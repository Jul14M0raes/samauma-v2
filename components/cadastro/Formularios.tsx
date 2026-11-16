'use client';

/* Formulários de cadastro (MOD-001): gerador (RF-001, RF-003) e cooperativa
   (RF-003). Usados na página pública de cadastro do gerador e na área de
   cadastros do Técnico da Prefeitura. */

import Link from 'next/link';
import { Campo } from '@/components/cadastro/Campo';
import { Aviso } from '@/components/ui/Basicos';
import { COOPERATIVAS } from '@/lib/dominio/catalogo';
import { Cadastro } from '@/lib/dominio/cadastro';
import { Fmt } from '@/lib/dominio/formato';
import { pontosDeCadastro, RAMOS } from '@/lib/dominio/formularios';
import { Pgrs, soDigitos } from '@/lib/dominio/pgrs';
import type { DadosCnpj } from '@/lib/servicos/integracoes';
import { usePgrsVersao } from '@/state/hooks';

export type ValorCampo = string | string[];
export type Dados = Record<string, ValorCampo | undefined>;
export type AoMudar = (campo: string, valor: ValorCampo) => void;

/* Estado da busca de CNPJ: só preenche o rascunho antes de enviar. */
export type EstadoBuscaCnpj =
  | { estado: 'ocioso' }
  | { estado: 'buscando' }
  | { estado: 'ok'; dados: DadosCnpj }
  | { estado: 'erro'; motivo: string };

function Opcoes({ lista }: { lista: readonly string[] }) {
  return <>{lista.map(v => <option key={v} value={v}>{v}</option>)}</>;
}

function StatusPgrsCompleto({ cnpj }: { cnpj: string }) {
  usePgrsVersao();
  const chave = soDigitos(cnpj);
  const rascunho = chave ? Pgrs.obter(chave) : null;
  if (!rascunho) return null;
  return (
    <div className="largo pgrs-encontrado">
      <Aviso titulo="PGRS completo encontrado para este CNPJ"
        texto={`Vai ser anexado automaticamente ao concluir o cadastro · rascunho de ${Fmt.dataHora(rascunho.atualizadoEm)}.`} />
      <div className="acoes-form">
        <Link href={`/pgrs/gerar?cnpj=${chave}&retorno=cadastro`} className="btn sec sm">Corrigir PGRS antes de concluir</Link>
      </div>
    </div>
  );
}

function ResultadoBuscaCnpj({ busca }: { busca: EstadoBuscaCnpj }) {
  if (busca.estado === 'ocioso') return null;
  if (busca.estado === 'buscando') {
    return <div className="largo"><p className="ajuda">Consultando dados públicos do CNPJ…</p></div>;
  }
  if (busca.estado === 'erro') {
    return (
      <div className="largo pgrs-encontrado">
        <Aviso tom="alerta" titulo="Não foi possível buscar este CNPJ" texto={`${busca.motivo} Preencha os campos manualmente.`} />
      </div>
    );
  }
  const d = busca.dados;
  return (
    <div className="largo pgrs-encontrado">
      <Aviso titulo="Dados encontrados pelo CNPJ" tom={d.situacaoCadastral && d.situacaoCadastral !== 'ATIVA' ? 'problema' : 'bom'}
        texto={`${d.razaoSocial}${d.situacaoCadastral ? ' · situação: ' + d.situacaoCadastral : ''}${d.logradouro ? ' · ' + [d.logradouro, d.numero].filter(Boolean).join(', ') + (d.bairro ? ' — ' + d.bairro : '') : ''}`} />
    </div>
  );
}

