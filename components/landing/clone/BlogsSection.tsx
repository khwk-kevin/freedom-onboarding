import Link from 'next/link'

const BLOG_POSTS = [
  {
    tag: 'features',
    tagColor: '#10F48B',
    title: 'The New Era of Community Recognition with Freedom World',
    desc: 'Discover how gamified badges and missions are transforming how businesses recognize and reward their most loyal members.',
    date: 'Mar 2025',
    readTime: '5 min read',
    gradient: 'from-[#1248C8]/30 to-[#10F48B]/10',
  },
  {
    tag: 'inspiration',
    tagColor: '#36BBF6',
    title: 'Why Building Your Community Drives More Impact',
    desc: 'Explore the data behind why community-led growth consistently outperforms traditional marketing channels.',
    date: 'Feb 2025',
    readTime: '7 min read',
    gradient: 'from-[#36BBF6]/20 to-[#1248C8]/10',
  },
  {
    tag: 'playbooks',
    tagColor: '#F742A2',
    title: 'Creative Ways to Monetize Your Virtual Communities',
    desc: 'Practical strategies for turning engaged community members into revenue-generating partners for your business.',
    date: 'Jan 2025',
    readTime: '6 min read',
    gradient: 'from-[#F742A2]/20 to-[#1248C8]/10',
  },
]

export default function BlogsSection() {
  return (
    <section className="relative w-full px-4 md:px-8 max-w-7xl mx-auto overflow-hidden">
      {/* Glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '60%',
          height: '50%',
          background: 'radial-gradient(ellipse, rgba(18,72,200,0.12) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />

      <div className="relative z-10 flex flex-col gap-10 md:gap-14">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="flex flex-col gap-3">
            <span className="uppercase text-xs font-semibold tracking-[0.2em] text-[#10F48B]">
              Blog
            </span>
            <h2 className="text-3xl md:text-5xl font-black uppercase text-white leading-tight">
              community insights &amp; ideas
            </h2>
            <p className="text-[#A6A7B5] text-base">for your inspiration</p>
          </div>

          <Link
            href="/blog"
            className="flex items-center gap-2.5 rounded-full px-5 pr-2 py-2 bg-white/[0.06] border border-white/[0.1] hover:border-white/[0.2] hover:scale-105 active:scale-95 transition-all w-fit self-start md:self-auto"
          >
            <span className="text-sm font-bold uppercase leading-[150%] text-white whitespace-nowrap">
              see more
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.08] border border-white/[0.1]">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 11L11 3M11 3H5M11 3v6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </Link>
        </div>

        {/* Blog cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {BLOG_POSTS.map((post, i) => (
            <article
              key={i}
              className="group relative rounded-2xl border border-white/[0.06] overflow-hidden flex flex-col hover:border-white/[0.12] transition-colors cursor-pointer"
            >
              {/* Cover area */}
              <div className={`relative aspect-[16/9] bg-gradient-to-br ${post.gradient} flex items-end p-5`}>
                {/* Decorative pattern */}
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)',
                    backgroundSize: '20px 20px',
                  }}
                />
                {/* Tag */}
                <span
                  className="relative z-10 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider"
                  style={{
                    background: `${post.tagColor}20`,
                    color: post.tagColor,
                    border: `1px solid ${post.tagColor}30`,
                  }}
                >
                  {post.tag}
                </span>
              </div>

              {/* Content */}
              <div className="flex flex-col gap-3 p-5 flex-1 bg-white/[0.02]">
                <h3 className="text-white font-bold text-sm leading-snug group-hover:text-[#10F48B] transition-colors line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-[#67697C] text-xs leading-relaxed line-clamp-3">{post.desc}</p>

                <div className="mt-auto flex items-center justify-between pt-3 border-t border-white/[0.05]">
                  <span className="text-[#67697C] text-[11px]">{post.date}</span>
                  <span className="text-[#67697C] text-[11px]">{post.readTime}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
