/* SAMAÚMA — catálogo do domínio.
   Aqui ficam apenas as tabelas: quem é quem, o que é o quê e quanto vale.
   Nenhuma regra e nenhuma tela — só os dados que o resto do sistema lê.

   Organizações, pessoas, documentos, coordenadas e valores são fictícios ou
   demonstrativos. Os bairros são reais; as coordenadas são aproximadas e não
   vieram do geoportal da Prefeitura. */

import { dataRelativa } from './formato';
import type { Canal, Catador, Cooperativa, Destino, Fluxo, Gerador, Operador, Pgrs, Ponto,
  QualidadeId, Residuo, StatusId } from './tipos';

/* Valores iniciais dos parâmetros do município (RF-004); a Prefeitura ajusta.
   Tolerância entre a massa observada na coleta e a aferida na balança (RN-021),
   com piso absoluto para cargas pequenas. */
export const TOLERANCIA = 0.05;
export const TOLERANCIA_MINIMA_KG = 10;

/* Antecedência do alerta "A renovar" do PGRS (RN-033, decisão D-05). */
export const ANTECEDENCIA_PGRS_DIAS = 30;

/* Janela para a cooperativa justificar e remarcar coleta não executada (RN-041). */
export const JANELA_EXECUCAO_HORAS = 96;

/* Por onde a cooperativa registra a coleta em campo. O cooperado não tem login
   (RN-029): todo registro acontece sob o acesso da Cooperativa (RNF-007). */
export const CANAIS: Record<string, Canal> = {
  compartilhado: { nome: 'Aparelho da equipe', digitadoPor: null,
    texto: 'O aparelho é da cooperativa e acompanha a rota.' },
  terminal: { nome: 'Terminal do galpão', digitadoPor: 'Encarregado do galpão',
    texto: 'A ficha de papel é digitada depois, no galpão, preservando horário e autoria.' },
  assistido: { nome: 'Registro assistido', digitadoPor: 'Encarregado da cooperativa',
    texto: 'O encarregado digita por quem coletou. Quem executou e quem digitou ficam identificados.' }
};

export const TARIFA_ATERRO = 96.50;

export const ETAPAS = ['Declaração', 'Avaliação', 'Coleta', 'Transporte', 'Recebimento', 'Comprovação'];

/* Estados de EST-001. "Recebida" e "Em conciliação" acontecem no mesmo ato da
   confirmação do recebimento e ficam registrados na trilha, não como estado. */
export const STATUS: Record<StatusId, { id: StatusId; rotulo: string; tom: string; etapa: number }> = {
  CRIADA:                { id: 'CRIADA',                rotulo: 'Criada',                   tom: 'neutro', etapa: 1 },
  DISPONIVEL:            { id: 'DISPONIVEL',            rotulo: 'Disponível',               tom: 'info',   etapa: 2 },
  NAO_ACEITA:            { id: 'NAO_ACEITA',            rotulo: 'Não aceita',               tom: 'alerta', etapa: 2 },
  ACEITA:                { id: 'ACEITA',                rotulo: 'Aceita',                   tom: 'info',   etapa: 3 },
  EM_COLETA:             { id: 'EM_COLETA',             rotulo: 'Em coleta',                tom: 'alerta', etapa: 3 },
  PENDENCIA_EXECUCAO:    { id: 'PENDENCIA_EXECUCAO',    rotulo: 'Pendência de execução',    tom: 'erro',   etapa: 3 },
  EM_TRANSPORTE:         { id: 'EM_TRANSPORTE',         rotulo: 'Em transporte',            tom: 'marca',  etapa: 4 },
  PENDENCIA_DIVERGENCIA: { id: 'PENDENCIA_DIVERGENCIA', rotulo: 'Pendência de divergência', tom: 'erro',   etapa: 5 },
  COMPROVADA:            { id: 'COMPROVADA',            rotulo: 'Comprovada',               tom: 'ok',     etapa: 6 }
};

export const EM_ABERTO: StatusId[] = ['CRIADA', 'DISPONIVEL', 'ACEITA', 'EM_COLETA'];
export const EM_CURSO: StatusId[] = ['DISPONIVEL', 'ACEITA', 'EM_COLETA', 'EM_TRANSPORTE'];

