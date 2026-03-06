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
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const navItems = [
  { href: '/crm', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/crm/pipeline', label: 'Pipeline', icon: KanbanSquare, exact: false },
  { href: '/crm/merchants', label: 'Merchants', icon: Users, exact: false },
  { href: '/crm/handoffs', label: 'Handoffs', icon: AlertCircle, exact: false },
  { href: '/crm/analytics', label: 'Analytics', icon: BarChart3, exact: false },
];

export function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <aside
      className="hidden md:flex w-64 bg-gray-900 text-white flex-col h-screen sticky top-0 shrink-0"
      aria-label="BD Console navigation"
    >
      {/* Logo */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-green rounded-lg flex items-center justify-center shrink-0" aria-hidden="true">
            <span className="text-black font-bold text-sm">FW</span>
          </div>
          <div>
            <p className="font-semibold text-white text-sm leading-tight">Freedom World</p>
            <p className="text-gray-400 text-xs">BD Console</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto" aria-label="Main navigation">
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
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-1 focus-visible:ring-offset-gray-900 ${
                active
                  ? 'bg-brand-green text-black'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Icon size={18} aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="p-4 border-t border-gray-800">
        <button
          onClick={logout}
          aria-label="Sign out of BD Console"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:text-white hover:bg-gray-800 w-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-1 focus-visible:ring-offset-gray-900"
        >
          <LogOut size={18} aria-hidden="true" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
