/* SAMAÚMA — a carteira fora da tela: arquivo para guardar e folha para imprimir.

   O cartão sai em HTML autônomo, com estilo embutido e o QR Code em SVG dentro
   do próprio arquivo. Isso importa: o catador baixa uma vez, e depois abre sem
   internet, num aparelho emprestado, na tela de qualquer navegador. Nada aqui
   depende do site continuar no ar.

   Mesmo conteúdo do componente JSX equivalente em `components/carteira`; duas
   saídas porque uma vive dentro do React e a outra precisa andar sozinha. */

import { enderecoPublico } from '../caminhos';
import { codigoDeVerificacao, situacaoDaCarteira, type Carteira } from '../dominio/carteira';
import { Catalogo } from '../dominio/catalogo';
import { escapar as esc, Fmt } from '../dominio/formato';
import { abrirParaImprimir, baixarHtml } from './arquivo';
import { svgQr } from './qr';

function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  return ((partes[0]?.[0] || '') + (partes.length > 1 ? partes[partes.length - 1][0] : '')).toUpperCase();
}

export function carteiraHtml(carteira: Carteira, logoUrl: string): string {
  const catador = Catalogo.catador(carteira.catadorId);
  const coop = Catalogo.cooperativa(carteira.vinculo);
  const situacao = situacaoDaCarteira(carteira);
  const codigo = codigoDeVerificacao(carteira.numero);
  const endereco = enderecoPublico(`/carteira/${codigo}`);
  const nome = catador ? catador.nome : carteira.catadorId;
  const qr = (lado: number) => svgQr(endereco, { nivel: 'Q', margem: 2, titulo: `Verificação da carteira ${codigo}` })
    .replace('<svg ', `<svg width="${lado}" height="${lado}" `);

  return `<div class="par">
  <div class="cartao ${situacao.liberada ? '' : 'bloqueado'}">
    <div class="topo">
      <img src="${logoUrl}" alt="" class="marca" onerror="this.style.display='none'">
      <div class="org">
        <b>PREFEITURA DE PORTO VELHO · SEMA</b>
        <span>Coleta seletiva · carteira do catador</span>
      </div>
    </div>
    <div class="corpo">
      <div class="retrato">${esc(iniciais(nome))}</div>
      <div class="dados">
        <b class="nome">${esc(nome)}</b>
        <span class="vinculo">${coop ? 'Cooperado · ' + esc(coop.nome) : 'Catador autônomo'}</span>
        <dl>
          <div><dt>Registro</dt><dd class="mono">${esc(codigo)}</dd></div>
          <div><dt>Válida até</dt><dd>${esc(Fmt.data(carteira.validaAte))}</dd></div>
          <div><dt>Zona</dt><dd>${esc(catador?.zona || '—')}</dd></div>
        </dl>
      </div>
      <div class="qr">
        ${qr(88)}
        <span class="pino ${situacao.tom}">${esc(situacao.rotulo)}</span>
      </div>
    </div>
  </div>

  <div class="cartao verso ${situacao.liberada ? '' : 'bloqueado'}">
    <div class="faixa">
      <span>Programa municipal de coleta seletiva</span>
      <b class="mono">${esc(carteira.numero)}</b>
    </div>
    <div class="corpo-verso">
      <div class="texto">
        <p><b>O que esta carteira atesta.</b> Que a pessoa identificada na frente é
          trabalhadora reconhecida no programa municipal de coleta seletiva de Porto
          Velho/RO e está registrada no SAMAÚMA.</p>
        <p><b>Como conferir.</b> Aponte a câmera para o QR Code ou digite o código no
          endereço abaixo. A conferência é pública e não exige cadastro.</p>
        <p class="limite"><b>Não substitui documento de identidade civil.</b>
          Base legal: Lei nº 12.305/2010 e Lei nº 11.445/2007.</p>
      </div>
      <div class="qr-verso">
        ${qr(96)}
        <small class="mono">${esc(codigo)}</small>
      </div>
    </div>
    <div class="rodape">
      <span>Emitida em ${esc(Fmt.data(carteira.emitidaEm))} por ${esc(carteira.emitidaPor)} · via ${carteira.via}</span>
      <span class="mono">${esc(endereco.replace(/^https?:\/\//, ''))}</span>
    </div>
  </div>
</div>
<p class="aviso">Protótipo demonstrativo. Pessoas, documentos e valores são fictícios.
O documento não representa ato administrativo da Prefeitura de Porto Velho.</p>`;
}

