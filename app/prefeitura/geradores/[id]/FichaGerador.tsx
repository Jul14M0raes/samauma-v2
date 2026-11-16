'use client';

/* Ficha do gerador para o Técnico da Prefeitura: situação regulatória com os
   motivos (RF-005), peças para o processo, gestão do cadastro (RF-003) e a
   classificação de inconformidade grave (RN-037). */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Aviso, BotaoConfirmar, Cabecalho, Cartao, Kpi, Kpis, LOGO_URL, Pares, SituacaoGerador, Vazio, Voltar } from '@/components/ui/Basicos';
import { GraficoRosca, GraficoSerie } from '@/components/ui/Graficos';
import { ListaDemandas } from '@/components/ui/Listas';
import { Fmt } from '@/lib/dominio/formato';
import { Catalogo } from '@/lib/dominio/catalogo';
import { Cadastro } from '@/lib/dominio/cadastro';
import { RAMOS } from '@/lib/dominio/formularios';
import { COOPERATIVAS } from '@/lib/dominio/catalogo';
import { useRecado } from '@/components/layout/RecadoProvider';
import { FormularioDecisao } from './FormularioDecisao';
import type { Gerador } from '@/lib/dominio/tipos';
import { Painel } from '@/lib/dominio/indicadores';
import { dossieDoGerador, minutaDeNotificacao, PRAZO_REGULARIZACAO } from '@/lib/dominio/notificacao';
import { Store } from '@/lib/dominio/store';
import { baixarDossie, baixarMinuta, imprimirDossie, imprimirMinuta } from '@/lib/servicos/pecaProcesso';
import { useDominio } from '@/state/hooks';
import { Cadastros } from '@/lib/dados/cadastros';

export function FichaGerador({ id }: { id: string }) {
  useDominio();
  const router = useRouter();

  if (!Catalogo.gerador(id)) return <Vazio titulo="Gerador não encontrado" texto="Ele pode ter sido removido ao reiniciar a demonstração." />;

  const p = Painel.gerador(id);
  const s = p.situacao;
  /* RN-008: cada não aceite sinaliza que a cooperativa precisa de mais equipamento. */
  const naoAceites = p.demandas.reduce((n, d) => n + d.naoAceites.length, 0);

  return (
    <>
      <Voltar para="/prefeitura/cadastros" rotulo="Voltar para grandes geradores" />

      <Cabecalho titulo={p.cadastro.nome} texto={`${p.cadastro.ramo} · CNPJ ${p.cadastro.cnpj} · ${Catalogo.endereco(p.cadastro.ponto)}`}
        acao={<SituacaoGerador situacao={s} />} />

      <PecasDoProcesso id={id} />

      <Kpis>
        <Kpi rotulo="Massa destinada" valor={Fmt.toneladas(p.ambiental.massa)} sub={`${p.comprovadas} comprovante(s)`} tom="marca" />
        <Kpi rotulo="Taxa de recuperação" valor={Fmt.percentual(p.ambiental.taxaRecuperacao, 0)} sub="do que saiu deste gerador" tom="ok" />
        <Kpi rotulo="Em andamento" valor={p.emAberto + p.emTransporte} sub="demandas em campo" />
        <Kpi rotulo="Pendências" valor={p.pendencias} sub="divergência aguardando decisão" tom={p.pendencias ? 'erro' : 'ok'} />
      </Kpis>

      <div className="colunas dois-um">
        <Cartao titulo="Por que esta situação" sub={s.rotulo} classe={s.id === 'REGULAR' ? 'acao-viva bom' : 'destaque-erro'}
          corpo={
            <>
              <ul className="motivos">{s.motivos.map((m, i) => <li key={i}>{m}</li>)}</ul>
              <Pares itens={[
                ['Razão social', p.cadastro.razaoSocial || 'não informada'],
                ['Endereço', p.cadastro.endereco || 'não informado'],
                ['Responsável técnico', p.cadastro.responsavelTecnico || 'não informado'],
                ['PGRS', s.pgrs ? `${s.pgrs.numero} · emitido em ${Fmt.data(s.pgrs.emitidoEm)}` : 'não enviado'],
                ['Validade', s.pgrs ? Fmt.data(s.pgrs.validade) : '—'],
                ['Última destinação', s.ultimaDestinacao ? Fmt.data(s.ultimaDestinacao) : 'nunca'],
                ['Cooperativa contratada', p.operador ? p.operador.nome : 'sem contrato vigente'],
                ['Capacidade da cooperativa', naoAceites
                  ? <span className="alerta">{`precisa de mais equipamento · ${naoAceites} não aceite(s)`}</span>
                  : 'sem registro de não aceite'],
                ['Volume declarado', Fmt.kg(p.cadastro.volumeMes) + ' / mês'],
                ['Aderência ao declarado', Fmt.percentual(p.aderencia ? p.aderencia.parte : null, 0)]
              ]} />
            </>
          } />
        <Cartao titulo="Composição" sub="O que este gerador destina" corpo={<GraficoRosca itens={p.materiais} />} />
      </div>

      <GestaoDoCadastro id={id} />

      <Cartao titulo="Destinação dia a dia" sub="Últimos 14 dias" corpo={<GraficoSerie serie={p.serie} />} />

      <Cartao titulo="Processos deste gerador" sub={`${p.total} demanda(s)`}
        corpo={<ListaDemandas demandas={p.demandas.slice(0, 10)} aoAbrir={did => router.push(`/prefeitura/demandas/${did}`)} />} />
    </>
  );
}

