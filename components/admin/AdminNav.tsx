'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useTransitionRouter } from 'next-transition-router';
import { signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Plug,
  Code,
  LogOut,
  Menu,
  X,
  Clock,
  Calendar,
  Briefcase,
  PenLine,
  Receipt,
} from 'lucide-react';
import type { NavProject } from '@/app/admin/layout';

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/projects', label: 'Projects', icon: FolderKanban, exact: false },
  { href: '/admin/clients', label: 'Clients', icon: Users, exact: false },
  { href: '/admin/clock', label: 'Clock', icon: Clock, exact: false },
  { href: '/admin/calendar', label: 'Calendar', icon: Calendar, exact: false },
  { href: '/admin/portfolio', label: 'Portfolio', icon: Briefcase, exact: false },
  { href: '/admin/blog', label: 'Blog', icon: PenLine, exact: false },
  { href: '/admin/invoices', label: 'Invoices', icon: Receipt, exact: false },
  { href: '/admin/connections', label: 'Connections', icon: Plug, exact: false },
  { href: '/admin/api-docs', label: 'API Docs', icon: Code, exact: false },
];

const CIRC = 62.83;

interface AdminNavProps {
  projects: NavProject[];
  hasActiveTimer: boolean;
  activeTimerProjectIds: Set<string>;
}

