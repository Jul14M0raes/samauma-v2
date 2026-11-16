/* SAMAÚMA — o armazém da demanda e coleta (EST-001).
   Guarda as demandas, aplica as transições de estado e responde às consultas de
   cada perfil. Não calcula painel (isso é `indicadores.ts`) nem monta tela.
   Um subscribe/notify mínimo avisa o React (`useSyncExternalStore`). */

import {
  CANAIS, Catalogo, GERADOR_SESSAO, JANELA_EXECUCAO_HORAS, STATUS, unidadeDaCooperativa
} from './catalogo';
import { DemandaRegras as Demanda } from './demanda';
import { exigeMtr, PORTAL_MTR } from './mtr';
import { Fmt } from './formato';
import { Semente } from './semente';
import type { Demanda as TDemanda, Ocorrencia, QualidadeId, StatusId, TipoOcorrencia } from './tipos';

const ROTULO_OCORRENCIA: Record<TipoOcorrencia, string> = {
  FECHADO: 'estabelecimento fechado',
  MATERIAL_DIVERGENTE: 'material diferente do combinado',
  ACESSO: 'acesso bloqueado',
  VOLUME: 'volume diferente do declarado',
  OUTRO: 'outra'
};

const CHAVE_ARMAZENAMENTO = 'samauma.next.demandas.v2';
const HORA = 3600000;

type Ouvinte = () => void;

class ArmazemDemandas {
  demandas: TDemanda[] = [];
  sequencia = 0;
  private ouvintes = new Set<Ouvinte>();
  private instantaneo = { demandas: this.demandas };

  subscribe = (ouvinte: Ouvinte): (() => void) => {
    this.ouvintes.add(ouvinte);
    return () => this.ouvintes.delete(ouvinte);
  };

  getSnapshot = (): { demandas: TDemanda[] } => this.instantaneo;

  private notificar() {
    this.instantaneo = { demandas: this.demandas };
    this.ouvintes.forEach(ouvinte => ouvinte());
  }

  iniciar(): this {
    const salvo = this._ler();
    if (salvo) {
      this.demandas = salvo.demandas;
      this.sequencia = salvo.sequencia;
    } else {
      this.reiniciarSemNotificar();
    }
    this.verificarPrazos();
    this.instantaneo = { demandas: this.demandas };
    return this;
  }

  reiniciar() {
    this.reiniciarSemNotificar();
    this.verificarPrazos();
    this.notificar();
  }

  private reiniciarSemNotificar() {
    const semente = Semente.gerar();
    this.demandas = semente.demandas;
    this.sequencia = semente.sequencia;
    this._gravar();
  }

  /* ------------------------------------------------------------ consultas */

  obter(id: string | null | undefined): TDemanda | null {
    return this.demandas.find(d => d.id === id) || null;
  }

  todas(): TDemanda[] {
    return this.demandas.slice().sort(this._maisRecente);
  }

  doGerador(geradorId: string = GERADOR_SESSAO): TDemanda[] {
    return this.demandas.filter(d => d.gerador.id === geradorId).sort(this._maisRecente);
  }

  disponiveis(): TDemanda[] {
    return this.demandas.filter(d => d.status === 'DISPONIVEL').sort(this._porPrazo);
  }

  doCatador(catadorId: string): TDemanda[] {
    return this.demandas.filter(d => d.catador && d.catador.id === catadorId).sort(this._maisRecente);
  }

  /* Tudo o que a cooperativa atende: as demandas endereçadas ao seu galpão. */
  daCooperativa(cooperativaId: string): TDemanda[] {
    return this.paraDestino(unidadeDaCooperativa(cooperativaId).id);
  }

  paraDestino(destinoId: string): TDemanda[] {
    return this.demandas.filter(d => d.destino && d.destino.id === destinoId).sort(this._maisRecente);
  }

  aCaminhoDe(destinoId: string): TDemanda[] {
    return this.demandas
      .filter(d => d.status === 'EM_TRANSPORTE' && d.destino && d.destino.id === destinoId)
      .sort(this._porPrazo);
  }

  pendentes(): TDemanda[] {
    return this.demandas.filter(d => d.status === 'PENDENCIA_DIVERGENCIA').sort(this._maisRecente);
  }

