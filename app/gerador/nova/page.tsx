'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Cabecalho, Cartao, Vazio, Voltar } from '@/components/ui/Basicos';
import { useRecado } from '@/components/layout/RecadoProvider';
import { Catalogo, PONTOS, RESIDUOS } from '@/lib/dominio/catalogo';
import { daquiADias } from '@/lib/dominio/formato';
import { Sessao } from '@/lib/dominio/sessao';
import { useDominio } from '@/state/hooks';
import { Demandas } from '@/lib/dados/demandas';

export default function PaginaNovaDemanda() {
  useDominio();
  const router = useRouter();
  const recado = useRecado();
  const cadastro = Sessao.cadastroGerador;

  const [residuo, setResiduo] = useState(RESIDUOS[0].id);
  const [quantidade, setQuantidade] = useState('4000');
  const [ponto, setPonto] = useState(cadastro?.ponto || '');
  const [prazo, setPrazo] = useState(() => daquiADias(2).toISOString().slice(0, 10));
  const [observacao, setObservacao] = useState('');

  if (!cadastro) {
    return (
      <>
        <Voltar para="/gerador/demandas" rotulo="Voltar para minhas demandas" />
        <Vazio titulo="Cadastro do estabelecimento não encontrado"
          texto="Não foi possível carregar os dados do gerador para montar o formulário. Tente novamente pela lista de demandas." />
      </>
    );
  }

  const pontosDisponiveis = PONTOS.filter(p => p.id !== 'pt-galpao');
  const operador = Catalogo.operador(cadastro);

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    const litros = Number(quantidade);
    if (!litros || litros <= 0) { recado('Informe a quantidade em litros.'); return; }

    let demanda;
    try {
      demanda = await Demandas.declarar({
        residuo,
        declaradoL: litros,
        ponto,
        prazo: new Date(prazo + 'T17:00:00').toISOString(),
        observacao: observacao.trim()
      });
    } catch (erro) { recado((erro as Error).message); return; }
    recado(`Demanda ${demanda.id.replace('DEM-', '#')} encaminhada a ${demanda.destino.nome}.`);
    router.push(`/gerador/demandas/${demanda.id}`);
  }

  return (
    <>
      <Voltar para="/gerador/demandas" rotulo="Voltar para minhas demandas" />
      <Cabecalho titulo="Declarar coleta avulsa" texto="Coleta fora do que o contrato prevê (RF-007). As coletas do contrato são propostas em Demandas." />

      <Cartao corpo={
        <form className="form" onSubmit={enviar}>
          <div>
            <label className="rot" htmlFor="campoResiduo">Tipo de resíduo</label>
            <select id="campoResiduo" value={residuo} onChange={e => setResiduo(e.target.value)}>
              {RESIDUOS.map(r => <option key={r.id} value={r.id}>{r.nome}{r.recuperavel ? '' : ' — vai para o aterro'}</option>)}
            </select>

          </div>
          <div>
            <label className="rot" htmlFor="campoQuantidade">Quantidade (litros)</label>
            <input type="number" id="campoQuantidade" min={1} step="any" value={quantidade} onChange={e => setQuantidade(e.target.value)} required />
            <div className="ajuda">Declarada em litros (RN-006). A massa é registrada na coleta e na balança da cooperativa.</div>
          </div>
          <div>
            <label className="rot" htmlFor="campoPonto">Ponto de coleta</label>
            <select id="campoPonto" value={ponto} onChange={e => setPonto(e.target.value)}>
              {pontosDisponiveis.map(p => <option key={p.id} value={p.id}>{p.bairro} · {p.zona}</option>)}
            </select>
            <div className="ajuda">{Catalogo.ponto(ponto)?.acesso}</div>
          </div>
          <div>
            <label className="rot" htmlFor="campoPrazo">Prazo</label>
            <input type="date" id="campoPrazo" value={prazo} onChange={e => setPrazo(e.target.value)} required />
          </div>
          <div className="largo">
            <label className="rot" htmlFor="campoObservacao">Observação para a cooperativa (opcional)</label>
            <textarea id="campoObservacao" placeholder="Ponto de retirada, horário de acesso, condição do material..." value={observacao} onChange={e => setObservacao(e.target.value)} />
          </div>
          <div className="largo acoes-form">
            <button className="btn" type="submit">Declarar e encaminhar</button>
            <span className="ajuda">{operador
              ? 'A demanda vai para a cooperativa contratada: ' + operador.nome + ', que avalia se consegue atender.'
              : 'Sem contrato vigente, a demanda vai à cooperativa do piloto.'}</span>
          </div>
        </form>
      } />
    </>
  );
}
