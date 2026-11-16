/* SAMAÚMA — as peças que vão para o processo administrativo.

   Minuta de notificação e dossiê do gerador, em HTML autônomo para o servidor
   revisar, imprimir ou anexar no SEI.

   As duas saem carimbadas como MINUTA, no topo e no rodapé, e sem espaço para
   assinatura. Isso é deliberado: um documento que sai do sistema parecendo
   pronto para expedir acaba expedido sem revisão, e aí o software terá
   praticado ato administrativo — competência que ele não tem. O carimbo é a
   diferença entre ajudar o fiscal e passar por cima dele. */

import { escapar as esc, Fmt } from '../dominio/formato';
import type { Dossie, Minuta } from '../dominio/notificacao';
import { Catalogo } from '../dominio/catalogo';
import { abrirParaImprimir, baixarHtml } from './arquivo';

const CABECA = (titulo: string, referencia: string, logoUrl: string) => `
  <header class="cabeca">
    <img src="${logoUrl}" alt="" class="marca" onerror="this.style.display='none'">
    <div class="org">
      <b>PREFEITURA DE PORTO VELHO</b>
      <span>Secretaria Municipal de Meio Ambiente e Desenvolvimento Sustentável</span>
    </div>
    <div class="carimbo">MINUTA</div>
  </header>
  <h1>${esc(titulo)}</h1>
  <div class="ref mono">Referência do sistema: ${esc(referencia)}</div>`;

const RODAPE = `
  <footer class="rodape">
    <p><b>Esta peça é uma minuta gerada por sistema.</b> Não constitui ato administrativo,
    não produz efeitos, não constitui o notificado em mora e não substitui a manifestação
    da autoridade competente. A expedição depende de revisão, numeração e assinatura no
    processo administrativo próprio.</p>
    <p class="aviso">Protótipo demonstrativo. Organizações, documentos e valores são fictícios.</p>
  </footer>`;

export function minutaHtml(minuta: Minuta, logoUrl: string): string {
  const g = minuta.gerador;
  const achados = minuta.achados.map((a, i) => `
    <li>
      <b>${i + 1}. ${esc(a.titulo)}</b>
      <p>${esc(a.detalhe)}</p>
      <p class="base">${esc(a.fundamento.norma)}, ${esc(a.fundamento.dispositivo)}, ${esc(a.fundamento.texto)}</p>
    </li>`).join('');

  return `<div class="peca">
  ${CABECA('Minuta de notificação', minuta.referencia, logoUrl)}

  <section class="destinatario">
    <div><span>Estabelecimento</span><b>${esc(g.nome)}</b></div>
    <div><span>CNPJ</span><b class="mono">${esc(g.cnpj)}</b></div>
    <div><span>Ramo</span><b>${esc(g.ramo)}</b></div>
    <div><span>Endereço</span><b>${esc(Catalogo.endereco(g.ponto))}</b></div>
  </section>

  <p class="corrido">Da apuração feita no sistema municipal de rastreabilidade de resíduos,
  na competência ${esc(minuta.competencia)}, resultou a situação
  <b>${esc(minuta.situacao.rotulo.toLowerCase())}</b> para o estabelecimento acima,
  pelos motivos a seguir.</p>

  <h2>Do apurado</h2>
  <ol class="achados">${achados}</ol>

  ${minuta.solicitacoes.length ? `
  <h2>Do que se pede informar</h2>
  <p class="corrido nota">Os pontos a seguir <b>não constituem imputação</b>: são informações que
  faltam ao sistema municipal e cuja ausência, por si só, não caracteriza irregularidade.</p>
  <ol class="achados">${minuta.solicitacoes.map(a => `
    <li><b>${esc(a.titulo)}</b><p>${esc(a.detalhe)}</p></li>`).join('')}</ol>` : ''}

  <h2>Do prazo</h2>
  <p class="corrido">Fica concedido o prazo de <b>${minuta.prazo} (${esc(porExtenso(minuta.prazo))}) dias corridos</b>,
  a contar do recebimento, para regularização ou apresentação de defesa, com vencimento
  previsto para <b>${esc(Fmt.data(minuta.vencimentoEm))}</b>.</p>

  <h2>Do que se espera</h2>
  <ul class="providencias">
    <li>Apresentar ou renovar o Plano de Gerenciamento de Resíduos Sólidos, quando for o caso.</li>
    <li>Comprovar a destinação ambientalmente adequada dos resíduos gerados no período.</li>
    <li>Informar o operador de coleta contratado, ficando vedada a utilização da coleta pública.</li>
    <li>Registrar no sistema o número do Manifesto de Transporte de Resíduos das cargas transportadas.</li>
  </ul>

  <p class="corrido">A comprovação pode ser feita pelo próprio sistema, no perfil do gerador,
  onde ficam registradas as cargas destinadas e os respectivos comprovantes.</p>

  ${RODAPE}
</div>`;
}

