/* SAMAÚMA — integrações com fontes públicas: malha do IBGE e consulta de CNPJ.
   Se a rede falhar, a tela avisa e o resto do sistema continua funcionando. */

const API_MALHA_IBGE = 'https://servicodados.ibge.gov.br/api/v3/malhas/municipios/1100205?formato=application/vnd.geo+json';

/* Toda consulta externa desiste em oito segundos. */
const LIMITE_ESPERA = 8000;

function buscarComLimite(url: string, opcoes: RequestInit = {}): Promise<Response> {
  if (typeof AbortController === 'undefined') return fetch(url, opcoes);
  const controle = new AbortController();
  const relogio = setTimeout(() => controle.abort(), LIMITE_ESPERA);
  return fetch(url, { ...opcoes, signal: controle.signal }).finally(() => clearTimeout(relogio));
}

let malhaCache: GeoJSON.GeoJsonObject | null = null;

/* Consulta a malha oficial do IBGE, com cache em memória de sessão. */
export async function buscarMalhaMunicipal(): Promise<GeoJSON.GeoJsonObject> {
  if (malhaCache) return malhaCache;
  const resposta = await buscarComLimite(API_MALHA_IBGE);
  if (!resposta.ok) throw new Error('malha ' + resposta.status);
  const geo = await resposta.json();
  malhaCache = geo;
  return geo;
}

/* CNPJ: BrasilAPI com Minha Receita de reserva, ambas sobre a base aberta da
   Receita. O Conecta gov.br exige credenciamento governo-a-governo; quando o
   município aderir, troca-se só `buscarCnpj`, mantendo `DadosCnpj`. */

const API_CNPJ_BRASILAPI = (cnpj: string) => `https://brasilapi.com.br/api/cnpj/v1/${cnpj}`;
const API_CNPJ_MINHA_RECEITA = (cnpj: string) => `https://minhareceita.org/${cnpj}`;

export interface DadosCnpj {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  situacaoCadastral: string;
  dataSituacaoCadastral: string | null;
  logradouro: string;
  numero: string;
  bairro: string;
  municipio: string;
  uf: string;
  cep: string;
  telefone: string;
  email: string;
  cnaePrincipal: string;
  fonte: 'BrasilAPI' | 'Minha Receita';
}

/* As duas fontes usam nomes de campo levemente diferentes para o mesmo dado
   (herança de como cada uma reempacota o dump da Receita) — aqui os dois
   formatos convergem para um só, que é o que o resto do sistema enxerga. */
function normalizarCnpj(bruto: Record<string, unknown>, fonte: DadosCnpj['fonte']): DadosCnpj {
  const texto = (v: unknown) => (typeof v === 'string' ? v : v == null ? '' : String(v));
  return {
    cnpj: texto(bruto.cnpj),
    razaoSocial: texto(bruto.razao_social),
    nomeFantasia: texto(bruto.nome_fantasia),
    situacaoCadastral: texto(bruto.descricao_situacao_cadastral),
    dataSituacaoCadastral: texto(bruto.data_situacao_cadastral) || null,
    logradouro: [texto(bruto.descricao_tipo_de_logradouro), texto(bruto.logradouro)].filter(Boolean).join(' ').trim(),
    numero: texto(bruto.numero),
    bairro: texto(bruto.bairro),
    municipio: texto(bruto.municipio),
    uf: texto(bruto.uf),
    cep: texto(bruto.cep),
    telefone: [bruto.ddd_telefone_1].filter(Boolean).map(texto)[0] || '',
    email: texto(bruto.email),
    cnaePrincipal: texto(bruto.cnae_fiscal_descricao),
    fonte
  };
}

export async function buscarCnpj(cnpjBruto: string): Promise<DadosCnpj> {
  const cnpj = cnpjBruto.replace(/\D/g, '');
  if (cnpj.length !== 14) throw new Error('CNPJ precisa ter 14 dígitos.');

  try {
    const resposta = await buscarComLimite(API_CNPJ_BRASILAPI(cnpj), { headers: { Accept: 'application/json' } });
    if (!resposta.ok) throw new Error(resposta.status === 404 ? 'CNPJ não encontrado.' : 'resposta ' + resposta.status);
    return normalizarCnpj(await resposta.json(), 'BrasilAPI');
  } catch (erroPrimario) {
    try {
      const resposta = await buscarComLimite(API_CNPJ_MINHA_RECEITA(cnpj), { headers: { Accept: 'application/json' } });
      if (!resposta.ok) throw new Error(resposta.status === 404 ? 'CNPJ não encontrado.' : 'resposta ' + resposta.status);
      return normalizarCnpj(await resposta.json(), 'Minha Receita');
    } catch {
      throw erroPrimario instanceof Error ? erroPrimario : new Error('Não foi possível consultar o CNPJ agora.');
    }
  }
}
