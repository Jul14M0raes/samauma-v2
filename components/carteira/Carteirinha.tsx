'use client';

/* A carteirinha na tela, nas duas faces.

   O formato segue o cartão ID-1 da ISO/IEC 7810 — 85,6 × 54 mm, o mesmo da
   carteira de motorista — porque é o que cabe na carteira de bolso e o que as
   gráficas já sabem imprimir sem pedir molde novo.

   A frente resolve a portaria: nome grande, número, situação e QR. O verso
   resolve quem encontrou a carteira sem saber o que ela é: o que ela atesta,
   o que não atesta e onde conferir. */

import { Catalogo } from '@/lib/dominio/catalogo';
import { codigoDeVerificacao, situacaoDaCarteira, type Carteira } from '@/lib/dominio/carteira';
import { Fmt } from '@/lib/dominio/formato';
import { enderecoPublico } from '@/lib/caminhos';
import { Marca, Pino } from '@/components/ui/Basicos';
import { CodigoQr } from './CodigoQr';

function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  const primeira = partes[0]?.[0] || '';
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : '';
  return (primeira + ultima).toUpperCase();
}

export function Carteirinha({ carteira, face = 'frente' }: { carteira: Carteira; face?: 'frente' | 'verso' }) {
  const catador = Catalogo.catador(carteira.catadorId);
  const coop = Catalogo.cooperativa(carteira.vinculo);
  const situacao = situacaoDaCarteira(carteira);
  const codigo = codigoDeVerificacao(carteira.numero);
  const endereco = enderecoPublico(`/carteira/${codigo}`);
  const nome = catador ? catador.nome : carteira.catadorId;

  if (face === 'verso') {
    return (
      <div className={`carteirinha verso ${situacao.liberada ? '' : 'bloqueada'}`}>
        <div className="carteirinha-faixa">
          <span>Programa municipal de coleta seletiva</span>
          <b className="mono">{carteira.numero}</b>
        </div>
        <div className="carteirinha-verso-corpo">
          <div className="carteirinha-texto">
            <p><b>O que esta carteira atesta.</b> Que a pessoa identificada na frente é
              trabalhadora reconhecida no programa municipal de coleta seletiva de Porto
              Velho/RO e está registrada no SAMAÚMA.</p>
            <p><b>Como conferir.</b> Aponte a câmera para o QR Code ou digite o código no
              endereço abaixo. A conferência é pública e não exige cadastro.</p>
            <p className="carteirinha-limite"><b>Não substitui documento de identidade civil.</b>{' '}
              Base legal: Lei nº 12.305/2010 e Lei nº 11.445/2007.</p>
          </div>
          <div className="carteirinha-verso-qr">
            <CodigoQr conteudo={endereco} tamanho={104} nivel="Q"
              rotulo={`Verificação da carteira ${codigo}`} />
            <small className="mono">{codigo}</small>
          </div>
        </div>
        <div className="carteirinha-rodape">
          <span>Emitida em {Fmt.data(carteira.emitidaEm)} por {carteira.emitidaPor} · via {carteira.via}</span>
          <span className="mono">{endereco.replace(/^https?:\/\//, '')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`carteirinha ${situacao.liberada ? '' : 'bloqueada'}`}>
      <header className="carteirinha-topo">
        <Marca tamanho={30} />
        <div>
          <b>PREFEITURA DE PORTO VELHO · SEMA</b>
          <span>Coleta seletiva · carteira do catador</span>
        </div>
      </header>

      <div className="carteirinha-corpo">
        <div className="carteirinha-retrato" aria-hidden="true">{iniciais(nome)}</div>

        <div className="carteirinha-dados">
          <b className="carteirinha-nome">{nome}</b>
          <span className="carteirinha-vinculo">
            {coop ? `Cooperado · ${coop.nome}` : 'Catador autônomo'}
          </span>
          <dl>
            <div><dt>Registro</dt><dd className="mono">{codigo}</dd></div>
            <div><dt>Válida até</dt><dd>{Fmt.data(carteira.validaAte)}</dd></div>
            <div><dt>Zona</dt><dd>{catador?.zona || '—'}</dd></div>
          </dl>
        </div>

        <div className="carteirinha-qr">
          <CodigoQr conteudo={endereco} tamanho={92} nivel="Q"
            rotulo={`Verificação da carteira ${codigo}`} />
          <Pino rotulo={situacao.rotulo} tom={situacao.tom} />
        </div>
      </div>
    </div>
  );
}

/** As duas faces lado a lado, como saem da impressão. */
export function CarteirinhaDupla({ carteira }: { carteira: Carteira }) {
  return (
    <div className="carteirinha-par">
      <Carteirinha carteira={carteira} face="frente" />
      <Carteirinha carteira={carteira} face="verso" />
    </div>
  );
}
