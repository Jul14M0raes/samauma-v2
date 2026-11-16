import { VerificacaoCarteira } from './VerificacaoCarteira';
import { idsDeCarteira } from '@/lib/rotasEstaticas';

/* Exportacao estatica: a casca e servidor so para declarar quais verificacoes
   viram arquivo; o conteudo todo continua no componente cliente. O que passar
   da faixa cai no `not-found`, que reconhece o endereco e mostra a mesma tela. */
export function generateStaticParams() {
  return idsDeCarteira();
}

export default async function PaginaVerificacaoCarteira({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  return <VerificacaoCarteira codigo={codigo} />;
}