/* Situação regulatória do estabelecimento (EST-002). `ordem` vai da pior para a
   melhor: é a que decide qual condição prevalece quando várias valem. */
export const SITUACOES: Record<string, { id: string; rotulo: string; tom: string; ordem: number }> = {
  IRREGULAR: { id: 'IRREGULAR', rotulo: 'Irregular', tom: 'erro',   ordem: 1 },
  PENDENTE:  { id: 'PENDENTE',  rotulo: 'Pendente',  tom: 'info',   ordem: 2 },
  A_RENOVAR: { id: 'A_RENOVAR', rotulo: 'A renovar', tom: 'alerta', ordem: 3 },
  REGULAR:   { id: 'REGULAR',   rotulo: 'Regular',   tom: 'ok',     ordem: 4 }
};

/* Os fluxos de resíduo do piloto. Logística reversa fica fora (RN-032). Cada
   fluxo diz o que "recuperar" significa e qual destinação a cooperativa
   declara por padrão ao receber a carga (RN-014). */
export const FLUXOS: Fluxo[] = [
  { id: 'RECICLAVEL', nome: 'Reciclável seco', cor: '#2a8c7a',
    responsavel: 'Gerador, até a destinação final adequada',
    baseLegal: 'Lei nº 12.305/2010, arts. 20 e 21; Decreto Municipal nº 15.603/2018',
    recuperacao: 'Massa vendida à indústria com nota fiscal de saída',
    regime: 'Coleta, triagem e venda. É o fluxo que a cooperativa opera e onde a inclusão de catadores acontece.',
    destinacao: 'Triagem e venda à indústria recicladora; rejeito ao aterro sanitário' },

  { id: 'ORGANICO', nome: 'Orgânico', cor: '#8fbb3f',
    responsavel: 'Gerador, com compostagem entre as metas do titular do serviço',
    baseLegal: 'Lei nº 12.305/2010, art. 36, V; Decreto nº 10.936/2022',
    recuperacao: 'Massa que virou composto, aferida na unidade de tratamento',
    regime: 'Não passa por triagem de recicláveis. Vai para compostagem, e o produto é insumo agrícola.',
    destinacao: 'Compostagem' },

  { id: 'REJEITO', nome: 'Rejeito', cor: '#8a9690',
    responsavel: 'Gerador, com disposição em aterro licenciado',
    baseLegal: 'Lei nº 12.305/2010, art. 3º, XV e art. 54',
    recuperacao: 'Não há: por definição, rejeito é o que esgotou as possibilidades de tratamento',
    regime: 'Disposição final ambientalmente adequada.',
    destinacao: 'Aterro sanitário municipal' }
];

/* `densidade` (kg por litro, solto) só serve para estimar a massa a partir do
   volume declarado em litros (RN-006), para planejamento. Nunca entra na
   conciliação, que compara massa observada com massa aferida.
   ponytail: densidade média de tabela; a comparação litros × kg segue em aberto na doc. */
