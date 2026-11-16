'use client';

/* SAMAÚMA — acesso: gov.br (ainda sem credenciamento, o botão explica o que
   falta), código de acesso e o protótipo demonstrativo em `/demonstracao`. */

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { useDominioPronto } from '@/components/layout/Bootstrap';
import { Marca } from '@/components/ui/Basicos';
import { Conta } from '@/lib/dominio/conta';
import { PERFIS } from '@/lib/dominio/perfis';
import { Sessao } from '@/lib/dominio/sessao';
import type { Conta as TConta, Perfil } from '@/lib/dominio/tipos';
import { useCadastroVersao, useContaVersao } from '@/state/hooks';
import { Esqueleto } from '@/components/ui/Esqueleto';

function PaginaAcessoConteudo() {
  const pronto = useDominioPronto();
  useContaVersao();
  useCadastroVersao();
  const router = useRouter();
  const busca = useSearchParams();

  const [codigo, setCodigo] = useState('');
  const [erro, setErro] = useState('');
  const [recadoGov, setRecadoGov] = useState('');

  useEffect(() => {
    if (!pronto) return;
    /* Atalho `?perfil=` continua valendo: havia link circulando com ele. */
    const atalho = busca.get('perfil') as Perfil | null;
    if (atalho && PERFIS[atalho]) {
      router.replace(`/demonstracao?${busca.toString()}`);
      return;
    }
    const conta = Conta.retomar();
    if (conta) abrir(conta);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pronto]);

  function abrir(conta: TConta) {
    Conta.entrarComConta(conta);
    Sessao.definirPerfil(conta.perfil);
    if (conta.tipo === 'gerador') { Sessao.entrarComoGerador(conta.registro.id); router.push(`/gerador/${PERFIS.gerador.abas[0].id}`); }
    if (conta.tipo === 'cooperativa') { Sessao.entrarComoDestino(conta.registro.id); router.push(`/cooperativa/${PERFIS.cooperativa.abas[0].id}`); }
  }

  function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    setRecadoGov('');
    const { conta, erro: falha } = Conta.entrar(codigo);
    if (falha || !conta) { setErro(falha || 'Não encontramos essa conta.'); return; }
    abrir(conta);
  }

  if (!pronto) return <Esqueleto variante="publico" />;
  const lembretes = Conta.lembretes();

  return (
    <main className="login" id="conteudo">
      <div className="login-caixa">
        <header className="login-marca">
          <Marca tamanho="clamp(76px, 14vh, 118px)" forma="completa" />
        </header>

        <h1>Acesse sua conta</h1>
        <p className="login-lead">Entre pelo gov.br ou com seu código de acesso</p>

        {/* O gov.br vem primeiro porque é a autenticação que vale em produção. */}
        <button type="button" className="botao-gov"
          onClick={() => setRecadoGov(
            'A entrada pelo gov.br depende de credenciamento do órgão no Login Único do governo federal. ' +
            'Enquanto isso não acontece, use o código de acesso abaixo.')}>
          <span className="gov-marca" aria-hidden="true">
            <b>gov</b><i>.br</i>
          </span>
          <span>Entrar com gov.br</span>
        </button>

        <p className="login-gov-nota">Depende de credenciamento do órgão no Login Único do governo federal — ainda não disponível.</p>
        {recadoGov && <p className="login-recado" role="status" aria-live="polite">{recadoGov}</p>}

        <div className="login-ou"><span>ou</span></div>

        <form onSubmit={enviar}>
          <div className="campo-icone">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} aria-hidden="true">
              <circle cx="12" cy="8" r="3.4" /><path d="M5.5 19.5a6.5 6.5 0 0 1 13 0" strokeLinecap="round" />
            </svg>
            <input type="text" value={codigo} aria-label="Código de acesso"
              placeholder="Código de acesso" autoComplete="username"
              onChange={e => { setCodigo(e.target.value.toUpperCase()); setErro(''); }} />
          </div>

          <p className="login-nota">Nesta demonstração, só o código é exigido — sem senha.</p>

          <div className="login-linha">
            <span>O código vem no cadastro ou na carteira</span>
            <Link href="/cadastro">Não tenho conta</Link>
          </div>

          {erro && <p className="login-erro" role="alert">{erro}</p>}

          <button className="btn login-entrar" type="submit">ENTRAR</button>
        </form>

        {lembretes.length > 0 && (
          <div className="login-lembretes">
            <span className="etiqueta">Contas deste aparelho</span>
            {lembretes.map(c => (
              <button key={c.codigo} type="button" onClick={() => {
                const { conta } = Conta.entrar(c.codigo);
                if (conta) abrir(conta);
              }}>
                {c.nome}<small>{c.papel} · {c.codigo}</small>
              </button>
            ))}
          </div>
        )}
      </div>

      <Link href="/demonstracao" className="login-prototipo">
        Entrar no protótipo demonstrativo
        <small>Conheça o sistema pelas quatro áreas, sem precisar de conta</small>
      </Link>

      <p className="login-rodape">
        <Link href="/prefeitura/metodologia">Metodologia, fontes e limites</Link>
        <span>·</span>
        <span>Protótipo demonstrativo · dados fictícios</span>
      </p>
    </main>
  );
}

export default function PaginaAcesso() {
  return (
    <Suspense fallback={null}>
      <PaginaAcessoConteudo />
    </Suspense>
  );
}
