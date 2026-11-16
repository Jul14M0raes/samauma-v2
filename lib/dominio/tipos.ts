/* SAMAÚMA — tipos do domínio. */

import type { Mtr } from './mtr';
import type { DadosPgrs } from './pgrs';

/* Estados da demanda e coleta (EST-001). */
export type StatusId =
  | 'CRIADA' | 'DISPONIVEL' | 'NAO_ACEITA' | 'ACEITA' | 'EM_COLETA' | 'PENDENCIA_EXECUCAO'
  | 'EM_TRANSPORTE' | 'PENDENCIA_DIVERGENCIA' | 'COMPROVADA';

/* O que impediu ou atrapalhou a coleta. Não muda o estado da demanda. */
export type TipoOcorrencia = 'FECHADO' | 'MATERIAL_DIVERGENTE' | 'ACESSO' | 'VOLUME' | 'OUTRO';

export interface Ocorrencia {
  tipo: TipoOcorrencia;
  nota: string;
  quando: string;
  registradaPor: string;
}

/* Situação regulatória do estabelecimento (EST-002). */
export type SituacaoId = 'PENDENTE' | 'REGULAR' | 'A_RENOVAR' | 'IRREGULAR';

/* Pendência de divergência de medição (EST-004). Cada decisão é um evento novo,
   com justificativa (RN-024); a medição original nunca muda (RN-023). */
export type EstadoPendencia = 'ABERTA' | 'LIBERADA' | 'MANTIDA';

export interface DecisaoPendencia {
  resultado: 'LIBERADA' | 'MANTIDA';
  justificativa: string;
  autor: string;
  quando: string;
}

export interface PendenciaDivergencia {
  estado: EstadoPendencia;
  abertaEm: string;
  /** Variação observada × aferida, em %, no momento da abertura. */
  divergencia: number | null;
  /** Tolerância em kg vigente na abertura. */
  toleranciaKg: number | null;
  decisoes: DecisaoPendencia[];
}

/* Coleta prevista não executada (RN-034, RN-041). */
export interface PendenciaExecucao {
  constatadaEm: string;
  /** Até quando a cooperativa pode justificar e remarcar (96 h, RN-041). */
  prazoJustificativa: string;
  justificativa: string | null;
}

/* Recusa da cooperativa ao avaliar a demanda (RF-008, RN-008). */
export interface NaoAceite {
  cooperativa: string;
  motivo: string;
  quando: string;
}

export interface Evento {
  quando: string;
  titulo: string;
  detalhe: string;
  autor: string;
}

export interface Comprovante {
  codigo: string;
  emitidoEm: string;
  divergencia: number | null;
}

export interface DemandaCatador {
  id: string;
  nome: string;
  cooperativa: string | null;
}

/* Evidência da pesagem no destino.

   A massa aferida na balança é a âncora de todo o sistema: é dela que sai o
   comprovante, o indicador de recuperação e a renda do catador. Sem
   identificação do instrumento e sem tíquete, essa âncora é um número digitado
   — e a primeira pergunta de uma auditoria é justamente essa. */
export interface EvidenciaPesagem {
  /** Identificação do instrumento: marca, modelo ou patrimônio. */
  balanca: string;
  /** Verificação do INMETRO: número e/ou validade. */
  afericao: string;
  /** Imagem do tíquete emitido pela balança. */
  tiquete: string | null;
  registradaEm: string;
  /* De onde veio o número.

     DIGITADA: alguém leu o mostrador e digitou. Continua sendo o caminho
     normal, porque a maioria das balanças de galpão não tem saída de dados.

     INSTRUMENTO: o número veio da própria balança, sem passar pelo teclado.
     É a única forma de a natureza "medido" ser de fato independente de quem
     recebe a carga -- e por isso vira o degrau mais alto da força da prova. */
  origem?: 'DIGITADA' | 'INSTRUMENTO';
  /** Identificador do registro no instrumento, quando a leitura é automática. */
  leitura?: string | null;
}

/* Demanda e coleta (EST-001). As três medições da conciliação (RN-020) são:
   `declaradoL` (GGR, em litros, RN-006), `coletadoKg` (observada pela
   cooperativa na coleta) e `verificadoKg` (aferida na balança). Cada uma é
   gravada uma vez e nunca é alterada (RN-023). */