export const RESIDUOS: Residuo[] = [
  /* --------------------------------------------------- reciclável seco */
  { id: 'papelao',  nome: 'Papelão',               fluxo: 'RECICLAVEL', preco: 0.62, co2: 1.1, cor: '#c98f2a', recuperavel: true,  perdaTriagem: 0.08, densidade: 0.05 },
  { id: 'plastico', nome: 'Plástico (PET)',        fluxo: 'RECICLAVEL', preco: 1.85, co2: 1.8, cor: '#2a6fa8', recuperavel: true,  perdaTriagem: 0.14, densidade: 0.03 },
  { id: 'papel',    nome: 'Papel branco',          fluxo: 'RECICLAVEL', preco: 0.74, co2: 0.9, cor: '#7aa6c2', recuperavel: true,  perdaTriagem: 0.11, densidade: 0.1 },
  { id: 'vidro',    nome: 'Vidro',                 fluxo: 'RECICLAVEL', preco: 0.18, co2: 0.3, cor: '#2a8c7a', recuperavel: true,  perdaTriagem: 0.06, densidade: 0.3 },
  { id: 'metal',    nome: 'Metal e alumínio',      fluxo: 'RECICLAVEL', preco: 4.20, co2: 4.5, cor: '#8fbb3f', recuperavel: true,  perdaTriagem: 0.04, densidade: 0.08 },
  { id: 'oleo',     nome: 'Óleo de cozinha usado', fluxo: 'RECICLAVEL', preco: 1.10, co2: 2.4, cor: '#e0a93a', recuperavel: true,  perdaTriagem: 0.02, densidade: 0.92 },

  /* ------------------------------------------------------------ orgânico */
  { id: 'organico', nome: 'Orgânico (alimentar e poda)', fluxo: 'ORGANICO', preco: 0, co2: 0.6, cor: '#6f9c3f', recuperavel: true, perdaTriagem: 0.35, densidade: 0.5 },

  /* -------------------------------------------------------------- rejeito */
  { id: 'rejeito',  nome: 'Rejeito indiferenciado', fluxo: 'REJEITO', preco: 0, co2: 0, cor: '#8a9690', recuperavel: false, perdaTriagem: 1, densidade: 0.15 }
];

/* A cooperativa acumula o papel de unidade receptora (RN-035): cada uma recebe
   no próprio galpão (`galpao`, uma entrada de DESTINOS). */
export const COOPERATIVAS: Cooperativa[] = [
  { id: 'coop-01', nome: 'CATANORTE', razao: 'Cooperativa de Trabalho dos Catadores de Materiais Recicláveis do Norte', cnpj: '05.114.233/0001-39',
    fundada: '2011-05-18', bairro: 'Industrial', ponto: 'pt-galpao',
    contrato: 'Termo de cooperação 034/2025 · coleta seletiva conveniada', galpao: 'dst-01' },
  { id: 'coop-02', nome: 'COOCAMAR', razao: 'Cooperativa dos Catadores de Materiais Recicláveis', cnpj: '07.338.911/0001-72',
    fundada: '2015-09-02', bairro: 'Embratel', ponto: 'pt-07',
    contrato: 'Termo de cooperação 019/2024 · coleta seletiva conveniada', galpao: 'dst-02' },
  { id: 'coop-03', nome: 'COOPRECICLA PVH', razao: 'Cooperativa de Reciclagem de Porto Velho', cnpj: '09.552.644/0001-67',
    fundada: '2017-02-14', bairro: 'Caiari', ponto: 'pt-09',
    contrato: 'Termo de cooperação 027/2024 · coleta seletiva conveniada', galpao: 'dst-03' },
  { id: 'coop-04', nome: 'COOPVERDE', razao: 'Cooperativa Verde de Trabalhadores em Materiais Recicláveis', cnpj: '11.776.355/0001-93',
    fundada: '2019-06-30', bairro: 'Cidade Nova', ponto: 'pt-12',
    contrato: 'Termo de cooperação 041/2025 · coleta seletiva conveniada', galpao: 'dst-04' },
  { id: 'coop-05', nome: 'COOPAMAZÔNIA', razao: 'Cooperativa Amazônia de Catadores de Materiais Recicláveis', cnpj: '13.990.066/0001-18',
    fundada: '2020-11-05', bairro: 'Areal', ponto: 'pt-02',
    contrato: 'Termo de cooperação 052/2025 · coleta seletiva conveniada', galpao: 'dst-05' }
];