export function dossieHtml(dossie: Dossie, logoUrl: string): string {
  const g = dossie.gerador;
  const linhas = dossie.linhas.map(l => `
    <tr>
      <td class="mono">${esc(l.demanda.id)}</td>
      <td>${esc(Fmt.data(l.demanda.criadaEm))}</td>
      <td>${esc(Catalogo.nomeResiduo(l.demanda.residuo))}</td>
      <td>${esc(l.massa)}</td>
      <td>${esc(l.prova)}</td>
      <td class="mono">${esc(l.manifesto)}</td>
      <td class="mono">${esc(l.comprovante)}</td>
    </tr>`).join('');

  const achados = dossie.achados.length
    ? `<h2>Pontos apurados</h2><ol class="achados">${dossie.achados.map(a => `
        <li><b>${esc(a.titulo)}</b><p>${esc(a.detalhe)}</p>
        <p class="base">${esc(a.fundamento.norma)}, ${esc(a.fundamento.dispositivo)}</p></li>`).join('')}</ol>`
    : '<h2>Pontos apurados</h2><p class="corrido">Nenhuma pendência apurada nesta data.</p>';

  return `<div class="peca larga">
  ${CABECA('Dossiê do gerador', dossie.referencia, logoUrl)}

  <section class="destinatario">
    <div><span>Estabelecimento</span><b>${esc(g.nome)}</b></div>
    <div><span>CNPJ</span><b class="mono">${esc(g.cnpj)}</b></div>
    <div><span>Situação nesta data</span><b>${esc(dossie.situacao.rotulo)}</b></div>
    <div><span>Emitido em</span><b>${esc(Fmt.dataHora(dossie.emitidoEm))}</b></div>
  </section>

  <section class="totais">
    <div><b>${dossie.totais.cargas}</b><span>cargas registradas</span></div>
    <div><b>${dossie.totais.comprovadas}</b><span>com comprovante</span></div>
    <div><b>${esc(Fmt.kg(dossie.totais.massa))}</b><span>massa comprovada</span></div>
    <div><b>${dossie.totais.comTiquete}</b><span>com medição comprovada</span></div>
    <div><b>${dossie.totais.comMtr}</b><span>com MTR informado</span></div>
  </section>

  ${achados}

  ${dossie.solicitacoes.length ? `
  <h2>Informações pendentes</h2>
  <p class="corrido nota">Não são imputações: são dados que faltam ao sistema.</p>
  <ol class="achados">${dossie.solicitacoes.map(a => `
    <li><b>${esc(a.titulo)}</b><p>${esc(a.detalhe)}</p></li>`).join('')}</ol>` : ''}

  <h2>Cargas do estabelecimento</h2>
  <table class="grade">
    <thead><tr><th>Carga</th><th>Criada</th><th>Resíduo</th><th>Massa</th><th>Prova</th><th>MTR</th><th>Comprovante</th></tr></thead>
    <tbody>${linhas || '<tr><td colspan="7">Nenhuma carga registrada.</td></tr>'}</tbody>
  </table>

  <p class="corrido nota">A coluna <b>Prova</b> indica se a massa do destino se sustenta
  sozinha: <i>medição comprovada</i> quando há balança identificada, aferição e tíquete;
  <i>massa declarada</i> quando o número foi digitado sem essa evidência.</p>

  ${RODAPE}
</div>`;
}

function porExtenso(n: number): string {
  const nomes: Record<number, string> = { 5: 'cinco', 10: 'dez', 15: 'quinze', 20: 'vinte', 30: 'trinta' };
  return nomes[n] || String(n);
}

