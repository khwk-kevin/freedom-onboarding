/**
 * Merchant Health Score Calculator (0–100)
 *
 * Scoring dimensions:
 *   - Onboarding completeness (0–30 pts)
 *   - Activity / recency (0–25 pts)
 *   - Revenue / transactions (0–25 pts)
 *   - Profile completeness (0–20 pts)
 */

export interface MerchantHealthInput {
  // Onboarding
  onboarding_status: string
  onboarding_completed_at?: string | null

  // Activity
  last_activity_at?: string | null
  monthly_transactions?: number
  lifetime_transactions?: number

  // Revenue
  monthly_revenue?: number
  lifetime_revenue?: number

  // Profile completeness
  business_name?: string | null
  business_description?: string | null
  logo_url?: string | null
  banner_url?: string | null
  primary_color?: string | null
  website_url?: string | null
  social_urls?: Record<string, string> | null
  phone?: string | null

  // Products
  product_count?: number

  // Engagement signals
  has_members?: boolean
  member_count?: number
}

export interface HealthScoreResult {
  score: number
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  breakdown: {
    onboarding: number
    activity: number
    revenue: number
    profile: number
  }
  flags: string[]
}

/**
 * Calculate merchant health score (0–100)
 */
export function calculateHealthScore(
  merchant: MerchantHealthInput
): HealthScoreResult {
  const flags: string[] = []

  // ─── 1. Onboarding completeness (max 30 pts) ───────────────
  let onboardingScore = 0
  const phaseScores: Record<string, number> = {
    signup: 5,
    context: 10,
    branding: 15,
    products: 20,
    rewards: 25,
    golive: 28,
    completed: 30,
    abandoned: 2,
  }
  onboardingScore = phaseScores[merchant.onboarding_status] ?? 0

  if (merchant.onboarding_status !== 'completed') {
    flags.push('onboarding_incomplete')
  }

  // ─── 2. Activity / recency (max 25 pts) ────────────────────
  let activityScore = 0
  if (merchant.last_activity_at) {
    const daysSinceActivity = daysSince(merchant.last_activity_at)

    if (daysSinceActivity <= 1) {
      activityScore = 25
    } else if (daysSinceActivity <= 3) {
      activityScore = 22
    } else if (daysSinceActivity <= 7) {
      activityScore = 18
    } else if (daysSinceActivity <= 14) {
      activityScore = 12
    } else if (daysSinceActivity <= 30) {
      activityScore = 6
    } else {
      activityScore = 0
      flags.push('inactive_30_days')
    }
  } else {
    activityScore = 0
    flags.push('no_activity_recorded')
  }

  // Bonus for transaction volume this month
  const monthlyTx = merchant.monthly_transactions ?? 0
  if (monthlyTx >= 100) activityScore = Math.min(25, activityScore + 3)
  else if (monthlyTx >= 50) activityScore = Math.min(25, activityScore + 2)
  else if (monthlyTx >= 10) activityScore = Math.min(25, activityScore + 1)

  // ─── 3. Revenue (max 25 pts) ────────────────────────────────
  let revenueScore = 0
  const monthlyRevenue = merchant.monthly_revenue ?? 0
  const lifetimeRevenue = merchant.lifetime_revenue ?? 0

  // Monthly revenue tiers (THB)
  if (monthlyRevenue >= 100_000) {
    revenueScore = 25
  } else if (monthlyRevenue >= 50_000) {
    revenueScore = 22
  } else if (monthlyRevenue >= 20_000) {
    revenueScore = 18
  } else if (monthlyRevenue >= 5_000) {
    revenueScore = 13
  } else if (monthlyRevenue >= 1_000) {
    revenueScore = 8
  } else if (monthlyRevenue > 0) {
    revenueScore = 4
  } else if (lifetimeRevenue > 0) {
    // Has some lifetime revenue but not this month
    revenueScore = 2
    flags.push('no_revenue_this_month')
  } else {
    revenueScore = 0
    flags.push('no_revenue')
  }

  // ─── 4. Profile completeness (max 20 pts) ──────────────────
  let profileScore = 0
  const profileFields: Array<{ field: unknown; points: number; flag: string }> = [
    { field: merchant.business_name, points: 3, flag: 'missing_business_name' },
    { field: merchant.business_description, points: 2, flag: 'missing_description' },
    { field: merchant.logo_url, points: 4, flag: 'missing_logo' },
    { field: merchant.banner_url, points: 2, flag: 'missing_banner' },
    { field: merchant.phone, points: 2, flag: 'missing_phone' },
    { field: merchant.website_url, points: 2, flag: 'missing_website' },
    {
      field: hasSocialUrls(merchant.social_urls),
      points: 2,
      flag: 'missing_social',
    },
    {
      field: (merchant.product_count ?? 0) > 0,
      points: 3,
      flag: 'no_products',
    },
  ]

  for (const { field, points, flag } of profileFields) {
    if (field) {
      profileScore += points
    } else {
      flags.push(flag)
    }
  }

  profileScore = Math.min(20, profileScore)

  // ─── Total ──────────────────────────────────────────────────
  const rawScore = onboardingScore + activityScore + revenueScore + profileScore
  const score = Math.min(100, Math.max(0, Math.round(rawScore)))

  return {
    score,
    grade: scoreToGrade(score),
    breakdown: {
      onboarding: onboardingScore,
      activity: activityScore,
      revenue: revenueScore,
      profile: profileScore,
    },
    flags,
  }
}

// ─── Helpers ─────────────────────────────────────────────────

function daysSince(isoDate: string): number {
  const now = Date.now()
  const then = new Date(isoDate).getTime()
  return Math.floor((now - then) / (1000 * 60 * 60 * 24))
}

function scoreToGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 85) return 'A'
  if (score >= 70) return 'B'
  if (score >= 55) return 'C'
  if (score >= 40) return 'D'
  return 'F'
}

function hasSocialUrls(
  socialUrls: Record<string, string> | null | undefined
): boolean {
  if (!socialUrls) return false
  return Object.values(socialUrls).some((v) => typeof v === 'string' && v.length > 0)
}