/* A equipe de cooperados (RF-015). O cooperado não é usuário do sistema (RN-029). */
export const CATADORES: Catador[] = [
  { id: 'cat-01', nome: 'João Silva',      cooperativa: 'coop-01', desde: '2021-03-11', metaSemanal: 1800, veiculo: 'Triciclo elétrico', zona: 'Zona Sul' },
  { id: 'cat-02', nome: 'Antônio Ribeiro', cooperativa: 'coop-01', desde: '2019-11-27', metaSemanal: 1800, veiculo: 'Caminhonete da cooperativa', zona: 'Zona Leste' },
  { id: 'cat-03', nome: 'Célio Barbosa',   cooperativa: 'coop-01', desde: '2022-06-09', metaSemanal: 1500, veiculo: 'Carroça motorizada', zona: 'Centro' },
  { id: 'cat-04', nome: 'Rosa Menezes',    cooperativa: 'coop-01', desde: '2023-01-15', metaSemanal: 1500, veiculo: 'Triciclo elétrico', zona: 'Zona Norte' },
  { id: 'cat-06', nome: 'Edilene Farias',  cooperativa: 'coop-02', desde: '2020-04-19', metaSemanal: 1200, veiculo: 'Triciclo elétrico', zona: 'Zona Norte' },
  { id: 'cat-07', nome: 'Vanderlei Souza', cooperativa: 'coop-02', desde: '2021-08-22', metaSemanal: 1200, veiculo: 'Carroça motorizada', zona: 'Zona Norte' },
  { id: 'cat-08', nome: 'Iracema Pantoja', cooperativa: 'coop-03', desde: '2018-12-03', metaSemanal: 1100, veiculo: 'Triciclo elétrico', zona: 'Centro' },
  { id: 'cat-09', nome: 'Raimundo Costa',  cooperativa: 'coop-03', desde: '2022-02-17', metaSemanal: 1100, veiculo: 'Carroça própria', zona: 'Centro' },
  { id: 'cat-10', nome: 'Deuzimar Alves',  cooperativa: 'coop-04', desde: '2020-10-08', metaSemanal: 900,  veiculo: 'Triciclo elétrico', zona: 'Zona Norte' },
  { id: 'cat-11', nome: 'Josenilde Reis',  cooperativa: 'coop-04', desde: '2023-05-14', metaSemanal: 900,  veiculo: 'Carroça motorizada', zona: 'Zona Norte' },
  { id: 'cat-12', nome: 'Adenilson Melo',  cooperativa: 'coop-05', desde: '2021-01-27', metaSemanal: 800,  veiculo: 'Carroça própria', zona: 'Zona Sul' },
  { id: 'cat-13', nome: 'Cleonice Farias', cooperativa: 'coop-05', desde: '2023-09-10', metaSemanal: 800,  veiculo: 'Triciclo elétrico', zona: 'Zona Sul' }
];

export const PONTOS: Ponto[] = [
  { id: 'pt-01', bairro: 'Nova Porto Velho',        zona: 'Zona Sul',    lat: -8.7644, lng: -63.8779, acesso: 'Doca lateral · 6h às 11h' },
  { id: 'pt-02', bairro: 'Areal',                   zona: 'Zona Sul',    lat: -8.7735, lng: -63.8973, acesso: 'Pátio dos fundos · 7h às 12h' },
  { id: 'pt-03', bairro: 'Agenor de Carvalho',      zona: 'Zona Leste',  lat: -8.7605, lng: -63.8684, acesso: 'Expurgo · acesso controlado' },
  { id: 'pt-04', bairro: 'Flodoaldo Pontes Pinto',  zona: 'Zona Leste',  lat: -8.7476, lng: -63.8694, acesso: 'Doca de carga · 8h às 17h' },
  { id: 'pt-05', bairro: 'Centro',                  zona: 'Centro',      lat: -8.7647, lng: -63.9041, acesso: 'Calçada lateral · após 18h' },
  { id: 'pt-06', bairro: 'Candeias do Jamari',      zona: 'Região metropolitana', lat: -8.7950, lng: -63.7019, acesso: 'Portaria de carga · 24h' },
  { id: 'pt-07', bairro: 'Embratel',                zona: 'Zona Norte',  lat: -8.7510, lng: -63.8819, acesso: 'Depósito interno · 8h às 16h' },
  { id: 'pt-08', bairro: 'Olaria',                  zona: 'Centro',      lat: -8.7556, lng: -63.9054, acesso: 'Estacionamento · 7h às 19h' },
  { id: 'pt-09', bairro: 'Caiari',                  zona: 'Centro',      lat: -8.7614, lng: -63.9064, acesso: 'Portaria · 6h às 10h' },
  { id: 'pt-10', bairro: 'Industrial',              zona: 'Zona Sul',    lat: -8.7367, lng: -63.8841, acesso: 'Balança da entrada · 24h' },
  { id: 'pt-11', bairro: 'São João Bosco',          zona: 'Centro',      lat: -8.7481, lng: -63.8980, acesso: 'Doca coberta · 7h às 13h' },
  { id: 'pt-12', bairro: 'Cidade Nova',             zona: 'Zona Sul',    lat: -8.8102, lng: -63.8781, acesso: 'Pátio externo · 8h às 18h' },
  { id: 'pt-galpao', bairro: 'Industrial',          zona: 'Zona Sul',    lat: -8.7390, lng: -63.8815, acesso: 'Galpão da CATANORTE' }
];