function CampoCnpj({ d, e, aoMudar, busca, aoBuscarCnpj }: {
  d: Dados; e: Record<string, string>; aoMudar: AoMudar; busca?: EstadoBuscaCnpj; aoBuscarCnpj?: () => void;
}) {
  return (
    <>
      <Campo id="cadCnpj" rotulo="CNPJ" erro={e.cnpj} ajuda="Conferido com os dígitos verificadores. O mesmo CNPJ não é cadastrado duas vezes."
        controle={
          <div className="campo-com-botao">
            <input type="text" id="cadCnpj" inputMode="numeric" value={d.cnpj || ''}
              onChange={ev => aoMudar('cnpj', Cadastro.formatarCnpj(ev.target.value))} placeholder="00.000.000/0001-00" />
            {aoBuscarCnpj && busca && (
              <button type="button" className="btn sec sm" disabled={!Cadastro.cnpjValido(d.cnpj) || busca.estado === 'buscando'} onClick={aoBuscarCnpj}>
                {busca.estado === 'buscando' ? 'Buscando…' : 'Buscar dados'}
              </button>
            )}
          </div>
        } />
      {busca && <ResultadoBuscaCnpj busca={busca} />}
    </>
  );
}

function CampoPonto({ d, e, aoMudar, rotulo }: { d: Dados; e: Record<string, string>; aoMudar: AoMudar; rotulo: string }) {
  return (
    <Campo id="cadPonto" rotulo={rotulo} erro={e.ponto} ajuda="Bairros reais de Porto Velho; a coordenada é aproximada."
      controle={
        <select id="cadPonto" value={d.ponto || ''} onChange={ev => aoMudar('ponto', ev.target.value)}>
          <option value="">Selecione…</option>
          {pontosDeCadastro().map(p => <option key={p.id} value={p.id}>{p.bairro} · {p.zona}</option>)}
        </select>
      } />
  );
}