/* As peças que o fiscal leva para o processo. Ficam no topo da ficha porque é
   o que ele veio fazer: olhar a situação e produzir o documento. */
function PecasDoProcesso({ id }: { id: string }) {
  const gerador = Catalogo.gerador(id)!;
  const demandas = Store.doGerador(id);
  const minuta = minutaDeNotificacao(gerador, demandas);
  const dossie = dossieDoGerador(gerador, demandas);

  return (
    <Cartao titulo="Peças para o processo"
      sub={minuta.achados.length
        ? `${minuta.achados.length} ponto(s) apurado(s) · prazo sugerido de ${PRAZO_REGULARIZACAO} dias`
        : 'Sem pendências apuradas nesta data'}
      nota="As duas peças saem carimbadas como minuta, sem campo de assinatura. O sistema não notifica nem constitui em mora: quem expede é a autoridade competente, no processo próprio."
      corpo={<>
        {minuta.achados.length > 0 && (
          <ul className="lista-motivos">
            {minuta.achados.map((a, i) => (
              <li key={i}><b>{a.titulo}</b> — {a.detalhe}<br />
                <small className="fonte-dado">{a.fundamento.norma}, {a.fundamento.dispositivo}</small></li>
            ))}
          </ul>
        )}
        {minuta.solicitacoes.length > 0 && (
          <>
            <p className="fonte-dado" style={{ marginTop: 'var(--e3)' }}>
              <b>Informações que faltam</b> — não são imputação:
            </p>
            <ul className="lista-motivos">
              {minuta.solicitacoes.map((a, i) => (
                <li key={i}><b>{a.titulo}</b> — {a.detalhe}</li>
              ))}
            </ul>
          </>
        )}
        {minuta.achados.length === 0 && (
          <Aviso tom="bom" titulo="Nada a notificar hoje"
            texto="A situação apurada não comporta notificação. O dossiê continua disponível para instrução." />
        )}
        <div className="acoes-form">
          {minuta.achados.length > 0 && <>
            <button className="btn" onClick={() => imprimirMinuta(minuta, LOGO_URL)}>Imprimir minuta</button>
            <button className="btn sec sm" onClick={() => baixarMinuta(minuta, LOGO_URL)}>Baixar minuta</button>
          </>}
          <button className="btn sec sm" onClick={() => imprimirDossie(dossie, LOGO_URL)}>Imprimir dossiê</button>
          <button className="btn sec sm" onClick={() => baixarDossie(dossie, LOGO_URL)}>Baixar dossiê</button>
        </div>
      </>} />
  );
}

/* Gestão do cadastro pelo Técnico: corrigir, dar baixa e classificar
   inconformidade grave. Toda alteração entra na trilha do cadastro (RN-026). */
function GestaoDoCadastro({ id }: { id: string }) {
  const recado = useRecado();
  const [aba, setAba] = useState<'' | 'editar' | 'decidir'>('');
  const g = Catalogo.gerador(id);
  if (!g) return null;

  const s = Painel.gerador(id).situacao;
  const emBaixa = !!g.baixa;
  const trilha = Cadastro.auditoria(id);

  return (
    <Cartao titulo="Gestão do cadastro" sub="Correção, baixa e inconformidade grave"
      nota="A situação regulatória é calculada a partir dos dados. A única entrada manual é a inconformidade grave, sempre com fundamento (RN-037)."
      acao={
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn sec sm" onClick={() => setAba(a => a === 'editar' ? '' : 'editar')}>
            {aba === 'editar' ? 'Fechar' : 'Corrigir cadastro'}
          </button>
          <button className="btn sec sm" onClick={() => setAba(a => a === 'decidir' ? '' : 'decidir')}>
            {aba === 'decidir' ? 'Fechar' : 'Inconformidade grave'}
          </button>
        </div>
      }
      corpo={
        <>
          {emBaixa && (
            <Aviso tom="alerta" titulo={`Cadastro baixado em ${Fmt.data(g.baixa!.quando)}`}
              texto={`${g.baixa!.motivo} — registrado por ${g.baixa!.por}. O histórico continua válido; o que a baixa faz é tirar da fila de fiscalização.`} />
          )}

          {s.inconformidade && (
            <Aviso tom="problema" titulo="Inconformidade grave classificada"
              texto={`${s.inconformidade.fundamento} — ${s.inconformidade.por}, ${Fmt.data(s.inconformidade.quando)}.`} />
          )}

          {aba === 'editar' && <FormularioEdicao gerador={g} aoFechar={() => setAba('')} recado={recado} />}
          {aba === 'decidir' && <FormularioDecisao gerador={g} aoFechar={() => setAba('')} recado={recado} />}

          {!aba && (
            <div className="acoes-form">
              {emBaixa
                ? <button className="btn sec" onClick={async () => {
                    await Cadastros.reativar(id);
                    recado('Cadastro reativado. Volta a aparecer na fila de fiscalização.');
                  }}>Reativar cadastro</button>
                : <BotaoConfirmar rotulo="Dar baixa no cadastro" rotuloConfirmar="Confirmar baixa"
                    pergunta={`Dar baixa em ${g.nome}? Sai da fila de fiscalização e não recebe demanda nova. O histórico e os comprovantes já emitidos continuam válidos.`}
                    onConfirmar={async () => {
                      await Cadastros.darBaixa(id, 'Baixa registrada pela fiscalização');
                      recado('Baixa registrada. Nada foi apagado.');
                    }} />}
            </div>
          )}

          {trilha.length > 0 && (
            <ul className="lista-motivos" style={{ marginTop: 'var(--e3)' }}>
              {trilha.slice(0, 8).map((t, i) => (
                <li key={i}><b>{t.acao}</b> — {t.detalhe}<br /><small className="fonte-dado">{t.por}, {Fmt.dataHora(t.quando)}</small></li>
              ))}
            </ul>
          )}
        </>
      } />
  );
}

