/**
 * Freedom World App Builder — Build Dispatcher
 * Sprint 3.2 — Build Dispatcher + Task Queue
 *
 * Orchestrates: interview answer → vault file update → SSH → Claude Code task.
 * Maintains a per-merchant FIFO queue with a processing lock.
 */

import { randomUUID } from 'crypto';
import { BuildTrigger, BuildResult, MerchantAppSpec } from './types';
import { generateVaultFiles } from './vault-writer';
import { sshWriteFile, sshExecCommand } from './railway';
import { recordBuildTask, estimateBuildCostUsd } from './cost-tracker';
import { track } from '../analytics/posthog';
import { EVENTS } from '../analytics/events';
import {
  isTokenBudgetExhausted,
  deductTokens,
  estimateTaskTokens,
} from './token-budget';
import { sanitizeErrorForUser, shouldRetry, formatBuildError } from './error-handler';

// ============================================================
// TASK TEMPLATES — BuildTrigger → Claude Code prompt
// ============================================================

const TASK_TEMPLATES: Record<BuildTrigger, string> = {
  scrape_complete:
    'Read CLAUDE.md. You have new context in context/ and photos in public/assets/. Build the homepage with Hero, product highlights, and contact section.',
  idea_described:
    'Read CLAUDE.md. The user described their app idea in context/business.md. Build a conceptual homepage that captures their vision.',
  mood_selected:
    'Mood and theme updated in design/theme.json and context/brand.md. Re-read them. Update all component variants and visual styles to match the new mood.',
  color_changed:
    'Primary color changed in design/theme.json. Update the CSS theme variables and ensure all pages reflect the new color scheme.',
  style_changed:
    'UI style treatment updated in design/theme.json (see uiStyle field). Re-read CLAUDE.md and update all component styles to match the selected treatment (glass/bold/outlined/gradient/neumorphic).',
  products_added:
    'Products/services added to context/business.md. Build a products/services section using ProductCard components.',
  priorities_set:
    'App priorities set in context/business.md. Build the priority pages and update navigation.',
  anti_prefs_set:
    'Anti-preferences updated in context/brand.md. Review all existing pages and remove/adjust anything that conflicts.',
  audience_defined:
    'Target audience defined in context/audience.md. Adjust copy, tone, and messaging across all pages.',
  features_selected:
    'Freedom features selected. Note them in context/business.md for future integration.',
  ad_hoc_request:
    "The merchant requests: '{adHocMsg}'. Read all context files first, then make the requested change.",
};

// ============================================================
// QUEUE STATE — In-memory per-merchant task queue
// ============================================================

interface QueuedTask {
  taskId: string;
  merchantId: string;
  trigger: BuildTrigger;
  spec: MerchantAppSpec;
  adHocMsg?: string;
  resolve: (result: BuildResult) => void;
  reject: (err: unknown) => void;
}

interface MerchantQueueState {
  isBuilding: boolean;
  queue: QueuedTask[];
  currentTaskId?: string;
  cancelled: boolean;
  lastTaskResult?: BuildResult;
}

// Global in-memory map: merchantId → queue state
const merchantQueues = new Map<string, MerchantQueueState>();

function getOrCreateQueue(merchantId: string): MerchantQueueState {
  if (!merchantQueues.has(merchantId)) {
    merchantQueues.set(merchantId, {
      isBuilding: false,
      queue: [],
      cancelled: false,
    });
  }
  return merchantQueues.get(merchantId)!;
}

// ============================================================
// CORE DISPATCH
// ============================================================

/**
 * dispatchBuildTask — core function.
 *
 * 1. Generates vault files from spec
 * 2. Writes each file to Railway via SSH
 * 3. Builds Claude prompt from TASK_TEMPLATES[trigger]
 * 4. SSH-execs: `claude -p "..." --dangerously-skip-permissions --max-turns 100 --cwd /workspace`
 * 5. On failure: auto-retry once with a fix-focused prompt
 * 6. On repeated failure: logs APP_BUILD_FAILED to PostHog, returns failure result
 * 7. Returns BuildResult — NEVER throws; caller always receives a result
 */
