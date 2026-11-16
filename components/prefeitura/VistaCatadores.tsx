'use client';

/* A identificação dos cooperados no programa municipal, do lado da Prefeitura.

   Só consulta: quem emite, renova e suspende é a cooperativa (RF-016, matriz
   de permissões). A Prefeitura vê quantas pessoas o programa alcança e onde
   há controle de fluxo. Renda e produção individual não aparecem aqui. */

import { useState } from 'react';

import { Busca } from '@/components/ui/Busca';
import { filtrarPorTexto } from '@/lib/dominio/busca';
import { Cabecalho, Cartao, Filtros, Kpi, Kpis, Pino, Vazio } from '@/components/ui/Basicos';
import { useRecado } from '@/components/layout/RecadoProvider';
import {
  Carteiras, codigoDeVerificacao, situacaoDaCarteira,
  type Carteira, type SituacaoCarteiraId
} from '@/lib/dominio/carteira';
import { CATADORES, Catalogo, COOPERATIVAS } from '@/lib/dominio/catalogo';
import { Fmt } from '@/lib/dominio/formato';
import { baixarTexto, carimboArquivo, montarCsv } from '@/lib/servicos/arquivo';
import { useDominio } from '@/state/hooks';

type Grupo = 'todas' | 'ativas' | 'vencendo' | 'bloqueadas';

const GRUPOS: Record<Grupo, (c: Carteira) => boolean> = {
  todas: () => true,
  ativas: c => situacaoDaCarteira(c).id === 'ATIVA',
  vencendo: c => situacaoDaCarteira(c).id === 'A_VENCER',
  bloqueadas: c => !situacaoDaCarteira(c).liberada
};

