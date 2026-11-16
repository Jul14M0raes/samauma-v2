'use client';

/* O acesso passou para a raiz do site, junto com a foto da cidade e a entrada
   pelo gov.br. Esta rota continua existindo porque havia link para ela — no
   cadastro e em material impresso — e some sozinha levando para o lugar certo. */

import { useRouter } from 'next/navigation';
import { useSyncExternalStore } from 'react';
import { Esqueleto } from '@/components/ui/Esqueleto';

function assinar() { return () => {}; }

export default function PaginaEntrarAntiga() {
  const router = useRouter();
  /* Redireciona só no cliente: no build estático não existe rota para navegar. */
  const noNavegador = useSyncExternalStore(assinar, () => true, () => false);
  if (noNavegador) router.replace('/');
  return <Esqueleto variante="publico" />;
}
