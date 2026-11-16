/* SAMAÚMA — conciliação do MTR com as cargas (RF-020, RF-024).
   Protótipo: recebe o arquivo que o gerador exporta do SINIR, não uma consulta.
   Aponta manifesto sem carga, carga sem manifesto e massa que não bate. */

import { Catalogo } from './catalogo';
import { Store } from './store';
import type { Demanda as TDemanda } from './tipos';

/** Uma linha do arquivo exportado do SINIR. */
export interface LinhaMtr {
  numero: string;
  cnpjGerador: string;
  cnpjDestinador: string;
  massaKg: number;
  data: string;
  cdf: string | null;
  /** Número da linha no arquivo, para a tela apontar o erro onde ele está. */
  linha: number;
}

export interface ParDeConciliacao {
  mtr: LinhaMtr;
  demanda: TDemanda;
  /** Como o par foi encontrado. */
  por: 'NUMERO' | 'CNPJ_E_MASSA';
  divergenciaKg: number;
  divergenciaPercentual: number | null;
  confere: boolean;
}

export interface Conciliacao {
  pares: ParDeConciliacao[];
  /** Manifesto no arquivo sem carga correspondente no sistema. */
  mtrSemCarga: LinhaMtr[];
  /** Carga em transporte ou recebida sem manifesto no arquivo. */
  cargaSemMtr: TDemanda[];
  /** Linhas do arquivo que não deu para ler. */
  invalidas: { linha: number; texto: string; motivo: string }[];
  resumo: { lidas: number; casadas: number; divergentes: number; semCarga: number; semMtr: number };
}

const soDigitos = (s: string) => (s || '').replace(/\D/g, '');

/* Divide uma linha de CSV respeitando aspas.

   Dividir com `split(/[;,\t]/)` parecia bastar até aparecer o caso que
   realmente acontece num arquivo brasileiro: separador vírgula e massa
   "1.250,50" entre aspas. O split ingênuo quebrava o número no meio e
   registrava 1.250 quilos onde havia 1.250,5 -- erro silencioso, do pior tipo,
   porque o arquivo é aceito e a conciliação sai errada.

   O separador é escolhido por detecção fora das aspas: ponto e vírgula quando
   houver, que é o padrão de exportação em português; vírgula ou tabulação nos
   outros casos. */
function separarCampos(linha: string): string[] {
  const forasDeAspas = (ch: string) => {
    let dentro = false, n = 0;
    for (const c of linha) {
      if (c === '"') dentro = !dentro;
      else if (c === ch && !dentro) n++;
    }
    return n;
  };
  const separador = forasDeAspas(';') ? ';' : forasDeAspas('\t') ? '\t' : ',';

  const campos: string[] = [];
  let atual = '';
  let dentro = false;
  for (const c of linha) {
    if (c === '"') { dentro = !dentro; continue; }
    if (c === separador && !dentro) { campos.push(atual); atual = ''; continue; }
    atual += c;
  }
  campos.push(atual);
  return campos.map(c => c.trim());
}

/* Tolerância de massa na conciliação. Deliberadamente igual à do sistema: se
   a diferença entre campo e balança já é aceita em 5%, exigir mais rigor do
   manifesto seria incoerente. */
const TOLERANCIA = 0.05;

/* Janela de dias entre a data do manifesto e o recebimento da carga, para o
   casamento por CNPJ. Manifesto acompanha o transporte, mas a digitação no
   SINIR costuma acontecer depois -- por isso a janela é generosa de um lado. */
const JANELA_DIAS = 7;

/**
 * Lê o texto exportado do SINIR.
 *
 * Aceita CSV com separador vírgula ou ponto e vírgula, com ou sem cabeçalho.
 * A ordem esperada é: número, CNPJ do gerador, CNPJ do destinador, massa em
 * quilos, data, e o CDF quando houver.
 *
 * O formato é permissivo de propósito: exportação de sistema público varia
 * entre versões, e recusar o arquivo inteiro por causa de uma linha torta
 * empurraria o usuário de volta para a conferência manual.
 */
