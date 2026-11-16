/* SAMAÚMA — carteira do cooperado e controle de passagens na portaria.
   Identifica a pessoa no programa municipal de coleta seletiva (RF-016) e
   registra entradas e saídas (RF-014). Passagem nenhuma é apagada. */

import { Catalogo, CATADORES, DESTINOS, PONTOS } from './catalogo';
import { comDigito, corpoDoCodigo, digitoVerificador, FORMATO_CARTEIRA } from './credencial';
import type { Catador, Evento } from './tipos';

export const CHAVE_CARTEIRAS = 'samauma.next.carteiras.v1';

/** Meses de validade da carteira, contados da emissão. */
export const VALIDADE_MESES = 24;

/** Janela em que a carteira já aparece como "a vencer" para quem a emitiu. */
export const AVISO_VENCIMENTO_DIAS = 60;

export type EstadoCarteira = 'ATIVA' | 'SUSPENSA' | 'CANCELADA';
export type SituacaoCarteiraId = 'ATIVA' | 'A_VENCER' | 'VENCIDA' | 'SUSPENSA' | 'CANCELADA';
export type TipoPassagem = 'ENTRADA' | 'SAIDA';

export interface SituacaoCarteira {
  id: SituacaoCarteiraId;
  rotulo: string;
  tom: string;
  /** Verdadeiro só quando a carteira autoriza a passagem agora. */
  liberada: boolean;
  motivo: string;
  diasParaVencer: number;
}

export interface Carteira {
  numero: string;
  catadorId: string;
  emitidaEm: string;
  validaAte: string;
  via: number;
  estado: EstadoCarteira;
  motivoEstado: string;
  /** Cooperativa no momento da emissão. */
  vinculo: string | null;
  emitidaPor: string;
  eventos: Evento[];
}

export interface LocalControle {
  id: string;
  nome: string;
  tipo: string;
}

export interface Passagem {
  id: string;
  carteira: string;
  catadorId: string;
  catadorNome: string;
  local: LocalControle;
  tipo: TipoPassagem;
  quando: string;
  registradoPor: string;
  /* Situação no instante da leitura. Guardada junto porque a carteira muda de
     estado depois, e a auditoria precisa saber o que o porteiro viu. */
  situacaoNaLeitura: SituacaoCarteiraId;
  cargaKg: number | null;
  observacao: string;
}

export interface LeituraCarteira {
  encontrada: boolean;
  carteira: Carteira | null;
  catador: Catador | null;
  situacao: SituacaoCarteira | null;
  /** Última passagem registrada, para saber se a próxima é entrada ou saída. */
  ultima: Passagem | null;
  dentro: boolean;
  recado: string;
}

/* O dígito e o formato vivem em `credencial.ts`: a carteira, o selo do gerador
   e a demanda conferem do mesmo jeito, e quem confere no campo é a mesma
   pessoa. Reexportados aqui porque a carteira e o caminho de entrada deles. */
export { digitoVerificador };

/** Número mais dígito: é isto que vai impresso e dentro do QR Code. */
export function codigoDeVerificacao(numero: string): string {
  return comDigito(numero);
}

/** Aceita o número puro ou o código completo; devolve o número ou nulo. */
export function numeroDoCodigo(bruto: string): string | null {
  return corpoDoCodigo(bruto, FORMATO_CARTEIRA);
}

function somarMeses(partida: Date, meses: number): Date {
  const data = new Date(partida.getTime());
  const dia = data.getDate();
  data.setMonth(data.getMonth() + meses);
  /* 31 de janeiro mais um mês não pode virar 3 de março. */
  if (data.getDate() < dia) data.setDate(0);
  return data;
}

function diasEntre(alvo: string, referencia: Date): number {
  const dia = 24 * 60 * 60 * 1000;
  return Math.round((new Date(alvo).getTime() - referencia.getTime()) / dia);
}

