/* Duas coisas que decidem se o sistema se defende numa auditoria: a massa do
   destino ter evidência do instrumento que a produziu, e a Secretaria conseguir
   sair da tela com um documento na mão.

   Os testes aqui cobrem as duas, e cobrem também o que o sistema se recusa a
   fazer: nunca bloquear a pesagem por falta de tíquete, e nunca emitir peça que
   pareça ato administrativo pronto. */

import { beforeEach, describe, expect, it } from 'vitest';
import { GERADORES } from '../catalogo';
import { DemandaRegras as Demanda } from '../demanda';
import {
  achadosDoGerador, dossieDoGerador, filaDeFiscalizacao,
  minutaDeNotificacao, PRAZO_REGULARIZACAO
} from '../notificacao';
import { Regulatorio } from '../regulatorio';
import { Store } from '../store';
import { coletar } from './apoio';

describe('evidência da pesagem', () => {
  beforeEach(() => { Store.reiniciar(); });

  /* Carga nova a caminho; observada de 500 kg casa com a balança dos testes. */
  const aCaminho = (kg = 500) => coletar(Store.disponiveis().find(d => d.residuo !== 'rejeito')!, kg);

  it('classifica como declarada quando só há o número digitado', () => {
    const d = aCaminho();
    Store.receber(d.id, { kg: 500 });
    const forca = Demanda.forcaDaProva(Store.obter(d.id)!);
    expect(forca.id).toBe('DECLARADA');
    expect(forca.motivo).toMatch(/digitada sem identificação/i);
  });

  it('classifica como comprovada com balança, aferição e tíquete', () => {
    const d = aCaminho();
    Store.receber(d.id, {
      kg: 500, balanca: 'Toledo 2098', afericao: 'INMETRO 2026/114',
      tiquete: 'data:image/png;base64,AAAA'
    });
    const forca = Demanda.forcaDaProva(Store.obter(d.id)!);
    expect(forca.id).toBe('MEDIDA');
    expect(forca.motivo).toContain('Toledo 2098');
  });

  it('classifica como parcial e diz o que falta', () => {
    const d = aCaminho();
    Store.receber(d.id, { kg: 500, balanca: 'Toledo 2098' });
    const forca = Demanda.forcaDaProva(Store.obter(d.id)!);
    expect(forca.id).toBe('PARCIAL');
    expect(forca.motivo).toMatch(/registro de aferição/);
    expect(forca.motivo).toMatch(/tíquete/);
  });

  it('nunca bloqueia o recebimento por falta de evidência', () => {
    /* Exigir tíquete travaria a unidade que ainda não tem balança com
       impressora — o sistema classifica, não impede. */
    const d = aCaminho();
    expect(() => Store.receber(d.id, { kg: 500 })).not.toThrow();
    expect(Store.obter(d.id)!.verificadoKg).toBe(500);
  });

  it('a força da prova entra na trilha do recebimento', () => {
    const d = aCaminho();
    Store.receber(d.id, { kg: 500, balanca: 'Filizola 3000', afericao: 'INMETRO 2026/22', tiquete: 'data:image/png;base64,AA' });
    const evento = Store.obter(d.id)!.eventos.find(e => e.titulo === 'Recebimento confirmado')!;
    expect(evento.detalhe).toContain('Filizola 3000');
  });

  it('a fila de auditoria mostra o que não se sustenta sozinho', () => {
    const antes = Store.semEvidenciaDePesagem().length;
    const d = aCaminho();
    Store.receber(d.id, { kg: 500 });
    expect(Store.semEvidenciaDePesagem().length).toBe(antes + 1);

    const outra = aCaminho(400);
    Store.receber(outra.id, { kg: 400, balanca: 'B', afericao: 'A', tiquete: 'data:image/png;base64,AA' });
    expect(Store.semEvidenciaDePesagem().length).toBe(antes + 1);
  });

  it('sem pesagem não é o mesmo que prova frágil', () => {
    const disponivel = Store.disponiveis()[0];
    expect(Demanda.forcaDaProva(disponivel).id).toBe('SEM_PESAGEM');
    expect(Store.semEvidenciaDePesagem().some(d => d.id === disponivel.id)).toBe(false);
  });
});