  doDia(catadorId: string): TDemanda[] {
    return this.demandas
      .filter(d => d.catador && d.catador.id === catadorId &&
        d.status === 'EM_COLETA' && Fmt.diasAte(d.prazo) <= 0)
      .sort(this._porPrazo);
  }

  proximaColeta(catadorId: string): TDemanda | null {
    return this.demandas
      .filter(d => d.catador && d.catador.id === catadorId && d.status === 'EM_COLETA')
      .sort(this._porPrazo)[0] || null;
  }

  proximaDoGerador(geradorId: string = GERADOR_SESSAO): TDemanda | null {
    return this.doGerador(geradorId)
      .filter(d => ['DISPONIVEL', 'ACEITA', 'EM_COLETA', 'EM_TRANSPORTE'].includes(d.status))
      .sort(this._porPrazo)[0] || null;
  }

  comprovantes(demandas: TDemanda[]): TDemanda[] {
    return demandas.filter(d => d.status === 'COMPROVADA' && d.comprovante);
  }

  /** Cargas pesadas sem evidência completa: fila de auditoria. */
  semEvidenciaDePesagem(): TDemanda[] {
    return this.demandas
      .filter(d => d.verificadoKg != null && Demanda.forcaDaProva(d).id !== 'MEDIDA')
      .sort(this._maisRecente);
  }

  /** Cargas comprovadas sem MTR vinculado: fila de regularização. */
  semMtr(): TDemanda[] {
    return this.demandas.filter(d => exigeMtr(d) && !d.mtr).sort(this._maisRecente);
  }

  private _maisRecente(a: TDemanda, b: TDemanda) { return new Date(b.criadaEm).getTime() - new Date(a.criadaEm).getTime(); }
  private _porPrazo(a: TDemanda, b: TDemanda) { return new Date(a.prazo).getTime() - new Date(b.prazo).getTime(); }

  /* ------------------------------------------------ E1: declaração (GGR) */

  /* RF-006 / RF-007: o Gerador declara a coleta em litros (RN-006). A demanda
     é endereçada à cooperativa com contrato vigente (RN-005). */
  criar(opcoes: {
    geradorId?: string; residuo: string; declaradoL: number; ponto?: string; prazo: string;
    observacao?: string; origem?: 'CONTRATO' | 'AVULSA';
  }): TDemanda {
    const { geradorId = GERADOR_SESSAO, residuo, declaradoL, ponto, prazo, observacao, origem = 'AVULSA' } = opcoes;
    const gerador = Catalogo.gerador(geradorId);
    if (!gerador) throw new Error('Gerador não encontrado: ' + geradorId);
    if (gerador.baixa) throw new Error(`${gerador.nome} teve baixa no cadastro e não declara nova coleta.`);
    if (!(declaradoL > 0)) throw new Error('Informe a quantidade em litros, maior que zero.');
    const destino = unidadeDaCooperativa(gerador.operador);
    const local = Catalogo.ponto(ponto || gerador.ponto) || Catalogo.ponto(gerador.ponto)!;

    const demanda: TDemanda = {
      id: this._novoId(),
      gerador: { id: gerador.id, nome: gerador.nome },
      origem,
      residuo,
      declaradoL,
      ponto: local.id,
      bairro: local.bairro,
      zona: local.zona,
      km: gerador.km,
      prazo,
      observacao: observacao || '',
      status: 'CRIADA',
      catador: null,
      destino: { id: destino.id, nome: destino.nome },
      coletadoKg: null,
      verificadoKg: null,
      rejeitoKg: null,
      destinoFinal: null,
      recebidaEm: null,
      lote: null,
      foto: null,
      pesagem: null,
      qualidade: null,
      mtr: null,
      comprovante: null,
      pendencia: null,
      execucao: null,
      naoAceites: [],
      criadaEm: new Date().toISOString(),
      eventos: []
    };

    this._registrar(demanda, 'Demanda criada',
      `${gerador.nome} declarou ${Fmt.litros(declaradoL)} de ${Catalogo.nomeResiduo(residuo)} ` +
      `(${origem === 'CONTRATO' ? 'prevista em contrato' : 'coleta avulsa'}).`, 'Gerador');
    this.demandas.push(demanda);
    this._salvar();
    return demanda;
  }