/** A situação nunca é digitada: sai do estado administrativo e das datas. */
export function situacaoDaCarteira(carteira: Carteira, agora: Date = new Date()): SituacaoCarteira {
  const dias = diasEntre(carteira.validaAte, agora);

  if (carteira.estado === 'CANCELADA') {
    return { id: 'CANCELADA', rotulo: 'Cancelada', tom: 'erro', liberada: false, diasParaVencer: dias,
      motivo: carteira.motivoEstado || 'Carteira cancelada pela emissora.' };
  }
  if (carteira.estado === 'SUSPENSA') {
    return { id: 'SUSPENSA', rotulo: 'Suspensa', tom: 'erro', liberada: false, diasParaVencer: dias,
      motivo: carteira.motivoEstado || 'Carteira suspensa; procure a emissora.' };
  }
  if (dias < 0) {
    return { id: 'VENCIDA', rotulo: 'Vencida', tom: 'erro', liberada: false, diasParaVencer: dias,
      motivo: `Validade encerrada há ${Math.abs(dias)} dia(s). A renovação é feita pela cooperativa ou pela Prefeitura.` };
  }
  if (dias <= AVISO_VENCIMENTO_DIAS) {
    return { id: 'A_VENCER', rotulo: 'A vencer', tom: 'alerta', liberada: true, diasParaVencer: dias,
      motivo: `Vence em ${dias} dia(s). Ainda autoriza a passagem, mas já pode ser renovada.` };
  }
  return { id: 'ATIVA', rotulo: 'Ativa', tom: 'ok', liberada: true, diasParaVencer: dias,
    motivo: `Válida por mais ${dias} dia(s).` };
}

/** Os lugares onde há leitura de carteira: galpões, unidades e pontos de coleta. */
export function locaisDeControle(): LocalControle[] {
  const unidades = DESTINOS.map(d => ({ id: d.id, nome: d.nome, tipo: d.tipo }));
  const pontos = PONTOS.map(p => ({ id: p.id, nome: `${p.bairro} · ${p.acesso.split('·')[0].trim()}`, tipo: 'Ponto de coleta' }));
  return [...unidades, ...pontos];
}

export function localDeControle(id: string): LocalControle | null {
  return locaisDeControle().find(l => l.id === id) || null;
}

type Ouvinte = () => void;

interface DadosGravados {
  carteiras: Carteira[];
  passagens: Passagem[];
  sequencia: number;
  sequenciaPassagem: number;
}

class RegistroCarteiras {
  carteiras: Carteira[] = [];
  passagens: Passagem[] = [];
  sequencia = 0;
  sequenciaPassagem = 0;
  private ouvintes = new Set<Ouvinte>();
  private instantaneo = {};

  subscribe = (ouvinte: Ouvinte): (() => void) => {
    this.ouvintes.add(ouvinte);
    return () => this.ouvintes.delete(ouvinte);
  };

  getSnapshot = () => this.instantaneo;

  private notificar() {
    this.instantaneo = {};
    this.ouvintes.forEach(o => o());
  }

  iniciar(): this {
    const salvo = this._ler();
    if (salvo) {
      this.carteiras = salvo.carteiras;
      this.passagens = salvo.passagens;
      this.sequencia = salvo.sequencia;
      this.sequenciaPassagem = salvo.sequenciaPassagem;
    } else {
      this._semear();
    }
    return this;
  }

  reiniciar() {
    this._semear();
    this.notificar();
  }

  /* ---- Consulta ---- */

  todas(): Carteira[] {
    return this.carteiras.slice().sort((a, b) => a.numero.localeCompare(b.numero));
  }

  porNumero(numero: string | null | undefined): Carteira | null {
    return this.carteiras.find(c => c.numero === numero) || null;
  }

  /** A carteira vigente do catador: a de maior via que não foi cancelada. */
  doCatador(catadorId: string): Carteira | null {
    return this.carteiras
      .filter(c => c.catadorId === catadorId && c.estado !== 'CANCELADA')
      .sort((a, b) => b.via - a.via)[0] || null;
  }

