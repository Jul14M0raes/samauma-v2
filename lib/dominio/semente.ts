/* SAMAÚMA — dados demonstrativos.
   Histórico plausível para que todo perfil abra o sistema com o que acompanhar:
   a Prefeitura com indicadores, a cooperativa com fila e o gerador com situação
   regulatória. Inclui o que costuma ser escondido: parte relevante da massa vai
   para o aterro, como rejeito indiferenciado ou perda de triagem. */

import { Catalogo, GERADORES, unidadeDaCooperativa } from './catalogo';
import { DemandaRegras as Demanda } from './demanda';
import { dataRelativa, Fmt, sorteador } from './formato';
import type { Demanda as TDemanda, QualidadeId, StatusId } from './tipos';

interface ConfigDemanda {
  criadaEm: number;
  prazoEm: number;
  geradorIndice: number;
  residuo: string;
  /** Massa de referência da carga; o volume declarado sai dela pela densidade. */
  kg: number;
  catadorIndice?: number;
  divergente?: boolean;
  observacao?: string;
  ate?: StatusId;
}

/* Cooperados por índice da semente. */
const EQUIPE = ['cat-01', 'cat-02', 'cat-03', 'cat-04', 'cat-01', 'cat-06', 'cat-07',
  'cat-08', 'cat-09', 'cat-10', 'cat-11', 'cat-12', 'cat-13'];

