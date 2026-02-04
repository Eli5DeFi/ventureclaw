'use client';

import { SessionProvider } from 'next-auth/react';
import { Web3Provider } from './Web3Provider';
import { ReactNode } from 'react';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <Web3Provider>
        {children}
      </Web3Provider>
    </SessionProvider>
  );
}
