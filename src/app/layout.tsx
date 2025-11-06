// src/app/layout.tsx
import './global.css';
import { Poppins } from 'next/font/google';
import AuthProvider from '@/app/Providers'; // or { AuthProvider } if you chose named
import ChunkErrorWrapper from '@/components/common/ChunkErrorWrapper';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  display: 'swap',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={poppins.className}>
        <AuthProvider>
          <ChunkErrorWrapper>{children}</ChunkErrorWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}