export const Semente = {
  gerar(): { demandas: TDemanda[]; sequencia: number } {
    const sortear = sorteador(20260815);
    const demandas: TDemanda[] = [];
    let sequencia = 0;

    const registrar = (demanda: TDemanda, titulo: string, detalhe: string, autor: string, quando: string) => {
      demanda.eventos.push({ quando, titulo, detalhe, autor });
    };

    const nova = (config: ConfigDemanda): TDemanda => {
      sequencia += 1;
      const gerador = GERADORES[config.geradorIndice];
      const ponto = Catalogo.ponto(gerador.ponto)!;
      const catador = config.catadorIndice != null ? Catalogo.catador(EQUIPE[config.catadorIndice]) : null;
      const unidade = unidadeDaCooperativa(catador ? catador.cooperativa : gerador.operador);
      const residuo = Catalogo.residuo(config.residuo)!;
      const demanda: TDemanda = {
        id: 'DEM-' + String(sequencia).padStart(4, '0'),
        gerador: { id: gerador.id, nome: gerador.nome },
        origem: sequencia % 3 === 0 ? 'AVULSA' : 'CONTRATO',
        residuo: config.residuo,
        declaradoL: Math.round(config.kg / residuo.densidade / 10) * 10,
        ponto: ponto.id,
        bairro: ponto.bairro,
        zona: ponto.zona,
        km: gerador.km,
        prazo: dataRelativa(config.prazoEm, 17),
        observacao: config.observacao || '',
        status: 'CRIADA',
        catador: null,
        destino: { id: unidade.id, nome: unidade.nome },
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
        criadaEm: dataRelativa(config.criadaEm, 8, 30),
        eventos: []
      };
      demandas.push(demanda);
      return demanda;
    };

    const avancar = (demanda: TDemanda, ate: StatusId, config: ConfigDemanda) => {
      const dia = config.criadaEm;
      const agora = new Date().toISOString();
      const marca = (h: number, m: number) => {
        const quando = dataRelativa(dia, h, m);
        return dia === 0 && quando > agora ? agora : quando;
      };
      const coop = Catalogo.cooperativa(Catalogo.destino(demanda.destino.id)!.cooperativa)!;

      registrar(demanda, 'Demanda criada',
        `${demanda.gerador.nome} declarou ${Fmt.litros(demanda.declaradoL)} de ${Catalogo.nomeResiduo(demanda.residuo)}.`,
        'Gerador', marca(8, 30));
      if (ate === 'CRIADA') return;

      demanda.status = 'DISPONIVEL';
      registrar(demanda, 'Demanda disponível', `Encaminhada a ${demanda.destino.nome} para avaliação.`, 'Sistema', marca(8, 32));
      if (ate === 'DISPONIVEL') return;

      if (ate === 'NAO_ACEITA') {
        const motivo = 'Caminhão da rota em manutenção; sem capacidade para o volume declarado.';
        demanda.status = 'NAO_ACEITA';
        demanda.naoAceites = [{ cooperativa: coop.id, motivo, quando: marca(9, 0) }];
        registrar(demanda, 'Demanda não aceita', `${coop.nome} não consegue atender: ${motivo}`, coop.nome, marca(9, 0));
        return;
      }

      demanda.status = 'ACEITA';
      registrar(demanda, 'Demanda aceita', `${coop.nome} avaliou e consegue atender.`, coop.nome, marca(9, 5));
      if (ate === 'ACEITA') return;

      const catador = Catalogo.catador(EQUIPE[config.catadorIndice!])!;
      demanda.catador = { id: catador.id, nome: catador.nome, cooperativa: catador.cooperativa };
      demanda.status = 'EM_COLETA';
      registrar(demanda, 'Cooperado designado',
        `${coop.nome} designou ${catador.nome} para executar a coleta em ${Catalogo.endereco(demanda.ponto)}.`,
        coop.nome, marca(9, 10));
      if (ate === 'EM_COLETA') return;

      const kgObservado = Math.round(config.kg * (0.94 + sortear(0, 0.08)));
      demanda.coletadoKg = kgObservado;
      registrar(demanda, 'Peso registrado',
        `${Fmt.kg(kgObservado)} observados na coleta · declarado pelo gerador: ${Fmt.litros(demanda.declaradoL)}.`,
        coop.nome, marca(14, 5));
      demanda.foto = 'demonstrativa';
      registrar(demanda, 'Registro fotográfico anexado', 'Evidência da carga vinculada à demanda.', coop.nome, marca(14, 7));
      demanda.status = 'EM_TRANSPORTE';
      registrar(demanda, 'Carga em transporte',
        `${Fmt.kg(kgObservado)} coletados por ${catador.nome} a caminho de ${demanda.destino.nome}.`, coop.nome, marca(14, 40));
      if (ate === 'EM_TRANSPORTE') return;

      const desvio = config.divergente ? 0.055 + sortear(0, 0.03) : sortear(0, 0.028);
      demanda.verificadoKg = Math.round(kgObservado * (1 - desvio));
      const residuo = Catalogo.residuo(demanda.residuo)!;
      const rejeitoTotal = residuo.fluxo === 'REJEITO';
      /* Teto: rejeito nunca maior que a massa recebida. */
      demanda.rejeitoKg = rejeitoTotal
        ? demanda.verificadoKg
        : Math.min(demanda.verificadoKg,
            Math.round(demanda.verificadoKg * residuo.perdaTriagem * (0.7 + sortear(0, 0.8))));
      demanda.destinoFinal = Demanda.destinoFinal(demanda);
      demanda.recebidaEm = marca(15, 30);
      demanda.lote = 'LT-' + demanda.id.replace('DEM-', '') + '-' + String(Math.abs(dia)).padStart(2, '0');

      /* A demonstração precisa dos três graus de separação na origem. */
      if (!rejeitoTotal) {
        const sorte = sortear(0, 1);
        const grau: QualidadeId = sorte > 0.72 ? 'CONTAMINADO' : sorte > 0.38 ? 'MISTURADO' : 'LIMPO';
        demanda.qualidade = {
          id: grau,
          perda: Catalogo.qualidade(grau)!.perda,
          observacao: grau === 'CONTAMINADO' ? 'Resto de alimento junto ao material seco.' : '',
          registradaPor: demanda.destino.nome,
          registradaEm: demanda.recebidaEm
        };
      }

      registrar(demanda, 'Recebimento confirmado',
        `${Fmt.kg(demanda.verificadoKg)} pesados na balança de ${demanda.destino.nome} · lote ${demanda.lote}. ` +
        `Recuperado ${Fmt.kg(Demanda.reciclado(demanda))}, rejeito ${Fmt.kg(demanda.rejeitoKg)}. ` +
        `Destinação declarada: ${demanda.destinoFinal}.`,
        demanda.destino.nome, marca(15, 30));

      const divergencia = Demanda.divergencia(demanda);
      if (config.divergente) {
        demanda.status = 'PENDENCIA_DIVERGENCIA';
        demanda.pendencia = {
          estado: 'ABERTA', abertaEm: marca(15, 31), divergencia,
          toleranciaKg: Demanda.toleranciaKg(demanda), decisoes: []
        };
        registrar(demanda, 'Pendência de divergência aberta',
          `Variação de ${Fmt.percentual(divergencia)} entre a massa observada e a aferida, acima da tolerância. ` +
          'As medições originais ficam intactas; a decisão é da Prefeitura.', 'Sistema', marca(15, 31));
        if (ate === 'PENDENCIA_DIVERGENCIA') return;

        const justificativa = 'Tíquete de balança conferido pela fiscalização; perda de umidade no transporte.';
        demanda.pendencia = {
          ...demanda.pendencia, estado: 'LIBERADA',
          decisoes: [{ resultado: 'LIBERADA', justificativa, autor: 'SEMA · Técnico', quando: marca(16, 10) }]
        };
        registrar(demanda, 'Divergência liberada', `${justificativa} As três medições permanecem como registradas.`,
          'SEMA · Técnico', marca(16, 10));
      } else {
        registrar(demanda, 'Conciliação',
          `Variação de ${Fmt.percentual(divergencia)} entre a massa observada e a aferida, dentro da tolerância.`,
          'Sistema', marca(15, 31));
      }

      demanda.status = 'COMPROVADA';
      demanda.comprovante = {
        codigo: 'CMP-' + demanda.id.replace('DEM-', ''),
        emitidoEm: marca(16, 20),
        divergencia
      };
      registrar(demanda, 'Comprovante emitido',
        `${demanda.comprovante.codigo} · variação final de ${Fmt.percentual(divergencia)}.`, 'Sistema', marca(16, 20));
    };

    const historico: ConfigDemanda[] = [
      { criadaEm: -12, geradorIndice: 1, residuo: 'papelao', kg: 640, catadorIndice: 1, prazoEm: 0 },
      { criadaEm: -12, geradorIndice: 3, residuo: 'rejeito', kg: 2400, catadorIndice: 2, prazoEm: 0 },
      { criadaEm: -11, geradorIndice: 4, residuo: 'oleo', kg: 120, catadorIndice: 4, prazoEm: 0 },
      { criadaEm: -11, geradorIndice: 3, residuo: 'plastico', kg: 380, catadorIndice: 0, prazoEm: 0 },
      { criadaEm: -10, geradorIndice: 6, residuo: 'papel', kg: 510, catadorIndice: 3, prazoEm: 0 },
      { criadaEm: -10, geradorIndice: 5, residuo: 'rejeito', kg: 1900, catadorIndice: 1, prazoEm: 0 },
      { criadaEm: -9, geradorIndice: 0, residuo: 'papelao', kg: 720, catadorIndice: 0, prazoEm: 0 },
      { criadaEm: -9, geradorIndice: 8, residuo: 'vidro', kg: 260, catadorIndice: 3, prazoEm: 0 },
      { criadaEm: -8, geradorIndice: 2, residuo: 'papel', kg: 340, catadorIndice: 1, divergente: true, prazoEm: 0 },
      { criadaEm: -8, geradorIndice: 0, residuo: 'rejeito', kg: 1600, catadorIndice: 2, prazoEm: 0 },
      { criadaEm: -7, geradorIndice: 5, residuo: 'papelao', kg: 980, catadorIndice: 3, prazoEm: 0 },
      { criadaEm: -7, geradorIndice: 9, residuo: 'metal', kg: 180, catadorIndice: 4, prazoEm: 0 },
      { criadaEm: -6, geradorIndice: 1, residuo: 'plastico', kg: 450, catadorIndice: 0, prazoEm: 0 },
      { criadaEm: -6, geradorIndice: 3, residuo: 'rejeito', kg: 2100, catadorIndice: 1, prazoEm: 0 },
      { criadaEm: -5, geradorIndice: 7, residuo: 'papel', kg: 290, catadorIndice: 2, prazoEm: 0 },
      { criadaEm: -5, geradorIndice: 3, residuo: 'papelao', kg: 830, catadorIndice: 1, prazoEm: 0 },
      { criadaEm: -4, geradorIndice: 4, residuo: 'oleo', kg: 95, catadorIndice: 4, prazoEm: 0 },
      { criadaEm: -4, geradorIndice: 0, residuo: 'plastico', kg: 410, catadorIndice: 0, prazoEm: 0 },
      { criadaEm: -3, geradorIndice: 6, residuo: 'papelao', kg: 560, catadorIndice: 3, divergente: true, prazoEm: 0 },
      { criadaEm: -3, geradorIndice: 8, residuo: 'vidro', kg: 310, catadorIndice: 2, prazoEm: 0 },
      { criadaEm: -3, geradorIndice: 5, residuo: 'rejeito', kg: 1750, catadorIndice: 1, prazoEm: 0 },
      { criadaEm: -2, geradorIndice: 2, residuo: 'papel', kg: 470, catadorIndice: 1, prazoEm: 0 },
      { criadaEm: -2, geradorIndice: 5, residuo: 'metal', kg: 240, catadorIndice: 4, prazoEm: 0 },
      { criadaEm: -1, geradorIndice: 9, residuo: 'papelao', kg: 700, catadorIndice: 0, prazoEm: 0 },
      { criadaEm: -1, geradorIndice: 7, residuo: 'plastico', kg: 360, catadorIndice: 3, prazoEm: 0 },
      { criadaEm: -1, geradorIndice: 0, residuo: 'papel', kg: 320, catadorIndice: 2, prazoEm: 0 },
      { criadaEm: 0, geradorIndice: 1, residuo: 'papelao', kg: 520, catadorIndice: 1, prazoEm: 0 },
      { criadaEm: 0, geradorIndice: 3, residuo: 'papel', kg: 280, catadorIndice: 3, prazoEm: 0 },
      { criadaEm: 0, geradorIndice: 0, residuo: 'metal', kg: 150, catadorIndice: 0, prazoEm: 0 },

      { criadaEm: -11, geradorIndice: 7, residuo: 'papelao', kg: 420, catadorIndice: 5, prazoEm: 0 },
      { criadaEm: -9, geradorIndice: 10, residuo: 'plastico', kg: 310, catadorIndice: 6, prazoEm: 0 },
      { criadaEm: -7, geradorIndice: 9, residuo: 'papel', kg: 260, catadorIndice: 5, prazoEm: 0 },
      { criadaEm: -4, geradorIndice: 7, residuo: 'metal', kg: 140, catadorIndice: 6, prazoEm: 0 },
      { criadaEm: -2, geradorIndice: 10, residuo: 'papelao', kg: 380, catadorIndice: 5, prazoEm: 0 },

      { criadaEm: -10, geradorIndice: 11, residuo: 'papel', kg: 230, catadorIndice: 7, prazoEm: 0 },
      { criadaEm: -6, geradorIndice: 8, residuo: 'vidro', kg: 190, catadorIndice: 8, prazoEm: 0 },
      { criadaEm: -3, geradorIndice: 11, residuo: 'plastico', kg: 250, catadorIndice: 7, prazoEm: 0 },

      { criadaEm: -8, geradorIndice: 6, residuo: 'papel', kg: 170, catadorIndice: 9, prazoEm: 0 },
      { criadaEm: -5, geradorIndice: 2, residuo: 'papelao', kg: 200, catadorIndice: 10, prazoEm: 0 },

      { criadaEm: -6, geradorIndice: 5, residuo: 'metal', kg: 90, catadorIndice: 11, prazoEm: 0 },
      { criadaEm: -2, geradorIndice: 4, residuo: 'oleo', kg: 60, catadorIndice: 12, prazoEm: 0 },

      /* Orgânico: a maior massa de supermercado e restaurante. */
      { criadaEm: -9, geradorIndice: 0, residuo: 'organico', kg: 2400, catadorIndice: 1, prazoEm: 0 },
      { criadaEm: -7, geradorIndice: 4, residuo: 'organico', kg: 1850, catadorIndice: 3, prazoEm: 0 },
      { criadaEm: -5, geradorIndice: 5, residuo: 'organico', kg: 3100, catadorIndice: 1, prazoEm: 0 },
      { criadaEm: -3, geradorIndice: 0, residuo: 'organico', kg: 2650, catadorIndice: 2, prazoEm: 0 },
      { criadaEm: -1, geradorIndice: 4, residuo: 'organico', kg: 1920, catadorIndice: 3, prazoEm: 0 }
    ];
    historico.forEach(config => avancar(nova({ ...config, prazoEm: config.criadaEm + 2 }), 'COMPROVADA', config));

    /* Em aberto com prazo futuro: nenhuma vira pendência de execução sozinha. */
    const emAberto: ConfigDemanda[] = [
      { criadaEm: -1, prazoEm: 1, geradorIndice: 5, residuo: 'papelao', kg: 1200, ate: 'EM_TRANSPORTE', catadorIndice: 3 },
      { criadaEm: 0, prazoEm: 1, geradorIndice: 1, residuo: 'plastico', kg: 540, ate: 'EM_TRANSPORTE', catadorIndice: 0 },
      { criadaEm: 0, prazoEm: 1, geradorIndice: 7, residuo: 'papel', kg: 380, ate: 'EM_TRANSPORTE', catadorIndice: 2 },
      { criadaEm: 0, prazoEm: 2, geradorIndice: 9, residuo: 'metal', kg: 210, ate: 'EM_TRANSPORTE', catadorIndice: 1 },
      { criadaEm: 0, prazoEm: 1, geradorIndice: 3, residuo: 'rejeito', kg: 2200, ate: 'EM_TRANSPORTE', catadorIndice: 2 },

      { criadaEm: -1, prazoEm: 1, geradorIndice: 2, residuo: 'plastico', kg: 320, ate: 'EM_COLETA', catadorIndice: 0 },
      { criadaEm: 0, prazoEm: 1, geradorIndice: 6, residuo: 'papelao', kg: 540, ate: 'EM_COLETA', catadorIndice: 3 },
      { criadaEm: 0, prazoEm: 1, geradorIndice: 8, residuo: 'papelao', kg: 430, ate: 'ACEITA' },
      { criadaEm: 0, prazoEm: 1, geradorIndice: 4, residuo: 'oleo', kg: 110, ate: 'ACEITA',
        observacao: 'Bombonas na área de serviço; falar com o gerente do salão.' },
      { criadaEm: 0, prazoEm: 2, geradorIndice: 6, residuo: 'papel', kg: 610, ate: 'ACEITA' },

      { criadaEm: 0, prazoEm: 1, geradorIndice: 0, residuo: 'organico', kg: 2800, ate: 'EM_TRANSPORTE', catadorIndice: 1 },
      { criadaEm: 0, prazoEm: 2, geradorIndice: 5, residuo: 'organico', kg: 2200, ate: 'DISPONIVEL' },
      { criadaEm: 0, prazoEm: 1, geradorIndice: 4, residuo: 'oleo', kg: 140, ate: 'DISPONIVEL' },
      { criadaEm: 0, prazoEm: 2, geradorIndice: 9, residuo: 'metal', kg: 220, ate: 'DISPONIVEL' },
      { criadaEm: 0, prazoEm: 3, geradorIndice: 7, residuo: 'vidro', kg: 350, ate: 'DISPONIVEL' },
      { criadaEm: 0, prazoEm: 2, geradorIndice: 5, residuo: 'rejeito', kg: 1800, ate: 'DISPONIVEL' },
      { criadaEm: 0, prazoEm: 1, geradorIndice: 3, residuo: 'plastico', kg: 480, ate: 'DISPONIVEL',
        observacao: 'Material segregado na doca de carga, acesso pela rua lateral.' },
      { criadaEm: -1, prazoEm: 2, geradorIndice: 1, residuo: 'organico', kg: 3600, ate: 'NAO_ACEITA' }
    ];
    emAberto.forEach(config => avancar(nova(config), config.ate!, config));

    /* Coleta aceita cujo prazo venceu ontem: vira pendência de execução ao
       carregar, com a janela de 96 h ainda aberta (RN-041). */
    const vencida: ConfigDemanda = { criadaEm: -2, prazoEm: -1, geradorIndice: 0, residuo: 'papelao', kg: 480, ate: 'ACEITA' };
    avancar(nova(vencida), 'ACEITA', vencida);

    const comPendencia: ConfigDemanda[] = [
      { criadaEm: -1, prazoEm: 1, geradorIndice: 5, residuo: 'papelao', kg: 800, catadorIndice: 3, divergente: true },
      { criadaEm: -2, prazoEm: 1, geradorIndice: 2, residuo: 'papel', kg: 390, catadorIndice: 1, divergente: true },
      { criadaEm: -2, prazoEm: 1, geradorIndice: 6, residuo: 'plastico', kg: 260, catadorIndice: 0, divergente: true }
    ];
    comPendencia.forEach(config => avancar(nova(config), 'PENDENCIA_DIVERGENCIA', config));

    const rascunho: ConfigDemanda = { criadaEm: 0, prazoEm: 2, geradorIndice: 0, residuo: 'plastico', kg: 300 };
    avancar(nova(rascunho), 'CRIADA', rascunho);

    return { demandas, sequencia };
  }
};
