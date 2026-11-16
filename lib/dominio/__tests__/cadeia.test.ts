/* A pergunta que este arquivo responde não é "cada função funciona", e sim
   "a cadeia inteira fecha sem vazar".

   Um sistema de rastreabilidade quebra de um jeito específico e traiçoeiro: cada
   operação passa no seu teste, e mesmo assim a massa somada no painel não bate
   com a massa dos comprovantes, ou uma demanda fora de curso continua contando
   numa fila, ou um parâmetro muda o passado. Nada disso aparece testando a peça
   isolada — só olhando o ecossistema.

   Os invariantes verificados aqui:
     1. O ciclo feliz vai do cadastro ao comprovante sem estado órfão.
     2. Demanda comprovada ou não aceita sai das filas de trabalho.
     3. Massa comprovada = soma dos comprovantes, sempre.
     4. A cooperativa não aceitar não pune o gerador.
     5. Parâmetro muda o futuro, não o que já foi comprovado.
     6. Nenhuma operação apaga trilha. */

import { beforeEach, describe, expect, it } from 'vitest';
import { EM_CURSO, GERADORES } from '../catalogo';
import { DemandaRegras as Demanda } from '../demanda';
import { Painel } from '../indicadores';
import { achadosDoGerador } from '../notificacao';
import { Parametros } from '../parametros';
import { Regulatorio } from '../regulatorio';
import { Store } from '../store';
import { aceitar, ciclo, coletar, cooperativaDe, designar } from './apoio';

const HORA = 3600000;
const disponivel = () => Store.disponiveis().find(d => d.residuo !== 'rejeito')!;

/* Leva uma demanda do início ao comprovante, exercitando cada transição. */
function cicloCompleto(): string {
  const d = disponivel();
  ciclo(d, 500, 500, {
    kg: 500, balanca: 'Toledo 2098', afericao: 'INMETRO 2026/114',
    tiquete: 'data:image/png;base64,AAAA'
  });
  return d.id;
}

const naoAceitar = (id: string) =>
  Store.naoAceitar(id, { cooperativaId: cooperativaDe(id), motivo: 'sem caminhão disponível' });

describe('a cadeia fecha do começo ao fim', () => {
  beforeEach(() => { Store.reiniciar(); Parametros.restaurar(); });

  it('percorre todas as transições e emite comprovante', () => {
    const id = cicloCompleto();
    const d = Store.obter(id)!;
    expect(d.status).toBe('COMPROVADA');
    expect(d.comprovante).toBeTruthy();
    expect(d.verificadoKg).toBe(500);
    /* Cada transição deixou rastro: sem isso não há o que auditar. */
    expect(d.eventos.length).toBeGreaterThanOrEqual(6);
  });

  it('não deixa a demanda comprovada em nenhuma fila de trabalho', () => {
    const id = cicloCompleto();
    expect(Store.disponiveis().some(x => x.id === id)).toBe(false);
    expect(Store.pendentes().some(x => x.id === id)).toBe(false);
    expect(Store.aCaminhoDe(Store.obter(id)!.destino.id).some(x => x.id === id)).toBe(false);
  });

  it('a próxima ação de cada estado aponta para um perfil que existe', () => {
    const perfis = ['gerador', 'cooperativa', 'prefeitura', null];
    for (const d of Store.todas()) {
      expect(perfis).toContain(Demanda.proximaAcao(d).perfil);
      expect(Demanda.proximaAcao(d).texto.length).toBeGreaterThan(0);
    }
  });
});

describe('demanda não aceita sai das filas de trabalho', () => {
  beforeEach(() => { Store.reiniciar(); Parametros.restaurar(); });

  /* O erro clássico: tirar de uma lista e esquecer de outra. */
  it('não aparece em nenhum seletor de trabalho', () => {
    const d = disponivel();
    naoAceitar(d.id);
    const alvo = (lista: { id: string }[]) => lista.some(x => x.id === d.id);

    expect(alvo(Store.disponiveis())).toBe(false);
    expect(alvo(Store.pendentes())).toBe(false);
    expect(alvo(Store.comprovantes(Store.todas()))).toBe(false);
    expect(EM_CURSO.includes(Store.obter(d.id)!.status)).toBe(false);
  });
});

describe('a massa fecha em qualquer estado do sistema', () => {
  beforeEach(() => { Store.reiniciar(); Parametros.restaurar(); });

  /* Invariante central: o número do painel tem de ser a soma dos comprovantes.
     Se divergir, o sistema perdeu a razão de existir. */
  const conferirMassa = () => {
    const comprovadas = Store.comprovantes(Store.todas());
    const somaDireta = comprovadas.reduce((s, d) => s + (d.verificadoKg || 0), 0);
    expect(Painel.municipio().ambiental.massa).toBeCloseTo(somaDireta, 5);
  };

  it('fecha na semente', () => conferirMassa());

  it('continua fechando depois de um ciclo completo', () => {
    cicloCompleto();
    conferirMassa();
  });

  it('continua fechando depois de não aceite, pendência e prazo vencido', () => {
    naoAceitar(disponivel().id);
    ciclo(disponivel(), 500, 300);
    const aceita = disponivel();
    aceitar(aceita);
    Store.verificarPrazos(new Date(new Date(aceita.prazo).getTime() + HORA));
    conferirMassa();
  });

  it('carga em pendência não soma massa em lugar nenhum', () => {
    const antes = Painel.municipio().ambiental.massa;
    ciclo(disponivel(), 500, 300);
    expect(Painel.municipio().ambiental.massa).toBe(antes);
  });
});

