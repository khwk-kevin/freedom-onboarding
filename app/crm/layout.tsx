'use client';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/crm/Sidebar';
import { MobileCRMNav } from '@/components/crm/MobileCRMNav';

const AUTH_PATHS = ['/crm/login', '/crm/forgot-password', '/crm/reset-password'];

export default function CRMLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = AUTH_PATHS.some((p) => pathname?.startsWith(p));

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-[#f5f6f8] text-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <MobileCRMNav />
        <main className="flex-1 overflow-auto pb-16 md:pb-0">{children}</main>
      </div>
    </div>
  );
}