export const ESTILO_PECA = `
:root{--raiz:#1f6b4a;--tinta:#2c332f;--tinta2:#5d6b64;--tinta3:#8a9690;--linha:#e5ebe3;--linha2:#f0f4ef}
*{box-sizing:border-box}
body{background:#f3f6f2;color:var(--tinta);margin:0;padding:24px;line-height:1.6;font-size:13px;
  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif}
.mono{font-family:ui-monospace,Consolas,monospace}
.peca{max-width:760px;margin:0 auto;background:#fff;border:1px solid var(--linha);
  border-radius:14px;padding:32px 40px 24px}
.peca.larga{max-width:1000px}
.cabeca{display:flex;align-items:center;gap:12px;padding-bottom:14px;border-bottom:2px solid var(--raiz)}
.cabeca .marca{width:38px;height:auto}
.org{display:flex;flex-direction:column;flex:1}
.org b{font-size:11px;letter-spacing:1.4px;color:var(--raiz)}
.org span{font-size:10.5px;color:var(--tinta3)}
.carimbo{border:2px solid #b5453b;color:#b5453b;font-weight:700;font-size:12px;
  letter-spacing:2.5px;padding:5px 12px;border-radius:5px;transform:rotate(-2deg)}
h1{font-size:19px;font-weight:600;margin:20px 0 2px;letter-spacing:-.3px}
.ref{font-size:10.5px;color:var(--tinta3);letter-spacing:.6px}
h2{font-size:12px;text-transform:uppercase;letter-spacing:1.2px;color:var(--raiz);
  margin:22px 0 8px;padding-bottom:5px;border-bottom:1px solid var(--linha2)}
.destinatario{display:grid;grid-template-columns:repeat(2,1fr);gap:8px 20px;
  margin:18px 0 0;padding:14px 16px;background:#f7faf6;border-radius:10px}
.destinatario div{display:flex;flex-direction:column}
.destinatario span{font-size:9px;text-transform:uppercase;letter-spacing:.9px;color:var(--tinta3);font-weight:700}
.destinatario b{font-size:13px}
.totais{display:flex;flex-wrap:wrap;gap:26px;margin-top:16px;padding:14px 16px;
  background:#f7faf6;border-radius:10px}
.totais div{display:flex;flex-direction:column}
.totais b{font-size:19px;font-weight:600;letter-spacing:-.4px}
.totais span{font-size:9px;text-transform:uppercase;letter-spacing:.9px;color:var(--tinta3);font-weight:700}
.corrido{margin:10px 0 0;text-align:justify}
.corrido.nota{font-size:11.5px;color:var(--tinta2);margin-top:14px}
.achados{margin:0;padding:0;list-style:none;counter-reset:a}
.achados li{margin-bottom:14px;padding-left:0}
.achados li b{display:block;font-size:13px}
.achados li p{margin:3px 0 0;color:var(--tinta2)}
.achados .base{font-size:11.5px;color:var(--tinta3);font-style:italic}
.providencias{margin:0;padding:0;list-style:none}
.providencias li{position:relative;padding-left:16px;margin-bottom:6px;color:var(--tinta2)}
.providencias li::before{content:'';position:absolute;left:0;top:9px;width:5px;height:5px;
  border-radius:50%;background:var(--raiz)}
.grade{width:100%;border-collapse:collapse;font-size:11.5px;margin-top:6px}
.grade th{text-align:left;font-size:9px;text-transform:uppercase;letter-spacing:.9px;
  color:var(--tinta3);border-bottom:1.5px solid var(--linha);padding:0 10px 6px 0}
.grade td{padding:7px 10px 7px 0;border-bottom:1px solid var(--linha2);vertical-align:top}
.rodape{margin-top:26px;padding-top:14px;border-top:1px solid var(--linha)}
.rodape p{margin:0;font-size:11px;line-height:1.6;color:var(--tinta2)}
.rodape b{color:var(--tinta)}
.rodape .aviso{margin-top:8px;font-size:10px;color:var(--tinta3)}
@media print{body{background:#fff;padding:0;font-size:11pt}
  .peca{border:0;border-radius:0;max-width:none;padding:0}
  .grade{font-size:9pt}}`;

function pagina(titulo: string, corpo: string): string {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(titulo)} · SAMAÚMA</title>
<style>${ESTILO_PECA}</style></head><body>${corpo}</body></html>`;
}

function imprimir(titulo: string, corpo: string) {
  abrirParaImprimir(pagina(titulo, corpo), 880, 900);
}

function baixar(titulo: string, arquivo: string, corpo: string) {
  baixarHtml(pagina(titulo, corpo), arquivo);
}

export function imprimirMinuta(minuta: Minuta, logoUrl: string) {
  imprimir('Minuta de notificação', minutaHtml(minuta, logoUrl));
}

export function baixarMinuta(minuta: Minuta, logoUrl: string) {
  baixar('Minuta de notificação', `minuta-${minuta.gerador.id}.html`, minutaHtml(minuta, logoUrl));
}

export function imprimirDossie(dossie: Dossie, logoUrl: string) {
  imprimir('Dossiê do gerador', dossieHtml(dossie, logoUrl));
}

export function baixarDossie(dossie: Dossie, logoUrl: string) {
  baixar('Dossiê do gerador', `dossie-${dossie.gerador.id}.html`, dossieHtml(dossie, logoUrl));
}