/* PGRS que vence daqui a `diasRestantes`: emitido 12 meses antes do vencimento. */
function pgrs(numero: string, diasRestantes: number): Pgrs {
  return { numero, emitidoEm: dataRelativa(diasRestantes - 365, 9) };
}

/* `operador` é a cooperativa com contrato vigente (RN-005, DOC-006). */
export const GERADORES: Gerador[] = [
  { id: 'ger-01', nome: 'Mercado Ipê Roxo',         cnpj: '11.222.333/0001-44', razaoSocial: 'Ipê Roxo Comércio de Alimentos Ltda', endereco: 'Av. Jorge Teixeira, 1450', responsavelTecnico: 'Eng. Carla Nunes · CREA-RO 4411', ramo: 'Supermercado',     ponto: 'pt-01', km: 2.4,  volumeMes: 14000, operador: 'coop-01', pgrs: pgrs('PGRS 2025/0142', 240) },
  { id: 'ger-02', nome: 'Supermercado Rio Madeira', cnpj: '22.333.444/0001-55', razaoSocial: 'Rio Madeira Supermercados Ltda', endereco: 'Rua Rafael Vaz e Silva, 880', responsavelTecnico: 'Eng. Paulo Freitas · CREA-RO 3902', ramo: 'Supermercado',     ponto: 'pt-02', km: 4.1,  volumeMes: 11000, operador: 'coop-01', pgrs: pgrs('PGRS 2025/0088', 210) },
  { id: 'ger-03', nome: 'Hospital Santa Marcelina', cnpj: '33.444.555/0001-66', razaoSocial: 'Associação Beneficente Santa Marcelina', endereco: 'Rua Dom Pedro II, 1120', responsavelTecnico: 'Enf. Lúcia Prado · COREN-RO 22871', ramo: 'Serviço de saúde', ponto: 'pt-03', km: 6.7,  volumeMes: 9000,  operador: 'coop-02', pgrs: pgrs('PGRS 2024/0311', 20) },
  { id: 'ger-04', nome: 'Shopping Porto Velho',     cnpj: '44.555.666/0001-77', razaoSocial: 'Porto Velho Shopping S.A.', endereco: 'Av. Rio Madeira, 3288', responsavelTecnico: 'Eng. Marcos Tavares · CREA-RO 5120', ramo: 'Centro comercial', ponto: 'pt-04', km: 5.3,  volumeMes: 22000, operador: 'coop-01', pgrs: pgrs('PGRS 2025/0007', 320) },
  { id: 'ger-05', nome: 'Restaurante Beiradão',     cnpj: '55.666.777/0001-88', razaoSocial: 'Beiradão Restaurante e Petiscaria Ltda', endereco: 'Rua José Bonifácio, 211', responsavelTecnico: 'Tec. Ana Lima · CRT 0931', ramo: 'Alimentação',      ponto: 'pt-05', km: 1.8,  volumeMes: 2600,  operador: 'coop-01', pgrs: pgrs('PGRS 2024/0290', -20) },
  { id: 'ger-06', nome: 'Atacadão Candeias',        cnpj: '66.777.888/0001-99', razaoSocial: 'Atacadão Candeias Distribuidora Ltda', endereco: 'BR-364, km 9', responsavelTecnico: 'Eng. Rui Batista · CREA-RO 4078', ramo: 'Atacado',          ponto: 'pt-06', km: 11.2, volumeMes: 18000, operador: 'coop-01', pgrs: pgrs('PGRS 2025/0165', 260) },
  { id: 'ger-07', nome: 'Gráfica Selva Norte',      cnpj: '77.888.999/0001-00', razaoSocial: 'Selva Norte Artes Gráficas Ltda', endereco: 'Rua Getúlio Vargas, 2560', responsavelTecnico: 'Quím. Júlia Castro · CRQ 14200', ramo: 'Indústria gráfica', ponto: 'pt-07', km: 3.6, volumeMes: 5400,  operador: 'coop-01', pgrs: pgrs('PGRS 2025/0121', 150) },
  { id: 'ger-08', nome: 'Faculdade Rio Branco',     cnpj: '88.999.000/0001-11', razaoSocial: 'Instituto Educacional Rio Branco', endereco: 'Av. Carlos Gomes, 700', responsavelTecnico: 'Eng. Sérgio Mota · CREA-RO 3377', ramo: 'Ensino',           ponto: 'pt-08', km: 2.9,  volumeMes: 4200,  operador: 'coop-03', pgrs: pgrs('PGRS 2025/0053', 190) },
  { id: 'ger-09', nome: 'Hotel Vila Rica',          cnpj: '99.000.111/0001-22', razaoSocial: 'Vila Rica Hotelaria Ltda', endereco: 'Av. Carlos Gomes, 1616', responsavelTecnico: 'Tec. Bruno Alves · CRT 1188', ramo: 'Hotelaria',        ponto: 'pt-09', km: 1.5,  volumeMes: 3800,  operador: 'coop-02', pgrs: pgrs('PGRS 2024/0402', 25) },
  { id: 'ger-10', nome: 'Distribuidora Tucumã',     cnpj: '10.111.222/0001-33', razaoSocial: 'Tucumã Distribuição de Alimentos Ltda', endereco: 'Rua Jatuarana, 4120', responsavelTecnico: 'Eng. Denise Rocha · CREA-RO 4803', ramo: 'Distribuição',     ponto: 'pt-10', km: 8.4,  volumeMes: 7600,  operador: 'coop-01', pgrs: pgrs('PGRS 2023/0198', -140) },
  { id: 'ger-11', nome: 'Panificadora Madeira',     cnpj: '20.222.333/0001-44', razaoSocial: 'Panificadora Madeira Ltda', endereco: 'Rua Salgado Filho, 540', ramo: 'Alimentação',      ponto: 'pt-11', km: 2.2,  volumeMes: 1900,  operador: null,     pgrs: null },
  { id: 'ger-12', nome: 'Auto Peças Cidade Nova',   cnpj: '30.333.444/0001-55', razaoSocial: 'Auto Peças Cidade Nova Ltda', endereco: 'Av. Rio de Janeiro, 3310', ramo: 'Comércio',         ponto: 'pt-12', km: 7.1,  volumeMes: 2400,  operador: null,     pgrs: null }
];

