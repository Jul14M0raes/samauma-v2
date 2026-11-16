'use client';

/* Registro municipal de cooperativas — faltava: a Prefeitura via geradores e
   catadores em Cadastros, mas a cooperativa só aparecia como nome solto num
   ranking de massa no painel, sem CNPJ, contrato ou capacidade — os mesmos
   dados que já existem em `Cooperativa` (tipos.ts) e em `Painel.cooperativa()`,
   só que nunca reunidos numa tela de registro. */

import { useState } from 'react';
import { Busca } from '@/components/ui/Busca';
import { filtrarPorTexto } from '@/lib/dominio/busca';
import { Cabecalho, Kpi, Kpis, Vazio } from '@/components/ui/Basicos';
import { COOPERATIVAS } from '@/lib/dominio/catalogo';
import { Fmt, somar } from '@/lib/dominio/formato';
import { Painel } from '@/lib/dominio/indicadores';
import { useDominio } from '@/state/hooks';

export function VistaCooperativas() {
  useDominio();
  const [texto, setTexto] = useState('');

  const linhas = COOPERATIVAS.map(coop => ({ coop, p: Painel.cooperativa(coop.id)! })).filter(l => l.p);
  const lista = filtrarPorTexto(linhas, texto, l => [l.coop.nome, l.coop.razao, l.coop.cnpj, l.coop.bairro, l.coop.contrato]);

  const totalCatadores = somar(linhas, l => l.p.catadores);
  const totalMassa = somar(linhas, l => l.p.massa);
  const totalPendencias = somar(linhas, l => l.p.pendencias);

  return (
    <>
      <Cabecalho titulo="Cooperativas" texto="Registro, contrato e produção de cada organização de catadores do município." />

      <Kpis>
        <Kpi rotulo="Cooperativas cadastradas" valor={linhas.length} sub="registro municipal" tom="marca" />
        <Kpi rotulo="Catadores cooperados" valor={totalCatadores} sub="somando todas as equipes" />
        <Kpi rotulo="Massa comprovada" valor={Fmt.toneladas(totalMassa)} sub="por catadores cooperados" tom="ok" />
        <Kpi rotulo="Pendências abertas" valor={totalPendencias} sub="em conciliação" tom={totalPendencias ? 'erro' : 'ok'} />
      </Kpis>

      <Busca valor={texto} aoMudar={setTexto} achados={lista.length} total={linhas.length}
        rotulo="Buscar cooperativa" placeholder="Nome, razão social, CNPJ, bairro ou contrato" />

      {lista.length === 0
        ? <Vazio titulo="Nenhuma cooperativa neste filtro" texto="Troque o termo de busca para ver as demais." />
        : <div className="tabela-rolagem">
            <table className="tabela">
              <thead>
                <tr>
                  <th>Cooperativa</th><th>Bairro</th><th>Contrato</th>
                  <th className="dir">Catadores</th><th className="dir">Massa</th><th className="dir">Renda</th><th className="dir">Atendimentos</th>
                </tr>
              </thead>
              <tbody>
                {lista.map(({ coop, p }) => (
                  <tr key={coop.id}>
                    <td><b>{coop.nome}</b><small>{coop.cnpj} · fundada em {Fmt.data(coop.fundada)}</small></td>
                    <td>{coop.bairro}</td>
                    <td>{coop.contrato}</td>
                    <td className="num dir">{p.catadores}</td>
                    <td className="num dir">{Fmt.kg(p.massa)}</td>
                    <td className="num dir">{Fmt.reais(p.renda)}</td>
                    <td className="num dir">{p.atendimentos}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>}
    </>
  );
}
