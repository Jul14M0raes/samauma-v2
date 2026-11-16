/* SAMAÚMA — preferências de acessibilidade.
   Tamanho de texto e contraste variam por site inteiro (todo o CSS usa px
   fixo, não rem), então "aumentar fonte" de verdade aqui é zoom de página —
   a mesma técnica do Ctrl-+ do navegador, só que persistida e sem depender
   do usuário achar o atalho. Fica no aparelho de quem usa (localStorage),
   não é dado do sistema. */

export const CHAVE_ACESSIBILIDADE = 'samauma.next.acessibilidade.v1';

export type TamanhoInterface = 'padrao' | 'grande' | 'maior';
export type Tema = 'claro' | 'escuro';

interface DadosAcessibilidade {
  tamanho: TamanhoInterface;
  movimentoReduzido: boolean;
  altoContraste: boolean;
  tema: Tema;
}

const ESCALA: Record<TamanhoInterface, string> = { padrao: '1', grande: '1.15', maior: '1.3' };

const PADRAO: DadosAcessibilidade = { tamanho: 'padrao', movimentoReduzido: false, altoContraste: false, tema: 'claro' };

type Ouvinte = () => void;

class EstadoAcessibilidade {
  tamanho: TamanhoInterface = PADRAO.tamanho;
  movimentoReduzido = PADRAO.movimentoReduzido;
  altoContraste = PADRAO.altoContraste;
  tema: Tema = PADRAO.tema;
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
    this._aplicar();
    this._gravar();
  }

  iniciar(): this {
    const salvo = this._ler();
    if (salvo) Object.assign(this, salvo);
    this._aplicar();
    return this;
  }

  definirTamanho(tamanho: TamanhoInterface) { this.tamanho = tamanho; this.notificar(); }
  definirMovimentoReduzido(v: boolean) { this.movimentoReduzido = v; this.notificar(); }
  definirAltoContraste(v: boolean) { this.altoContraste = v; this.notificar(); }
  definirTema(tema: Tema) { this.tema = tema; this.notificar(); }

  restaurar() {
    Object.assign(this, PADRAO);
    this.notificar();
  }

  private _aplicar() {
    if (typeof document === 'undefined') return;
    const raiz = document.documentElement;
    raiz.style.setProperty('--escala-interface', ESCALA[this.tamanho]);
    raiz.toggleAttribute('data-movimento-reduzido', this.movimentoReduzido);
    raiz.toggleAttribute('data-alto-contraste', this.altoContraste);
    if (this.tema === 'escuro') raiz.setAttribute('data-tema', 'escuro');
    else raiz.removeAttribute('data-tema');
  }

  private _ler(): DadosAcessibilidade | null {
    if (typeof localStorage === 'undefined') return null;
    try {
      const bruto = localStorage.getItem(CHAVE_ACESSIBILIDADE);
      if (!bruto) return null;
      const dados = JSON.parse(bruto);
      return dados && typeof dados === 'object' ? { ...PADRAO, ...dados } : null;
    } catch {
      return null;
    }
  }

  private _gravar() {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(CHAVE_ACESSIBILIDADE, JSON.stringify({
        tamanho: this.tamanho,
        movimentoReduzido: this.movimentoReduzido,
        altoContraste: this.altoContraste,
        tema: this.tema
      }));
    } catch {
      /* Sem armazenamento local a preferência só não sobrevive à próxima visita. */
    }
  }
}

export const Acessibilidade = new EstadoAcessibilidade();
