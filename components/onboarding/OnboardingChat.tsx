/* Ambient gradient orb */
<div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
  <div 
    className="absolute top-1/4 -left-1/4 w-[600px] h-[600px] rounded-full animate-ambient-pulse"
    style={{ background: `radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)` }}
  />
  <div 
    className="absolute bottom-1/4 -right-1/4 w-[500px] h-[500px] rounded-full animate-ambient-pulse"
    style={{ background: `radial-gradient(circle, rgba(16,244,139,0.05) 0%, transparent 70%)`, animationDelay: '2.5s' }}
  />
</div>

<div className="gradient-header-line h-px w-full shrink-0" />

<div className="w-full h-full flex flex-col md:flex-row overflow-hidden relative" style={{
  background: theme.cardBg,
  border: `1px solid ${theme.border}`,
  backdropFilter: 'blur(4px)',
}} />

function AvaAvatar() {
  return (
    <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 shadow-lg ring-2 ring-white/10">
      <img src="/ava-avatar.png" alt="AVA" className="w-full h-full object-cover" />
    </div>
  );
}

<h2 className="text-xs md:text-sm font-semibold truncate" style={{ color: theme.text }}>
  AVA — Your App Designer
</h2>
