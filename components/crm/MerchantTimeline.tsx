'use client';
import { formatDistanceToNow } from 'date-fns';

export interface TimelineEvent {
  id: string;
  event_type: string;
  event_data: Record<string, unknown>;
  created_at: string;
}

interface MerchantTimelineProps {
  events: TimelineEvent[];
}

const EVENT_ICONS: Record<string, { icon: string; color: string; label: string }> = {
  signup_complete: { icon: '🎉', color: 'bg-green-100', label: 'Signed up' },
  signup_start: { icon: '📝', color: 'bg-gray-100', label: 'Started signup' },
  onboard_start: { icon: '🚀', color: 'bg-indigo-100', label: 'Started onboarding' },
  onboard_step_context: { icon: '💼', color: 'bg-blue-100', label: 'Completed: Business context' },
  onboard_step_branding: { icon: '🎨', color: 'bg-purple-100', label: 'Completed: Branding' },
  onboard_step_products: { icon: '🛍️', color: 'bg-amber-100', label: 'Completed: Products' },
  onboard_step_rewards: { icon: '🪙', color: 'bg-yellow-100', label: 'Completed: Rewards' },
  onboard_step_golive: { icon: '🌐', color: 'bg-teal-100', label: 'Completed: Go live' },
  onboard_complete: { icon: '✅', color: 'bg-green-100', label: 'Onboarding complete!' },
  onboard_drop_off: { icon: '⚠️', color: 'bg-orange-100', label: 'Dropped off' },
  onboard_resume: { icon: '↩️', color: 'bg-blue-100', label: 'Resumed onboarding' },
  handoff_triggered: { icon: '🤝', color: 'bg-red-100', label: 'Escalated to BD team' },
  handoff_assigned: { icon: '👤', color: 'bg-blue-100', label: 'Assigned to BD member' },
  handoff_resolved: { icon: '✔️', color: 'bg-green-100', label: 'Handoff resolved' },
  first_product: { icon: '📦', color: 'bg-indigo-100', label: 'First product added' },
  first_transaction: { icon: '💰', color: 'bg-green-100', label: 'First transaction' },
  page_view: { icon: '👁️', color: 'bg-gray-50', label: 'Page view' },
  cta_click: { icon: '🖱️', color: 'bg-gray-50', label: 'CTA clicked' },
};

function getEventConfig(eventType: string) {
  return (
    EVENT_ICONS[eventType] || {
      icon: '•',
      color: 'bg-gray-100',
      label: eventType.replace(/_/g, ' '),
    }
  );
}

export function MerchantTimeline({ events }: MerchantTimelineProps) {
  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-gray-400">No events recorded yet</div>
    );
  }

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-5 top-0 bottom-0 w-px bg-gray-200" />

      <div className="space-y-4">
        {events.map((event) => {
          const cfg = getEventConfig(event.event_type);
          return (
            <div key={event.id} className="flex gap-4 items-start relative">
              {/* Icon dot */}
              <div
                className={`w-10 h-10 ${cfg.color} rounded-full flex items-center justify-center text-base shrink-0 z-10 border-2 border-white`}
              >
                {cfg.icon}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pt-1.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-gray-800">{cfg.label}</p>
                  <span className="text-xs text-gray-400 shrink-0 mt-0.5">
                    {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                  </span>
                </div>

                {/* Extra data */}
                {Object.keys(event.event_data || {}).length > 0 && (
                  <div className="mt-1 text-xs text-gray-500 bg-gray-50 rounded px-2 py-1 font-mono">
                    {Object.entries(event.event_data)
                      .filter(([, v]) => v !== null && v !== undefined)
                      .slice(0, 3)
                      .map(([k, v]) => `${k}: ${String(v)}`)
                      .join(' · ')}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
