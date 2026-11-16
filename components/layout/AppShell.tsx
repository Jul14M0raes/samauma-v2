'use client';

/* SAMAÚMA — moldura do perfil: barra lateral com as abas, o sino de alertas
   e a identidade da conta. Também é a guarda de rota: cada perfil só abre as
   próprias telas (RN-040, RNF-003). A guarda é de interface; a verificação
   real de acesso fica com o backend. */

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { alertasDestino, alertasGerador, alertasMunicipio, type Alerta } from '@/lib/dominio/alertas';
import { Cadastro } from '@/lib/dominio/cadastro';
import { Carteiras } from '@/lib/dominio/carteira';
import { Parametros } from '@/lib/dominio/parametros';
import { Recorrencia } from '@/lib/dominio/recorrencia';
import { Conta } from '@/lib/dominio/conta';
import { EM_CURSO } from '@/lib/dominio/catalogo';
import { Painel } from '@/lib/dominio/indicadores';
import { PERFIS } from '@/lib/dominio/perfis';
import { Sessao } from '@/lib/dominio/sessao';
import { Store } from '@/lib/dominio/store';
import type { Perfil } from '@/lib/dominio/tipos';
import { useCadastroVersao, useCarteirasVersao, useContaVersao, useSessaoVersao, useStoreVersao } from '@/state/hooks';
import { useDominioPronto } from './Bootstrap';
import { Esqueleto } from '../ui/Esqueleto';
import { IconeAba, Marca } from '../ui/Basicos';
import { SinoAlertas } from './SinoAlertas';

function contadoresDoPerfil(perfil: Perfil): Record<string, number> {
  if (perfil === 'gerador') {
    const minhas = Store.doGerador(Sessao.gerador);
    return { demandas: minhas.filter(d => EM_CURSO.includes(d.status) || d.status === 'CRIADA').length };
  }
  if (perfil === 'cooperativa') {
    const minhas = Store.paraDestino(Sessao.destino.id);
    return {
      demandas: minhas.filter(d => ['DISPONIVEL', 'ACEITA', 'PENDENCIA_EXECUCAO'].includes(d.status)).length,
      fila: Store.aCaminhoDe(Sessao.destino.id).length
    };
  }
  if (perfil === 'gestao') return {};
  return {
    painel: Store.pendentes().length,
    geradores: Painel.geradores().filter(g => g.situacao.id !== 'REGULAR').length
  };
}

function contextoDoPerfil(perfil: Perfil): string {
  if (perfil === 'gerador') return Sessao.cadastroGerador?.nome || '—';
  if (perfil === 'cooperativa') return Sessao.cooperativa?.nome || Sessao.destino.nome;
  return 'Secretaria de Meio Ambiente';
}

function alertasDoPerfil(perfil: Perfil): Alerta[] {
  if (perfil === 'gerador') return alertasGerador(Sessao.gerador);
  if (perfil === 'cooperativa') return alertasDestino(Sessao.destino.id);
  if (perfil === 'prefeitura') return alertasMunicipio();
  return [];
}

const CHAVE_SIDEBAR = 'samauma.next.sidebar.v1';

/* Ícone de alternar a barra lateral: um retângulo com uma divisória — a
   mesma leitura de "painel lateral" usada em editores de código. */
function IconeSidebar() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.2" />
      <path d="M9.7 4.5v15" />
    </svg>
  );
}

function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  const primeira = partes[0]?.[0] || '';
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : '';
  return (primeira + ultima).toUpperCase() || '—';
}