  daCooperativa(cooperativaId: string): Carteira[] {
    const equipe = Catalogo.equipe(cooperativaId).map(c => c.id);
    return this.todas().filter(c => equipe.includes(c.catadorId));
  }

  /** Leitura do QR ou do número digitado, com tudo que a portaria precisa ver. */
  consultar(bruto: string, localId?: string): LeituraCarteira {
    const numero = numeroDoCodigo(bruto);
    if (!numero) {
      return { encontrada: false, carteira: null, catador: null, situacao: null, ultima: null, dentro: false,
        recado: 'Código inválido. Confira os dois caracteres finais ou aponte a câmera novamente para o QR.' };
    }
    const carteira = this.porNumero(numero);
    if (!carteira) {
      return { encontrada: false, carteira: null, catador: null, situacao: null, ultima: null, dentro: false,
        recado: `Nenhuma carteira ${numero} no registro municipal.` };
    }
    const situacao = situacaoDaCarteira(carteira);
    const ultima = this.ultimaPassagem(numero, localId);
    return {
      encontrada: true, carteira, catador: Catalogo.catador(carteira.catadorId), situacao, ultima,
      dentro: !!ultima && ultima.tipo === 'ENTRADA',
      recado: situacao.motivo
    };
  }

  ultimaPassagem(numero: string, localId?: string): Passagem | null {
    return this.passagens
      .filter(p => p.carteira === numero && (!localId || p.local.id === localId))
      .sort(this._maisRecente)[0] || null;
  }

  passagensDoLocal(localId: string): Passagem[] {
    return this.passagens.filter(p => p.local.id === localId).sort(this._maisRecente);
  }

  passagensDoCatador(catadorId: string): Passagem[] {
    return this.passagens.filter(p => p.catadorId === catadorId).sort(this._maisRecente);
  }

  todasPassagens(): Passagem[] {
    return this.passagens.slice().sort(this._maisRecente);
  }

  /** Quem entrou e ainda não saiu, por local. */
  presentes(localId: string): Passagem[] {
    const porCarteira = new Map<string, Passagem>();
    this.passagensDoLocal(localId).forEach(p => {
      if (!porCarteira.has(p.carteira)) porCarteira.set(p.carteira, p);
    });
    return Array.from(porCarteira.values()).filter(p => p.tipo === 'ENTRADA');
  }

  /* ---- Atos ---- */

  emitir(catadorId: string, opcoes: { emitidaPor: string; meses?: number; motivo?: string } = { emitidaPor: 'Prefeitura' }): Carteira {
    const catador = Catalogo.catador(catadorId);
    if (!catador) throw new Error('Catador não encontrado: ' + catadorId);

    const anterior = this.doCatador(catadorId);
    if (anterior) {
      anterior.estado = 'CANCELADA';
      anterior.motivoEstado = 'Substituída pela via ' + (anterior.via + 1) + '.';
      this._registrar(anterior, 'Via substituída',
        `Nova via emitida para ${catador.nome}. Esta via deixa de valer nesta data.`, opcoes.emitidaPor);
    }

    const agora = new Date();
    const carteira: Carteira = {
      numero: anterior ? anterior.numero : this._novoNumero(agora),
      catadorId,
      emitidaEm: agora.toISOString(),
      validaAte: somarMeses(agora, opcoes.meses ?? VALIDADE_MESES).toISOString(),
      via: anterior ? anterior.via + 1 : 1,
      estado: 'ATIVA',
      motivoEstado: '',
      vinculo: catador.cooperativa,
      emitidaPor: opcoes.emitidaPor,
      eventos: []
    };
    const coop = Catalogo.cooperativa(catador.cooperativa);
    this._registrar(carteira, carteira.via > 1 ? `Segunda via emitida (via ${carteira.via})` : 'Carteira emitida',
      `${catador.nome} · ${coop ? 'cooperado da ' + coop.nome : 'catador autônomo'}. ` +
      `Código de verificação ${codigoDeVerificacao(carteira.numero)}.` +
      (opcoes.motivo ? ' ' + opcoes.motivo : ''), opcoes.emitidaPor);

    this.carteiras.push(carteira);
    this._gravar();
    this.notificar();
    return carteira;
  }

