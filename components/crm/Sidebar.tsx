'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  KanbanSquare,
  Users,
  AlertCircle,
  BarChart3,
  LogOut,
  Plus,
  Compass,
  TrendingUp,
} from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';

const navItems = [
  { href: '/crm', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/crm/pipeline', label: 'Pipeline', icon: KanbanSquare, exact: false },
  { href: '/crm/merchants', label: 'Merchants', icon: Users, exact: false },
  { href: '/crm/handoffs', label: 'Handoffs', icon: AlertCircle, exact: false },
  { href: '/crm/analytics', label: 'Analytics', icon: BarChart3, exact: false },
  { href: '/crm/community-tracker', label: 'Community Tracker', icon: Compass, exact: false },
  { href: '/crm/acquisition-funnel', label: 'Acquisition Funnel', icon: TrendingUp, exact: false },
];

export function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <aside
      className="hidden md:flex w-[220px] bg-[#1a1a2e] text-white flex-col h-screen sticky top-0 shrink-0"
      aria-label="BD Console navigation"
    >
      {/* Logo */}
      <div className="px-4 py-4 border-b border-white/5">
        <Link href="/crm" className="flex items-center gap-3">
          <Image
            src="/images/freedom-logo.svg"
            alt="Freedom World"
            width={130}
            height={41}
            priority
          />
        </Link>
        <p className="text-gray-500 text-[10px] mt-1.5 uppercase tracking-widest font-medium">BD Console</p>
      </div>

      {/* Quick actions — Pipedrive-style */}
      <div className="px-3 py-3 border-b border-white/5">
        <button className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-[#00ff88] hover:bg-[#00e87a] text-[#1a1a2e] text-xs font-semibold transition-colors">
          <Plus size={14} />
          Add Merchant
        </button>
      </div>

      {/* Nav — Pipedrive sidebar style */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto" aria-label="Main navigation">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href) && pathname !== '/crm';
          const isDashboard = item.href === '/crm' && pathname === '/crm';
          const active = isDashboard || (item.href !== '/crm' && isActive);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-colors ${
                active
                  ? 'bg-white/10 text-white'
                  : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
              }`}
            >
              <Icon size={16} aria-hidden="true" className={active ? 'text-[#00ff88]' : ''} />
              {item.label}
              {item.label === 'Handoffs' && (
                <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  3
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom — Pipedrive-style user section */}
      <div className="px-3 py-3 border-t border-white/5 space-y-1">
        <div className="flex items-center gap-2.5 px-3 py-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-[10px] font-bold text-white">
            BD
          </div>
          <div className="min-w-0">
            <p className="text-[12px] text-gray-300 truncate">BD Team</p>
          </div>
        </div>
        <button
          onClick={logout}
          aria-label="Sign out"
          className="flex items-center gap-2.5 px-3 py-2 rounded-md text-[12px] text-gray-500 hover:text-gray-300 hover:bg-white/5 w-full transition-colors"
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