export interface Demanda {
  id: string;
  gerador: { id: string; nome: string };
  /** Prevista no contrato (RF-006) ou avulsa (RF-007). */
  origem: 'CONTRATO' | 'AVULSA';
  residuo: string;
  declaradoL: number;
  ponto: string;
  bairro: string;
  zona: string;
  km: number;
  prazo: string;
  observacao: string;
  status: StatusId;
  /** Cooperado designado pela cooperativa (RF-009). */
  catador: DemandaCatador | null;
  /** Unidade receptora: o galpão da cooperativa que atende (RN-035). */
  destino: { id: string; nome: string };
  coletadoKg: number | null;
  verificadoKg: number | null;
  rejeitoKg: number | null;
  destinoFinal: string | null;
  recebidaEm: string | null;
  lote: string | null;
  foto: string | null;
  pesagem: EvidenciaPesagem | null;
  /** Como o material chegou ao portão — ver `QualidadeCarga`. */
  qualidade: QualidadeCarga | null;
  mtr: Mtr | null;
  comprovante: Comprovante | null;
  pendencia: PendenciaDivergencia | null;
  execucao: PendenciaExecucao | null;
  naoAceites: NaoAceite[];
  criadaEm: string;
  eventos: Evento[];
  canalRegistro?: string;
  ocorrencias?: Ocorrencia[];
}

export interface Ponto {
  id: string;
  bairro: string;
  zona: string;
  lat: number;
  lng: number;
  acesso: string;
}

/* PGRS (EST-003): vale 12 meses a partir da emissão (RN-003). */
export interface Pgrs {
  numero: string;
  emitidoEm: string;
}

/* Grande gerador (AT-001). Cadastro completo, pela RN-004: CNPJ, endereço,
   razão social, responsável técnico e contrato vigente (`operador`). */
export interface Gerador {
  id: string;
  nome: string;
  cnpj: string;
  razaoSocial?: string;
  endereco?: string;
  responsavelTecnico?: string;
  ramo: string;
  ponto: string;
  km: number;
  volumeMes: number;
  operador: string | null;
  pgrs: Pgrs | null;
  pgrsCompleto?: DadosPgrs;
  cadastradoAqui?: boolean;
  codigo?: string;
  /* Baixa de cadastro: fechou, mudou de ramo, perdeu a licença.

     Não é exclusão. A massa que passou por aqui já sustenta comprovante
     emitido, então o registro fica; o que a baixa faz é tirar da fila de
     fiscalização e impedir movimento novo. Ausente quer dizer ativo. */
  baixa?: { quando: string; motivo: string; por: string } | null;
}

export interface Catador {
  id: string;
  nome: string;
  cooperativa: string | null;
  desde: string;
  metaSemanal: number;
  veiculo: string;
  zona: string;
  cadastradoAqui?: boolean;
  codigo?: string;
  /* Desligamento não apaga ninguém.

     Cooperado que sai para de receber demanda nova, mas continua na
     trilha das cargas que já fez. Apagar
     seria reescrever histórico -- e é justamente o histórico que sustenta o
     comprovante que já foi emitido. Ausente quer dizer ativo: cooperado
     antigo não precisa de migração para continuar valendo. */
  desligamento?: { quando: string; motivo: string; por: string } | null;
}

export interface Cooperativa {
  id: string;
  nome: string;
  razao: string;
  /* O MTR identifica o transportador por CNPJ. É por isso que, no manifesto,
     o transportador é a cooperativa e não a pessoa do catador. */
  cnpj: string;
  fundada: string;
  bairro: string;
  ponto: string;
  contrato: string;
  galpao?: string;
}

export interface Destino {
  id: string;
  nome: string;
  tipo: string;
  /** Exigido pelo MTR para identificar o destinador. */
  cnpj: string;
  cooperativa: string | null;
  ponto: string;
  licenca: string;
  capacidadeDiaria: number;
  aceita: string[];
  destinoFinal: string;
  triagem: boolean;
  cadastradoAqui?: boolean;
  codigo?: string;
  /* Baixa de cadastro: fechou, mudou de ramo, perdeu a licença.

     Não é exclusão. A massa que passou por aqui já sustenta comprovante
     emitido, então o registro fica; o que a baixa faz é tirar da fila de
     fiscalização e impedir movimento novo. Ausente quer dizer ativo. */
  baixa?: { quando: string; motivo: string; por: string } | null;
}

/* Fluxo a que o resíduo pertence: cada um tem regime jurídico e destinação
   próprios, por isso os indicadores de recuperação são sempre por fluxo. */
export type FluxoId = 'RECICLAVEL' | 'ORGANICO' | 'REJEITO';

