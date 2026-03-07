import { Sidebar } from '@/components/crm/Sidebar';
import { CRMAuthGate } from '@/components/crm/CRMAuthGate';
import { MobileCRMNav } from '@/components/crm/MobileCRMNav';

export const metadata = {
  title: 'BD Console | Freedom World',
};

export default function CRMLayout({ children }: { children: React.ReactNode }) {
  return (
    <CRMAuthGate>
      <div className="flex min-h-screen bg-[#f5f6f8] text-gray-900">
        {/* Desktop sidebar — hidden on mobile */}
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Mobile top nav — hidden on md+ */}
          <MobileCRMNav />
          {/* pb-16 on mobile to clear the fixed bottom nav */}
          <main className="flex-1 overflow-auto pb-16 md:pb-0">{children}</main>
        </div>
      </div>
    </CRMAuthGate>
  );
}