  renovar(numero: string, opcoes: { autor: string; meses?: number }): Carteira {
    const carteira = this._exigir(numero);
    if (carteira.estado === 'CANCELADA') throw new Error('Carteira cancelada não é renovada; emita uma nova via.');
    const partida = new Date();
    carteira.validaAte = somarMeses(partida, opcoes.meses ?? VALIDADE_MESES).toISOString();
    if (carteira.estado === 'SUSPENSA') {
      carteira.estado = 'ATIVA';
      carteira.motivoEstado = '';
    }
    this._registrar(carteira, 'Carteira renovada',
      `Nova validade até ${carteira.validaAte.slice(0, 10).split('-').reverse().join('/')}.`, opcoes.autor);
    this._gravar();
    this.notificar();
    return carteira;
  }

  suspender(numero: string, opcoes: { autor: string; motivo: string }): Carteira {
    const carteira = this._exigir(numero);
    if (!opcoes.motivo || opcoes.motivo.trim().length < 5) {
      throw new Error('Registre o motivo da suspensão: ele fica visível para o catador e para a fiscalização.');
    }
    carteira.estado = 'SUSPENSA';
    carteira.motivoEstado = opcoes.motivo.trim();
    this._registrar(carteira, 'Carteira suspensa', opcoes.motivo.trim(), opcoes.autor);
    this._gravar();
    this.notificar();
    return carteira;
  }

  reativar(numero: string, opcoes: { autor: string; motivo?: string }): Carteira {
    const carteira = this._exigir(numero);
    carteira.estado = 'ATIVA';
    carteira.motivoEstado = '';
    this._registrar(carteira, 'Carteira reativada',
      opcoes.motivo || 'Suspensão encerrada. A carteira volta a autorizar passagem.', opcoes.autor);
    this._gravar();
    this.notificar();
    return carteira;
  }

  cancelar(numero: string, opcoes: { autor: string; motivo: string }): Carteira {
    const carteira = this._exigir(numero);
    if (!opcoes.motivo || opcoes.motivo.trim().length < 5) {
      throw new Error('Registre o motivo do cancelamento.');
    }
    carteira.estado = 'CANCELADA';
    carteira.motivoEstado = opcoes.motivo.trim();
    this._registrar(carteira, 'Carteira cancelada', opcoes.motivo.trim(), opcoes.autor);
    this._gravar();
    this.notificar();
    return carteira;
  }

  /** Uma leitura no portão. Registra inclusive quando a carteira não autoriza. */
  registrarPassagem(bruto: string, opcoes: {
    localId: string; registradoPor: string; tipo?: TipoPassagem; cargaKg?: number | null; observacao?: string;
  }): Passagem {
    const leitura = this.consultar(bruto, opcoes.localId);
    if (!leitura.encontrada || !leitura.carteira || !leitura.situacao) throw new Error(leitura.recado);

    const local = localDeControle(opcoes.localId);
    if (!local) throw new Error('Local de controle não encontrado: ' + opcoes.localId);

    const catador = leitura.catador;
    const tipo: TipoPassagem = opcoes.tipo || (leitura.dentro ? 'SAIDA' : 'ENTRADA');
    if (tipo === 'ENTRADA' && !leitura.situacao.liberada) {
      throw new Error(`Entrada não autorizada: carteira ${leitura.situacao.rotulo.toLowerCase()}. ${leitura.situacao.motivo}`);
    }

    this.sequenciaPassagem += 1;
    const passagem: Passagem = {
      id: 'PSG-' + String(this.sequenciaPassagem).padStart(5, '0'),
      carteira: leitura.carteira.numero,
      catadorId: leitura.carteira.catadorId,
      catadorNome: catador ? catador.nome : leitura.carteira.catadorId,
      local,
      tipo,
      quando: new Date().toISOString(),
      registradoPor: opcoes.registradoPor,
      situacaoNaLeitura: leitura.situacao.id,
      cargaKg: opcoes.cargaKg ?? null,
      observacao: opcoes.observacao || ''
    };
    this.passagens.push(passagem);

    this._registrar(leitura.carteira, tipo === 'ENTRADA' ? 'Entrada registrada' : 'Saída registrada',
      `${local.nome}${passagem.cargaKg ? ' · ' + passagem.cargaKg + ' kg declarados' : ''}.`, opcoes.registradoPor);

    this._gravar();
    this.notificar();
    return passagem;
  }