export const GERADOR_SESSAO = 'ger-01';

/* Galpão de cada cooperativa: onde ela recebe, pesa e declara a destinação. */
const galpao = (id: string, cooperativa: string, nome: string, cnpj: string, ponto: string, licenca: string, capacidadeDiaria: number): Destino => ({
  id, nome, tipo: 'Central de triagem', cnpj, cooperativa, ponto, licenca, capacidadeDiaria,
  aceita: RESIDUOS.map(r => r.id), destinoFinal: 'Triagem e venda à indústria recicladora; rejeito ao aterro sanitário',
  triagem: true
});

export const DESTINOS: Destino[] = [
  galpao('dst-01', 'coop-01', 'Galpão de Triagem CATANORTE', '15.224.777/0001-07', 'pt-galpao', 'LO 1187/2025', 9000),
  galpao('dst-02', 'coop-02', 'Galpão COOCAMAR', '07.338.911/0002-53', 'pt-07', 'LO 0921/2024', 4000),
  galpao('dst-03', 'coop-03', 'Galpão COOPRECICLA PVH', '09.552.644/0002-48', 'pt-09', 'LO 0977/2024', 3500),
  galpao('dst-04', 'coop-04', 'Galpão COOPVERDE', '11.776.355/0002-74', 'pt-12', 'LO 1102/2025', 3000),
  galpao('dst-05', 'coop-05', 'Galpão COOPAMAZÔNIA', '13.990.066/0002-07', 'pt-02', 'LO 1215/2025', 2500)
];