export function VistaCatadores() {
  useDominio();
  const recado = useRecado();
  const [grupo, setGrupo] = useState<Grupo>('todas');
  const [texto, setTexto] = useState('');

  const carteiras = Carteiras.todas();
  const passagens = Carteiras.todasPassagens();
  const semCarteira = CATADORES.filter(c => !Carteiras.doCatador(c.id));

  const contagem = (id: SituacaoCarteiraId) => carteiras.filter(c => situacaoDaCarteira(c).id === id).length;
  const bloqueadas = carteiras.filter(c => !situacaoDaCarteira(c).liberada).length;

  const hoje = new Date().toDateString();
  const passagensHoje = passagens.filter(p => new Date(p.quando).toDateString() === hoje);
  const cargaRegistrada = passagens.reduce((soma, p) => soma + (p.cargaKg || 0), 0);

  /* Movimento por local: é o que mostra onde o programa realmente acontece. */
  const porLocal = Object.values(
    passagens.reduce((mapa, p) => {
      const atual = mapa[p.local.id] || { nome: p.local.nome, tipo: p.local.tipo, leituras: 0, entradas: 0, carga: 0 };
      atual.leituras += 1;
      if (p.tipo === 'ENTRADA') atual.entradas += 1;
      atual.carga += p.cargaKg || 0;
      mapa[p.local.id] = atual;
      return mapa;
    }, {} as Record<string, { nome: string; tipo: string; leituras: number; entradas: number; carga: number }>)
  ).sort((a, b) => b.leituras - a.leituras);

  const porCooperativa = COOPERATIVAS.map(coop => {
    const equipe = Carteiras.daCooperativa(coop.id);
    return {
      coop,
      total: equipe.length,
      ativas: equipe.filter(c => situacaoDaCarteira(c).liberada).length,
      pendentes: equipe.filter(c => !situacaoDaCarteira(c).liberada).length
    };
  }).filter(l => l.total > 0);

  function exportarCsv() {
    const colunas: [string, (c: Carteira) => unknown][] = [
      ['Registro', c => codigoDeVerificacao(c.numero)],
      ['Número', c => c.numero],
      ['Cooperado', c => Catalogo.catador(c.catadorId)?.nome || c.catadorId],
      ['Cooperativa', c => Catalogo.cooperativa(c.vinculo)?.nome || '—'],
      ['Zona', c => Catalogo.catador(c.catadorId)?.zona || ''],
      ['Situação', c => situacaoDaCarteira(c).rotulo],
      ['Motivo', c => situacaoDaCarteira(c).motivo],
      ['Emitida em', c => Fmt.data(c.emitidaEm)],
      ['Válida até', c => Fmt.data(c.validaAte)],
      ['Via', c => c.via],
      ['Emitida por', c => c.emitidaPor],
      ['Entradas registradas', c => Carteiras.passagensDoCatador(c.catadorId).filter(p => p.tipo === 'ENTRADA').length],
      ['Última leitura', c => {
        const ultima = Carteiras.passagensDoCatador(c.catadorId)[0];
        return ultima ? `${Fmt.dataHora(ultima.quando)} · ${ultima.local.nome}` : '';
      }]
    ];
    const csv = montarCsv([colunas.map(c => c[0]), ...carteiras.map(c => colunas.map(col => col[1](c)))]);
    baixarTexto(csv, 'text/csv;charset=utf-8', `samauma-carteiras-${carimboArquivo()}.csv`);
    recado(`Registro exportado: ${carteiras.length} carteira(s).`);
  }

  const doGrupo = carteiras.filter(GRUPOS[grupo]);
  const lista = filtrarPorTexto(doGrupo, texto, c => [
    c.numero,
    codigoDeVerificacao(c.numero),
    Catalogo.catador(c.catadorId)?.nome,
    Catalogo.cooperativa(c.vinculo)?.nome,
    situacaoDaCarteira(c).rotulo
  ]);

  return (
    <>
      <Cabecalho titulo="Cooperados"
        texto="Identificação no programa municipal, mantida pelas cooperativas, e controle de fluxo nos pontos de entrega"
        acao={<div className="exportar">
          <span className="etiqueta">Registro</span>
          <button className="btn sec sm" onClick={exportarCsv}>CSV</button>
        </div>} />

      <Kpis>
        <Kpi rotulo="Carteiras emitidas" valor={carteiras.length}
          sub={`${porCooperativa.length} cooperativa(s)`} tom="marca" destaque />
        <Kpi rotulo="Autorizando passagem" valor={carteiras.length - bloqueadas}
          sub={`${contagem('A_VENCER')} vencendo em até 60 dias`} tom="ok" />
        <Kpi rotulo="Sem autorizar" valor={bloqueadas}
          sub={`${contagem('VENCIDA')} vencida(s) · ${contagem('SUSPENSA')} suspensa(s)`}
          tom={bloqueadas ? 'erro' : ''} />
        <Kpi rotulo="Leituras hoje" valor={passagensHoje.length}
          sub={`${passagens.length} no total · ${Fmt.kg(cargaRegistrada)} declarados`} />
      </Kpis>

      {semCarteira.length > 0 && (
        <Cartao titulo="Cooperados sem identificação" sub="Na equipe de uma cooperativa e ainda sem carteira emitida"
          nota="A emissão é feita pela cooperativa, na Portaria."
          corpo={<div className="tabela-rolagem">
            <table className="tabela">
              <thead><tr><th>Cooperado</th><th>Cooperativa</th><th>Zona</th><th>No programa desde</th></tr></thead>
              <tbody>
                {semCarteira.map(c => (
                  <tr key={c.id}>
                    <td><b>{c.nome}</b></td>
                    <td>{Catalogo.cooperativa(c.cooperativa)?.nome}</td>
                    <td>{c.zona}</td>
                    <td>{Fmt.data(c.desde)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>} />
      )}

      <Cartao titulo="Registro de carteiras" sub="Toda carteira emitida no município"
        acao={<Filtros todas={carteiras} grupos={GRUPOS} atual={grupo}
          rotulos={[['todas', 'Todas'], ['ativas', 'Ativas'], ['vencendo', 'Vencendo'], ['bloqueadas', 'Sem autorizar']]}
          aoEscolher={setGrupo} />}
        nota="A situação é calculada a partir da validade e dos atos registrados; o motivo acompanha cada linha."
        corpo={<>
          <Busca valor={texto} aoMudar={setTexto} achados={lista.length} total={doGrupo.length}
            rotulo="Buscar carteira" placeholder="Número da carteira, nome do cooperado ou cooperativa" />
          {lista.length === 0
          ? <Vazio titulo="Nenhuma carteira neste filtro" texto="Troque o filtro para ver as demais." />
          : <div className="tabela-rolagem">
              <table className="tabela">
                <thead><tr><th>Registro</th><th>Cooperado</th><th>Cooperativa</th><th>Válida até</th><th>Situação</th><th>Última leitura</th></tr></thead>
                <tbody>
                  {lista.map(c => {
                    const situacao = situacaoDaCarteira(c);
                    const catador = Catalogo.catador(c.catadorId);
                    const ultima = Carteiras.passagensDoCatador(c.catadorId)[0];
                    return (
                      <tr key={c.numero}>
                        <td className="mono">{codigoDeVerificacao(c.numero)}<small>via {c.via}</small></td>
                        <td><b>{catador?.nome || c.catadorId}</b><small>{catador?.zona}</small></td>
                        <td>{Catalogo.cooperativa(c.vinculo)?.nome || '—'}</td>
                        <td>{Fmt.data(c.validaAte)}</td>
                        <td><Pino rotulo={situacao.rotulo} tom={situacao.tom} /><small>{situacao.motivo}</small></td>
                        <td>{ultima ? <>{Fmt.dataHora(ultima.quando)}<small>{ultima.local.nome}</small></> : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>}
        </>} />

      <div className="colunas dois-um">
        <Cartao titulo="Cobertura por organização" sub="Carteiras emitidas e situação por cooperativa"
          corpo={porCooperativa.length === 0
            ? <Vazio titulo="Nenhuma cooperativa com carteira" texto="A cobertura aparece quando a primeira carteira for emitida." />
            : <div className="tabela-rolagem">
                <table className="tabela">
                  <thead><tr><th>Organização</th><th>Bairro</th><th className="dir">Carteiras</th><th className="dir">Autorizando</th><th className="dir">Pendentes</th></tr></thead>
                  <tbody>
                    {porCooperativa.map(l => (
                      <tr key={l.coop.id}>
                        <td><b>{l.coop.nome}</b><small>{l.coop.contrato}</small></td>
                        <td>{l.coop.bairro}</td>
                        <td className="num dir">{l.total}</td>
                        <td className="num dir">{l.ativas}</td>
                        <td className="num dir">{l.pendentes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>} />

        <Cartao titulo="Onde há controle de fluxo" sub="Leituras de carteira por ponto"
          nota="Cada leitura é uma entrada ou saída registrada por quem opera o ponto."
          corpo={porLocal.length === 0
            ? <Vazio titulo="Sem leituras registradas" texto="O movimento aparece quando as portarias começarem a ler carteiras." />
            : <div className="tabela-rolagem">
                <table className="tabela">
                  <thead><tr><th>Ponto</th><th className="dir">Leituras</th><th className="dir">Entradas</th><th className="dir">Carga declarada</th></tr></thead>
                  <tbody>
                    {porLocal.map(l => (
                      <tr key={l.nome}>
                        <td><b>{l.nome}</b><small>{l.tipo}</small></td>
                        <td className="num dir">{l.leituras}</td>
                        <td className="num dir">{l.entradas}</td>
                        <td className="num dir">{Fmt.kg(l.carga)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>} />
      </div>

      <Cartao titulo="Limites desta tela" sub="O que o registro faz e o que não faz"
        corpo={<dl className="pares">
          <div><dt>O que a carteira atesta</dt><dd>Vínculo do cooperado com o programa municipal de coleta seletiva. Não é documento de identidade civil e não substitui RG, CPF ou CTPS.</dd></div>
          <div><dt>O que a passagem registra</dt><dd>Entrada e saída em ponto de controle, com autor e horário. Não há acompanhamento de deslocamento fora desses pontos.</dd></div>
          <div><dt>Dado pessoal</dt><dd>Nome e produção individual são dado pessoal tratado para execução de política pública. Produção por pessoa fica com o titular e com a coordenação da organização dele.</dd></div>
          <div><dt>Base legal</dt><dd>Lei nº 12.305/2010 e Lei nº 11.445/2007, que prioriza organizações de catadores; tratamento de dados conforme a Lei nº 13.709/2018.</dd></div>
        </dl>} />
    </>
  );
}
