'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { UserRole } from '@/types/database';

interface SidebarProps {
  userRole: UserRole;
  onClose?: () => void;
}

interface NavItem {
  href: string;
  label: string;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/dashboard/crop-performance', label: 'Crop Performance' },
  { href: '/dashboard/financial', label: 'Financial' },
  { href: '/dashboard/integrated', label: 'Integrated View' },
  { href: '/admin/upload', label: 'Import Data', adminOnly: true },
];

export default function Sidebar({ userRole, onClose }: SidebarProps) {
  const pathname = usePathname();

  const visibleItems = navItems.filter(
    (item) => !item.adminOnly || userRole === 'ADMIN'
  );

  return (
    <aside className="flex h-full w-64 flex-col bg-slate-800 text-white">
      <div className="flex h-16 items-center px-6">
        <Link href="/dashboard" className="text-xl font-bold text-green-400" onClick={onClose}>
          Farm Intel
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {visibleItems.map((item) => {
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-slate-900 text-green-400'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {item.label}
              {item.adminOnly && (
                <span className="ml-auto rounded bg-amber-600 px-1.5 py-0.5 text-xs">Admin</span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-700 px-6 py-4">
        <p className="text-xs text-slate-500">Farm Intelligence Platform</p>
      </div>
    </aside>
  );
}
