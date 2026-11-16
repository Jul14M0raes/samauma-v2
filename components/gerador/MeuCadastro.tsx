'use client';

/* O gerador corrigindo o próprio cadastro.

   Até aqui o estabelecimento se cadastrava uma vez e nunca mais podia mexer:
   mudou o horário da doca, aumentou o volume, trocou de nome — só ligando
   para a Secretaria. Isso empurra a correção para fora do sistema, e o
   cadastro desatualizado é o que faz o catador chegar no horário errado.

   O que ele NÃO pode mudar sozinho é o CNPJ. É a chave que liga este cadastro
   ao MTR e à consulta na Receita: outro CNPJ é outro
   estabelecimento, e vira cadastro novo. */

import { useState } from 'react';
import { Cartao, Pares } from '@/components/ui/Basicos';
import { useRecado } from '@/components/layout/RecadoProvider';
import { Catalogo } from '@/lib/dominio/catalogo';
import { Fmt } from '@/lib/dominio/formato';
import { RAMOS } from '@/lib/dominio/formularios';
import { Regulatorio } from '@/lib/dominio/regulatorio';
import { Sessao } from '@/lib/dominio/sessao';
import { useDominio } from '@/state/hooks';
import { Cadastros } from '@/lib/dados/cadastros';

export function MeuCadastro() {
  useDominio();
  const recado = useRecado();
  const [editando, setEditando] = useState(false);

  const g = Catalogo.gerador(Sessao.gerador);
  if (!g) return null;

  const ponto = Catalogo.ponto(g.ponto);
  const plano = Regulatorio.pgrs(g);

  return (
    <Cartao titulo="Meu cadastro" sub="O que a Prefeitura e o catador enxergam deste estabelecimento"
      nota="O CNPJ não se altera aqui: é a chave que liga este cadastro ao manifesto e à consulta na Receita. Mudança de CNPJ é cadastro novo."
      acao={<button className="btn sec sm" onClick={() => setEditando(v => !v)}>
        {editando ? 'Fechar' : 'Corrigir dados'}
      </button>}
      corpo={editando
        ? <Formulario gerador={g} acesso={ponto?.acesso || ''} recado={recado} aoFechar={() => setEditando(false)} />
        : <Pares itens={[
            ['Estabelecimento', g.nome],
            ['CNPJ', g.cnpj],
            ['Ramo', g.ramo],
            ['Ponto de coleta', Catalogo.endereco(g.ponto)],
            ['Acesso à carga', ponto?.acesso || '—'],
            ['Volume declarado', Fmt.kg(g.volumeMes) + ' / mês'],
            ['Distância do galpão', g.km + ' km'],
            ['PGRS', plano ? `${plano.numero} · vence ${Fmt.data(plano.validade)}` : 'não cadastrado'],
            ['Código de acesso', g.codigo || '—']
          ]} />
      } />
  );
}

function Formulario({ gerador, acesso, recado, aoFechar }: {
  gerador: NonNullable<ReturnType<typeof Catalogo.gerador>>;
  acesso: string; recado: (t: string) => void; aoFechar: () => void;
}) {
  const [d, setD] = useState({
    nome: gerador.nome, ramo: gerador.ramo,
    volumeMes: String(gerador.volumeMes), km: String(gerador.km), acesso
  });

  return (
    <>
      <div className="form">
        <div>
          <label className="rot" htmlFor="meuNome">Nome do estabelecimento</label>
          <input type="text" id="meuNome" value={d.nome}
            onChange={e => setD({ ...d, nome: e.target.value })} />
        </div>
        <div>
          <label className="rot" htmlFor="meuRamo">Ramo de atividade</label>
          <select id="meuRamo" value={d.ramo} onChange={e => setD({ ...d, ramo: e.target.value })}>
            {RAMOS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <div className="ajuda">Define o perfil de resíduo esperado e entra no enquadramento.</div>
        </div>
        <div>
          <label className="rot" htmlFor="meuVolume">Volume estimado por mês (kg)</label>
          <input type="number" id="meuVolume" min={1} value={d.volumeMes}
            onChange={e => setD({ ...d, volumeMes: e.target.value })} />
          <div className="ajuda">Comparado com o que você efetivamente destinou. Declarar a menos não ajuda: a diferença aparece como aderência baixa.</div>
        </div>
        <div>
          <label className="rot" htmlFor="meuKm">Distância do galpão (km)</label>
          <input type="number" id="meuKm" min={1} step="0.1" value={d.km}
            onChange={e => setD({ ...d, km: e.target.value })} />
        </div>
        <div className="largo">
          <label className="rot" htmlFor="meuAcesso">Como o catador acessa a carga</label>
          <input type="text" id="meuAcesso" value={d.acesso}
            onChange={e => setD({ ...d, acesso: e.target.value })}
            placeholder="Doca lateral · 7h às 12h" />
          <div className="ajuda">Aparece na tela do catador antes de ele sair. É o campo que mais evita viagem perdida.</div>
        </div>
      </div>
      <div className="acoes-form">
        <button className="btn" onClick={async () => {
          const ok = await Cadastros.editarGerador(gerador.id, {
            nome: d.nome, ramo: d.ramo,
            volumeMes: Number(d.volumeMes), km: Number(d.km)
          }, d.acesso);
          recado(ok
            ? 'Cadastro atualizado. A Prefeitura e a cooperativa já veem os dados novos.'
            : 'Confira o nome: precisa de ao menos 3 letras e não pode repetir outro estabelecimento.');
          if (ok) aoFechar();
        }}>Salvar</button>
        <button className="btn sec" onClick={aoFechar}>Cancelar</button>
      </div>
    </>
  );
}