/* RN-004: CNPJ, endereço, razão social, responsável técnico e contrato vigente. */
export function FormularioGerador({ d, e, aoMudar, busca, aoBuscarCnpj }: {
  d: Dados; e: Record<string, string>; aoMudar: AoMudar; busca?: EstadoBuscaCnpj; aoBuscarCnpj?: () => void;
}) {
  return (
    <>
      <Campo id="cadNome" rotulo="Nome do estabelecimento" erro={e.nome} ajuda="Como o estabelecimento é conhecido."
        controle={<input type="text" id="cadNome" value={d.nome || ''} onChange={ev => aoMudar('nome', ev.target.value)} placeholder="Mercado Central de Porto Velho" />} />
      <CampoCnpj d={d} e={e} aoMudar={aoMudar} busca={busca} aoBuscarCnpj={aoBuscarCnpj} />
      <Campo id="cadRazao" rotulo="Razão social" erro={e.razaoSocial}
        controle={<input type="text" id="cadRazao" value={d.razaoSocial || ''} onChange={ev => aoMudar('razaoSocial', ev.target.value)} />} />
      <Campo id="cadEndereco" rotulo="Endereço" erro={e.endereco}
        controle={<input type="text" id="cadEndereco" value={d.endereco || ''} onChange={ev => aoMudar('endereco', ev.target.value)} placeholder="Rua, número" />} />
      <Campo id="cadResponsavel" rotulo="Responsável técnico" erro={e.responsavelTecnico}
        ajuda="Sem responsável técnico o cadastro fica incompleto e a situação regulatória não chega a Regular."
        controle={<input type="text" id="cadResponsavel" value={d.responsavelTecnico || ''} onChange={ev => aoMudar('responsavelTecnico', ev.target.value)} placeholder="Nome e registro profissional" />} />
      <Campo id="cadRamo" rotulo="Ramo de atividade" erro={e.ramo}
        controle={<select id="cadRamo" value={d.ramo || ''} onChange={ev => aoMudar('ramo', ev.target.value)}><option value="">Selecione…</option><Opcoes lista={RAMOS} /></select>} />
      <Campo id="cadVolume" rotulo="Volume estimado por mês (kg)" erro={e.volumeMes} ajuda="Serve para comparar o declarado com o efetivamente destinado."
        controle={<input type="number" id="cadVolume" min={1} step="any" value={d.volumeMes || ''} onChange={ev => aoMudar('volumeMes', ev.target.value)} placeholder="4000" />} />
      <CampoPonto d={d} e={e} aoMudar={aoMudar} rotulo="Bairro do ponto de coleta" />
      <Campo id="cadAcesso" rotulo="Como a cooperativa acessa a carga" erro={e.acesso}
        controle={<input type="text" id="cadAcesso" value={d.acesso || ''} onChange={ev => aoMudar('acesso', ev.target.value)} placeholder="Doca lateral · 7h às 12h" />} />
      <Campo id="cadOperador" rotulo="Cooperativa com contrato vigente" erro={e.operador}
        ajuda="Sem contrato vigente o cadastro fica incompleto (RN-004)."
        controle={
          <select id="cadOperador" value={d.operador || ''} onChange={ev => aoMudar('operador', ev.target.value)}>
            <option value="">Ainda sem contrato</option>
            {COOPERATIVAS.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        } />
      <Campo id="cadPgrs" rotulo="Número do PGRS (opcional)" erro={e.pgrsNumero} ajuda="Sem PGRS, a situação começa como Irregular — e o sistema explica o motivo."
        controle={<input type="text" id="cadPgrs" value={d.pgrsNumero || ''} onChange={ev => aoMudar('pgrsNumero', ev.target.value)} placeholder="PGRS 2026/0001" />} />
      <Campo id="cadPgrsEmissao" rotulo="Data de emissão do PGRS" erro={e.pgrsEmitidoEm} ajuda="O PGRS vale 12 meses a partir da emissão (RN-003)."
        controle={<input type="date" id="cadPgrsEmissao" value={typeof d.pgrsEmitidoEm === 'string' ? d.pgrsEmitidoEm.slice(0, 10) : ''}
          onChange={ev => aoMudar('pgrsEmitidoEm', ev.target.value ? new Date(ev.target.value + 'T12:00:00').toISOString() : '')} />} />
      <StatusPgrsCompleto cnpj={typeof d.cnpj === 'string' ? d.cnpj : ''} />
    </>
  );
}

/* RF-003: a cooperativa, com o galpão onde recebe a carga (RN-035). */
export function FormularioCooperativa({ d, e, aoMudar }: { d: Dados; e: Record<string, string>; aoMudar: AoMudar }) {
  return (
    <>
      <Campo id="cadNome" rotulo="Nome da cooperativa" erro={e.nome}
        controle={<input type="text" id="cadNome" value={d.nome || ''} onChange={ev => aoMudar('nome', ev.target.value)} placeholder="COOPERATIVA NOVA" />} />
      <Campo id="cadRazao" rotulo="Razão social" erro={e.razao}
        controle={<input type="text" id="cadRazao" value={d.razao || ''} onChange={ev => aoMudar('razao', ev.target.value)} />} />
      <CampoCnpj d={d} e={e} aoMudar={aoMudar} />
      <Campo id="cadContrato" rotulo="Instrumento com o município" erro={e.contrato}
        controle={<input type="text" id="cadContrato" value={d.contrato || ''} onChange={ev => aoMudar('contrato', ev.target.value)} placeholder="Termo de cooperação 000/2026" />} />
      <Campo id="cadLicenca" rotulo="Licença do galpão" erro={e.licenca}
        controle={<input type="text" id="cadLicenca" value={d.licenca || ''} onChange={ev => aoMudar('licenca', ev.target.value)} placeholder="LO 0000/2026" />} />
      <Campo id="cadCapacidade" rotulo="Capacidade diária do galpão (kg)" erro={e.capacidadeDiaria}
        controle={<input type="number" id="cadCapacidade" min={1} step="any" value={d.capacidadeDiaria ?? 3000} onChange={ev => aoMudar('capacidadeDiaria', ev.target.value)} />} />
      <CampoPonto d={d} e={e} aoMudar={aoMudar} rotulo="Bairro do galpão" />
    </>
  );
}