  publicar(id: string): TDemanda {
    const demanda = this._exigir(id, 'CRIADA');
    demanda.status = 'DISPONIVEL';
    this._registrar(demanda, 'Demanda disponível',
      `Encaminhada a ${demanda.destino.nome} para avaliação.`, 'Sistema');
    this._salvar();
    return demanda;
  }

  /* ------------------------------------------- E2: avaliação (Cooperativa) */

  /* RF-008: a cooperativa avalia só as demandas endereçadas a ela. */
  aceitar(id: string, opcoes: { cooperativaId: string; por?: string }): TDemanda {
    const demanda = this._exigir(id, 'DISPONIVEL');
    const coop = this._cooperativaDaDemanda(demanda, opcoes.cooperativaId);
    demanda.status = 'ACEITA';
    this._registrar(demanda, 'Demanda aceita',
      `${coop.nome} avaliou e consegue atender.`, opcoes.por || coop.nome);
    this._salvar();
    return demanda;
  }

  /* RF-008, RN-008: não aceitar sinaliza no cadastro do GGR a necessidade de
     mais equipamento da cooperativa (sinal calculado a partir de `naoAceites`). */
  naoAceitar(id: string, opcoes: { cooperativaId: string; motivo: string; por?: string }): TDemanda {
    const demanda = this._exigir(id, 'DISPONIVEL');
    const coop = this._cooperativaDaDemanda(demanda, opcoes.cooperativaId);
    const motivo = (opcoes.motivo || '').trim();
    if (!motivo) throw new Error('Informe por que a cooperativa não consegue atender.');
    const quando = new Date().toISOString();
    demanda.status = 'NAO_ACEITA';
    demanda.naoAceites = [...demanda.naoAceites, { cooperativa: coop.id, motivo, quando }];
    this._registrar(demanda, 'Demanda não aceita',
      `${coop.nome} não consegue atender: ${motivo}. O cadastro do gerador passa a sinalizar ` +
      'necessidade de mais equipamento da cooperativa (RN-008).', opcoes.por || coop.nome);
    this._salvar();
    return demanda;
  }

  /* Nova avaliação depois de reforçar o equipamento (EST-001). */
  reavaliar(id: string, opcoes: { cooperativaId: string; por?: string }): TDemanda {
    const demanda = this._exigir(id, 'NAO_ACEITA');
    const coop = this._cooperativaDaDemanda(demanda, opcoes.cooperativaId);
    demanda.status = 'DISPONIVEL';
    this._registrar(demanda, 'Nova avaliação',
      `${coop.nome} reabriu a avaliação da demanda.`, opcoes.por || coop.nome);
    this._salvar();
    return demanda;
  }

  /* ------------------------------------ E3/E4: designação e coleta (Coop.) */

  /* RF-009: a cooperativa designa quem da equipe executa. A coleta passa a
     estar em execução (EST-001: Aceita → Em coleta). */
  designar(id: string, opcoes: { catadorId: string; cooperativaId: string; por?: string }): TDemanda {
    const demanda = this._exigir(id, 'ACEITA');
    const coop = this._cooperativaDaDemanda(demanda, opcoes.cooperativaId);
    const catador = Catalogo.catador(opcoes.catadorId);
    if (!catador) throw new Error('Cooperado não encontrado: ' + opcoes.catadorId);
    if (catador.cooperativa !== coop.id) {
      throw new Error(`${catador.nome} não é cooperado da ${coop.nome}. Cada cooperativa designa apenas a própria equipe.`);
    }
    if (catador.desligamento) throw new Error(`${catador.nome} foi desligado da equipe.`);

    demanda.status = 'EM_COLETA';
    demanda.catador = { id: catador.id, nome: catador.nome, cooperativa: coop.id };
    this._registrar(demanda, 'Cooperado designado',
      `${coop.nome} designou ${catador.nome} para executar a coleta em ${Catalogo.endereco(demanda.ponto)}.`,
      opcoes.por || coop.nome);
    this._salvar();
    return demanda;
  }

