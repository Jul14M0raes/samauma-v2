/* A carteira decide quem entra no galpão. Os testes abaixo cobrem as três
   coisas que, se quebrarem, quebram em silêncio: o dígito que valida o código
   digitado à mão, a situação que autoriza ou barra a passagem, e a trilha que
   precisa sobreviver a toda correção. */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  Carteiras, codigoDeVerificacao, digitoVerificador, numeroDoCodigo,
  situacaoDaCarteira, VALIDADE_MESES, type Carteira
} from '../carteira';
import { CATADORES } from '../catalogo';

function comValidade(base: Carteira, dias: number): Carteira {
  const validaAte = new Date(Date.now() + dias * 24 * 60 * 60 * 1000).toISOString();
  return { ...base, validaAte };
}

describe('carteira do catador', () => {
  beforeEach(() => {
    Carteiras.reiniciar();
  });

  describe('código de verificação', () => {
    it('gera dois caracteres estáveis para o mesmo número', () => {
      const digito = digitoVerificador('PVH-CAT-2026-0001');
      expect(digito).toHaveLength(2);
      expect(digitoVerificador('PVH-CAT-2026-0001')).toBe(digito);
    });

    it('não usa caracteres que se confundem à mão', () => {
      const numeros = Array.from({ length: 200 }, (_, i) => `PVH-CAT-2026-${String(i + 1).padStart(4, '0')}`);
      const usados = new Set(numeros.flatMap(n => digitoVerificador(n).split('')));
      for (const proibido of ['I', 'O', 'S', '0', '1', '5']) {
        expect(usados.has(proibido), `dígito não deveria usar ${proibido}`).toBe(false);
      }
    });

    it('separa números diferentes', () => {
      expect(digitoVerificador('PVH-CAT-2026-0001')).not.toBe(digitoVerificador('PVH-CAT-2026-0002'));
      expect(digitoVerificador('PVH-CAT-2026-0012')).not.toBe(digitoVerificador('PVH-CAT-2026-0021'));
    });

    it('aceita o código completo e devolve o número', () => {
      const codigo = codigoDeVerificacao('PVH-CAT-2026-0007');
      expect(numeroDoCodigo(codigo)).toBe('PVH-CAT-2026-0007');
      expect(numeroDoCodigo(codigo.toLowerCase())).toBe('PVH-CAT-2026-0007');
      expect(numeroDoCodigo(` ${codigo} `)).toBe('PVH-CAT-2026-0007');
    });

    it('recusa dígito trocado', () => {
      const codigo = codigoDeVerificacao('PVH-CAT-2026-0007');
      const errado = codigo.slice(0, -1) + (codigo.endsWith('Z') ? 'Y' : 'Z');
      expect(numeroDoCodigo(errado)).toBeNull();
    });

    it('recusa o que não tem formato de carteira', () => {
      expect(numeroDoCodigo('')).toBeNull();
      expect(numeroDoCodigo('DEM-0001')).toBeNull();
      expect(numeroDoCodigo('PVH-CAT-26-1')).toBeNull();
    });
  });

  describe('situação', () => {
    const base = () => Carteiras.todas()[0];

    it('autoriza quando está dentro da validade', () => {
      const situacao = situacaoDaCarteira(comValidade(base(), 400));
      expect(situacao.id).toBe('ATIVA');
      expect(situacao.liberada).toBe(true);
    });

    it('avisa do vencimento sem barrar a passagem', () => {
      const situacao = situacaoDaCarteira(comValidade(base(), 20));
      expect(situacao.id).toBe('A_VENCER');
      expect(situacao.liberada).toBe(true);
      expect(situacao.motivo).toMatch(/vence em/i);
    });

    it('barra quando a validade passou, e diz há quanto tempo', () => {
      const situacao = situacaoDaCarteira(comValidade(base(), -30));
      expect(situacao.id).toBe('VENCIDA');
      expect(situacao.liberada).toBe(false);
      expect(situacao.motivo).toMatch(/30 dia/);
    });

    it('a suspensão pesa mais que a validade', () => {
      const suspensa = { ...comValidade(base(), 400), estado: 'SUSPENSA' as const, motivoEstado: 'Apuração em curso.' };
      const situacao = situacaoDaCarteira(suspensa);
      expect(situacao.id).toBe('SUSPENSA');
      expect(situacao.liberada).toBe(false);
      expect(situacao.motivo).toBe('Apuração em curso.');
    });

    it('sempre devolve um motivo escrito', () => {
      for (const carteira of Carteiras.todas()) {
        expect(situacaoDaCarteira(carteira).motivo.length).toBeGreaterThan(10);
      }
    });
  });

  describe('semente', () => {
    it('emite uma carteira para cada catador do catálogo', () => {
      expect(Carteiras.todas()).toHaveLength(CATADORES.length);
      for (const catador of CATADORES) {
        expect(Carteiras.doCatador(catador.id), `carteira de ${catador.nome}`).not.toBeNull();
      }
    });

    it('cobre os quatro desfechos que a portaria enfrenta', () => {
      const situacoes = new Set(Carteiras.todas().map(c => situacaoDaCarteira(c).id));
      expect(situacoes).toContain('ATIVA');
      expect(situacoes).toContain('A_VENCER');
      expect(situacoes).toContain('VENCIDA');
      expect(situacoes).toContain('SUSPENSA');
    });

    it('guarda o vínculo de cada cooperado com a sua cooperativa', () => {
      for (const c of CATADORES) expect(Carteiras.doCatador(c.id)!.vinculo).toBe(c.cooperativa);
    });
  });

  describe('atos sobre a carteira', () => {
    it('renovar empurra a validade e reativa quem estava suspenso', () => {
      const carteira = Carteiras.todas().find(c => c.estado === 'SUSPENSA')!;
      Carteiras.renovar(carteira.numero, { autor: 'SEMA' });
      const depois = Carteiras.porNumero(carteira.numero)!;
      expect(depois.estado).toBe('ATIVA');
      expect(situacaoDaCarteira(depois).liberada).toBe(true);
      expect(situacaoDaCarteira(depois).diasParaVencer).toBeGreaterThan(VALIDADE_MESES * 28);
    });

    it('suspender exige motivo escrito', () => {
      const numero = Carteiras.todas()[0].numero;
      expect(() => Carteiras.suspender(numero, { autor: 'SEMA', motivo: '' })).toThrow(/motivo/i);
      expect(() => Carteiras.suspender(numero, { autor: 'SEMA', motivo: 'oi' })).toThrow(/motivo/i);
      Carteiras.suspender(numero, { autor: 'SEMA', motivo: 'Divergência em apuração.' });
      expect(situacaoDaCarteira(Carteiras.porNumero(numero)!).liberada).toBe(false);
    });

    it('segunda via mantém o número e invalida a anterior', () => {
      const original = Carteiras.doCatador('cat-01')!;
      const nova = Carteiras.emitir('cat-01', { emitidaPor: 'CATANORTE' });
      expect(nova.numero).toBe(original.numero);
      expect(nova.via).toBe(original.via + 1);
      expect(Carteiras.doCatador('cat-01')!.via).toBe(nova.via);
      const antigas = Carteiras.todas().filter(c => c.catadorId === 'cat-01' && c.via < nova.via);
      expect(antigas.every(c => c.estado === 'CANCELADA')).toBe(true);
    });

    it('nenhum ato apaga a trilha', () => {
      const numero = Carteiras.todas()[0].numero;
      const antes = Carteiras.porNumero(numero)!.eventos.length;
      Carteiras.suspender(numero, { autor: 'SEMA', motivo: 'Conferência de pesagem.' });
      Carteiras.reativar(numero, { autor: 'SEMA' });
      Carteiras.renovar(numero, { autor: 'SEMA' });
      const eventos = Carteiras.porNumero(numero)!.eventos;
      expect(eventos.length).toBe(antes + 3);
      expect(eventos.every(e => e.autor && e.quando && e.titulo)).toBe(true);
    });
  });

  describe('controle de fluxo', () => {
    const galpao = 'dst-01';

    it('a primeira leitura é entrada e a seguinte é saída', () => {
      const carteira = Carteiras.todas().find(c =>
        situacaoDaCarteira(c).liberada && Carteiras.presentes(galpao).every(p => p.carteira !== c.numero))!;
      const codigo = codigoDeVerificacao(carteira.numero);

      const entrada = Carteiras.registrarPassagem(codigo, { localId: galpao, registradoPor: 'Encarregado' });
      expect(entrada.tipo).toBe('ENTRADA');
      const saida = Carteiras.registrarPassagem(codigo, { localId: galpao, registradoPor: 'Encarregado', cargaKg: 240 });
      expect(saida.tipo).toBe('SAIDA');
      expect(saida.cargaKg).toBe(240);
    });

    it('barra a entrada de carteira que não autoriza', () => {
      const bloqueada = Carteiras.todas().find(c => !situacaoDaCarteira(c).liberada)!;
      expect(() => Carteiras.registrarPassagem(codigoDeVerificacao(bloqueada.numero),
        { localId: galpao, registradoPor: 'Encarregado', tipo: 'ENTRADA' })).toThrow(/não autorizada/i);
    });

    it('recusa código inválido e carteira inexistente', () => {
      expect(() => Carteiras.registrarPassagem('QUALQUER-COISA',
        { localId: galpao, registradoPor: 'Encarregado' })).toThrow(/inválido/i);
      expect(() => Carteiras.registrarPassagem(codigoDeVerificacao('PVH-CAT-2026-9999'),
        { localId: galpao, registradoPor: 'Encarregado' })).toThrow(/registro municipal/i);
    });

    it('guarda a situação do momento da leitura', () => {
      const carteira = Carteiras.todas().find(c => situacaoDaCarteira(c).id === 'A_VENCER')!;
      const passagem = Carteiras.registrarPassagem(codigoDeVerificacao(carteira.numero),
        { localId: galpao, registradoPor: 'Encarregado' });
      expect(passagem.situacaoNaLeitura).toBe('A_VENCER');

      Carteiras.renovar(carteira.numero, { autor: 'SEMA' });
      /* A carteira mudou; o que o porteiro viu, não. */
      expect(Carteiras.todasPassagens().find(p => p.id === passagem.id)!.situacaoNaLeitura).toBe('A_VENCER');
    });

    it('presentes lista só quem entrou e não saiu', () => {
      const presentesAntes = Carteiras.presentes(galpao).length;
      const carteira = Carteiras.todas().find(c =>
        situacaoDaCarteira(c).liberada && !Carteiras.presentes(galpao).some(p => p.carteira === c.numero))!;
      const codigo = codigoDeVerificacao(carteira.numero);

      Carteiras.registrarPassagem(codigo, { localId: galpao, registradoPor: 'Encarregado' });
      expect(Carteiras.presentes(galpao)).toHaveLength(presentesAntes + 1);

      Carteiras.registrarPassagem(codigo, { localId: galpao, registradoPor: 'Encarregado' });
      expect(Carteiras.presentes(galpao)).toHaveLength(presentesAntes);
    });

    it('duas leituras no mesmo milissegundo mantêm a ordem de entrada e saída', () => {
      /* Com o relógio parado, as duas passagens nascem com o mesmo horário —
         que é o que acontece na portaria quando o bipador dispara duas vezes
         seguidas. A ordem tem de vir do identificador, não do relógio. */
      /* O relógio para logo depois da última passagem semeada, e não numa data
         fixa: com data fixa o teste caía dentro da faixa de horários da
         semente dependendo da hora em que rodasse, e a leitura mais recente
         passava a ser a da semente em vez da criada aqui. */
      const ultimaSemeada = Math.max(...Carteiras.todasPassagens()
        .map(p => new Date(p.quando).getTime()));
      vi.useFakeTimers();
      vi.setSystemTime(new Date(ultimaSemeada + 60 * 60 * 1000));
      try {
        const presentesAntes = Carteiras.presentes(galpao).length;
        const carteira = Carteiras.todas().find(c =>
          situacaoDaCarteira(c).liberada && !Carteiras.presentes(galpao).some(p => p.carteira === c.numero))!;
        const codigo = codigoDeVerificacao(carteira.numero);

        const entrada = Carteiras.registrarPassagem(codigo, { localId: galpao, registradoPor: 'Encarregado' });
        const saida = Carteiras.registrarPassagem(codigo, { localId: galpao, registradoPor: 'Encarregado' });

        expect(entrada.quando).toBe(saida.quando);
        expect(entrada.tipo).toBe('ENTRADA');
        expect(saida.tipo).toBe('SAIDA');
        expect(Carteiras.ultimaPassagem(carteira.numero, galpao)!.id).toBe(saida.id);
        expect(Carteiras.presentes(galpao)).toHaveLength(presentesAntes);
      } finally {
        vi.useRealTimers();
      }
    });

    it('a presença é por local, não global', () => {
      const carteira = Carteiras.todas().find(c =>
        situacaoDaCarteira(c).liberada && !Carteiras.presentes(galpao).some(p => p.carteira === c.numero))!;
      const codigo = codigoDeVerificacao(carteira.numero);
      Carteiras.registrarPassagem(codigo, { localId: galpao, registradoPor: 'Encarregado' });
      const noPonto = Carteiras.registrarPassagem(codigo, { localId: 'pt-05', registradoPor: 'Portaria do gerador' });
      expect(noPonto.tipo).toBe('ENTRADA');
    });

    it('a leitura registra o local com nome e tipo', () => {
      const carteira = Carteiras.todas().find(c => situacaoDaCarteira(c).liberada)!;
      const passagem = Carteiras.registrarPassagem(codigoDeVerificacao(carteira.numero),
        { localId: 'pt-05', registradoPor: 'Portaria' });
      expect(passagem.local.id).toBe('pt-05');
      expect(passagem.local.tipo).toBe('Ponto de coleta');
      expect(passagem.local.nome).toMatch(/Centro/);
    });
  });

  describe('consulta pública', () => {
    it('encontra pela leitura do QR', () => {
      const carteira = Carteiras.todas()[0];
      const leitura = Carteiras.consultar(codigoDeVerificacao(carteira.numero));
      expect(leitura.encontrada).toBe(true);
      expect(leitura.catador).not.toBeNull();
      expect(leitura.situacao!.motivo.length).toBeGreaterThan(10);
    });

    it('explica o que houve quando não encontra', () => {
      expect(Carteiras.consultar('lixo').recado).toMatch(/inválido/i);
      expect(Carteiras.consultar(codigoDeVerificacao('PVH-CAT-2026-8888')).recado).toMatch(/registro municipal/i);
    });
  });
});
