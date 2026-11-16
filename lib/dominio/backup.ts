/* SAMAÚMA — backup dos dados deste aparelho.

   Sem servidor, tudo vive no localStorage do navegador: limpar o cache ou trocar
   de aparelho apaga o histórico. O backup é um arquivo JSON com as chaves do
   sistema, para guardar fora e restaurar depois. Preferências de exibição
   (tema, tamanho, barra lateral) ficam de fora: são do aparelho, não do dado. */

const PREFIXO = 'samauma.';
const DO_APARELHO = ['samauma.next.acessibilidade.v1', 'samauma.next.sidebar.v1'];
const LIMITE_BYTES = 5 * 1024 * 1024;

export const BACKUP_VERSAO = 1;

export interface ArmazemMinimo {
  readonly length: number;
  key(i: number): string | null;
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
  removeItem(k: string): void;
}

export interface ArquivoBackup {
  app: 'samauma';
  versao: number;
  geradoEm: string;
  chaves: Record<string, string>;
}

export type ResultadoImportacao = { ok: true; chaves: number } | { ok: false; erro: string };

const dosDados = (k: string) => k.startsWith(PREFIXO) && !DO_APARELHO.includes(k);

function chavesDosDados(armazem: ArmazemMinimo): string[] {
  const lista: string[] = [];
  for (let i = 0; i < armazem.length; i++) {
    const k = armazem.key(i);
    if (k && dosDados(k)) lista.push(k);
  }
  return lista.sort();
}

export function exportarBackup(armazem: ArmazemMinimo, agora = new Date()): ArquivoBackup {
  const chaves: Record<string, string> = {};
  for (const k of chavesDosDados(armazem)) {
    const v = armazem.getItem(k);
    if (v !== null) chaves[k] = v;
  }
  return { app: 'samauma', versao: BACKUP_VERSAO, geradoEm: agora.toISOString(), chaves };
}

/* Valida o arquivo inteiro antes de tocar em qualquer chave: um arquivo torto
   não pode deixar o aparelho com metade dos dados novos e metade dos velhos. */
export function lerBackup(texto: string): { ok: true; arquivo: ArquivoBackup } | { ok: false; erro: string } {
  if (texto.length > LIMITE_BYTES) return { ok: false, erro: 'O arquivo é grande demais para ser um backup do Samaúma.' };
  let bruto: unknown;
  try { bruto = JSON.parse(texto); } catch { return { ok: false, erro: 'O arquivo não é um JSON válido.' }; }
  const o = bruto as Partial<ArquivoBackup> | null;
  if (!o || typeof o !== 'object' || o.app !== 'samauma' || !o.chaves || typeof o.chaves !== 'object') {
    return { ok: false, erro: 'Este arquivo não é um backup do Samaúma.' };
  }
  if (o.versao !== BACKUP_VERSAO) return { ok: false, erro: `Versão de backup não suportada (${String(o.versao)}).` };
  for (const [k, v] of Object.entries(o.chaves)) {
    if (!dosDados(k)) return { ok: false, erro: `Chave fora do escopo do sistema: ${k}.` };
    if (typeof v !== 'string') return { ok: false, erro: `Valor inválido em ${k}.` };
    try { JSON.parse(v); } catch { return { ok: false, erro: `Dado corrompido em ${k}.` }; }
  }
  return { ok: true, arquivo: o as ArquivoBackup };
}

/* Substitui, não mescla: restaurar é voltar ao estado do arquivo. */
export function importarBackup(armazem: ArmazemMinimo, texto: string): ResultadoImportacao {
  const lido = lerBackup(texto);
  if (!lido.ok) return lido;
  for (const k of chavesDosDados(armazem)) armazem.removeItem(k);
  for (const [k, v] of Object.entries(lido.arquivo.chaves)) armazem.setItem(k, v);
  return { ok: true, chaves: Object.keys(lido.arquivo.chaves).length };
}