  /* RF-012: massa observada na coleta. É gravada uma vez e não muda (RN-023). */
  registrarPeso(id: string, kg: number, canalId: string = 'compartilhado'): TDemanda {
    const demanda = this._exigir(id, 'EM_COLETA');
    if (demanda.coletadoKg != null) {
      throw new Error('A massa observada já foi registrada e não pode ser alterada (RN-023).');
    }
    if (!(kg > 0)) throw new Error('Informe a massa observada, maior que zero.');
    const canal = CANAIS[canalId] || CANAIS.compartilhado;
    demanda.coletadoKg = kg;
    demanda.canalRegistro = canal.nome;
    this._registrar(demanda, 'Peso registrado',
      `${Fmt.kg(kg)} observados na coleta · declarado pelo gerador: ${Fmt.litros(demanda.declaradoL)}. ` +
      `Registro por ${canal.nome.toLowerCase()}${demanda.catador ? ', executado por ' + demanda.catador.nome : ''}.`,
      this._autorCooperativa(demanda, canal.digitadoPor));
    this._salvar();
    return demanda;
  }

  anexarFoto(id: string, imagem: string): TDemanda {
    const demanda = this._exigir(id, 'EM_COLETA');
    demanda.foto = imagem;
    this._registrar(demanda, 'Registro fotográfico anexado', 'Evidência da carga vinculada à demanda.',
      this._autorCooperativa(demanda));
    this._salvar();
    return demanda;
  }

  /* RF-011: toda coleta registra responsável e horário (RN-010). */
  finalizarColeta(id: string): TDemanda {
    const demanda = this._exigir(id, 'EM_COLETA');
    if (demanda.coletadoKg == null) throw new Error('Registre a massa observada antes de fechar a carga.');
    demanda.status = 'EM_TRANSPORTE';
    this._registrar(demanda, 'Carga em transporte',
      `${Fmt.kg(demanda.coletadoKg)} coletados por ${demanda.catador?.nome || 'cooperado'} a caminho de ${demanda.destino.nome}.`,
      this._autorCooperativa(demanda));
    this._salvar();
    return demanda;
  }

  /* ------------------------- E5: recebimento e conciliação (Cooperativa) */

  /* RF-013: a cooperativa, como unidade receptora (RN-035), confirma o
     recebimento com a massa aferida (RN-011). O sistema compara as medições
     (RF-017) e comprova ou abre pendência de divergência (RF-018). */
  receber(id: string, opcoes: {
    kg: number; rejeitoKg?: number; destinoFinal?: string; nota?: string; lote?: string;
    balanca?: string; afericao?: string; tiquete?: string | null;
    qualidade?: QualidadeId; qualidadeObs?: string; conferente?: string;
    origemPesagem?: 'DIGITADA' | 'INSTRUMENTO'; leitura?: string | null;
  }): TDemanda {
    const { kg, destinoFinal, nota, lote } = opcoes;
    const demanda = this._exigir(id, 'EM_TRANSPORTE');
    if (!kg || kg <= 0) throw new Error('Informe a massa pesada na balança.');
    const rejeitoTotal = Catalogo.residuo(demanda.residuo)?.fluxo === 'REJEITO';
    const rejeitoKg = rejeitoTotal ? kg : (opcoes.rejeitoKg ?? 0);
    if (rejeitoKg < 0 || rejeitoKg > kg) throw new Error('O rejeito não pode ser maior que a massa recebida.');

    const quem = opcoes.conferente || demanda.destino.nome;
    demanda.verificadoKg = kg;
    demanda.rejeitoKg = rejeitoKg;
    demanda.destinoFinal = destinoFinal || Demanda.destinoFinal(demanda);
    demanda.recebidaEm = new Date().toISOString();
    demanda.lote = lote || this._novoLote(demanda);

    /* A evidência acompanha a pesagem e não é obrigatória: o sistema guarda o
       que existe e classifica a força da prova. */
    const balanca = (opcoes.balanca || '').trim();
    const afericao = (opcoes.afericao || '').trim();
    if (balanca || afericao || opcoes.tiquete || opcoes.origemPesagem === 'INSTRUMENTO') {
      demanda.pesagem = {
        balanca, afericao,
        tiquete: opcoes.tiquete || null,
        registradaEm: demanda.recebidaEm,
        origem: opcoes.origemPesagem || 'DIGITADA',
        leitura: opcoes.leitura || null
      };
    }

    /* Grau de separação com que a carga chegou; não altera a massa aferida. */
    if (opcoes.qualidade) {
      const faixa = Catalogo.qualidade(opcoes.qualidade);
      demanda.qualidade = {
        id: opcoes.qualidade,
        perda: faixa ? faixa.perda : 0,
        observacao: (opcoes.qualidadeObs || '').trim(),
        registradaPor: quem,
        registradaEm: demanda.recebidaEm
      };
    }

    this._registrar(demanda, 'Recebimento confirmado',
      `${Fmt.kg(kg)} pesados na balança de ${demanda.destino.nome} · lote ${demanda.lote}. ` +
      `Recuperado ${Fmt.kg(Demanda.reciclado(demanda))}, rejeito ${Fmt.kg(demanda.rejeitoKg)}. ` +
      `Destinação declarada: ${demanda.destinoFinal}. ` +
      `${demanda.qualidade ? `Separação na origem: ${(Catalogo.qualidade(demanda.qualidade.id)?.rotulo || '').toLowerCase()}. ` : ''}` +
      `${Demanda.forcaDaProva(demanda).motivo}${nota ? ' ' + nota : ''}`,
      quem);

    const divergencia = Demanda.divergencia(demanda);
    const toleranciaKg = Demanda.toleranciaKg(demanda);
    if (Demanda.dentroDaTolerancia(demanda)) {
      this._registrar(demanda, 'Conciliação',
        `Variação de ${Fmt.percentual(divergencia)} entre a massa observada e a aferida, dentro da tolerância de ${Fmt.kg(toleranciaKg)}.`,
        'Sistema');
      this._comprovar(demanda, divergencia);
    } else {
      demanda.status = 'PENDENCIA_DIVERGENCIA';
      demanda.pendencia = {
        estado: 'ABERTA', abertaEm: new Date().toISOString(), divergencia, toleranciaKg, decisoes: []
      };
      this._registrar(demanda, 'Pendência de divergência aberta',
        `Variação de ${Fmt.percentual(divergencia)} entre a massa observada e a aferida, acima da tolerância de ` +
        `${Fmt.kg(toleranciaKg)}. As medições originais ficam intactas; a decisão é da Prefeitura.`,
        'Sistema');
    }
    this._salvar();
    return demanda;
  }

