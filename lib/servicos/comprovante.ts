/* SAMAÚMA — comprovante simplificado (DOC-004), em HTML autônomo: abre sozinho
   fora do site e serve também à impressão. Composição da decisão D-06, mais o
   número do MTR (RF-023). */

import { Catalogo } from '../dominio/catalogo';
import { baixarHtml } from './arquivo';
import { escapar as esc, Fmt } from '../dominio/formato';
import type { Demanda as TDemanda } from '../dominio/tipos';

export function comprovanteHtml(demanda: TDemanda, logoUrl: string): string {
  const linha = (rotulo: string, valor: string) => `<div class="linha"><dt>${esc(rotulo)}</dt><dd>${valor}</dd></div>`;
  const coop = Catalogo.cooperativa(Catalogo.destino(demanda.destino.id)?.cooperativa);
  const cadastro = Catalogo.gerador(demanda.gerador.id);
  const coleta = [demanda.catador?.nome, coop?.nome].filter(Boolean).join(' · ') || '—';

  return `<div class="comprovante" id="comprovante">
    <div class="cabeca">
      <img src="${logoUrl}" alt="SAMAÚMA" class="marca-arquivo" onerror="this.style.display='none'">
      <div class="org">PREFEITURA DE PORTO VELHO · SAMAÚMA</div>
      <h2>Comprovante simplificado</h2>
      <div class="cod mono">${esc(demanda.comprovante!.codigo)}</div>
      <div class="tri"><i></i><i></i><i></i></div>
    </div>
    <dl>
      ${linha('Gerador', esc(demanda.gerador.nome) + (cadastro ? ' · ' + esc(cadastro.cnpj) : ''))}
      ${linha('Responsável técnico', esc(cadastro?.responsavelTecnico || 'não informado'))}
      ${linha('Responsável da coleta', esc(coleta))}
      ${linha('Entrega da coleta', esc(Fmt.dataHora(demanda.recebidaEm)))}
      ${linha('Tipo de resíduo', esc(Catalogo.nomeResiduo(demanda.residuo)))}
      ${linha('Quantidade', `${Fmt.kg(demanda.verificadoKg)} <small>(declarado: ${Fmt.litros(demanda.declaradoL)})</small>`)}
      ${linha('MTR', demanda.mtr ? esc(demanda.mtr.numero) + ' · SINIR' : 'ainda não vinculado pelo gerador')}
    </dl>
    <div class="aviso">Protótipo demonstrativo. Organizações, pessoas, documentos e valores são fictícios. O documento não representa ato administrativo, contratação ou decisão da Prefeitura de Porto Velho.</div>
  </div>`;
}

export const ESTILO_COMPROVANTE = `
body{background:#f3f6f2;color:#2c332f;margin:0;padding:24px;line-height:1.55;
  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif}
.comprovante{max-width:580px;margin:0 auto;background:#fff;border:1px solid #e2e8e0;
  border-radius:18px;padding:28px 32px}
.comprovante .cabeca{text-align:center;padding-bottom:16px}
.comprovante .cabeca .marca-arquivo{width:88px;height:auto;margin-bottom:6px}
.comprovante .cabeca .org{font-size:10.5px;font-weight:700;letter-spacing:2px;color:#1f6b4a}
.comprovante .cabeca h2{font-size:19px;margin:10px 0 0;font-weight:600;letter-spacing:-.2px}
.comprovante .cabeca .cod{font-size:12.5px;color:#8a9690;margin-top:6px;letter-spacing:1.5px;
  font-family:ui-monospace,Consolas,monospace}
.comprovante .tri{display:flex;gap:5px;justify-content:center;margin:14px 0 0}
.comprovante .tri i{width:34px;height:3px;border-radius:3px}
.comprovante .tri i:nth-child(1){background:#8fbb3f}
.comprovante .tri i:nth-child(2){background:#2a6fa8}
.comprovante .tri i:nth-child(3){background:#e0a93a}
.comprovante dl{margin:20px 0 0}
.comprovante .linha{display:flex;justify-content:space-between;gap:16px;padding:10px 0;
  border-bottom:1px solid #eff3ee;font-size:13.5px}
.comprovante .linha dt{color:#8a9690;margin:0}
.comprovante .linha dd{font-weight:600;text-align:right;margin:0;font-variant-numeric:tabular-nums}
.comprovante .linha dd small{color:#8a9690;font-weight:400}
.comprovante .aviso{margin-top:18px;font-size:11.5px;color:#8a9690;line-height:1.6;
  border-top:1px solid #eff3ee;padding-top:14px}
@media print{body{background:#fff;padding:0}.comprovante{border:0}}`;

export function baixarComprovante(demanda: TDemanda, logoUrl: string) {
  const pagina = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Comprovante ${demanda.comprovante!.codigo} · SAMAÚMA</title>
<style>${ESTILO_COMPROVANTE}</style></head><body>
${comprovanteHtml(demanda, logoUrl)}</body></html>`;
  baixarHtml(pagina, `comprovante-${demanda.comprovante!.codigo.toLowerCase()}.html`);
}