  /* ---- Interno ---- */

  /* O bipador da portaria e mais rapido que o relogio: duas leituras seguidas
     caem no mesmo milissegundo e a ordem por horario fica indefinida — entrada
     podia aparecer depois da saida, e a pessoa continuava "dentro". O
     identificador e sequencial, entao ele desempata. */
  private _maisRecente(a: Passagem, b: Passagem) {
    const distancia = new Date(b.quando).getTime() - new Date(a.quando).getTime();
    return distancia !== 0 ? distancia : b.id.localeCompare(a.id);
  }

  private _exigir(numero: string): Carteira {
    const carteira = this.porNumero(numero);
    if (!carteira) throw new Error('Carteira não encontrada: ' + numero);
    return carteira;
  }

  private _novoNumero(agora: Date): string {
    this.sequencia += 1;
    return `PVH-CAT-${agora.getFullYear()}-${String(this.sequencia).padStart(4, '0')}`;
  }

  private _registrar(carteira: Carteira, titulo: string, detalhe: string, autor: string, quando?: string) {
    carteira.eventos.push({ quando: quando || new Date().toISOString(), titulo, detalhe, autor });
  }

  /* Semente demonstrativa: todo catador do catálogo já chega com carteira, e o
     conjunto cobre de propósito os quatro desfechos que a portaria enfrenta —
     ativa, a vencer, vencida e suspensa. */
  private _semear() {
    this.carteiras = [];
    this.passagens = [];
    this.sequencia = 0;
    this.sequenciaPassagem = 0;

    const hoje = new Date();
    const dia = 24 * 60 * 60 * 1000;

    CATADORES.forEach((catador, indice) => {
      this.sequencia += 1;
      const numero = `PVH-CAT-2026-${String(this.sequencia).padStart(4, '0')}`;
      /* Emissões espalhadas no tempo para que as validades não vençam juntas. */
      const emitidaEm = new Date(hoje.getTime() - (60 + indice * 47) * dia);
      const carteira: Carteira = {
        numero,
        catadorId: catador.id,
        emitidaEm: emitidaEm.toISOString(),
        validaAte: somarMeses(emitidaEm, VALIDADE_MESES).toISOString(),
        via: 1,
        estado: 'ATIVA',
        motivoEstado: '',
        vinculo: catador.cooperativa,
        emitidaPor: catador.cooperativa ? Catalogo.cooperativa(catador.cooperativa)!.nome : 'SEMA · Porto Velho',
        eventos: []
      };
      const coop = Catalogo.cooperativa(catador.cooperativa);
      this._registrar(carteira, 'Carteira emitida',
        `${catador.nome} · ${coop ? 'cooperado da ' + coop.nome : 'catador autônomo'}. ` +
        `Código de verificação ${codigoDeVerificacao(numero)}.`,
        carteira.emitidaPor, emitidaEm.toISOString());
      this.carteiras.push(carteira);
    });

    /* Um caso vencido e um suspenso, para a tela de fiscalização ter o que mostrar. */
    const vencida = this.carteiras[8];
    if (vencida) {
      vencida.emitidaEm = new Date(hoje.getTime() - 800 * dia).toISOString();
      vencida.validaAte = new Date(hoje.getTime() - 70 * dia).toISOString();
      this._registrar(vencida, 'Validade encerrada',
        'A carteira passou da validade sem renovação. Renovar pela cooperativa ou pela Prefeitura.',
        'Sistema', vencida.validaAte);
    }
    const aVencer = this.carteiras[3];
    if (aVencer) {
      aVencer.validaAte = new Date(hoje.getTime() + 24 * dia).toISOString();
    }
    const suspensa = this.carteiras[11];
    if (suspensa) {
      suspensa.estado = 'SUSPENSA';
      suspensa.motivoEstado = 'Divergência de pesagem em apuração na cooperativa.';
      this._registrar(suspensa, 'Carteira suspensa', suspensa.motivoEstado,
        'COOPAMAZÔNIA', new Date(hoje.getTime() - 9 * dia).toISOString());
    }

    /* Movimento do galpão nos últimos dias: entradas e saídas já fechadas, mais
       algumas pessoas ainda dentro, para o painel de presença não nascer vazio. */
    const galpao = localDeControle('dst-01');
    if (galpao) {
      const equipe = this.carteiras.filter(c => c.vinculo === 'coop-01');
      equipe.forEach((carteira, indice) => {
        const catador = Catalogo.catador(carteira.catadorId);
        if (!catador) return;
        for (let recuo = 3; recuo >= 1; recuo--) {
          const entrada = new Date(hoje.getTime() - recuo * dia);
          entrada.setHours(7, 10 + indice * 7, 0, 0);
          const saida = new Date(entrada.getTime() + (5 * 60 + indice * 11) * 60 * 1000);
          this._passagemSemente(carteira, catador, galpao, 'ENTRADA', entrada, null);
          this._passagemSemente(carteira, catador, galpao, 'SAIDA', saida, 180 + indice * 45);
        }
        /* Os dois primeiros continuam dentro do galpão hoje. */
        if (indice < 2) {
          const agora = new Date(hoje.getTime());
          agora.setHours(7, 20 + indice * 9, 0, 0);
          this._passagemSemente(carteira, catador, galpao, 'ENTRADA', agora, null);
        }
      });
    }

    this._gravar();
  }

