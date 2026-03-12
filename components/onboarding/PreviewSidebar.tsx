'use client';

import type { CommunityData } from '@/types/onboarding';

interface PreviewSidebarProps {
  communityData: Partial<CommunityData> & {
    businessType?: string;
    vibe?: string;
    brandStyle?: string;
    scrapedImages?: string[];
    products?: string[];
    description?: string;
    audiencePersona?: string;
  };
  onUpdate: (data: Partial<CommunityData>) => void;
  onGenerateImage?: (type: 'logo' | 'banner') => Promise<void>;
  isGeneratingLogo?: boolean;
  isGeneratingBanner?: boolean;
  isAnonymous?: boolean;
  isDark?: boolean;
}

/**
 * Live Preview Sidebar — shows the app being built in real-time.
 * 
 * Starts empty. As the user answers questions, sections appear with animations.
 * Every element comes from user data — nothing is shown until the user provides it.
 */
export function PreviewSidebar({ communityData }: PreviewSidebarProps) {
  const name = communityData.name;
  const color = communityData.primaryColor || '#10F48B';
  const vibe = communityData.vibe;
  const desc = communityData.description;
  const logo = communityData.logo;
  const banner = communityData.banner;
  const products = communityData.products;
  const type = communityData.businessType;
  const audience = communityData.audiencePersona;
  const images = communityData.scrapedImages;

  const bg = '#050314';
  const cardBg = '#0D0B1A';
  const cardBorder = '#1A1730';
  const textMuted = '#8B8A9A';
  const isFood = type === 'restaurant' || type === 'cafe';
  const foodEmoji = ['🍜', '🍛', '🥗', '☕', '🍰', '🥤', '🍲', '🍱'];
  const serviceEmoji = ['✨', '💆', '💇', '💅', '🧖', '🏋️', '📸', '🎨'];
  const emojiSet = isFood ? foodEmoji : serviceEmoji;

  // Count filled fields for progress
  const fields = [name, desc, type, color !== '#10F48B' ? color : null, vibe, products?.length ? 'y' : null, audience];
  const filled = fields.filter(Boolean).length;
  const hasAnything = filled > 0;

  return (
    <aside
      className="w-[380px] h-full border-l flex flex-col overflow-hidden"
      style={{ backgroundColor: bg, borderColor: cardBorder }}
    >
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b" style={{ borderColor: cardBorder }}>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: hasAnything ? color : '#555' }} />
          <span className="text-xs font-semibold text-white">Live Preview</span>
          {hasAnything && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${color}22`, color }}>
              {filled}/7
            </span>
          )}
        </div>
        <span className="text-[10px] font-medium px-2 py-0.5 rounded" style={{ backgroundColor: cardBg, color: textMuted, border: `1px solid ${cardBorder}` }}>
          MOBILE
        </span>
      </div>

      {/* Phone frame */}
      <div className="flex-1 overflow-y-auto p-4">
        <div
          className="rounded-[2rem] overflow-hidden border-2 mx-auto"
          style={{
            maxWidth: '320px',
            minHeight: '580px',
            backgroundColor: bg,
            borderColor: cardBorder,
            boxShadow: hasAnything ? `0 0 40px ${color}15` : 'none',
            transition: 'box-shadow 0.5s ease',
          }}
        >
          {/* Status bar */}
          <div className="h-6 flex items-center justify-center">
            <div className="w-20 h-1 rounded-full" style={{ backgroundColor: cardBorder }} />
          </div>

          {!hasAnything ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl mb-4" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
                📱
              </div>
              <p className="text-sm font-medium text-white mb-1">Your app will appear here</p>
              <p className="text-xs leading-relaxed" style={{ color: textMuted }}>
                Answer questions in the chat and watch your app build live
              </p>
            </div>
          ) : (
            /* Live app preview */
            <div className="px-0 pb-16">

              {/* App header — appears when name is set */}
              {name && (
                <div className="px-4 py-3 flex items-center gap-2.5 animate-fadeIn">
                  {logo ? (
                    <img src={logo} alt={name} className="w-8 h-8 rounded-lg object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold" style={{ background: `linear-gradient(135deg, ${color}, ${color}88)`, color: bg }}>
                      {name.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">{name}</p>
                    {type && <p className="text-[10px] capitalize" style={{ color: textMuted }}>{type}</p>}
                  </div>
                </div>
              )}

              {/* Hero — appears when description or banner is set */}
              {(desc || banner) && (
                <div className="relative mx-3 rounded-xl overflow-hidden mb-3 animate-fadeIn" style={{ minHeight: '120px' }}>
                  <div className="absolute inset-0" style={{
                    background: banner
                      ? `url(${banner}) center/cover`
                      : `linear-gradient(135deg, ${color}22 0%, ${bg} 100%)`
                  }} />
                  <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${bg} 0%, transparent 60%)` }} />
                  <div className="relative p-4 flex flex-col justify-end" style={{ minHeight: '120px' }}>
                    {vibe && (
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium mb-1.5 self-start" style={{ backgroundColor: `${color}22`, color, border: `1px solid ${color}33` }}>
                        <span className="w-1 h-1 rounded-full" style={{ backgroundColor: color }} />
                        {vibe}
                      </div>
                    )}
                    {name && <p className="text-base font-bold text-white">{name}</p>}
                    {desc && <p className="text-[10px] mt-0.5 text-white/70 leading-relaxed line-clamp-2">{desc}</p>}
                  </div>
                </div>
              )}

              {/* Quick actions — appear when type is set */}
              {type && (
                <div className="grid grid-cols-4 gap-2 px-3 mb-3 animate-fadeIn">
                  {[
                    { icon: '🛒', label: 'Order' },
                    { icon: '📅', label: 'Book' },
                    { icon: '📍', label: 'Visit' },
                    { icon: '💬', label: 'Chat' },
                  ].map((a) => (
                    <div key={a.label} className="flex flex-col items-center gap-1 py-2 rounded-lg" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
                      <span className="text-base">{a.icon}</span>
                      <span className="text-[8px] font-medium" style={{ color: textMuted }}>{a.label}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Products — appear as user lists them */}
              {products && products.length > 0 && (
                <div className="px-3 mb-3 animate-fadeIn">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-white">{isFood ? '🔥 Menu' : '⭐ Services'}</p>
                    <span className="text-[9px]" style={{ color }}>{products.length} items</span>
                  </div>
                  <div className="space-y-1.5">
                    {products.slice(0, 5).map((product, i) => {
                      const [pName, price] = String(product).split(':');
                      return (
                        <div key={i} className="flex items-center gap-2 p-2 rounded-lg" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0" style={{ background: `linear-gradient(135deg, ${color}15, ${color}08)` }}>
                            {emojiSet[i % emojiSet.length]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-medium text-white truncate">{pName?.trim()}</p>
                          </div>
                          {price && (
                            <span className="text-[10px] font-bold shrink-0" style={{ color }}>
                              {/^\d/.test(price.trim()) ? `฿${price.trim()}` : price.trim()}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Gallery — from scraped images */}
              {images && images.length > 0 && (
                <div className="px-3 mb-3 animate-fadeIn">
                  <p className="text-xs font-bold text-white mb-2">📸 Gallery</p>
                  <div className="flex gap-1.5 overflow-hidden">
                    {images.slice(0, 3).map((img, i) => (
                      <img key={i} src={img} alt="" className="w-20 h-20 rounded-lg object-cover" style={{ border: `1px solid ${cardBorder}` }} />
                    ))}
                  </div>
                </div>
              )}

              {/* Audience — appears when audience is defined */}
              {audience && (
                <div className="mx-3 mb-3 p-3 rounded-lg text-center animate-fadeIn" style={{ background: `linear-gradient(135deg, ${color}12, ${color}06)`, border: `1px solid ${color}18` }}>
                  <p className="text-[10px] font-medium" style={{ color: textMuted }}>Built for</p>
                  <p className="text-[11px] text-white mt-0.5 leading-relaxed">{audience}</p>
                </div>
              )}

              {/* Loyalty placeholder — appears when type is set */}
              {type && name && (
                <div className="mx-3 mb-3 p-3 rounded-lg animate-fadeIn" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm" style={{ background: `linear-gradient(135deg, ${color}33, ${color}11)` }}>⭐</div>
                    <div>
                      <p className="text-[10px] font-semibold text-white">0 / 100 pts</p>
                      <p className="text-[8px]" style={{ color: textMuted }}>Earn with every purchase</p>
                    </div>
                  </div>
                  <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: `${color}15` }}>
                    <div className="h-full rounded-full" style={{ width: '10%', backgroundColor: color }} />
                  </div>
                </div>
              )}

              {/* Bottom nav */}
              {name && (
                <div className="fixed-bottom mx-3 mt-2 flex items-center justify-around py-2 rounded-xl animate-fadeIn" style={{ backgroundColor: `${cardBg}ee`, border: `1px solid ${cardBorder}` }}>
                  {[
                    { icon: '🏠', label: 'Home', active: true },
                    { icon: '📋', label: isFood ? 'Menu' : 'Browse', active: false },
                    { icon: '🏆', label: 'Rewards', active: false },
                    { icon: '👤', label: 'Profile', active: false },
                  ].map((tab) => (
                    <div key={tab.label} className="flex flex-col items-center gap-0.5 px-2">
                      <span className="text-sm">{tab.icon}</span>
                      <span className="text-[7px] font-medium" style={{ color: tab.active ? color : textMuted }}>{tab.label}</span>
                      {tab.active && <div className="w-1 h-1 rounded-full" style={{ backgroundColor: color }} />}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer status */}
      <div className="px-4 py-2.5 border-t text-center" style={{ borderColor: cardBorder }}>
        <p className="text-[10px]" style={{ color: textMuted }}>
          {!hasAnything && 'Start chatting to build your app'}
          {hasAnything && filled < 5 && `Building... ${filled}/7 sections`}
          {filled >= 5 && filled < 7 && `Almost ready — ${filled}/7 sections`}
          {filled >= 7 && '✨ Spec complete — ready to build!'}
        </p>
      </div>
    </aside>
  );
}
