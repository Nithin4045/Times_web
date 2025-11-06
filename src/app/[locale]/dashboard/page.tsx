"use client";
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session?.user?.role === 'ADM') {
      router.push('/dashboard/admin');
    } else if (session?.user?.role === 'STU') {
      router.push('/dashboard/student');
    } else {
      router.push('/login');
    }
  }, [session, router]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      fontSize: '18px'
    }}>
      Redirecting to dashboard...
    </div>
  );
} 