  /* RF-019, RN-024, RN-025: a Prefeitura (subperfil Técnico) decide a
     pendência. A decisão é um evento com justificativa; nenhuma medição muda. */
  decidirPendencia(id: string, opcoes: { resultado: 'LIBERADA' | 'MANTIDA'; justificativa: string; por: string }): TDemanda {
    const demanda = this._exigir(id, 'PENDENCIA_DIVERGENCIA');
    if (!demanda.pendencia || demanda.pendencia.estado !== 'ABERTA') {
      throw new Error('Esta pendência já foi decidida.');
    }
    const justificativa = (opcoes.justificativa || '').trim();
    if (!justificativa) throw new Error('A decisão exige justificativa (RN-024).');

    const quando = new Date().toISOString();
    demanda.pendencia = {
      ...demanda.pendencia,
      estado: opcoes.resultado,
      decisoes: [...demanda.pendencia.decisoes, { resultado: opcoes.resultado, justificativa, autor: opcoes.por, quando }]
    };
    if (opcoes.resultado === 'LIBERADA') {
      this._registrar(demanda, 'Divergência liberada',
        `${justificativa} As três medições permanecem como registradas.`, opcoes.por);
      this._comprovar(demanda, Demanda.divergencia(demanda));
    } else {
      this._registrar(demanda, 'Divergência mantida',
        `${justificativa} A carga não é liberada. O desfecho de uma divergência mantida segue pendente de definição na doc.`,
        opcoes.por);
    }
    this._salvar();
    return demanda;
  }

  /* ---------------------------------------- Pendência de execução (RN-041) */

  /* Coleta aceita ou em execução com o prazo vencido vira pendência de
     execução, constatada pelo sistema na data do prazo (EST-001). */
  verificarPrazos(agora: Date = new Date()): number {
    let mudou = 0;
    for (const demanda of this.demandas) {
      if (!['ACEITA', 'EM_COLETA'].includes(demanda.status)) continue;
      const prazo = new Date(demanda.prazo);
      if (prazo.getTime() >= agora.getTime()) continue;
      const constatadaEm = prazo.toISOString();
      demanda.status = 'PENDENCIA_EXECUCAO';
      demanda.execucao = {
        constatadaEm,
        prazoJustificativa: new Date(prazo.getTime() + JANELA_EXECUCAO_HORAS * HORA).toISOString(),
        justificativa: null
      };
      this._registrar(demanda, 'Pendência de execução',
        `Prazo de ${Fmt.data(demanda.prazo)} vencido sem coleta. A cooperativa tem ${JANELA_EXECUCAO_HORAS} horas ` +
        'para justificar e remarcar.', 'Sistema', constatadaEm);
      mudou += 1;
    }
    if (mudou) { this._gravar(); this.notificar(); }
    return mudou;
  }

