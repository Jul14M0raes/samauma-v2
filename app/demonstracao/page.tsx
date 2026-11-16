'use client';

/* SAMAÚMA — áreas de demonstração.

   As quatro portas na ordem do ciclo. Ficava na raiz do site até a entrada
   virar tela de acesso; agora é o caminho de quem quer conhecer o sistema sem
   ter conta, e continua honrando o atalho `?perfil=` que já circulava em link. */

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import { useDominioPronto } from '@/components/layout/Bootstrap';
import { Marca } from '@/components/ui/Basicos';
import { ORDEM_PERFIS, PERFIS } from '@/lib/dominio/perfis';
import { Sessao } from '@/lib/dominio/sessao';
import type { Perfil } from '@/lib/dominio/tipos';
import { useCadastroVersao, useContaVersao, useSessaoVersao } from '@/state/hooks';
import { Esqueleto } from '@/components/ui/Esqueleto';

function primeiraRota(perfil: Perfil) {
  return `/${perfil}/${PERFIS[perfil].abas[0].id}`;
}

/* Título de cartão só desta tela: em qualquer outro lugar do sistema
   (sidebar, cadastro) o perfil continua se chamando "Gerador" — aqui, e só
   aqui, a pergunta é "em que ramo você trabalha", então o nome ganha a
   forma mais descritiva. */
const TITULOS_DEMO: Partial<Record<Perfil, string>> = {
  gerador: 'Geradores de Resíduos'
};

/* Ícones desta tela, à parte de `ICONES_PERFIL` (usado também no cadastro,
   que não muda aqui). */
const ICONES_DEMO: Record<Perfil, string> = {
  gerador: '<path d="M12 3.3 19.5 7.6v8.8L12 20.7 4.5 16.4V7.6z"/><path d="M4.7 7.6 12 11.9l7.3-4.3"/><path d="M12 11.9v8.8"/>',
  cooperativa: '<path d="M2.7 7.8h10.6v8.8H2.7z"/><path d="M13.3 11h3.9l3.1 3v2.6h-7z"/><circle cx="7" cy="18.3" r="1.7"/><circle cx="17" cy="18.3" r="1.7"/>',
  prefeitura: '<path d="M3 9.6 12 4.3l9 5.3"/><path d="M4.2 9.6v9.4M8.6 9.6v9.4M15.4 9.6v9.4M19.8 9.6v9.4"/><path d="M2.5 20.5h19"/>',
  gestao: '<path d="M4 19.5V11M9.3 19.5V6.5M14.7 19.5v-6M20 19.5V4"/><path d="M2.5 20.5h19"/>'
};

function PaginaDemonstracaoConteudo() {
  const pronto = useDominioPronto();
  useSessaoVersao();
  useContaVersao();
  useCadastroVersao();
  const router = useRouter();
  const busca = useSearchParams();

  useEffect(() => {
    if (!pronto) return;

    const atalho = busca.get('perfil') as Perfil | null;
    if (atalho && PERFIS[atalho]) {
      entrar(atalho, busca.get('destino'));
      return;
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pronto]);

  function entrar(perfil: Perfil, destinoId?: string | null) {
    Sessao.definirPerfil(perfil);
    if (destinoId) Sessao.entrarComoDestino(destinoId);
    router.push(primeiraRota(perfil));
  }

  if (!pronto) return <Esqueleto variante="publico" />;

  return (
    <main className="portao" id="conteudo">
      <Link href="/" className="demo-voltar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M19 12H5" /><path d="M11 18 5 12l6-6" />
        </svg>
        Voltar
      </Link>

      <div className="portao-caixa">
        <header className="portao-marca">
          <Marca tamanho={128} forma="completa" />
        </header>

        <h1 id="portaoTitulo" className="demo-titulo">Em qual ramo você trabalha?</h1>
        <span className="demo-titulo-divisor" aria-hidden="true"></span>

        <p className="portao-lead">
          O gerador declara a coleta. A cooperativa avalia, coleta, recebe e confirma.
          A Prefeitura acompanha. O ciclo só fecha quando existe prova.
        </p>

        <div className="portao-grade">
          {ORDEM_PERFIS.map(chave => {
            const p = PERFIS[chave];
            return (
              <article key={chave} className="porta porta-grande" style={{ ['--cor-perfil' as string]: p.cor }}>
                <span className="porta-icone porta-icone-grande" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"
                    dangerouslySetInnerHTML={{ __html: ICONES_DEMO[chave] }} />
                </span>
                <h2>{TITULOS_DEMO[chave] || p.nome}</h2>
                <span className="porta-divisor" aria-hidden="true"></span>
                <p>{p.resumo}</p>
                <div className="porta-acoes">
                  {p.entradas.map((e, i) => (
                    <button key={i} className={e.secundaria ? 'porta-secundaria' : 'btn'}
                      onClick={() => entrar(p.id, e.destino)}>
                      {e.secundaria ? e.rotulo : <>ENTRAR<span className="seta"> →</span></>}
                    </button>
                  ))}
                </div>
              </article>
            );
          })}
        </div>

        <p className="demo-rodape-selo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 3 4.5 6v6c0 4.5 3 7.5 7.5 9 4.5-1.5 7.5-4.5 7.5-9V6Z" />
          </svg>
          Protótipo demonstrativo da Prefeitura de Porto Velho/RO.
        </p>

        <p className="portao-aviso">
          Organizações, pessoas, documentos, coordenadas e valores são fictícios
          ou aproximados. O protótipo não acessa sistemas oficiais nem o geoportal, não movimenta dinheiro e não
          representa contratação, decisão administrativa ou procedimento homologado pela Prefeitura de Porto Velho.
        </p>
      </div>
    </main>
  );
}

export default function PaginaDemonstracao() {
  return (
    <Suspense fallback={null}>
      <PaginaDemonstracaoConteudo />
    </Suspense>
  );
}
