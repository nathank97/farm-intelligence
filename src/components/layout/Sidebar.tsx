'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { UserRole } from '@/types/database';

interface SidebarProps {
  userRole: UserRole;
  onClose?: () => void;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface NavItem {
  href: string;
  label: string;
  adminOnly?: boolean;
}

const navSections: NavSection[] = [
  {
    title: '',
    items: [
      { href: '/dashboard', label: 'Overview' },
    ],
  },
  {
    title: 'Corn Database',
    items: [
      { href: '/dashboard/corn', label: 'Corn Performance' },
      { href: '/dashboard/corn/varieties', label: 'Corn Varieties' },
    ],
  },
  {
    title: 'Edibles Database',
    items: [
      { href: '/dashboard/edibles', label: 'Bean Performance' },
      { href: '/dashboard/edibles/dockage', label: 'Dockage Analysis' },
    ],
  },
  {
    title: 'Field P&L',
    items: [
      { href: '/dashboard/financial', label: 'Financial Overview' },
      { href: '/dashboard/financial/crops', label: 'Crop Profitability' },
    ],
  },
  {
    title: '',
    items: [
      { href: '/dashboard/integrated', label: 'Integrated (Phase 2)' },
      { href: '/admin/upload', label: 'Import Data', adminOnly: true },
    ],
  },
];

export default function Sidebar({ userRole, onClose }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  return (
    <aside className="flex h-full w-64 flex-col bg-slate-800 text-white">
      <div className="flex h-16 items-center px-6">
        <Link href="/dashboard" className="text-xl font-bold text-green-400" onClick={onClose}>
          Farm Intel
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {navSections.map((section, si) => {
          const visibleItems = section.items.filter(
            (item) => !item.adminOnly || userRole === 'ADMIN'
          );
          if (visibleItems.length === 0) return null;

          return (
            <div key={si} className="mb-2">
              {section.title && (
                <h3 className="mb-1 px-3 pt-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {section.title}
                </h3>
              )}
              <div className="space-y-0.5">
                {visibleItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? 'bg-slate-900 text-green-400'
                        : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    {item.label}
                    {item.adminOnly && (
                      <span className="ml-auto rounded bg-amber-600 px-1.5 py-0.5 text-xs">Admin</span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-slate-700 px-6 py-4">
        <p className="text-xs text-slate-500">Farm Intelligence Platform</p>
      </div>
    </aside>
  );
}
