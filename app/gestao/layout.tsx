'use client';

import { AppShell } from '@/components/layout/AppShell';

/* Painel de gestão da Prefeitura (AT-003): só leitura (RN-040, decisão D-03). */
export default function LayoutGestao({ children }: { children: React.ReactNode }) {
  return <AppShell perfil="gestao">{children}</AppShell>;
}