export function lerArquivoMtr(texto: string): { linhas: LinhaMtr[]; invalidas: Conciliacao['invalidas'] } {
  const linhas: LinhaMtr[] = [];
  const invalidas: Conciliacao['invalidas'] = [];

  (texto || '').split(/\r?\n/).forEach((bruta, i) => {
    const n = i + 1;
    const texto = bruta.trim();
    if (!texto) return;

    const campos = separarCampos(texto);
    /* Cabeçalho: primeira coluna sem dígito nenhum. */
    if (i === 0 && !/\d/.test(campos[0] || '')) return;

    if (campos.length < 5) {
      invalidas.push({ linha: n, texto, motivo: 'Menos de cinco colunas.' });
      return;
    }
    const [numero, cnpjGerador, cnpjDestinador, massaBruta, data, cdf] = campos;
    const massaKg = Number(String(massaBruta).replace(/\./g, '').replace(',', '.'));
    if (!numero) {
      invalidas.push({ linha: n, texto, motivo: 'Sem número de manifesto.' });
      return;
    }
    if (!Number.isFinite(massaKg) || massaKg <= 0) {
      invalidas.push({ linha: n, texto, motivo: `Massa ilegível: "${massaBruta}".` });
      return;
    }
    linhas.push({
      numero: numero.trim(),
      cnpjGerador: soDigitos(cnpjGerador),
      cnpjDestinador: soDigitos(cnpjDestinador),
      massaKg,
      data: (data || '').trim(),
      cdf: cdf ? cdf.trim() : null,
      linha: n
    });
  });

  return { linhas, invalidas };
}

function diasEntre(a: string, b: string): number {
  const ta = new Date(a).getTime();
  const tb = new Date(b).getTime();
  if (!Number.isFinite(ta) || !Number.isFinite(tb)) return Infinity;
  return Math.abs(ta - tb) / 86400000;
}

/* Converte data brasileira para ISO quando vier assim. Exportação pública
   costuma trazer dd/mm/aaaa, e comparar isso com ISO daria sempre Infinity. */
function normalizarData(d: string): string {
  const br = /^(\d{2})\/(\d{2})\/(\d{4})/.exec(d || '');
  return br ? `${br[3]}-${br[2]}-${br[1]}` : d;
}

/**
 * Cruza o arquivo com as cargas do sistema.
 *
 * A ordem das estratégias importa: primeiro o número do manifesto, que é
 * identidade; só depois o casamento por CNPJ e massa, que é inferência e por
 * isso vem marcado como tal na tela.
 */
