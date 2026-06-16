'use client';

import { useTransitionRouter } from 'next-transition-router';

interface AdminLinkProps {
  href: string;
  className?: string;
  children: React.ReactNode;
}

export default function AdminLink({ href, className, children }: AdminLinkProps) {
  const router = useTransitionRouter();
  return (
    <div
      role="presentation"
      onClick={() => router.push(href)}
      className={className}
      style={{ display: 'contents' }}
    >
      {children}
    </div>
  );
}