function FormularioEdicao({ gerador, aoFechar, recado }: {
  gerador: Gerador; aoFechar: () => void; recado: (t: string) => void;
}) {
  const ponto = Catalogo.ponto(gerador.ponto);
  const [d, setD] = useState({
    nome: gerador.nome, ramo: gerador.ramo,
    razaoSocial: gerador.razaoSocial || '', endereco: gerador.endereco || '',
    responsavelTecnico: gerador.responsavelTecnico || '', operador: gerador.operador || '',
    volumeMes: String(gerador.volumeMes), km: String(gerador.km),
    acesso: ponto?.acesso || ''
  });

  return (
    <>
      <div className="form">
        <div>
          <label className="rot" htmlFor="edNome">Nome do estabelecimento</label>
          <input type="text" id="edNome" value={d.nome} onChange={e => setD({ ...d, nome: e.target.value })} />
        </div>
        <div>
          <label className="rot" htmlFor="edRamo">Ramo de atividade</label>
          <select id="edRamo" value={d.ramo} onChange={e => setD({ ...d, ramo: e.target.value })}>
            {RAMOS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label className="rot" htmlFor="edRazao">Razão social</label>
          <input type="text" id="edRazao" value={d.razaoSocial} onChange={e => setD({ ...d, razaoSocial: e.target.value })} />
        </div>
        <div>
          <label className="rot" htmlFor="edEndereco">Endereço</label>
          <input type="text" id="edEndereco" value={d.endereco} onChange={e => setD({ ...d, endereco: e.target.value })} />
        </div>
        <div>
          <label className="rot" htmlFor="edResponsavel">Responsável técnico</label>
          <input type="text" id="edResponsavel" value={d.responsavelTecnico} onChange={e => setD({ ...d, responsavelTecnico: e.target.value })} />
        </div>
        <div>
          <label className="rot" htmlFor="edOperador">Cooperativa com contrato vigente</label>
          <select id="edOperador" value={d.operador} onChange={e => setD({ ...d, operador: e.target.value })}>
            <option value="">Sem contrato</option>
            {COOPERATIVAS.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </div>
        <div>
          <label className="rot" htmlFor="edVolume">Volume estimado por mês (kg)</label>
          <input type="number" id="edVolume" min={1} value={d.volumeMes}
            onChange={e => setD({ ...d, volumeMes: e.target.value })} />
          <div className="ajuda">Base do enquadramento como grande gerador e da aderência declarada.</div>
        </div>
        <div>
          <label className="rot" htmlFor="edKm">Distância do galpão (km)</label>
          <input type="number" id="edKm" min={1} step="0.1" value={d.km}
            onChange={e => setD({ ...d, km: e.target.value })} />
        </div>
        <div className="largo">
          <label className="rot" htmlFor="edAcesso">Como a cooperativa acessa a carga</label>
          <input type="text" id="edAcesso" value={d.acesso} onChange={e => setD({ ...d, acesso: e.target.value })} />
          <div className="ajuda">CNPJ não se edita: outro CNPJ é outro estabelecimento.</div>
        </div>
      </div>
      <div className="acoes-form">
        <button className="btn" onClick={async () => {
          const ok = await Cadastros.editarGerador(gerador.id, {
            nome: d.nome, ramo: d.ramo, razaoSocial: d.razaoSocial, endereco: d.endereco,
            responsavelTecnico: d.responsavelTecnico, operador: d.operador,
            volumeMes: Number(d.volumeMes), km: Number(d.km)
          }, d.acesso);
          recado(ok ? 'Cadastro atualizado.' : 'Confira os campos: nome com ao menos 3 letras e sem repetir outro cadastro.');
          if (ok) aoFechar();
        }}>Salvar</button>
        <button className="btn sec" onClick={aoFechar}>Cancelar</button>
      </div>
    </>
  );
}
