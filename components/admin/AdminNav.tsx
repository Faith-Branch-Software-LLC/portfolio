'use client';

import { usePathname } from 'next/navigation';
import { useTransitionRouter } from 'next-transition-router';
import { signOut } from 'next-auth/react';
import { LayoutDashboard, Users, FolderKanban, LogOut } from 'lucide-react';

const links = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/clients', label: 'Clients', icon: Users, exact: false },
  { href: '/admin/projects', label: 'Projects', icon: FolderKanban, exact: false },
];

export default function AdminNav() {
  const pathname = usePathname();
  const router = useTransitionRouter();

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <nav className="flex items-center gap-1 px-6 py-3 border-b border-black/10 bg-white/60 backdrop-blur-sm">
      <span className="font-fraunces font-semibold text-lg mr-6">Admin</span>
      <div className="flex items-center gap-1 flex-1">
        {links.map(({ href, label, icon: Icon, exact }) => (
          <button
            key={href}
            onClick={() => router.push(href)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive(href, exact)
                ? 'bg-black text-white'
                : 'text-gray-600 hover:bg-black/5'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>
      <button
        onClick={() => signOut({ callbackUrl: '/auth/login' })}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-black/5 transition-colors"
      >
        <LogOut className="w-4 h-4" />
        Sign out
      </button>
    </nav>
  );
}
