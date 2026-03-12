function AvaAvatar() {
  return (
    <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 shadow-lg ring-2 ring-white/10">
      <img src="/ava-avatar.png" alt="AVA" className="w-full h-full object-cover" />
    </div>
  );
}

// ── Typing indicator ──────────────────────────────────────────────
export function TypingIndicator() {
  return (
    <div className="flex items-start space-x-3 max-w-sm">
      <AvaAvatar />
      <div
        className="rounded-2xl rounded-tl-none px-4 py-4 flex items-center space-x-1.5"
        style={{
          background: 'var(--oc-bubble-bg)',
          border: '1px solid var(--oc-bubble-border)',
        }}
      >
        {[0, 160, 320].map((delay) => (
          <div
            key={delay}
            className="w-2 h-2 rounded-full animate-bounce"
            style={{ backgroundColor: '#10F48B', animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
