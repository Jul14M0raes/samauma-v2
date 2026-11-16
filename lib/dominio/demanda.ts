/* SAMAÚMA — regras da demanda e coleta (EST-001).
   Funções puras sobre um objeto demanda: nada aqui lê armazenamento nem escreve
   tela. O que a demanda vale, quanto foi recuperado, se está atrasada e quem
   precisa agir agora. */

import { Catalogo, EM_ABERTO, STATUS } from './catalogo';
import { Parametros } from './parametros';
import { comDigito } from './credencial';
import { Fmt } from './formato';
import type { Demanda } from './tipos';

export const DemandaRegras = {
  /* Código do QR da demanda e da etiqueta da carga; o dígito evita abrir a
     demanda vizinha por erro de digitação. */
  codigoVerificacao(demanda: Demanda): string {
    return comDigito(demanda.id);
  },

  /* Massa estimada a partir do volume declarado, só para planejamento
     (capacidade, previsão). Nunca entra na conciliação. */
  estimativaKg(demanda: Demanda): number {
    const residuo = Catalogo.residuo(demanda.residuo);
    return Math.round(demanda.declaradoL * (residuo ? residuo.densidade : 0.1));
  },

  /* Quanto a pesagem se sustenta sozinha (RN-011 a RN-013, RNF-002). O sistema
     não recusa pesagem sem evidência: classifica, com o motivo escrito. */
  forcaDaProva(demanda: Demanda): { id: string; rotulo: string; tom: string; motivo: string } {
    if (demanda.verificadoKg == null) {
      return { id: 'SEM_PESAGEM', rotulo: 'Sem pesagem', tom: 'neutro',
        motivo: 'A carga ainda não foi pesada no recebimento.' };
    }
    const p = demanda.pesagem;
    if (!p || (!p.balanca && !p.afericao && !p.tiquete)) {
      return { id: 'DECLARADA', rotulo: 'Massa declarada', tom: 'alerta',
        motivo: 'A massa foi digitada sem identificação do instrumento nem tíquete. ' +
          'Vale como declaração de quem recebeu, não como medição comprovável.' };
    }
    if (p.origem === 'INSTRUMENTO') {
      return { id: 'INSTRUMENTADA', rotulo: 'Leitura do instrumento', tom: 'ok',
        motivo: `Massa lida direto de ${p.balanca}${p.leitura ? `, registro ${p.leitura}` : ''}, ` +
          `aferição ${p.afericao}. O número não foi digitado por quem recebeu a carga.` };
    }
    if (p.balanca && p.afericao && p.tiquete) {
      return { id: 'MEDIDA', rotulo: 'Medição comprovada', tom: 'ok',
        motivo: `Pesada em ${p.balanca}, aferição ${p.afericao}, com tíquete anexado.` };
    }
    const falta = [!p.balanca && 'identificação da balança', !p.afericao && 'registro de aferição',
      !p.tiquete && 'tíquete'].filter(Boolean).join(', ');
    return { id: 'PARCIAL', rotulo: 'Medição parcial', tom: 'info',
      motivo: `Pesagem identificada, mas falta ${falta}.` };
  },

  /* Variação entre a massa observada na coleta e a aferida no recebimento.
     O volume declarado em litros aparece ao lado como referência: a comparação
     litros × kg segue em aberto na doc (Contradições e Pontos em Aberto). */
  divergencia(demanda: Demanda): number | null {
    if (demanda.coletadoKg == null || demanda.verificadoKg == null) return null;
    return Math.abs(demanda.verificadoKg - demanda.coletadoKg) / demanda.coletadoKg * 100;
  },

  toleranciaKg(demanda: Demanda): number | null {
    if (demanda.coletadoKg == null) return null;
    return Math.max(demanda.coletadoKg * Parametros.toleranciaFracao, Parametros.toleranciaMinimaKg);
  },

  dentroDaTolerancia(demanda: Demanda): boolean {
    if (demanda.coletadoKg == null || demanda.verificadoKg == null) return false;
    return Math.abs(demanda.verificadoKg - demanda.coletadoKg) <= (DemandaRegras.toleranciaKg(demanda) as number);
  },

  /* Liberada pela Prefeitura depois de uma pendência de divergência. */
  conciliada(demanda: Demanda): boolean {
    return demanda.pendencia?.estado === 'LIBERADA';
  },

  reciclado(demanda: Demanda): number | null {
    if (demanda.verificadoKg == null) return null;
    return Math.max(0, demanda.verificadoKg - (demanda.rejeitoKg || 0));
  },

  rejeito(demanda: Demanda): number | null {
    if (demanda.verificadoKg == null) return null;
    return demanda.rejeitoKg || 0;
  },

  taxaRecuperacao(demanda: Demanda): number | null {
    const reciclado = DemandaRegras.reciclado(demanda);
    if (reciclado == null || !demanda.verificadoKg) return null;
    return (reciclado / demanda.verificadoKg) * 100;
  },

  valor(demanda: Demanda): number | null {
    const kg = DemandaRegras.reciclado(demanda) ?? demanda.coletadoKg;
    if (kg == null) return null;
    const residuo = Catalogo.residuo(demanda.residuo);
    return kg * (residuo ? Parametros.preco(residuo.id) : 0.5);
  },

  co2(demanda: Demanda): number | null {
    const kg = DemandaRegras.reciclado(demanda) ?? demanda.coletadoKg;
    if (kg == null) return null;
    const residuo = Catalogo.residuo(demanda.residuo);
    return kg * (residuo ? residuo.co2 : 1);
  },

  atrasada(demanda: Demanda): boolean {
    return EM_ABERTO.includes(demanda.status) && new Date(demanda.prazo) < new Date();
  },

  rotulo(demanda: Demanda): string {
    const base = STATUS[demanda.status].rotulo;
    return DemandaRegras.conciliada(demanda) && demanda.status === 'COMPROVADA' ? base + ' · conciliada' : base;
  },

  cicloHoras(demanda: Demanda): number | null {
    if (!demanda.comprovante) return null;
    return (new Date(demanda.comprovante.emitidoEm).getTime() - new Date(demanda.criadaEm).getTime()) / 3600000;
  },

  destinoFinal(demanda: Demanda): string {
    if (demanda.destinoFinal) return demanda.destinoFinal;
    return Catalogo.fluxo(demanda.residuo)?.destinacao || '—';
  },

  /* Ainda dá para justificar e remarcar (RN-041)? */
  dentroDaJanelaDeExecucao(demanda: Demanda, agora: Date = new Date()): boolean {
    return demanda.status === 'PENDENCIA_EXECUCAO' && !!demanda.execucao &&
      agora.getTime() <= new Date(demanda.execucao.prazoJustificativa).getTime();
  },

  /* --- A trilha organizada por etapa ---------------------------------------
     O casamento é por título; o que não casar cai no grupo 0, para que nenhum
     evento suma da vista por falha de classificação. */
  etapaDoEvento(titulo: string): number | null {
    const t = titulo.toLowerCase();
    if (t.startsWith('ocorrência')) return 3;

    const MAPA: [string[], number][] = [
      [['demanda criada', 'demanda disponível'], 1],
      [['demanda aceita', 'demanda não aceita', 'nova avaliação'], 2],
      [['cooperado designado', 'peso registrado', 'registro fotográfico',
        'pendência de execução', 'coleta remarcada'], 3],
      [['carga em transporte', 'mtr registrado'], 4],
      [['recebimento confirmado', 'conciliação', 'pendência de divergência aberta', 'cdf registrado'], 5],
      [['comprovante emitido', 'divergência liberada', 'divergência mantida'], 6]
    ];
    for (const [chaves, etapa] of MAPA) {
      if (chaves.some(c => t.includes(c))) return etapa;
    }
    return null;
  },

  trilhaPorEtapa(demanda: Demanda): Record<number, Demanda['eventos']> {
    const grupos: Record<number, Demanda['eventos']> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
    for (const evento of demanda.eventos) {
      grupos[DemandaRegras.etapaDoEvento(evento.titulo) ?? 0].push(evento);
    }
    return grupos;
  },

  proximaAcao(demanda: Demanda): { perfil: string | null; texto: string } {
    switch (demanda.status) {
      case 'CRIADA':                return { perfil: 'gerador',     texto: 'Encaminhar a demanda à cooperativa' };
      case 'DISPONIVEL':            return { perfil: 'cooperativa', texto: 'Avaliar se consegue atender' };
      case 'NAO_ACEITA':            return { perfil: 'cooperativa', texto: 'Reavaliar depois de reforçar o equipamento' };
      case 'ACEITA':                return { perfil: 'cooperativa', texto: 'Designar quem executa a coleta' };
      case 'EM_COLETA':             return { perfil: 'cooperativa', texto: 'Registrar a massa observada e fechar a carga' };
      case 'PENDENCIA_EXECUCAO':    return { perfil: 'cooperativa', texto: 'Justificar e remarcar a coleta' };
      case 'EM_TRANSPORTE':         return { perfil: 'cooperativa', texto: 'Confirmar o recebimento e pesar' };
      case 'PENDENCIA_DIVERGENCIA':
        return demanda.pendencia?.estado === 'MANTIDA'
          ? { perfil: null, texto: 'Divergência mantida; o desfecho segue pendente de definição na doc' }
          : { perfil: 'prefeitura', texto: 'Decidir a pendência de divergência' };
      default:                      return { perfil: null, texto: 'Ciclo concluído' };
    }
  },

  massaCorrente(demanda: Demanda): { kg: number | null; rotulo: string; nota: string; atrasada?: boolean } {
    if (demanda.status === 'COMPROVADA') {
      return { kg: demanda.verificadoKg, rotulo: 'recebidos', nota: 'comprovada em ' + Fmt.data(demanda.comprovante!.emitidoEm) };
    }
    if (demanda.status === 'PENDENCIA_DIVERGENCIA') {
      return { kg: demanda.coletadoKg, rotulo: 'coletados', nota: 'em análise pela Prefeitura' };
    }
    if (demanda.status === 'EM_TRANSPORTE') {
      return { kg: demanda.coletadoKg, rotulo: 'coletados', nota: 'aguardando recebimento' };
    }
    return {
      kg: demanda.coletadoKg ?? DemandaRegras.estimativaKg(demanda),
      rotulo: demanda.coletadoKg != null ? 'coletados' : 'estimados',
      nota: 'prazo ' + Fmt.prazo(demanda.prazo),
      atrasada: DemandaRegras.atrasada(demanda)
    };
  },

  /* RF-010, RN-017: rota sugerida para as coletas aceitas, agrupando por zona,
     depois pela distância ao galpão e pelo prazo.
     ponytail: ordenação simples; horário e capacidade do caminhão entram quando
     as regras complementares da D-02 forem definidas. */
  ordemDeRota(demandas: Demanda[]): Demanda[] {
    return demandas.slice().sort((a, b) =>
      a.zona.localeCompare(b.zona) || a.km - b.km ||
      new Date(a.prazo).getTime() - new Date(b.prazo).getTime());
  },

  /* ------------------------------------------- SEPARAÇÃO NA ORIGEM */

  /* Perda de triagem causada por carga mal separada (a evitável), diferente
     da perda inerente ao material. */
  perdaPorSeparacao(demanda: Demanda): number | null {
    if (demanda.verificadoKg == null || !demanda.qualidade) return null;
    return Math.round(demanda.verificadoKg * demanda.qualidade.perda);
  },

  custoDaSeparacao(demanda: Demanda): number | null {
    const perda = DemandaRegras.perdaPorSeparacao(demanda);
    if (perda == null) return null;
    const residuo = Catalogo.residuo(demanda.residuo);
    const limpo = Catalogo.qualidade('LIMPO');
    const evitavel = Math.max(0, perda - (demanda.verificadoKg || 0) * (limpo ? limpo.perda : 0));
    return evitavel * (residuo ? Parametros.preco(residuo.id) : 0);
  }
};