export const ESTILO_CARTEIRA = `
:root{--raiz:#1f6b4a;--tinta:#2c332f;--tinta2:#5d6b64;--tinta3:#8a9690;--linha:#e5ebe3;--linha2:#f0f4ef}
*{box-sizing:border-box}
body{background:#f3f6f2;color:var(--tinta);margin:0;padding:24px;line-height:1.5;
  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif}
.mono{font-family:ui-monospace,Consolas,monospace}
.par{display:flex;flex-wrap:wrap;gap:18px;justify-content:center}
.cartao{position:relative;display:flex;flex-direction:column;width:340px;height:214px;
  background:#fff;border:1px solid var(--linha);border-radius:14px;overflow:hidden;
  box-shadow:0 10px 26px rgba(31,61,46,.12)}
.cartao::before{content:'';position:absolute;inset:0 0 auto;height:4px;
  background:linear-gradient(90deg,#8fbb3f 0%,#2f8f5b 30%,#2a6fa8 68%,#e0a93a 100%)}
.cartao.bloqueado::before{background:#b5453b}
.cartao.verso{background:#f7faf6}
.topo{display:flex;align-items:center;gap:9px;padding:12px 14px 8px;border-bottom:1px solid var(--linha2)}
.topo .marca{width:26px;height:auto}
.org{display:flex;flex-direction:column;min-width:0}
.org b{font-size:8px;letter-spacing:1.2px;color:var(--raiz)}
.org span{font-size:9.5px;color:var(--tinta3)}
.corpo{flex:1;display:flex;gap:11px;padding:11px 14px 13px;align-items:flex-start}
.retrato{width:46px;height:56px;border-radius:8px;flex-shrink:0;display:flex;align-items:center;
  justify-content:center;background:#f1f5f0;border:1px solid var(--linha);color:var(--raiz);
  font-weight:700;font-size:16px}
.dados{flex:1;min-width:0}
.nome{display:block;font-size:15px;line-height:1.15;letter-spacing:-.2px;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.vinculo{display:block;font-size:10px;color:var(--tinta2);margin-bottom:6px;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dados dl{margin:0;display:flex;flex-direction:column;gap:2px}
.dados dl>div{display:flex;gap:6px;align-items:baseline;font-size:10px}
.dados dt{margin:0;width:54px;flex-shrink:0;color:var(--tinta3);font-size:8px;
  text-transform:uppercase;letter-spacing:.6px;font-weight:700}
.dados dd{margin:0;font-weight:600}
.qr{display:flex;flex-direction:column;align-items:center;gap:5px;flex-shrink:0}
.qr svg{display:block;border-radius:3px}
.pino{font-size:8.5px;padding:3px 8px;border-radius:999px;font-weight:700;
  background:#eaf5ec;border:1px solid #c8e2ce;color:#2f8f5b}
.pino.erro{background:#fdeeec;border-color:#f2cfca;color:#b5453b}
.pino.alerta{background:#fdf5e6;border-color:#f0dfba;color:#b6801c}
.faixa{display:flex;justify-content:space-between;align-items:baseline;gap:10px;
  padding:12px 14px 8px;border-bottom:1px solid var(--linha2)}
.faixa span{font-size:8px;letter-spacing:1.1px;text-transform:uppercase;color:var(--raiz);font-weight:700}
.faixa b{font-size:10px;color:var(--tinta2)}
.corpo-verso{flex:1;display:flex;gap:12px;padding:10px 14px 6px}
.texto{flex:1;display:flex;flex-direction:column;gap:5px;min-width:0}
.texto p{margin:0;font-size:9px;line-height:1.42;color:var(--tinta2)}
.texto b{color:var(--tinta)}
.limite{color:var(--tinta3)}
.qr-verso{display:flex;flex-direction:column;align-items:center;gap:3px}
.qr-verso small{font-size:7.5px;color:var(--tinta3)}
.rodape{display:flex;justify-content:space-between;gap:10px;padding:7px 14px 10px;
  border-top:1px solid var(--linha2);font-size:7.5px;color:var(--tinta3)}
.rodape span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.aviso{max-width:700px;margin:20px auto 0;font-size:11px;color:var(--tinta3);
  line-height:1.55;text-align:center}
@media print{
  body{background:#fff;padding:0}
  .cartao{box-shadow:none;break-inside:avoid;width:85.6mm;height:54mm}
  .par{gap:6mm}
  .aviso{margin-top:8mm}
}`;

function paginaCarteira(carteira: Carteira): string {
  const codigo = codigoDeVerificacao(carteira.numero);
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Carteira ${codigo} · SAMAÚMA</title>
<style>${ESTILO_CARTEIRA}</style></head><body>
${carteiraHtml(carteira, enderecoPublico('/logo.png'))}</body></html>`;
}

export function baixarCarteira(carteira: Carteira) {
  baixarHtml(paginaCarteira(carteira), `carteira-${carteira.numero.toLowerCase()}.html`);
}

export function imprimirCarteira(carteira: Carteira) {
  abrirParaImprimir(paginaCarteira(carteira), 760, 560);
}