describe('minuta de notificação', () => {
  beforeEach(() => { Store.reiniciar(); });

  const irregular = () => {
    const achado = GERADORES.find(g => achadosDoGerador(g, Store.doGerador(g.id)).length > 0);
    return achado!;
  };

  it('cada achado vem com fundamentação e detalhe', () => {
    const g = irregular();
    const minuta = minutaDeNotificacao(g, Store.doGerador(g.id));
    expect(minuta.achados.length).toBeGreaterThan(0);
    for (const a of minuta.achados) {
      expect(a.titulo.length).toBeGreaterThan(5);
      expect(a.detalhe.length).toBeGreaterThan(15);
      expect(a.fundamento.norma).toMatch(/Lei|Decreto/);
      expect(a.fundamento.dispositivo.length).toBeGreaterThan(3);
    }
  });

  it('não cita norma que não tem a ver com o achado', () => {
    /* Notificação que despeja seis leis para um PGRS vencido é notificação que
       o advogado do gerador derruba por excesso. */
    const comPgrsBom = GERADORES.find(g => (Regulatorio.pgrs(g)?.dias ?? 0) > 90);
    if (!comPgrsBom) return;
    const achados = achadosDoGerador(comPgrsBom, Store.doGerador(comPgrsBom.id));
    expect(achados.some(a => a.titulo.includes('PGRS'))).toBe(false);
  });

  it('o prazo tem vencimento calculado', () => {
    const g = irregular();
    const minuta = minutaDeNotificacao(g, Store.doGerador(g.id));
    expect(minuta.prazo).toBe(PRAZO_REGULARIZACAO);
    const dias = Math.round(
      (new Date(minuta.vencimentoEm).getTime() - new Date(minuta.emitidaEm).getTime()) / 86400000);
    expect(dias).toBe(PRAZO_REGULARIZACAO);
  });

  it('gerador sem pendência não gera achado', () => {
    const regular = GERADORES.find(g => achadosDoGerador(g, Store.doGerador(g.id)).length === 0);
    if (!regular) return;
    expect(minutaDeNotificacao(regular, Store.doGerador(regular.id)).achados).toHaveLength(0);
  });

  it('gerador regular nunca recebe imputação', () => {
    /* Esta é a implicação que importa juridicamente, e ela vale só num sentido:
       se a ficha diz regular, a minuta não pode acusar nada. */
    for (const g of GERADORES) {
      const minuta = minutaDeNotificacao(g, Store.doGerador(g.id));
      if (minuta.situacao.id === 'REGULAR') {
        expect(minuta.achados, `${g.nome} está regular e não pode ter achado`).toHaveLength(0);
      }
    }
  });

  it('nem todo motivo de "em regularização" é infração do gerador', () => {
    /* A volta não vale, e é proposital. Demanda publicada que ninguém coletou
       rebaixa a situação — mas a conclusão depende da rede de coleta, não do
       estabelecimento. Vira informação no dossiê, nunca imputação na minuta. */
    const comAtraso = GERADORES.find(g => {
      const dem = Store.doGerador(g.id);
      return dem.some(d => ['DISPONIVEL', 'ACEITA', 'EM_COLETA'].includes(d.status) && Demanda.atrasada(d));
    });
    if (!comAtraso) return;

    const minuta = minutaDeNotificacao(comAtraso, Store.doGerador(comAtraso.id));
    expect(minuta.situacao.id).not.toBe('REGULAR');
    expect(minuta.achados.some(a => a.titulo.includes('não coletadas'))).toBe(false);
    expect(minuta.solicitacoes.some(a => a.titulo.includes('não coletadas'))).toBe(true);
  });

  it('rascunho parado com prazo vencido é omissão do gerador, e vira achado', () => {
    const comRascunho = GERADORES.find(g =>
      Store.doGerador(g.id).some(d => d.status === 'CRIADA' && Demanda.atrasada(d)));
    if (!comRascunho) return;
    const minuta = minutaDeNotificacao(comRascunho, Store.doGerador(comRascunho.id));
    expect(minuta.achados.some(a => a.titulo.includes('rascunho'))).toBe(true);
  });

  it('o MTR não informado é pedido, não acusação', () => {
    /* A emissão é no SINIR: ausência do número aqui não prova ausência de
       manifesto, prova que este sistema não foi informado. */
    const g = GERADORES.find(x =>
      Store.doGerador(x.id).some(d => ['COLETADA', 'PENDENCIA', 'COMPROVADA'].includes(d.status) && !d.mtr))!;
    const minuta = minutaDeNotificacao(g, Store.doGerador(g.id));
    expect(minuta.achados.some(a => a.titulo.includes('MTR'))).toBe(false);
    expect(minuta.solicitacoes.some(a => a.titulo.includes('MTR'))).toBe(true);
    expect(minuta.solicitacoes.find(a => a.titulo.includes('MTR'))!.detalhe)
      .toMatch(/pode ter sido emitido/i);
  });
});

describe('dossiê do gerador', () => {
  beforeEach(() => { Store.reiniciar(); });

  it('lista todas as cargas e fecha os totais', () => {
    const g = GERADORES[0];
    const demandas = Store.doGerador(g.id);
    const dossie = dossieDoGerador(g, demandas);

    expect(dossie.linhas).toHaveLength(demandas.length);
    expect(dossie.totais.cargas).toBe(demandas.length);
    expect(dossie.totais.comprovadas).toBe(demandas.filter(d => d.status === 'COMPROVADA').length);
    expect(dossie.totais.massa).toBe(
      demandas.filter(d => d.status === 'COMPROVADA').reduce((s, d) => s + (d.verificadoKg || 0), 0));
  });

  it('distingue massa da balança de massa de campo', () => {
    const g = GERADORES[0];
    const dossie = dossieDoGerador(g, Store.doGerador(g.id));
    const deCampo = dossie.linhas.filter(l => l.massa.includes('campo'));
    for (const l of deCampo) expect(l.demanda.verificadoKg).toBeNull();
  });

  it('conta separadamente o que tem medição comprovada', () => {
    const g = GERADORES[0];
    const antes = dossieDoGerador(g, Store.doGerador(g.id)).totais.comTiquete;
    const aberta = Store.doGerador(g.id).find(d => d.status === 'DISPONIVEL');
    if (!aberta) return;
    const aCaminho = coletar(aberta, 300);
    Store.receber(aCaminho.id, { kg: 300, balanca: 'X', afericao: 'Y', tiquete: 'data:image/png;base64,AA' });
    expect(dossieDoGerador(g, Store.doGerador(g.id)).totais.comTiquete).toBe(antes + 1);
  });
});

describe('fila de fiscalização', () => {
  beforeEach(() => { Store.reiniciar(); });

  it('traz só quem tem achado, do mais grave para o menos', () => {
    const fila = filaDeFiscalizacao(GERADORES.map(g => ({ gerador: g, demandas: Store.doGerador(g.id) })));
    expect(fila.length).toBeGreaterThan(0);
    for (const item of fila) expect(item.achados.length).toBeGreaterThan(0);
    for (let i = 1; i < fila.length; i++) {
      expect(fila[i - 1].situacao.ordem).toBeLessThanOrEqual(fila[i].situacao.ordem);
    }
  });
});
