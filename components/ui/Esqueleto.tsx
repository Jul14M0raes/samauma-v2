/* SAMAÚMA — estado de carregamento.
   Antes desta peça, toda tela esperava o domínio ficar pronto com um
   `return null`: a página piscava em branco até os dados chegarem. Aqui fica
   a moldura que ocupa esse instante — a mesma forma da tela final, sem os
   números — para o layout não saltar quando o conteúdo chega. */

export function Esqueleto({ variante = 'app' }: { variante?: 'app' | 'publico' }) {
  if (variante === 'publico') {
    return (
      <div className="esqueleto-publico" role="status" aria-label="Carregando">
        <span className="esqueleto-pulso" />
      </div>
    );
  }
  return (
    <div className="esqueleto-app" role="status" aria-label="Carregando">
      <div className="esqueleto-topo">
        <span className="esqueleto-pulso" style={{ width: 40, height: 40, borderRadius: '50%' }} />
        <span className="esqueleto-pulso" style={{ width: 220, height: 14 }} />
      </div>
      <div className="esqueleto-corpo">
        <span className="esqueleto-pulso" style={{ width: '35%', height: 26 }} />
        <div className="esqueleto-kpis">
          <span className="esqueleto-pulso" /><span className="esqueleto-pulso" />
          <span className="esqueleto-pulso" /><span className="esqueleto-pulso" />
        </div>
        <span className="esqueleto-pulso" style={{ height: 180 }} />
      </div>
    </div>
  );
}
