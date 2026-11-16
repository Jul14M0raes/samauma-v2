'use client';

/* A página que abre quando alguém aponta a câmera para o QR da carteira.

   Quem chega aqui é um porteiro, um fiscal, um cliente do supermercado ou o
   próprio catador conferindo. Nenhum deles tem login, e nenhum deles precisa
   ter: a verificação é pública porque o objetivo é justamente ser conferível
   por qualquer um, de fora do sistema.

   O que aparece é o mínimo necessário para responder "esta pessoa está
   regular?": nome, vínculo, validade e situação. O que não aparece, por
   decisão e não por esquecimento: renda, produção, endereço, telefone,
   histórico de coletas e qualquer pendência interna da cooperativa. */

import Link from 'next/link';
import { CabecalhoPublico } from '@/components/layout/CabecalhoPublico';
import { useDominioPronto } from '@/components/layout/Bootstrap';
import { CarteirinhaDupla } from '@/components/carteira/Carteirinha';
import { Aviso, Cartao, Pino, Tri } from '@/components/ui/Basicos';
import { Carteiras, numeroDoCodigo, situacaoDaCarteira } from '@/lib/dominio/carteira';
import { Catalogo } from '@/lib/dominio/catalogo';
import { useCarteirasVersao } from '@/state/hooks';
import { Esqueleto } from '@/components/ui/Esqueleto';

export function VerificacaoCarteira({ codigo }: { codigo: string }) {
  const pronto = useDominioPronto();
  useCarteirasVersao();

  if (!pronto) return <Esqueleto variante="publico" />;

  const numero = numeroDoCodigo(codigo);
  const carteira = numero ? Carteiras.porNumero(numero) : null;

  if (!carteira) {
    return (
      <main className="portao" id="conteudo">
        <div className="verificacao">
          <CabecalhoPublico />
          <div className="verificacao-veredito erro">
            <b>Carteira não encontrada</b>
            <p>{numero
              ? `Nenhuma carteira ${numero} consta do registro municipal.`
              : 'O código lido não tem o formato de uma carteira do SAMAÚMA, ou os dois caracteres de conferência não batem.'}</p>
          </div>
          <Cartao titulo="O que fazer" corpo={<dl className="pares">
            <div><dt>Se digitou à mão</dt><dd>Confira o código impresso no cartão, inclusive os dois caracteres depois do último hífen.</dd></div>
            <div><dt>Se leu o QR</dt><dd>Uma carteira que não consta do registro não autoriza entrada. Encaminhe a pessoa à cooperativa ou à Secretaria.</dd></div>
          </dl>} />
          <p className="fonte-dado" style={{ textAlign: 'center' }}>
            <Link href="/demonstracao">Ver o sistema por dentro</Link>
          </p>
        </div>
      </main>
    );
  }

  const situacao = situacaoDaCarteira(carteira);
  const catador = Catalogo.catador(carteira.catadorId);
  const coop = Catalogo.cooperativa(carteira.vinculo);

  return (
    <main className="portao" id="conteudo">
      <div className="verificacao">
        <CabecalhoPublico />

        <div className={`verificacao-veredito ${situacao.liberada ? 'ok' : 'erro'}`}>
          <Pino rotulo={situacao.rotulo} tom={situacao.tom} />
          <b>{catador ? catador.nome : carteira.catadorId}</b>
          <p>{coop ? `Cooperado da ${coop.nome}` : 'Catador autônomo'}</p>
          <Tri />
          <p>{situacao.motivo}</p>
        </div>

        <CarteirinhaDupla carteira={carteira} />

        <dl className="pares">
          <div><dt>Zona de atuação</dt><dd>{catador?.zona || '—'}</dd></div>
          <div><dt>Emitida por</dt><dd>{carteira.emitidaPor}</dd></div>
        </dl>

        {!situacao.liberada && (
          <Aviso tom="erro" titulo="Esta carteira não autoriza entrada"
            texto="Encaminhe a pessoa à cooperativa de vínculo ou à Secretaria Municipal de Meio Ambiente para regularizar. A recusa de entrada não impede a pessoa de trabalhar; impede apenas o registro de passagem neste momento." />
        )}

        <Cartao titulo="O que esta página informa" sub="E o que ela deliberadamente não informa"
          nota="Protótipo demonstrativo. Pessoas, documentos e valores são fictícios; a página não representa ato administrativo da Prefeitura de Porto Velho."
          corpo={<dl className="pares">
            <div><dt>Informa</dt><dd>Nome, vínculo, zona de atuação, validade e situação da carteira.</dd></div>
            <div><dt>Não informa</dt><dd>Renda, produção, endereço, telefone, histórico de coletas ou pendências internas da organização. Esses dados não são públicos.</dd></div>
          </dl>} />

        <p className="fonte-dado" style={{ textAlign: 'center' }}>
          <Link href="/demonstracao">Ver o sistema por dentro</Link>
        </p>
      </div>
    </main>
  );
}