  private _passagemSemente(carteira: Carteira, catador: Catador, local: LocalControle,
                           tipo: TipoPassagem, quando: Date, cargaKg: number | null) {
    this.sequenciaPassagem += 1;
    this.passagens.push({
      id: 'PSG-' + String(this.sequenciaPassagem).padStart(5, '0'),
      carteira: carteira.numero,
      catadorId: catador.id,
      catadorNome: catador.nome,
      local,
      tipo,
      quando: quando.toISOString(),
      registradoPor: 'Encarregado do galpão',
      situacaoNaLeitura: 'ATIVA',
      cargaKg,
      observacao: ''
    });
  }

  private _ler(): DadosGravados | null {
    if (typeof localStorage === 'undefined') return null;
    try {
      const bruto = localStorage.getItem(CHAVE_CARTEIRAS);
      if (!bruto) return null;
      const dados = JSON.parse(bruto);
      return Array.isArray(dados.carteiras) && Array.isArray(dados.passagens) ? dados : null;
    } catch {
      return null;
    }
  }

  private _gravar() {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(CHAVE_CARTEIRAS, JSON.stringify({
        carteiras: this.carteiras,
        passagens: this.passagens,
        sequencia: this.sequencia,
        sequenciaPassagem: this.sequenciaPassagem
      }));
    } catch {
      /* Sem armazenamento local a demonstração continua, apenas não persiste. */
    }
  }
}

export const Carteiras = new RegistroCarteiras();