export interface Fluxo {
  id: FluxoId;
  nome: string;
  cor: string;
  /** Quem responde pela destinação segundo a lei. */
  responsavel: string;
  baseLegal: string;
  /** O que "recuperar" significa neste fluxo. */
  recuperacao: string;
  regime: string;
  /** Destinação que a cooperativa declara por padrão ao receber (RN-014). */
  destinacao: string;
}

export interface Residuo {
  id: string;
  nome: string;
  fluxo: FluxoId;
  preco: number;
  co2: number;
  cor: string;
  recuperavel: boolean;
  perdaTriagem: number;
  /** kg por litro, só para estimar massa a partir do volume declarado. */
  densidade: number;
}

export interface Canal {
  nome: string;
  digitadoPor: string | null;
  texto: string;
}

/* Classificação manual de inconformidade grave (RN-037): sempre humana, feita
   pelo subperfil Técnico, leva o estabelecimento a Irregular. Cada registro é
   um evento; revogar é outro evento, nunca apagamento. */
export interface Inconformidade {
  acao: 'CLASSIFICADA' | 'REVOGADA';
  fundamento: string;
  por: string;
  quando: string;
}

export interface Situacao {
  id: SituacaoId;
  rotulo: string;
  tom: string;
  ordem: number;
  motivos: string[];
  pgrs: PgrsResolvido | null;
  ultimaDestinacao: string | null;
  /** Inconformidade grave vigente, quando há. */
  inconformidade: Inconformidade | null;
}

export interface PgrsResolvido {
  numero: string;
  /** Data de emissão; a validade é de 12 meses (RN-003). */
  emitidoEm: string;
  validade: string;
  dias: number;
  vencido: boolean;
  /** Dentro da antecedência do alerta "A renovar" (RN-033). */
  vencendo: boolean;
}

export interface Aderencia {
  declarado: number;
  destinado: number;
  parte: number;
}

/* A cooperativa com contrato vigente com o gerador (RN-005). */
export interface Operador {
  id: string;
  nome: string;
  detalhe: string;
}

/* Os quatro perfis de acesso (RN-040): Gerador, Cooperativa e os dois
   subperfis da Prefeitura — `prefeitura` é o Técnico/administrativo da
   regulação e `gestao` é o Painel de gestão, só leitura. */
export type Perfil = 'gerador' | 'cooperativa' | 'prefeitura' | 'gestao';

export interface AbaPerfil {
  id: string;
  rotulo: string;
  /* Marca temporária de "tela nova" — não é um estado do domínio, é uma
     nota editorial pra quem está revisando o que mudou. Fica no perfil, não
     no componente, porque é o mesmo dado que decide o rótulo da aba. */
  novo?: boolean;
}

export interface EntradaPerfil {
  rotulo: string;
  destino?: string;
  secundaria?: boolean;
}

export interface DefinicaoPerfil {
  id: Perfil;
  nome: string;
  cor: string;
  resumo: string;
  abas: AbaPerfil[];
  entradas: EntradaPerfil[];
}

/* `catador` é o cooperado da equipe (RF-015): cadastrado pela cooperativa,
   sem acesso próprio (RN-029). */
export type TipoCadastro = 'gerador' | 'catador' | 'cooperativa';

export type ValorCampoCadastro = string | string[] | undefined;
export type DadosCadastro = Record<string, ValorCampoCadastro>;

export interface RegistrosCadastro {
  geradores: Gerador[];
  catadores: Catador[];
  destinos: Destino[];
  cooperativas: Cooperativa[];
  pontos: Ponto[];
}

export interface Conta {
  tipo: Exclude<TipoCadastro, 'catador'>;
  perfil: 'gerador' | 'cooperativa';
  registro: Gerador | Destino;
}

/* ===================================================== ECONOMIA CIRCULAR

   Até aqui o sistema acompanha o resíduo do gerador até a balança do destino.
   Isso comprova destinação. Comprovar reciclagem é outra coisa: exige saber
   que o material saiu da unidade de triagem e entrou de novo numa linha de
   produção. Os três tipos abaixo fecham esse trecho. */

/* Como o material chegou ao portão. A separação na origem é o que decide se
   uma carga vira matéria-prima ou vira rejeito, e até agora o sistema não
   registrava isso: papelão molhado entrava como papelão. Aqui ele passa a
   ter nome, e o nome volta atribuído a quem gerou. */
export type QualidadeId = 'LIMPO' | 'MISTURADO' | 'CONTAMINADO';

export interface QualidadeCarga {
  id: QualidadeId;
  /** Fração da carga perdida por contaminação, de 0 a 1, aferida na triagem. */
  perda: number;
  observacao: string;
  registradaPor: string;
  registradaEm: string;
}