describe('não aceitar não pune o gerador', () => {
  beforeEach(() => { Store.reiniciar(); Parametros.restaurar(); });

  /* A falta de capacidade é da cooperativa (RN-008): o gerador declarou. */
  it('não cria achado de infração contra o gerador', () => {
    const alvo = disponivel();
    const gerador = GERADORES.find(g => g.id === alvo.gerador.id)!;
    const antes = achadosDoGerador(gerador, Store.doGerador(gerador.id)).length;
    naoAceitar(alvo.id);
    expect(achadosDoGerador(gerador, Store.doGerador(gerador.id)).length).toBeLessThanOrEqual(antes);
  });

  it('a situação regulatória do gerador não piora', () => {
    const alvo = disponivel();
    const gerador = GERADORES.find(g => g.id === alvo.gerador.id)!;
    const antes = Regulatorio.situacao(gerador, Store.doGerador(gerador.id)).ordem;
    naoAceitar(alvo.id);
    expect(Regulatorio.situacao(gerador, Store.doGerador(gerador.id)).ordem).toBe(antes);
  });
});

describe('parâmetro muda o futuro, não o passado', () => {
  beforeEach(() => { Store.reiniciar(); Parametros.restaurar(); });

  it('apertar a tolerância não reabre comprovante já emitido', () => {
    const id = cicloCompleto();
    expect(Store.obter(id)!.status).toBe('COMPROVADA');
    Parametros.definir('tolerancia', 1);
    expect(Store.obter(id)!.status).toBe('COMPROVADA');
    expect(Store.obter(id)!.comprovante).toBeTruthy();
  });

  it('apertar a tolerância muda o que ainda vai ser recebido', () => {
    Parametros.definir('tolerancia', 25);
    expect(ciclo(disponivel(), 1000, 1150).status).toBe('COMPROVADA');

    Store.reiniciar();
    Parametros.definir('tolerancia', 2);
    expect(ciclo(disponivel(), 1000, 1150).status).toBe('PENDENCIA_DIVERGENCIA');
  });

  it('mudar o preço não altera a massa nem a recuperação', () => {
    const antes = Painel.municipio().ambiental;
    Parametros.definirPreco('papelao', 9.99);
    const depois = Painel.municipio().ambiental;
    expect(depois.massa).toBe(antes.massa);
    expect(depois.reciclado).toBe(antes.reciclado);
    expect(depois.taxaRecuperacao).toBe(antes.taxaRecuperacao);
  });

  it('mudar o preço altera o valor apurado, que é o que ele governa', () => {
    const antes = Painel.municipio().financeiro.valor;
    Parametros.definirPreco('papelao', 9.99);
    expect(Painel.municipio().financeiro.valor).toBeGreaterThan(antes);
  });

  it('restaurar devolve exatamente os valores de origem', () => {
    Parametros.definir('tolerancia', 17);
    Parametros.definirPreco('metal', 1);
    Parametros.restaurar();
    expect(Parametros.atual()).toEqual(Parametros.origem());
  });
});

describe('nenhuma operação apaga trilha', () => {
  beforeEach(() => { Store.reiniciar(); Parametros.restaurar(); });

  it('a trilha só cresce, em todo o percurso, inclusive nas saídas de erro', () => {
    const d = disponivel();
    let anterior = Store.obter(d.id)!.eventos.length;
    const cresceu = () => {
      const agora = Store.obter(d.id)!.eventos.length;
      expect(agora).toBeGreaterThan(anterior);
      anterior = agora;
    };

    naoAceitar(d.id); cresceu();
    Store.reavaliar(d.id, { cooperativaId: cooperativaDe(d.id) }); cresceu();
    aceitar(d); cresceu();
    Store.registrarOcorrencia(d.id, { tipo: 'ACESSO', nota: 'rua interditada', por: 'Equipe' }); cresceu();
    Store.verificarPrazos(new Date(new Date(d.prazo).getTime() + HORA)); cresceu();
    const constatada = new Date(Store.obter(d.id)!.execucao!.constatadaEm).getTime();
    const agora = new Date(constatada + HORA);
    Store.remarcar(d.id, {
      justificativa: 'rua interditada', novoPrazo: new Date(agora.getTime() + 24 * HORA).toISOString(), por: 'Coop', agora
    }); cresceu();
    designar(d); cresceu();
    coletar(d, 300); cresceu();
    Store.receber(d.id, { kg: 200 }); cresceu();
    Store.decidirPendencia(d.id, { resultado: 'LIBERADA', justificativa: 'umidade', por: 'Técnico' }); cresceu();

    /* A ocorrência sobreviveu à remarcação: o que impediu a coleta continua
       registrado mesmo depois de a demanda voltar para a fila. */
    expect(Store.obter(d.id)!.ocorrencias).toHaveLength(1);
  });

  it('todo evento tem autor e horário legível', () => {
    for (const d of Store.todas()) {
      for (const e of d.eventos) {
        expect(e.autor).toBeTruthy();
        expect(Number.isNaN(new Date(e.quando).getTime())).toBe(false);
      }
    }
  });
});
