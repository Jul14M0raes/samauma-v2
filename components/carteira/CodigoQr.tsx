'use client';

/* O QR Code na tela.

   Só desenha depois que o domínio sobe no navegador: o conteúdo costuma ser um
   endereço absoluto construído a partir da origem real da página, que não
   existe durante a geração estática. Desenhar antes gravaria a marca errada no
   HTML e produziria divergência de hidratação logo em seguida.

   A espera reaproveita o mesmo sinal do resto do sistema (`useDominioPronto`),
   em vez de um `useState` de montagem só para este componente. */

import { useMemo } from 'react';
import { useDominioPronto } from '@/components/layout/Bootstrap';
import { caminhoQr, gerarQr, type NivelCorrecao } from '@/lib/servicos/qr';

export function CodigoQr({
  conteudo, tamanho = 128, nivel = 'Q', margem = 2, cor = '#12241c',
  rotulo = 'QR Code de verificação', classe = ''
}: {
  conteudo: string; tamanho?: number; nivel?: NivelCorrecao; margem?: number;
  cor?: string; rotulo?: string; classe?: string;
}) {
  const pronto = useDominioPronto();

  const matriz = useMemo(() => {
    if (!pronto || !conteudo) return null;
    try {
      return gerarQr(conteudo, { nivel });
    } catch {
      /* Conteúdo longo demais para as versões previstas: melhor um espaço vazio
         do que uma tela quebrada em cima de um cartão. */
      return null;
    }
  }, [pronto, conteudo, nivel]);

  if (!matriz) {
    /* Enquanto o domínio ainda não subiu, o vazio é esperado e breve — sem
       aviso. Se já está pronto e mesmo assim não gerou, é falha de verdade:
       diz isso em vez de deixar uma caixa cinza sem explicação. */
    return (
      <span className={`qr-reserva ${classe}`} style={{ width: tamanho, height: tamanho }}
        role={pronto ? 'img' : undefined} aria-hidden={pronto ? undefined : true}
        aria-label={pronto ? 'QR Code indisponível' : undefined}>
        {pronto && <small>QR indisponível</small>}
      </span>
    );
  }

  const lado = matriz.tamanho + margem * 2;
  return (
    <svg className={`qr ${classe}`} width={tamanho} height={tamanho} viewBox={`0 0 ${lado} ${lado}`}
      role="img" aria-label={rotulo} shapeRendering="crispEdges">
      <rect width={lado} height={lado} fill="#fff" />
      <g transform={`translate(${margem} ${margem})`}>
        <path d={caminhoQr(matriz)} fill={cor} />
      </g>
    </svg>
  );
}
