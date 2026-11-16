/* SAMAÚMA — parâmetros do município (RF-004).
   Decisões da Administração, não verdades do sistema: tolerância de
   conciliação, antecedência do alerta do PGRS, tarifa de aterro e preços de
   referência. Ficam persistidos e cada alteração vira registro com valor
   anterior, novo valor, autor e data (RN-026, RNF-001). Mexer no parâmetro não
   muda a regra que o usa, só o limiar. */

import { ANTECEDENCIA_PGRS_DIAS, RESIDUOS, TARIFA_ATERRO, TOLERANCIA, TOLERANCIA_MINIMA_KG } from './catalogo';

type Ouvinte = () => void;

export interface ValoresParametros {
  tolerancia: number;
  toleranciaMinimaKg: number;
  antecedenciaPgrsDias: number;
  tarifaAterro: number;
  precos: Record<string, number>;
}

export type IdParametro = 'tolerancia' | 'toleranciaMinimaKg' | 'antecedenciaPgrsDias' | 'tarifaAterro';

export interface DefinicaoParametro {
  id: IdParametro;
  rotulo: string;
  unidade: string;
  minimo: number;
  maximo: number;
  passo: number;
  efeito: string;
}

export interface AlteracaoParametro {
  parametro: string;
  anterior: number;
  novo: number;
  por: string;
  quando: string;
}

export const DEFINICOES: DefinicaoParametro[] = [
  {
    id: 'tolerancia', rotulo: 'Tolerância de conciliação', unidade: '%',
    minimo: 1, maximo: 25, passo: 0.5,
    efeito: 'Variação aceita entre a massa observada na coleta e a aferida na balança. Abaixo dela a carga é conciliada; acima, abre pendência para decisão da Prefeitura (RN-021, RN-022).'
  },
  {
    id: 'toleranciaMinimaKg', rotulo: 'Piso da tolerância', unidade: 'kg',
    minimo: 1, maximo: 100, passo: 1,
    efeito: 'Margem absoluta para cargas pequenas, em que um percentual sozinho abriria pendência por diferença menor que a precisão da balança.'
  },
  {
    id: 'antecedenciaPgrsDias', rotulo: 'Antecedência do alerta do PGRS', unidade: 'dias',
    minimo: 1, maximo: 180, passo: 1,
    efeito: 'Quantos dias antes do vencimento do PGRS a situação do estabelecimento passa a "A renovar" (RN-033, decisão D-05).'
  },
  {
    id: 'tarifaAterro', rotulo: 'Tarifa de aterro', unidade: 'R$/t',
    minimo: 10, maximo: 500, passo: 0.5,
    efeito: 'Custo evitado por tonelada desviada do aterro. Entra apenas no indicador de economia.'
  }
];

const ORIGEM: ValoresParametros = {
  tolerancia: TOLERANCIA * 100,
  toleranciaMinimaKg: TOLERANCIA_MINIMA_KG,
  antecedenciaPgrsDias: ANTECEDENCIA_PGRS_DIAS,
  tarifaAterro: TARIFA_ATERRO,
  precos: Object.fromEntries(RESIDUOS.map(r => [r.id, r.preco]))
};

const CHAVE = 'samauma.next.parametros.v1';

class ParametrosDoMunicipio {
  private valores: ValoresParametros = this._copiaDaOrigem();
  private historico: AlteracaoParametro[] = [];
  private carregado = false;
  private ouvintes = new Set<Ouvinte>();
  private instantaneo: ValoresParametros = this.valores;

  private _copiaDaOrigem(): ValoresParametros {
    return { ...ORIGEM, precos: { ...ORIGEM.precos } };
  }

  subscribe = (ouvinte: Ouvinte): (() => void) => {
    this.ouvintes.add(ouvinte);
    return () => this.ouvintes.delete(ouvinte);
  };

  getSnapshot = () => { this._carregar(); return this.instantaneo; };