export function AppShell({ perfil, children }: { perfil: Perfil; children: React.ReactNode }) {
  const pronto = useDominioPronto();
  useStoreVersao();
  useSessaoVersao();
  useContaVersao();
  useCadastroVersao();
  useCarteirasVersao();
  const pathname = usePathname();
  const router = useRouter();

  /* Fica salvo no aparelho — não é preferência de conta, é do espaço de
     tela de quem usa agora. A leitura só roda depois que `pronto` já
     passou pelo primeiro paint (ver comentário em Bootstrap.tsx), então
     não há divergência entre o que o servidor mandou e o que o cliente
     mostra. */
  const [sidebarFechada, setSidebarFechada] = useState(() => {
    if (typeof localStorage === 'undefined') return false;
    try { return localStorage.getItem(CHAVE_SIDEBAR) === 'fechada'; } catch { return false; }
  });

  function alternarSidebar() {
    setSidebarFechada(atual => {
      const novo = !atual;
      try { localStorage.setItem(CHAVE_SIDEBAR, novo ? 'fechada' : 'aberta'); } catch { /* sem storage, só não persiste */ }
      return novo;
    });
  }

  /* Quem entrou por conta só abre o próprio perfil; na demonstração, o
     perfil escolhido na vitrine vale até trocar. */
  const perfilPermitido = Conta.atual ? Conta.atual.perfil : Sessao.perfil;
  const bloqueado = !!perfilPermitido && perfilPermitido !== perfil;

  useEffect(() => {
    if (pronto && !bloqueado && Sessao.perfil !== perfil) Sessao.definirPerfil(perfil);
  }, [pronto, bloqueado, perfil]);

  if (!pronto) return <Esqueleto variante="app" />;

  if (bloqueado) {
    return (
      <main className="portao" id="conteudo">
        <div className="portao-caixa">
          <div className="nao-encontrado">
            <h1>Acesso não permitido</h1>
            <p>Esta área é do perfil {PERFIS[perfil].nome}. Você está usando o perfil {PERFIS[perfilPermitido!].nome}.</p>
            <div className="acoes-form">
              <Link className="btn" href={`/${perfilPermitido}/${PERFIS[perfilPermitido!].abas[0].id}`}>Voltar ao meu perfil</Link>
              <button className="btn sec" onClick={() => { Conta.sair(); Sessao.definirPerfil(null); router.push('/demonstracao'); }}>Trocar perfil</button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const perfilAtual = PERFIS[perfil];
  const contadores = contadoresDoPerfil(perfil);
  const abaAtiva = pathname.split('/')[2] || perfilAtual.abas[0].id;
  const comConta = !!Conta.atual;
  const contexto = contextoDoPerfil(perfil);

  const trocarOuSair = () => {
    if (comConta) {
      Conta.sair();
    }
    Sessao.definirPerfil(null);
    /* Quem entrou por conta volta para o acesso; quem estava só olhando a
       demonstração volta para a vitrine, e não para uma tela de login. */
    router.push(comConta ? '/' : '/demonstracao');
  };

  const reiniciar = () => {
    Store.reiniciar();
    Cadastro.limpar();
    Carteiras.reiniciar();
    Recorrencia.reiniciar();
    Parametros.reiniciar();
    router.push(`/${perfil}/${perfilAtual.abas[0].id}`);
  };

  /* Telas que existem sem ocupar aba propria: sao detalhamento de uma aba, e
     por isso mantem a aba de origem acesa enquanto o usuario esta nelas.

     O mapa e por perfil porque o mesmo trecho de rota significa coisas
     diferentes: `demandas` e aba propria no gerador e detalhe de processo na
     prefeitura. Um mapa unico acenderia a aba errada. */
  const ABA_DE_ORIGEM: Record<string, Record<string, string>> = {
    gerador: { nova: 'demandas' },
    cooperativa: {},
    prefeitura: {
      mapa: 'painel', metodologia: 'relatorios',
      geradores: 'cadastros', catadores: 'cadastros',
      processos: 'fiscalizacao', demandas: 'fiscalizacao'
    }
  };
  const origem = ABA_DE_ORIGEM[perfil] || {};

  const botoesAbas = () => (
    <>
      {perfilAtual.abas.map(a => {
        const ativa = abaAtiva === a.id || origem[abaAtiva] === a.id;
        const n = contadores[a.id];
        return (
          <Link key={a.id} href={`/${perfil}/${a.id}`} className={ativa ? 'on' : ''} aria-current={ativa ? 'page' : undefined}>
            <span>{a.rotulo}</span>{!!n && <span className="n num">{n}</span>}{a.novo && <span className="novo">novo</span>}
          </Link>
        );
      })}
    </>
  );

  const rodape = (
    <footer className="rodape">
      <Marca tamanho={24} />
      <p><b>Protótipo demonstrativo.</b>
        O gerador declara a coleta, a cooperativa avalia, executa e confirma o recebimento, e a Prefeitura
        acompanha. Dados fictícios; bairros reais de Porto Velho/RO com coordenadas aproximadas.</p>
    </footer>
  );

  const alertas = alertasDoPerfil(perfil);

  return (
    <div className="app app-sidebar" style={{ ['--perfil' as string]: perfilAtual.cor }}>
      <aside className={`sidebar ${sidebarFechada ? 'fechada' : ''}`}>
        <div className="sidebar-marca">
          <Marca tamanho={34} />
          <div className="marca-texto">
            <strong>SAMAÚMA</strong>
            <small>Grandes geradores e inclusão produtiva · Porto Velho/RO</small>
          </div>
        </div>

        <p className="sidebar-secao">Menu</p>
        <nav className="sidebar-nav" aria-label="Seções do perfil">
          {perfilAtual.abas.map(a => {
            const ativa = abaAtiva === a.id || origem[abaAtiva] === a.id;
            const n = contadores[a.id];
            return (
              <Link key={a.id} href={`/${perfil}/${a.id}`} className={ativa ? 'on' : ''} aria-current={ativa ? 'page' : undefined}>
                <IconeAba id={a.id} /><span>{a.rotulo}</span>{!!n && <span className="n num">{n}</span>}{a.novo && <span className="novo">novo</span>}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-rodape">
          <button type="button" className="sidebar-reiniciar" title="Voltar aos dados iniciais" onClick={reiniciar}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 12a8 8 0 1 1-2.6-5.9" /><path d="M20 4v5h-5" />
            </svg>
            Reiniciar dados
          </button>
          <div className="sidebar-conta">
            <span className="sidebar-avatar" aria-hidden="true">{iniciais(contexto)}</span>
            <div className="sidebar-conta-texto">
              <span className="etiqueta">{perfilAtual.nome}</span>
              <span className="onde">{contexto}</span>
            </div>
          </div>
          <button type="button" className="sidebar-sair" onClick={trocarOuSair}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" /><path d="M10 8l4 4-4 4" /><path d="M14 12H3" />
            </svg>
            {comConta ? 'Sair' : 'Trocar perfil'}
          </button>
        </div>
      </aside>

      <div className="sidebar-coluna">
        <header className="sidebar-topo">
          <button type="button" className="sidebar-alternar" onClick={alternarSidebar}
            aria-expanded={!sidebarFechada} title={sidebarFechada ? 'Abrir barra lateral' : 'Fechar barra lateral'}>
            <IconeSidebar />
            <span className="vis-oculto">{sidebarFechada ? 'Abrir barra lateral' : 'Fechar barra lateral'}</span>
          </button>
          <div className="sidebar-topo-marca">
            <Marca tamanho={26} />
            <strong>SAMAÚMA</strong>
          </div>
          <SinoAlertas alertas={alertas} />
        </header>

        <main className="principal" id="conteudo">
          <div id="tela">{children}</div>
        </main>

        {rodape}
      </div>

      <nav className="menu-mobile" aria-label="Seções do perfil">{botoesAbas()}</nav>
    </div>
  );
}
