import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import authOptions from '@/lib/actions/authOptions';
import AdminNav from '@/components/admin/AdminNav';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect('/auth/login');
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-100">
      <AdminNav />
      <main className="flex-1 min-h-0 overflow-hidden">{children}</main>
    </div>
  );
}