  private _carregar() {
    if (this.carregado) return;
    this.carregado = true;
    if (typeof localStorage === 'undefined') return;
    try {
      const bruto = localStorage.getItem(CHAVE);
      if (!bruto) return;
      const salvo = JSON.parse(bruto);
      this.valores = { ...this._copiaDaOrigem(), ...salvo.valores, precos: { ...ORIGEM.precos, ...(salvo.valores?.precos || {}) } };
      this.historico = Array.isArray(salvo.historico) ? salvo.historico : [];
      this.instantaneo = { ...this.valores, precos: { ...this.valores.precos } };
    } catch { /* segue com os valores de origem */ }
  }

  private _publicar() {
    this.instantaneo = { ...this.valores, precos: { ...this.valores.precos } };
    if (typeof localStorage !== 'undefined') {
      try { localStorage.setItem(CHAVE, JSON.stringify({ valores: this.valores, historico: this.historico })); }
      catch { /* sem armazenamento, vale para esta sessão */ }
    }
    this.ouvintes.forEach(o => o());
  }

  /* Tolerância guardada em percentual, como o gestor pensa; a regra usa fração. */
  get toleranciaFracao(): number { this._carregar(); return this.valores.tolerancia / 100; }
  get toleranciaMinimaKg(): number { this._carregar(); return this.valores.toleranciaMinimaKg; }
  get antecedenciaPgrsDias(): number { this._carregar(); return this.valores.antecedenciaPgrsDias; }
  get tarifaAterro(): number { this._carregar(); return this.valores.tarifaAterro; }

  preco(residuo: string): number {
    this._carregar();
    return this.valores.precos[residuo] ?? ORIGEM.precos[residuo] ?? 0;
  }

  atual(): ValoresParametros { this._carregar(); return this.instantaneo; }
  origem(): ValoresParametros { return ORIGEM; }
  alteracoes(): AlteracaoParametro[] { this._carregar(); return this.historico.slice().reverse(); }

  alterado(id: IdParametro): boolean {
    this._carregar();
    return this.valores[id] !== ORIGEM[id];
  }

  precoAlterado(residuo: string): boolean {
    this._carregar();
    return this.valores.precos[residuo] !== ORIGEM.precos[residuo];
  }

  definir(id: IdParametro, valor: number, por = 'Prefeitura · Técnico') {
    this._carregar();
    const definicao = DEFINICOES.find(d => d.id === id);
    if (!definicao) throw new Error('Parâmetro desconhecido: ' + id);
    if (!Number.isFinite(valor)) throw new Error('Informe um número.');
    if (valor < definicao.minimo || valor > definicao.maximo) {
      throw new Error(`${definicao.rotulo} deve ficar entre ${definicao.minimo} e ${definicao.maximo} ${definicao.unidade}.`);
    }
    if (this.valores[id] === valor) return;
    this.historico.push({ parametro: definicao.rotulo, anterior: this.valores[id], novo: valor, por, quando: new Date().toISOString() });
    this.valores[id] = valor;
    this._publicar();
  }

  definirPreco(residuo: string, valor: number, por = 'Prefeitura · Técnico') {
    this._carregar();
    if (!Number.isFinite(valor) || valor < 0) throw new Error('O preço não pode ser negativo.');
    if (valor > 100) throw new Error('Preço acima de R$ 100,00 por quilo: confira o valor.');
    const anterior = this.preco(residuo);
    if (anterior === valor) return;
    this.historico.push({ parametro: `Preço de ${residuo}`, anterior, novo: valor, por, quando: new Date().toISOString() });
    this.valores.precos[residuo] = valor;
    this._publicar();
  }

  /* Volta aos valores de origem; a volta também fica registrada. */
  restaurar(por = 'Prefeitura · Técnico') {
    this._carregar();
    const quando = new Date().toISOString();
    for (const d of DEFINICOES) {
      if (this.valores[d.id] !== ORIGEM[d.id]) {
        this.historico.push({ parametro: d.rotulo, anterior: this.valores[d.id], novo: ORIGEM[d.id], por, quando });
      }
    }
    this.valores = this._copiaDaOrigem();
    this._publicar();
  }

  /* Só para reiniciar a demonstração: apaga valores e histórico. */
  reiniciar() {
    this.valores = this._copiaDaOrigem();
    this.historico = [];
    this.carregado = true;
    this._publicar();
  }
}

export const Parametros = new ParametrosDoMunicipio();
