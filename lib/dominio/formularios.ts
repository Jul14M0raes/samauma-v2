/* SAMAÚMA — dados de apoio dos formulários de cadastro. */

import { PONTOS } from './catalogo';

export const RAMOS = ['Supermercado', 'Centro comercial', 'Alimentação', 'Hotelaria', 'Serviço de saúde',
  'Ensino', 'Atacado', 'Indústria gráfica', 'Distribuição', 'Comércio'];

/* Chuta o ramo de atividade a partir da descrição do CNAE principal
   devolvida pela consulta de CNPJ — é texto livre da Receita Federal, então
   o casamento é por palavra-chave (sem acento, sem plural fixo), não por
   código. Serve só para poupar um clique de quem está cadastrando; a pessoa
   sempre pode trocar no formulário. */
const PISTAS_RAMO: Array<[string, (typeof RAMOS)[number]]> = [
  ['hipermercado', 'Supermercado'], ['supermercado', 'Supermercado'], ['mercearia', 'Supermercado'],
  ['shopping', 'Centro comercial'], ['centro comercial', 'Centro comercial'], ['galeria', 'Centro comercial'],
  ['restaurante', 'Alimentação'], ['lanchonete', 'Alimentação'], ['padaria', 'Alimentação'],
  ['refeic', 'Alimentação'], ['bar e outros', 'Alimentação'], ['bebida', 'Alimentação'], ['confeitaria', 'Alimentação'],
  ['hote', 'Hotelaria'], ['hospedagem', 'Hotelaria'], ['pousada', 'Hotelaria'], ['mote', 'Hotelaria'],
  ['hospit', 'Serviço de saúde'], ['clinic', 'Serviço de saúde'],
  ['saude', 'Serviço de saúde'], ['laboratorio', 'Serviço de saúde'], ['odontol', 'Serviço de saúde'], ['medic', 'Serviço de saúde'],
  ['ensino', 'Ensino'], ['escola', 'Ensino'], ['educac', 'Ensino'],
  ['creche', 'Ensino'], ['faculdade', 'Ensino'], ['universidade', 'Ensino'], ['curso', 'Ensino'],
  ['atacadista', 'Atacado'], ['atacado', 'Atacado'],
  ['grafica', 'Indústria gráfica'], ['impress', 'Indústria gráfica'], ['editora', 'Indústria gráfica'],
  ['distribuic', 'Distribuição'], ['distribuidora', 'Distribuição'],
  ['logistica', 'Distribuição'], ['armazenamento', 'Distribuição'], ['deposito', 'Distribuição'],
  ['comercio varejista', 'Comércio'], ['varejo', 'Comércio'], ['loja', 'Comércio']
];

function normalizarTexto(v: string) {
  return v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
}

export function inferirRamoPorCnae(descricaoCnae: string): string | null {
  const alvo = normalizarTexto(descricaoCnae);
  if (!alvo) return null;
  const achado = PISTAS_RAMO.find(([pista]) => alvo.includes(pista));
  return achado ? achado[1] : null;
}

export function pontosDeCadastro() {
  const estruturas = ['pt-galpao'];
  const vistos = new Set<string>();
  return PONTOS.filter(p => {
    if (estruturas.includes(p.id) || vistos.has(p.bairro)) return false;
    vistos.add(p.bairro);
    return true;
  });
}

export function zonasDeCadastro() {
  return [...new Set(PONTOS.map(p => p.zona))];
}

/* Casa o bairro devolvido pela consulta de CNPJ com um dos pontos de coleta
   já cadastrados — primeiro tenta igual, depois "um contém o outro" (a
   Receita Federal às vezes abrevia ou acrescenta zona/distrito no nome). */
export function casarPontoPorBairro(bairro: string) {
  const alvo = normalizarTexto(bairro);
  if (!alvo) return null;
  const pontos = pontosDeCadastro();
  return pontos.find(p => normalizarTexto(p.bairro) === alvo)
    || pontos.find(p => { const b = normalizarTexto(p.bairro); return alvo.includes(b) || b.includes(alvo); })
    || null;
}
