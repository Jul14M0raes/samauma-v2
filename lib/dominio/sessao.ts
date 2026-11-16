/* SAMAÚMA — quem está usando o sistema agora: o perfil (RN-040) e, dentro
   dele, qual gerador ou qual cooperativa. A cooperativa é identificada pelo
   galpão, que é a sua unidade receptora (RN-035). */

import { Catalogo, DESTINOS, GERADOR_SESSAO } from './catalogo';
import type { Cooperativa, Destino, Gerador, Perfil } from './tipos';

type Ouvinte = () => void;

/* O perfil escolhido na demonstração sobrevive a recarregar a aba; sem isso a
   primeira rota aberta depois do reload tomaria o perfil e furaria o guarda. */
const CHAVE_PERFIL = 'samauma.next.perfil';

function lerPerfil(): Perfil | null {
  try { return (sessionStorage.getItem(CHAVE_PERFIL) as Perfil | null) || null; } catch { return null; }
}

class EstadoSessao {
  perfil: Perfil | null = lerPerfil();
  gerador: string = GERADOR_SESSAO;
  destino: Destino = DESTINOS[0];
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

  definirPerfil(perfil: Perfil | null) {
    this.perfil = perfil;
    try {
      if (perfil) sessionStorage.setItem(CHAVE_PERFIL, perfil);
      else sessionStorage.removeItem(CHAVE_PERFIL);
    } catch { /* sem storage, vale só nesta página */ }
    this.notificar();
  }

  entrarComoGerador(id: string): string {
    const gerador = Catalogo.gerador(id);
    if (gerador) this.gerador = gerador.id;
    this.notificar();
    return this.gerador;
  }

  entrarComoDestino(id: string): Destino {
    this.destino = Catalogo.destino(id) || DESTINOS[0];
    this.notificar();
    return this.destino;
  }

  get cadastroGerador(): Gerador | null { return Catalogo.gerador(this.gerador); }
  get cooperativa(): Cooperativa | null { return Catalogo.cooperativa(this.destino.cooperativa); }

  /* Nome de quem assina as ações da sessão na trilha. */
  get autor(): string {
    switch (this.perfil) {
      case 'gerador': return this.cadastroGerador?.nome || 'Gerador';
      case 'cooperativa': return this.cooperativa?.nome || this.destino.nome;
      case 'prefeitura': return 'SEMA · Técnico';
      case 'gestao': return 'SEMA · Painel de gestão';
      default: return 'Sistema';
    }
  }
}

export const Sessao = new EstadoSessao();
