/* SAMAÚMA — os quatro perfis de acesso (RN-040, matriz de permissões):
   Gerador, Cooperativa e os dois subperfis da Prefeitura. O cooperado não tem
   perfil próprio (RN-029). */

import type { DefinicaoPerfil, Perfil } from './tipos';

export const PERFIS: Record<Perfil, DefinicaoPerfil> = {
  gerador: {
    id: 'gerador',
    nome: 'Gerador',
    cor: '#2a6fa8',
    resumo: 'Declara a coleta, mantém cadastro e PGRS e emite os documentos.',
    abas: [
      { id: 'painel', rotulo: 'Painel' },
      { id: 'demandas', rotulo: 'Demandas' },
      { id: 'documentos', rotulo: 'Documentos' },
      { id: 'relatorios', rotulo: 'Relatórios' },
      { id: 'configuracoes', rotulo: 'Configurações', novo: true }
    ],
    entradas: [{ rotulo: 'Entrar como gerador' }]
  },

  cooperativa: {
    id: 'cooperativa',
    nome: 'Cooperativa',
    cor: '#c98f2a',
    resumo: 'Avalia a demanda, designa, coleta, recebe e confirma o recebimento.',
    abas: [
      { id: 'painel', rotulo: 'Painel' },
      { id: 'demandas', rotulo: 'Demandas existentes' },
      { id: 'fila', rotulo: 'A caminho' },
      { id: 'recebidas', rotulo: 'Recebidas' },
      { id: 'equipe', rotulo: 'Equipe', novo: true },
      { id: 'portaria', rotulo: 'Portaria' },
      { id: 'relatorios', rotulo: 'Relatórios' },
      { id: 'configuracoes', rotulo: 'Configurações', novo: true }
    ],
    entradas: [{ rotulo: 'Entrar como cooperativa', destino: 'dst-01' }]
  },

  prefeitura: {
    id: 'prefeitura',
    nome: 'Prefeitura · Técnico',
    cor: '#1f6b4a',
    resumo: 'Cadastra, parametriza, decide pendências e acompanha o MTR.',
    abas: [
      { id: 'painel', rotulo: 'Painel' },
      { id: 'cadastros', rotulo: 'Cadastros' },
      { id: 'fiscalizacao', rotulo: 'Fiscalização' },
      { id: 'relatorios', rotulo: 'Relatórios' },
      { id: 'configuracoes', rotulo: 'Configurações', novo: true }
    ],
    entradas: [{ rotulo: 'Entrar como técnico da Prefeitura' }]
  },

  gestao: {
    id: 'gestao',
    nome: 'Prefeitura · Painel de gestão',
    cor: '#3f5f8a',
    resumo: 'Vê os indicadores do município e exporta relatórios. Só leitura.',
    abas: [
      { id: 'painel', rotulo: 'Painel' },
      { id: 'mapa', rotulo: 'Mapa' },
      { id: 'relatorios', rotulo: 'Relatórios' },
      { id: 'configuracoes', rotulo: 'Configurações' }
    ],
    entradas: [{ rotulo: 'Entrar no painel de gestão' }]
  }
};

/* Ordem em que a tela de entrada apresenta os perfis. */
export const ORDEM_PERFIS: Perfil[] = ['gerador', 'cooperativa', 'prefeitura', 'gestao'];
export const ICONES_PERFIL: Record<string, string> = {
  gerador: '<path d="M4 10v9.5h16V10"/><path d="M2.5 10 12 3.2 21.5 10"/><path d="M9.3 19.5v-6h5.4v6"/>',
  cooperativa: '<path d="M2.7 7.8h10.6v8.8H2.7z"/><path d="M13.3 11h3.9l3.1 3v2.6h-7z"/><circle cx="7" cy="18.3" r="1.7"/><circle cx="17" cy="18.3" r="1.7"/>',
  prefeitura: '<path d="M3 9.6 12 4.3l9 5.3"/><path d="M4.2 9.6v9.4M8.6 9.6v9.4M15.4 9.6v9.4M19.8 9.6v9.4"/><path d="M2.5 20.5h19"/>',
  gestao: '<path d="M4 19.5V11M9.3 19.5V6.5M14.7 19.5v-6M20 19.5V4"/><path d="M2.5 20.5h19"/>'
};
