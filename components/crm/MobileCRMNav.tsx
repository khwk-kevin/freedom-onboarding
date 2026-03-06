'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  KanbanSquare,
  Users,
  AlertCircle,
  BarChart3,
} from 'lucide-react';

const navItems = [
  { href: '/crm', label: 'Dash', icon: LayoutDashboard },
  { href: '/crm/pipeline', label: 'Pipeline', icon: KanbanSquare },
  { href: '/crm/merchants', label: 'Merchants', icon: Users },
  { href: '/crm/handoffs', label: 'Handoffs', icon: AlertCircle },
  { href: '/crm/analytics', label: 'Analytics', icon: BarChart3 },
];

/**
 * Bottom tab bar visible only on mobile (<md).
 * On md+ screens this is hidden in favour of the Sidebar.
 */
export function MobileCRMNav() {
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-gray-900 border-t border-gray-800 flex"
      aria-label="Mobile navigation"
    >
      {navItems.map((item) => {
        const isActive =
          item.href === '/crm' ? pathname === '/crm' : pathname.startsWith(item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-inset ${
              isActive ? 'text-brand-green' : 'text-gray-400 hover:text-white'
            }`}
            aria-current={isActive ? 'page' : undefined}
            aria-label={item.label}
          >
            <Icon size={20} aria-hidden="true" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