  /* RF-031: dentro de 96 h, a cooperativa justifica e remarca. A demanda volta
     a Aceita com a nova data e é designada de novo. */
  remarcar(id: string, opcoes: { justificativa: string; novoPrazo: string; por: string; agora?: Date }): TDemanda {
    const demanda = this._exigir(id, 'PENDENCIA_EXECUCAO');
    const agora = opcoes.agora || new Date();
    if (!Demanda.dentroDaJanelaDeExecucao(demanda, agora)) {
      throw new Error(`A janela de ${JANELA_EXECUCAO_HORAS} horas para justificar já passou. ` +
        'O encaminhamento depois desse prazo segue pendente de definição na doc (RN-034).');
    }
    const justificativa = (opcoes.justificativa || '').trim();
    if (!justificativa) throw new Error('Informe a justificativa da coleta não executada.');
    const novo = new Date(opcoes.novoPrazo);
    if (Number.isNaN(novo.getTime()) || novo.getTime() <= agora.getTime()) {
      throw new Error('A nova data precisa ser futura.');
    }

    demanda.execucao = { ...demanda.execucao!, justificativa };
    demanda.prazo = novo.toISOString();
    demanda.status = 'ACEITA';
    demanda.catador = null;
    this._registrar(demanda, 'Coleta remarcada',
      `Justificativa: ${justificativa}. Nova data: ${Fmt.data(demanda.prazo)}.`, opcoes.por);
    this._salvar();
    return demanda;
  }

  /* ---------------------------------------------------------- ocorrências */

  /* Registra o que impediu ou atrapalhou a coleta; não muda o estado. */
  registrarOcorrencia(id: string, opcoes: { tipo: TipoOcorrencia; nota: string; por: string }): TDemanda {
    const demanda = this._obrigatoria(id);
    const nota = (opcoes.nota || '').trim();
    if (!nota) throw new Error('Descreva a ocorrência.');
    const ocorrencia: Ocorrencia = {
      tipo: opcoes.tipo, nota, quando: new Date().toISOString(), registradaPor: opcoes.por
    };
    demanda.ocorrencias = [...(demanda.ocorrencias || []), ocorrencia];
    this._registrar(demanda, `Ocorrência: ${ROTULO_OCORRENCIA[opcoes.tipo]}`, nota, opcoes.por);
    this._salvar();
    return demanda;
  }

  /* --------------------------------------------- E6: documentos (Gerador) */

  /* RF-020: o Gerador emite o MTR no SINIR e o vincula aqui, com a origem. */
  registrarMtr(id: string, opcoes: { numero: string; emitidoEm?: string; registradoPor?: string }): TDemanda {
    const demanda = this._obrigatoria(id);
    if (!exigeMtr(demanda)) {
      throw new Error('O MTR é vinculado depois do recebimento confirmado e sem pendência aberta.');
    }
    const numero = String(opcoes.numero || '').trim();
    if (numero.length < 4) throw new Error(`Informe o número do MTR emitido em ${PORTAL_MTR}.`);
    if (demanda.mtr) throw new Error(`Esta carga já tem o MTR ${demanda.mtr.numero} vinculado.`);

    const registradoPor = opcoes.registradoPor || 'Gerador';
    const agora = new Date().toISOString();
    demanda.mtr = {
      numero, fonte: 'SINIR', emitidoEm: opcoes.emitidoEm || agora, consultadoEm: agora, registradoPor, cdf: null
    };
    this._registrar(demanda, 'MTR registrado',
      `Manifesto ${numero} emitido no SINIR em ${Fmt.data(demanda.mtr.emitidoEm)} e vinculado a esta carga ` +
      `em ${Fmt.dataHora(agora)}.`, registradoPor);
    this._salvar();
    return demanda;
  }

