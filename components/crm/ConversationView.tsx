'use client';

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  phase: string | null;
  created_at: string;
}

interface ConversationViewProps {
  messages: ConversationMessage[];
}

const PHASE_LABELS: Record<string, string> = {
  context: 'Business Context',
  branding: 'Branding',
  products: 'Products',
  rewards: 'Rewards',
  golive: 'Go Live',
};

export function ConversationView({ messages }: ConversationViewProps) {
  if (messages.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-gray-400">
        No conversation history
      </div>
    );
  }

  // Group by phase
  const phases = messages.reduce<Record<string, ConversationMessage[]>>((acc, m) => {
    const key = m.phase || 'unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {});

  const filteredMessages = messages.filter((m) => m.role !== 'system');

  return (
    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
      {filteredMessages.map((msg, idx) => {
        const isUser = msg.role === 'user';
        const prevMsg = filteredMessages[idx - 1];
        const phaseChanged = msg.phase && prevMsg?.phase !== msg.phase;

        return (
          <div key={msg.id}>
            {/* Phase label */}
            {phaseChanged && msg.phase && (
              <div className="flex items-center gap-2 my-3">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400 font-medium px-2 py-0.5 bg-gray-100 rounded-full">
                  {PHASE_LABELS[msg.phase] || msg.phase}
                </span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
            )}

            {/* Message bubble */}
            <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                  isUser
                    ? 'bg-brand-green text-black rounded-br-sm'
                    : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                }`}
              >
                {!isUser && (
                  <p className="text-xs font-semibold text-gray-500 mb-1">AI Assistant</p>
                )}
                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                <p
                  className={`text-xs mt-1 ${
                    isUser ? 'text-black/50 text-right' : 'text-gray-400'
                  }`}
                >
                  {new Date(msg.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