export function conciliar(linhas: LinhaMtr[], demandas?: TDemanda[]): Conciliacao {
  /* Só faz sentido conciliar o que já saiu do gerador: antes disso não há
     manifesto a existir. */
  const cargas = (demandas || Store.todas())
    .filter(d => ['COLETADA', 'PENDENCIA', 'COMPROVADA'].includes(d.status));

  const usadas = new Set<string>();
  const pares: ParDeConciliacao[] = [];
  const semCarga: LinhaMtr[] = [];

  const massaDe = (d: TDemanda) => d.verificadoKg ?? d.coletadoKg ?? 0;

  const parear = (mtr: LinhaMtr, demanda: TDemanda, por: ParDeConciliacao['por']) => {
    usadas.add(demanda.id);
    const massa = massaDe(demanda);
    const divergenciaKg = Math.abs(massa - mtr.massaKg);
    const divergenciaPercentual = massa ? (divergenciaKg / massa) * 100 : null;
    pares.push({
      mtr, demanda, por, divergenciaKg, divergenciaPercentual,
      confere: massa > 0 && divergenciaKg <= massa * TOLERANCIA
    });
  };

  /* Primeira passada: número do manifesto já registrado na carga. */
  const pendentes: LinhaMtr[] = [];
  linhas.forEach(mtr => {
    const porNumero = cargas.find(d => !usadas.has(d.id) && d.mtr && d.mtr.numero === mtr.numero);
    if (porNumero) parear(mtr, porNumero, 'NUMERO');
    else pendentes.push(mtr);
  });

  /* Segunda passada: mesmo gerador, mesmo destinador, data próxima e massa
     dentro da tolerância. É inferência, e a tela diz isso. */
  pendentes.forEach(mtr => {
    const data = normalizarData(mtr.data);
    const candidatas = cargas.filter(d => {
      if (usadas.has(d.id)) return false;
      const gerador = Catalogo.gerador(d.gerador.id);
      const destino = Catalogo.destino(d.destino.id);
      if (mtr.cnpjGerador && soDigitos(gerador?.cnpj || '') !== mtr.cnpjGerador) return false;
      if (mtr.cnpjDestinador && soDigitos(destino?.cnpj || '') !== mtr.cnpjDestinador) return false;
      return diasEntre(data, d.recebidaEm || d.prazo) <= JANELA_DIAS;
    });

    /* Entre as candidatas, a de massa mais próxima. */
    const melhor = candidatas.sort((a, b) =>
      Math.abs(massaDe(a) - mtr.massaKg) - Math.abs(massaDe(b) - mtr.massaKg))[0];

    if (melhor) parear(mtr, melhor, 'CNPJ_E_MASSA');
    else semCarga.push(mtr);
  });

  const cargaSemMtr = cargas.filter(d => !usadas.has(d.id));
  const divergentes = pares.filter(p => !p.confere).length;

  return {
    pares,
    mtrSemCarga: semCarga,
    cargaSemMtr,
    invalidas: [],
    resumo: {
      lidas: linhas.length,
      casadas: pares.length,
      divergentes,
      semCarga: semCarga.length,
      semMtr: cargaSemMtr.length
    }
  };
}

/** Lê e concilia num passo só, que é como a tela usa. */
export function conciliarTexto(texto: string, demandas?: TDemanda[]): Conciliacao {
  const { linhas, invalidas } = lerArquivoMtr(texto);
  const resultado = conciliar(linhas, demandas);
  return { ...resultado, invalidas };
}

/**
 * Gera um arquivo de exemplo a partir das cargas do próprio sistema.
 *
 * Existe para a demonstração ter o que conciliar sem depender de o avaliador
 * ter um export do SINIR à mão. Inclui de propósito uma divergência de massa e
 * um manifesto órfão: conciliação que só mostra linha verde não demonstra
 * nada.
 */
export function exemploDeArquivo(demandas?: TDemanda[]): string {
  const cargas = (demandas || Store.todas())
    .filter(d => d.status === 'COMPROVADA' && d.verificadoKg)
    .slice(0, 8);

  const linhas = ['numero;cnpj_gerador;cnpj_destinador;massa_kg;data;cdf'];
  cargas.forEach((d, i) => {
    const gerador = Catalogo.gerador(d.gerador.id);
    const destino = Catalogo.destino(d.destino.id);
    /* A terceira linha sai com 12% a mais: é a divergência que faz a tela
       mostrar para que serve. */
    const massa = i === 2 ? Math.round((d.verificadoKg || 0) * 1.12) : d.verificadoKg;
    linhas.push([
      d.mtr?.numero || 'MTR' + String(240000 + i * 7).padStart(6, '0'),
      gerador?.cnpj || '',
      destino?.cnpj || '',
      String(massa),
      (d.recebidaEm || '').slice(0, 10),
      d.mtr?.cdf?.numero || ''
    ].join(';'));
  });
  /* Um manifesto que não corresponde a carga nenhuma do sistema. */
  linhas.push('MTR999888;12.345.678/0001-95;15.224.777/0001-07;640;2026-08-14;');
  return linhas.join('\n');
}