export default function AdminNav({ projects, hasActiveTimer, activeTimerProjectIds }: AdminNavProps) {
  const pathname = usePathname();
  const router = useTransitionRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const currentProjectId = pathname.match(/\/admin\/projects\/([^/]+)/)?.[1] ?? null;

  const navigate = (href: string) => {
    router.push(href);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile top bar */}
      <div
        className="fixed top-0 left-0 right-0 h-14 md:hidden z-40 flex items-center px-4 gap-3"
        style={{ background: '#2E294E', borderBottom: '1px solid rgba(255,255,255,0.1)' }}
      >
        <button
          onClick={() => setMobileOpen(true)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'rgba(255,255,255,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4px',
            flexShrink: 0,
          }}
        >
          <Menu size={22} />
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.svg" alt="Faith Branch" style={{ width: '26px', height: '26px' }} />
        <span
          style={{
            fontFamily: 'Fraunces, serif',
            color: '#ffffff',
            fontWeight: 600,
            fontSize: '15px',
          }}
        >
          Faith Branch
        </span>
      </div>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 md:hidden z-[45]"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:relative inset-y-0 left-0 z-50 md:z-auto transition-transform duration-300 ease-in-out md:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{
          width: '240px',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          padding: '18px 14px',
          background: '#2E294E',
          overflow: 'hidden',
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '2px 6px 18px',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="Faith Branch" style={{ width: '36px', height: '36px' }} />
          <div style={{ lineHeight: 1, flex: 1 }}>
            <div
              style={{
                fontFamily: 'Fraunces, serif',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '16px',
              }}
            >
              Faith Branch
            </div>
            <div
              style={{
                fontFamily: '"Send Flowers", cursive',
                color: '#C5D86D',
                fontSize: '14px',
                marginTop: '2px',
              }}
            >
              the workshop
            </div>
          </div>
          {/* Close button — mobile only */}
          <button
            className="md:hidden"
            onClick={() => setMobileOpen(false)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'rgba(255,255,255,0.6)',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px',
              flexShrink: 0,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable middle: nav + projects */}
        <div
          className="admin-nav-scroll"
          style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden' }}
        >
          {/* Nav */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
            {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
              const active = isActive(href, exact);
              return (
                <button
                  key={href}
                  onClick={() => navigate(href)}
                  style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '11px 13px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '14px',
                    fontWeight: active ? 600 : 400,
                    background: active ? '#F4EAD4' : 'transparent',
                    color: active ? '#2E294E' : 'rgba(255,255,255,0.72)',
                    boxShadow: active ? '3px 3px 0 0 rgba(0,0,0,0.32)' : 'none',
                    transform: active ? 'rotate(-1deg)' : 'none',
                    transition: 'background 0.1s ease',
                  }}
                >
                  {active && (
                    <div
                      style={{
                        position: 'absolute',
                        height: '18px',
                        width: '40px',
                        background: 'rgba(215,38,61,0.82)',
                        backgroundImage:
                          'repeating-linear-gradient(45deg, rgba(255,255,255,0.2) 0 4px, transparent 4px 9px)',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                        top: '-5px',
                        left: '22px',
                        transform: 'rotate(-7deg)',
                        borderRadius: '2px',
                        pointerEvents: 'none',
                      }}
                    />
                  )}
                  <Icon size={18} />
                  {label}
                  {href === '/admin/clock' && hasActiveTimer && (
                    <span
                      className="animate-pulse"
                      style={{
                        marginLeft: 'auto',
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#4ade80',
                        flexShrink: 0,
                        boxShadow: '0 0 4px #4ade80',
                      }}
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Active projects */}
          {projects.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  padding: '0 6px 9px',
                  color: 'rgba(255,255,255,0.5)',
                }}
              >
                <FolderKanban size={13} />
                <span
                  style={{
                    fontFamily: 'Fraunces, serif',
                    fontWeight: 600,
                    fontSize: '11px',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                  }}
                >
                  Active projects
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {projects.map((p) => {
                  const dashVal = ((p.pct / 100) * CIRC).toFixed(1);
                  const dash = `${dashVal} ${CIRC}`;
                  const isCurrentProject = currentProjectId === p.id;

                  return (
                    <a
                      key={p.id}
                      href={`/admin/projects/${p.id}`}
                      onClick={(e) => {
                        if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                        e.preventDefault();
                        navigate(`/admin/projects/${p.id}`);
                      }}
                      title={`Open ${p.name}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '7px 8px',
                        borderRadius: '6px',
                        border: 'none',
                        cursor: 'pointer',
                        background: isCurrentProject ? 'rgba(255,255,255,0.14)' : 'transparent',
                        width: '100%',
                        textAlign: 'left',
                        textDecoration: 'none',
                        color: 'inherit',
                      }}
                    >
                      <span
                        style={{ position: 'relative', width: '26px', height: '26px', flexShrink: 0 }}
                      >
                        <svg
                          width="26"
                          height="26"
                          viewBox="0 0 26 26"
                          style={{ display: 'block', transform: 'rotate(-90deg)' }}
                        >
                          <circle
                            cx="13"
                            cy="13"
                            r="10"
                            fill="none"
                            stroke="rgba(255,255,255,0.16)"
                            strokeWidth="3"
                          />
                          <circle
                            cx="13"
                            cy="13"
                            r="10"
                            fill="none"
                            stroke={p.clientColor}
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeDasharray={dash}
                          />
                        </svg>
                        <span
                          style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: '8px',
                            fontWeight: 700,
                            color: '#fff',
                          }}
                        >
                          {p.pct}
                        </span>
                      </span>
                      <span
                        style={{
                          flex: 1,
                          minWidth: 0,
                          fontSize: '12.5px',
                          fontWeight: 600,
                          color: '#ffffff',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {p.name}
                      </span>
                      {activeTimerProjectIds.has(p.id) && (
                        <span
                          className="animate-pulse"
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: '#4ade80',
                            flexShrink: 0,
                            boxShadow: '0 0 4px #4ade80',
                          }}
                        />
                      )}
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* User / Sign out — always pinned at bottom */}
        <div
          style={{
            borderTop: '1px solid rgba(255,255,255,0.14)',
            paddingTop: '13px',
            flexShrink: 0,
          }}
        >
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '4px' }}
          >
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                background: '#1B998B',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'Fraunces, serif',
                fontWeight: 600,
                fontSize: '14px',
                flexShrink: 0,
              }}
            >
              S
            </div>
            <div style={{ lineHeight: 1.1 }}>
              <div style={{ color: '#ffffff', fontSize: '13px', fontWeight: 600 }}>Sebastian</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>admin</div>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/auth/login' })}
            style={{
              marginTop: '9px',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              background: 'transparent',
              color: 'rgba(255,255,255,0.78)',
              border: '1.5px solid rgba(255,255,255,0.22)',
              borderRadius: '6px',
              padding: '9px',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