  /* O CDF fecha o manifesto do lado de quem recebeu. */
  registrarCdf(id: string, opcoes: { numero: string; registradoPor?: string }): TDemanda {
    const demanda = this._obrigatoria(id);
    if (!demanda.mtr) throw new Error('Registre primeiro o número do MTR desta carga.');
    if (demanda.mtr.cdf) throw new Error(`Esta carga já tem o CDF ${demanda.mtr.cdf.numero} registrado.`);
    const numero = String(opcoes.numero || '').trim();
    if (numero.length < 4) throw new Error('Informe o número do Certificado de Destinação Final.');

    const registradoPor = opcoes.registradoPor || demanda.destino.nome;
    demanda.mtr.cdf = { numero, emitidoEm: new Date().toISOString(), registradoPor };
    this._registrar(demanda, 'CDF registrado',
      `Certificado de Destinação Final ${numero} vinculado ao manifesto ${demanda.mtr.numero}.`, registradoPor);
    this._salvar();
    return demanda;
  }

  /* -------------------------------------------------------------- apoio */

  private _comprovar(demanda: TDemanda, divergencia: number | null) {
    demanda.status = 'COMPROVADA';
    demanda.comprovante = {
      codigo: 'CMP-' + demanda.id.replace('DEM-', ''),
      emitidoEm: new Date().toISOString(),
      divergencia
    };
    this._registrar(demanda, 'Comprovante emitido',
      `${demanda.comprovante.codigo} · variação final de ${Fmt.percentual(divergencia)}.`, 'Sistema');
  }

  /* A cooperativa só avalia e executa o que foi endereçado ao galpão dela. */
  private _cooperativaDaDemanda(demanda: TDemanda, cooperativaId: string) {
    const coop = Catalogo.cooperativa(cooperativaId);
    if (!coop) throw new Error('Cooperativa não encontrada: ' + cooperativaId);
    if (Catalogo.destino(demanda.destino.id)?.cooperativa !== coop.id) {
      throw new Error(`Esta demanda está endereçada a ${demanda.destino.nome}, não à ${coop.nome}.`);
    }
    return coop;
  }

  private _autorCooperativa(demanda: TDemanda, digitadoPor?: string | null): string {
    const coop = Catalogo.cooperativa(Catalogo.destino(demanda.destino.id)?.cooperativa);
    return [coop?.nome || demanda.destino.nome, digitadoPor].filter(Boolean).join(' · ');
  }

  private _novoId(): string {
    this.sequencia += 1;
    return 'DEM-' + String(this.sequencia).padStart(4, '0');
  }

  private _novoLote(demanda: TDemanda): string {
    const dia = new Date();
    return 'LT-' + String(dia.getFullYear()).slice(2) + String(dia.getMonth() + 1).padStart(2, '0') +
      String(dia.getDate()).padStart(2, '0') + '-' + demanda.id.replace('DEM-', '');
  }

  private _obrigatoria(id: string): TDemanda {
    const demanda = this.obter(id);
    if (!demanda) throw new Error('Demanda não encontrada: ' + id);
    return demanda;
  }

  private _exigir(id: string, status: StatusId): TDemanda {
    const demanda = this._obrigatoria(id);
    if (demanda.status !== status) {
      throw new Error(`Ação indisponível: a demanda está ${STATUS[demanda.status].rotulo.toLowerCase()}.`);
    }
    return demanda;
  }

  private _registrar(demanda: TDemanda, titulo: string, detalhe: string, autor: string, quando?: string) {
    demanda.eventos.push({ quando: quando || new Date().toISOString(), titulo, detalhe, autor });
  }

  private _salvar() {
    this._gravar();
    this.notificar();
  }

  private _ler(): { demandas: TDemanda[]; sequencia: number } | null {
    if (typeof localStorage === 'undefined') return null;
    try {
      const bruto = localStorage.getItem(CHAVE_ARMAZENAMENTO);
      if (!bruto) return null;
      const dados = JSON.parse(bruto);
      return Array.isArray(dados.demandas) ? dados : null;
    } catch {
      return null;
    }
  }

  private _gravar() {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(CHAVE_ARMAZENAMENTO, JSON.stringify({
        demandas: this.demandas,
        sequencia: this.sequencia
      }));
    } catch {
      /* Sem armazenamento local a demonstração continua, apenas não persiste. */
    }
  }
}

export const Store = new ArmazemDemandas();
