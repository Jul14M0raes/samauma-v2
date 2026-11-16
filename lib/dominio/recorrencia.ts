/* SAMAÚMA — coletas previstas em contrato (RF-006, DOC-006).
   O contrato entre gerador e cooperativa define os dias de coleta; o sistema
   propõe a demanda do dia e alguém do estabelecimento confirma: automatiza a
   digitação, não a decisão de destinar. O contrato em si é firmado fora do
   sistema e só é referenciado aqui (sem ciclo de vida na doc). */

import { Catalogo } from './catalogo';
import { Store } from './store';

export type DiaDaSemana = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const NOME_DO_DIA = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

export interface Agendamento {
  id: string;
  geradorId: string;
  /** Cooperativa com quem o contrato foi firmado (RN-005). */
  cooperativa: string;
  residuo: string;
  /** Quantidade por coleta, em litros (RN-006). */
  declaradoL: number;
  ponto: string;
  /** Dias da semana em que costuma haver carga. */
  dias: DiaDaSemana[];
  observacao: string;
  ativo: boolean;
  criadoEm: string;
  /** Data (AAAA-MM-DD) da última vez que uma proposta virou demanda. */
  ultimaGeracao: string | null;
}

export interface Proposta {
  agendamento: Agendamento;
  data: string;
  /** Já existe demanda deste agendamento para esta data. */
  jaCriada: boolean;
}

type Ouvinte = () => void;
const CHAVE = 'samauma.next.contratos.v1';

function hojeISO(agora: Date = new Date()): string {
  return agora.toISOString().slice(0, 10);
}

class Agendamentos {
  private lista: Agendamento[] = [];
  private sequencia = 0;
  private ouvintes = new Set<Ouvinte>();
  private instantaneo: Agendamento[] = [];

  subscribe = (ouvinte: Ouvinte): (() => void) => {
    this.ouvintes.add(ouvinte);
    return () => this.ouvintes.delete(ouvinte);
  };

  getSnapshot = () => this.instantaneo;

  private _publicar() {
    this.instantaneo = [...this.lista];
    this.ouvintes.forEach(o => o());
  }

  private _gravar() {
    if (typeof localStorage === 'undefined') return;
    try { localStorage.setItem(CHAVE, JSON.stringify(this.lista)); } catch { /* cota cheia: segue em memória */ }
  }

  iniciar(): this {
    if (typeof localStorage !== 'undefined') {
      try {
        const bruto = localStorage.getItem(CHAVE);
        if (bruto) this.lista = JSON.parse(bruto) as Agendamento[];
      } catch { this.lista = []; }
    }
    this.sequencia = this.lista.length;
    this._publicar();
    return this;
  }

  reiniciar() {
    this.lista = [];
    this.sequencia = 0;
    this._gravar();
    this._publicar();
  }

  doGerador(geradorId: string): Agendamento[] {
    return this.lista.filter(a => a.geradorId === geradorId);
  }

  criar(geradorId: string, dados: {
    residuo: string; declaradoL: number; dias: DiaDaSemana[]; observacao?: string;
  }): Agendamento {
    const gerador = Catalogo.gerador(geradorId);
    if (!gerador) throw new Error('Estabelecimento não encontrado: ' + geradorId);
    if (!gerador.operador) throw new Error('Sem contrato vigente com cooperativa: a coleta prevista em contrato depende dele.');
    if (!dados.dias.length) throw new Error('Escolha ao menos um dia da semana.');
    if (!(dados.declaradoL > 0)) throw new Error('Informe a quantidade em litros, maior que zero.');
    if (!Catalogo.residuo(dados.residuo)) throw new Error('Resíduo desconhecido: ' + dados.residuo);

    this.sequencia += 1;
    const agendamento: Agendamento = {
      id: `AGD-${String(this.sequencia).padStart(4, '0')}`,
      geradorId,
      cooperativa: gerador.operador,
      residuo: dados.residuo,
      declaradoL: dados.declaradoL,
      ponto: gerador.ponto,
      dias: [...new Set(dados.dias)].sort((a, b) => a - b) as DiaDaSemana[],
      observacao: (dados.observacao || '').trim(),
      ativo: true,
      criadoEm: new Date().toISOString(),
      ultimaGeracao: null
    };
    this.lista.push(agendamento);
    this._gravar();
    this._publicar();
    return agendamento;
  }

  alternar(id: string): Agendamento {
    const a = this.lista.find(x => x.id === id);
    if (!a) throw new Error('Agendamento não encontrado: ' + id);
    a.ativo = !a.ativo;
    this._gravar();
    this._publicar();
    return a;
  }

  remover(id: string) {
    this.lista = this.lista.filter(a => a.id !== id);
    this._gravar();
    this._publicar();
  }

  /* Propostas do dia: o que o agendamento sugere, ainda sem virar demanda.
     `jaCriada` evita propor de novo o que já foi confirmado hoje. */
  propostasDoDia(geradorId: string, agora: Date = new Date()): Proposta[] {
    const dia = agora.getDay() as DiaDaSemana;
    const data = hojeISO(agora);
    return this.doGerador(geradorId)
      .filter(a => a.ativo && a.dias.includes(dia))
      .map(a => ({ agendamento: a, data, jaCriada: a.ultimaGeracao === data }));
  }

  /* Confirmar é o ato do estabelecimento: só aqui a demanda passa a existir e a
     rede de catadores é acionada. */
  confirmar(id: string, agora: Date = new Date()) {
    const a = this.lista.find(x => x.id === id);
    if (!a) throw new Error('Agendamento não encontrado: ' + id);
    if (!a.ativo) throw new Error('Este agendamento está pausado.');
    const data = hojeISO(agora);
    if (a.ultimaGeracao === data) throw new Error('A coleta deste agendamento já foi confirmada hoje.');

    /* O prazo acompanha o ritmo: coleta recorrente vence no dia seguinte, e não
       na semana que vem, porque a carga já está no estabelecimento hoje. */
    const prazo = new Date(agora.getTime() + 24 * 60 * 60 * 1000).toISOString();

    const demanda = Store.criar({
      geradorId: a.geradorId,
      residuo: a.residuo,
      declaradoL: a.declaradoL,
      ponto: a.ponto,
      prazo,
      origem: 'CONTRATO',
      observacao: a.observacao
        ? `${a.observacao} · Prevista em contrato (${a.id}).`
        : `Prevista em contrato (${a.id}).`
    });
    Store.publicar(demanda.id);

    a.ultimaGeracao = data;
    this._gravar();
    this._publicar();
    return demanda;
  }
}

export const Recorrencia = new Agendamentos();
