'use client';

import { useEffect } from 'react';

const ChunkErrorWrapper = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    const handleChunkError = (e: any) => {
      const message = e?.reason?.message || e?.message || "";
      if (message.includes('Loading chunk')) {
        console.warn("Detected chunk load error. Reloading...");
        window.location.reload();
      }
    };

    window.addEventListener('error', handleChunkError);
    window.addEventListener('unhandledrejection', handleChunkError);

    return () => {
      window.removeEventListener('error', handleChunkError);
      window.removeEventListener('unhandledrejection', handleChunkError);
    };
  }, []);

  return <>{children}</>;
};

export default ChunkErrorWrapper;
