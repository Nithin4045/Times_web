import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export default function Home() {
  redirect('/login'); // Redirect to login (locale will be handled automatically)
  return null;
}
