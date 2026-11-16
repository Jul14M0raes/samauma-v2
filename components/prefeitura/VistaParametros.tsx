'use client';

/* Parâmetros de trabalho do município.

   A pergunta silenciosa de todo comprador público é "vou depender do fornecedor
   para tudo?". Enquanto tolerância, tarifa e preços viviam como constante no
   código, a resposta era sim. Esta tela responde não.

   Cada parâmetro mostra o valor de origem ao lado do vigente, para que qualquer
   alteração seja comparável ao ponto de partida — e diz o que a mudança
   provoca, porque girar um número sem saber o efeito é pior que não poder
   girar. */

import { useState, useSyncExternalStore } from 'react';

import { Aviso, Cabecalho, Cartao, Pares } from '@/components/ui/Basicos';
import { useRecado } from '@/components/layout/RecadoProvider';
import { RESIDUOS } from '@/lib/dominio/catalogo';
import { Fmt } from '@/lib/dominio/formato';
import { DEFINICOES, Parametros, type IdParametro } from '@/lib/dominio/parametros';
import { Painel } from '@/lib/dominio/indicadores';
import { Store } from '@/lib/dominio/store';
import { DemandaRegras as Demanda } from '@/lib/dominio/demanda';
import { Configuracao } from '@/lib/dados/parametros';

export function VistaParametros() {
  useSyncExternalStore(Parametros.subscribe, Parametros.getSnapshot, Parametros.getSnapshot);
  const recado = useRecado();
  const [rascunho, setRascunho] = useState<Record<string, string>>({});

  const atual = Parametros.atual();
  const origem = Parametros.origem();

  /* O efeito da tolerância é mostrado em número de cargas, e não em abstrato:
     o gestor precisa ver que mexer nela move a fila de pendências dele. */
  const todas = Store.todas();
  const comMedicao = todas.filter(d => d.coletadoKg != null && d.verificadoKg != null);
  const foraDaTolerancia = comMedicao.filter(d => !Demanda.dentroDaTolerancia(d)).length;

  const aplicar = async (id: string, texto: string) => {
    try {
      const numero = Number(String(texto).replace(',', '.'));
      await Configuracao.definir(id as IdParametro, numero);
      setRascunho(r => ({ ...r, [id]: '' }));
      recado('Parâmetro atualizado. As regras que dependem dele passam a usar o novo valor.');
    } catch (erro) { recado((erro as Error).message); }
  };

  const aplicarPreco = async (residuoId: string, texto: string) => {
    try {
      await Configuracao.definirPreco(residuoId, Number(String(texto).replace(',', '.')));
      setRascunho(r => ({ ...r, ['p-' + residuoId]: '' }));
      recado('Preço de referência atualizado.');
    } catch (erro) { recado((erro as Error).message); }
  };

  return (
    <>
      <Cabecalho titulo="Parâmetros do município"
        texto="Valores de trabalho que a Administração define, e que o sistema apenas aplica." />

      <Aviso tom="alerta" titulo="O que muda e o que não muda"
        texto="Alterar um parâmetro muda o resultado das regras daqui para frente, não o que já foi comprovado: comprovante emitido não é recalculado. A regra em si permanece — mexer na tolerância não altera como a divergência é medida, apenas a partir de quanto ela abre pendência." />

      {DEFINICOES.map(d => {
        const vigente = atual[d.id];
        const mudou = Parametros.alterado(d.id);
        return (
          <Cartao key={d.id} titulo={d.rotulo}
            sub={mudou ? `Vigente ${vigente} ${d.unidade} · origem ${origem[d.id]} ${d.unidade}` : `${vigente} ${d.unidade}`}
            classe={mudou ? 'acao-viva' : ''}
            nota={d.efeito}
            corpo={
              <div className="acoes-form">
                <input type="number" min={d.minimo} max={d.maximo} step={d.passo}
                  aria-label={d.rotulo}
                  value={rascunho[d.id] ?? String(vigente)}
                  onChange={e => setRascunho(r => ({ ...r, [d.id]: e.target.value }))} />
                <button className="btn sm" onClick={() => aplicar(d.id, rascunho[d.id] ?? String(vigente))}>
                  Aplicar
                </button>
                <span className="ajuda">
                  Entre {d.minimo} e {d.maximo} {d.unidade}
                  {d.id === 'tolerancia' && ` · hoje ${foraDaTolerancia} de ${comMedicao.length} carga(s) medida(s) ficariam fora`}
                </span>
              </div>
            } />
        );
      })}

      <Cartao titulo="Preços de referência por material"
        sub="Base do valor apurado para o catador"
        nota="Preço de sucata muda com o mercado. Este valor é parâmetro de trabalho — e a tela de metodologia declara isso para cada número que dele deriva."
        corpo={
          <div className="tabela-rolagem">
            <table className="tabela">
              <thead><tr><th>Material</th><th>Origem</th><th>Vigente</th><th>Novo valor</th><th></th></tr></thead>
              <tbody>
                {RESIDUOS.filter(r => r.recuperavel).map(r => {
                  const chave = 'p-' + r.id;
                  const vigente = Parametros.preco(r.id);
                  return (
                    <tr key={r.id}>
                      <td><b>{r.nome}</b></td>
                      <td className="num">{Fmt.reais(origem.precos[r.id])}</td>
                      <td className="num">
                        {Fmt.reais(vigente)}
                        {Parametros.precoAlterado(r.id) && <small>alterado</small>}
                      </td>
                      <td>
                        <input type="number" min={0} step={0.01} aria-label={`Preço de ${r.nome}`}
                          value={rascunho[chave] ?? String(vigente)}
                          onChange={e => setRascunho(s => ({ ...s, [chave]: e.target.value }))} />
                      </td>
                      <td>
                        <button className="btn sec sm" onClick={() => aplicarPreco(r.id, rascunho[chave] ?? String(vigente))}>
                          Aplicar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        } />

      <Cartao titulo="Efeito no município agora" sub="Com os valores vigentes"
        corpo={<Pares itens={[
          ['Cargas com as três medições', Fmt.numero(comMedicao.length)],
          ['Fora da tolerância vigente', Fmt.numero(foraDaTolerancia)],
          ['Economia por desvio de aterro', Fmt.reais(Painel.municipio().financeiro.custoAterroEvitado)],
          ['Valor apurado pelos catadores', Fmt.reais(Painel.municipio().financeiro.valor)]
        ]} />}
        acao={<button className="btn sec sm" onClick={async () => { await Configuracao.restaurar(); setRascunho({}); recado('Parâmetros restaurados aos valores de origem.'); }}>
          Restaurar origem
        </button>} />
    </>
  );
}