export async function dispatchBuildTask(
  merchantId: string,
  trigger: BuildTrigger,
  spec: MerchantAppSpec,
  adHocMsg?: string
): Promise<BuildResult> {
  const startTime = Date.now();

  const projectId = spec.railwayProjectId;
  const serviceId = spec.railwayServiceId;

  // ── Token budget gate ────────────────────────────────────────────────────
  const exhausted = await isTokenBudgetExhausted(merchantId);
  if (exhausted) {
    return {
      success: false,
      exitCode: -1,
      stdout: '',
      stderr: 'Token budget exhausted',
      durationMs: 0,
      error: 'token_limit',
    };
  }

  if (!projectId || !serviceId) {
    return {
      success: false,
      exitCode: 1,
      stdout: '',
      stderr: '',
      durationMs: Date.now() - startTime,
      error: `merchantId=${merchantId}: railwayProjectId and railwayServiceId must be set on the spec`,
    };
  }

  // 1. Generate vault files
  let vaultFiles: ReturnType<typeof generateVaultFiles>;
  try {
    vaultFiles = generateVaultFiles(spec);
  } catch (err) {
    return {
      success: false,
      exitCode: 1,
      stdout: '',
      stderr: '',
      durationMs: Date.now() - startTime,
      error: `generateVaultFiles failed: ${String(err)}`,
    };
  }

  // 2. Write each vault file to Railway via SSH
  for (const file of vaultFiles) {
    try {
      await sshWriteFile(projectId, serviceId, `/workspace/${file.path}`, file.content);
    } catch (err) {
      return {
        success: false,
        exitCode: 1,
        stdout: '',
        stderr: '',
        durationMs: Date.now() - startTime,
        error: `sshWriteFile failed for ${file.path}: ${String(err)}`,
      };
    }
  }

  // 3. Build Claude prompt
  let promptTemplate = TASK_TEMPLATES[trigger];
  if (trigger === 'ad_hoc_request') {
    promptTemplate = promptTemplate.replace('{adHocMsg}', adHocMsg ?? '');
  }

  // ── Inner helper: run Claude Code via SSH ────────────────────────────────
  const runClaudeCode = async (prompt: string): Promise<BuildResult> => {
    const escapedPrompt = prompt.replace(/"/g, '\\"');
    const cmd = `claude -p "${escapedPrompt}" --dangerously-skip-permissions --max-turns 100 --cwd /workspace`;

    let sshResult: Awaited<ReturnType<typeof sshExecCommand>>;
    try {
      sshResult = await sshExecCommand(projectId!, serviceId!, cmd);
    } catch (err) {
      return {
        success: false,
        exitCode: 1,
        stdout: '',
        stderr: String(err),
        durationMs: Date.now() - startTime,
        error: `sshExecCommand threw: ${String(err)}`,
      };
    }

    return {
      success: sshResult.exitCode === 0,
      exitCode: sshResult.exitCode,
      stdout: sshResult.stdout,
      stderr: sshResult.stderr,
      durationMs: Date.now() - startTime,
      error: sshResult.exitCode !== 0 ? (sshResult.stderr || 'Build task failed') : undefined,
    };
  };

  // 4. First attempt
  let buildResult = await runClaudeCode(promptTemplate);

  // 5. Retry once on failure
  if (!buildResult.success) {
    const rawStderr = buildResult.stderr ?? buildResult.error ?? '';
    console.warn(
      `[build-dispatcher] Task failed for merchant ${merchantId} (trigger: ${trigger}). ` +
      `Exit code: ${buildResult.exitCode}. Attempting retry.`
    );

    if (shouldRetry(rawStderr)) {
      const retryPrompt =
        `The previous build had an error: ${sanitizeErrorForUser(rawStderr)}. ` +
        `Please fix the issue and try again. ${promptTemplate}`;

      buildResult = await runClaudeCode(retryPrompt);
    }

    // 6. Both attempts failed — log to PostHog
    if (!buildResult.success) {
      console.error(
        `[build-dispatcher] Retry also failed for merchant ${merchantId} (trigger: ${trigger}).`
      );

      track(EVENTS.APP_BUILD_FAILED, {
        merchantId,
        trigger,
        exitCode: buildResult.exitCode,
        // Sanitized error only — never expose raw stderr to analytics
        error: sanitizeErrorForUser(buildResult.stderr ?? buildResult.error ?? ''),
        durationMs: Date.now() - startTime,
      });

      // Return a sanitized result — upstream code should use formatBuildError for chat display
      return {
        ...buildResult,
        durationMs: Date.now() - startTime,
        error: formatBuildError(trigger, buildResult.stderr ?? ''),
        // Keep raw stderr accessible under a private key for server-side logging only
        stderr: sanitizeErrorForUser(buildResult.stderr ?? ''),
      };
    }
  }

  // 7. Deduct tokens after a successful build
  if (buildResult.success) {
    const tokenCost = estimateTaskTokens(trigger);
    try {
      const { remaining, isExhausted } = await deductTokens(merchantId, tokenCost);
      if (isExhausted) {
        track(EVENTS.TOKEN_LIMIT_REACHED, {
          merchantId,
          tokenBalance: remaining,
          tokenUsed: spec.tokenUsed + tokenCost,
          trigger,
        });
      }
    } catch (err) {
      // Non-fatal — log and continue; don't block the build result
      console.error(`[token-budget] deductTokens failed for ${merchantId}:`, err);
    }
  }

  return { ...buildResult, durationMs: Date.now() - startTime };
}

// ============================================================
// QUEUE PROCESSOR
// ============================================================

/**
 * Internal: process the next queued task for a merchant, FIFO.
 * Re-entrant safe — only one task runs at a time per merchant.
 */
async function processNext(merchantId: string): Promise<void> {
  const state = merchantQueues.get(merchantId);
  if (!state || state.isBuilding || state.queue.length === 0) return;

  const task = state.queue.shift()!;
  state.isBuilding = true;
  state.currentTaskId = task.taskId;

  try {
    if (state.cancelled) {
      task.resolve({
        success: false,
        exitCode: 0,
        stdout: '',
        stderr: '',
        durationMs: 0,
        error: 'Queue was cancelled before task ran',
      });
      return;
    }

    // dispatchBuildTask never throws — it always returns a BuildResult.
    // A failed result does NOT block the queue: we resolve (not reject) and
    // continue to the next queued task.
    const result = await dispatchBuildTask(
      task.merchantId,
      task.trigger,
      task.spec,
      task.adHocMsg
    );

    // ── Cost + performance tracking (non-blocking, best-effort) ──────────────
    const estimatedCostUsd = estimateBuildCostUsd(result.durationMs);

    void recordBuildTask(
      task.merchantId,
      task.trigger,
      result.durationMs,
      result.success,
      result.error
    );

    track(EVENTS.APP_BUILD_COMPLETED, {
      trigger: task.trigger,
      durationMs: result.durationMs,
      estimatedCostUsd,
      success: result.success,
    });
    // ─────────────────────────────────────────────────────────────────────────

    state.lastTaskResult = result;
    // Always resolve — failures are reported as failed BuildResult, not thrown.
    // This ensures the queue keeps moving even after errors.
    task.resolve(result);
  } catch (err) {
    // Unexpected exception (programming error) — log, sanitize, resolve (not reject)
    // so the queue continues processing subsequent tasks.
    console.error(`[build-dispatcher] Unexpected exception for task ${task.taskId}:`, err);

    const errResult: BuildResult = {
      success: false,
      exitCode: 1,
      stdout: '',
      stderr: '',
      durationMs: 0,
      // Use sanitized message — never expose raw exception to caller
      error: formatBuildError(task.trigger, String(err)),
    };

    // ── Cost tracking for unexpected errors ───────────────────────────────────
    void recordBuildTask(
      task.merchantId,
      task.trigger,
      errResult.durationMs,
      false,
      errResult.error
    );

    track(EVENTS.APP_BUILD_FAILED, {
      trigger: task.trigger,
      durationMs: errResult.durationMs,
      estimatedCostUsd: 0,
      success: false,
      error: sanitizeErrorForUser(String(err)),
    });
    // ─────────────────────────────────────────────────────────────────────────

    state.lastTaskResult = errResult;
    // Resolve (not reject) — queue must not stall
    task.resolve(errResult);
  } finally {
    state.isBuilding = false;
    state.currentTaskId = undefined;
    // Always process next task — failures never block the queue
    void processNext(merchantId);
  }
}

// ============================================================
// PUBLIC API
// ============================================================

/**
 * enqueueBuildTask — adds a task to the per-merchant FIFO queue.
 * If no task is running, starts processing immediately.
 * Resolves when the task completes (waits in queue if needed).
 */
export async function enqueueBuildTask(
  merchantId: string,
  trigger: BuildTrigger,
  spec: MerchantAppSpec,
  adHocMsg?: string
): Promise<void> {
  const state = getOrCreateQueue(merchantId);

  // Reset cancelled flag when new tasks arrive
  state.cancelled = false;

  await new Promise<BuildResult>((resolve, reject) => {
    const task: QueuedTask = {
      taskId: randomUUID(),
      merchantId,
      trigger,
      spec,
      adHocMsg,
      resolve,
      reject,
    };
    state.queue.push(task);
    void processNext(merchantId);
  });
}

/**
 * cancelMerchantQueue — cancels all pending (not-yet-started) tasks for a merchant.
 * The currently-running task (if any) is NOT interrupted; it will complete naturally.
 */
export function cancelMerchantQueue(merchantId: string): void {
  const state = merchantQueues.get(merchantId);
  if (!state) return;

  state.cancelled = true;

  // Drain pending queue — resolve each with a cancelled result
  while (state.queue.length > 0) {
    const task = state.queue.shift()!;
    task.resolve({
      success: false,
      exitCode: 0,
      stdout: '',
      stderr: '',
      durationMs: 0,
      error: 'Task cancelled by cancelMerchantQueue',
    });
  }
}

/**
 * getQueueStatus — returns current queue depth and build status for a merchant.
 */
export function getQueueStatus(merchantId: string): {
  isBuilding: boolean;
  queueDepth: number;
  currentTask?: string;
  lastTaskResult?: BuildResult;
} {
  const state = merchantQueues.get(merchantId);
  if (!state) {
    return { isBuilding: false, queueDepth: 0 };
  }

  return {
    isBuilding: state.isBuilding,
    queueDepth: state.queue.length,
    currentTask: state.currentTaskId,
    lastTaskResult: state.lastTaskResult,
  };
}