export const DESTINO_SESSAO = 'dst-01';

/* ===================================================== ECONOMIA CIRCULAR */

/* Grau de separação da carga na chegada. A perda é o que a triagem descarta
   por causa da mistura — não é o rejeito natural do material (isso é
   `perdaTriagem` no catálogo de resíduo), é o que se perde por vir mal
   separado da origem. Os valores são parâmetro de trabalho e ficam aqui, num
   lugar só, para serem trocados por medição local sem caçar número no meio
   das telas. */
export const QUALIDADES: { id: QualidadeId; rotulo: string; perda: number; tom: string; descricao: string }[] = [
  { id: 'LIMPO', rotulo: 'Separado na origem', perda: 0.02, tom: 'bom',
    descricao: 'Material seco, sem mistura. Segue direto para o fardo.' },
  { id: 'MISTURADO', rotulo: 'Misturado', perda: 0.15, tom: 'alerta',
    descricao: 'Recicláveis de tipos diferentes no mesmo volume. Exige retriagem.' },
  { id: 'CONTAMINADO', rotulo: 'Contaminado', perda: 0.45, tom: 'erro',
    descricao: 'Resto de comida, líquido ou material molhado junto. Boa parte vira rejeito.' }
];

/* Unidade receptora de uma cooperativa (RN-035). Sem cooperativa, a demanda vai
   à CATANORTE, a cooperativa do piloto. */
export function unidadeDaCooperativa(cooperativaId: string | null | undefined): Destino {
  return DESTINOS.find(d => d.cooperativa === cooperativaId) || DESTINOS[0];
}

export const Catalogo = {
  residuo: (id: string): Residuo | null => RESIDUOS.find(r => r.id === id) || null,
  nomeResiduo(id: string): string { const r = Catalogo.residuo(id); return r ? r.nome : id; },
  corResiduo(id: string): string { const r = Catalogo.residuo(id); return r ? r.cor : '#8a9690'; },

  gerador: (id: string | null | undefined): Gerador | null => GERADORES.find(g => g.id === id) || null,
  catador: (id: string | null | undefined): Catador | null => CATADORES.find(c => c.id === id) || null,
  cooperativa: (id: string | null | undefined): Cooperativa | null => COOPERATIVAS.find(c => c.id === id) || null,
  destino: (id: string | null | undefined): Destino | null => DESTINOS.find(d => d.id === id) || null,
  ponto: (id: string | null | undefined): Ponto | null => PONTOS.find(p => p.id === id) || null,

  operador(gerador: Gerador | null): Operador | null {
    const coop = gerador ? Catalogo.cooperativa(gerador.operador) : null;
    return coop ? { id: coop.id, nome: coop.nome, detalhe: coop.contrato } : null;
  },

  fluxo: (residuo: string): Fluxo | null => {
    const r = Catalogo.residuo(residuo);
    return r ? FLUXOS.find(f => f.id === r.fluxo) || null : null;
  },

  /* A equipe inteira, incluindo quem foi desligado: o histórico precisa de
     todo mundo que trabalhou. */
  equipe: (cooperativaId: string): Catador[] => CATADORES.filter(c => c.cooperativa === cooperativaId),

  /* Só quem pode receber demanda nova. É esta que a fila de designação usa --
     designar carga para cooperado desligado seria criar trabalho para quem
     não está mais lá. */
  equipeAtiva: (cooperativaId: string): Catador[] =>
    CATADORES.filter(c => c.cooperativa === cooperativaId && !c.desligamento),

  qualidade: (id: QualidadeId | null | undefined) => QUALIDADES.find(q => q.id === id) || null,

  endereco(pontoId: string): string {
    const ponto = Catalogo.ponto(pontoId);
    return ponto ? `${ponto.bairro} · ${ponto.zona}` : '—';
  }
};
