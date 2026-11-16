/* SAMAÚMA — canal por onde a cooperativa registra a coleta em campo
   (aparelho da equipe, terminal do galpão ou registro assistido). A escolha
   vale para a rota, não para a pessoa. */

type Ouvinte = () => void;

class CanalDeRegistro {
  atual = 'compartilhado';
  private ouvintes = new Set<Ouvinte>();
  private instantaneo = { atual: this.atual };

  subscribe = (ouvinte: Ouvinte): (() => void) => {
    this.ouvintes.add(ouvinte);
    return () => this.ouvintes.delete(ouvinte);
  };

  getSnapshot = () => this.instantaneo;

  escolher(id: string) {
    this.atual = id;
    this.instantaneo = { atual: id };
    this.ouvintes.forEach(o => o());
  }
}

export const CanalRegistro = new CanalDeRegistro();
