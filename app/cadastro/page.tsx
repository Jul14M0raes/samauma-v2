'use client';

/* SAMAÚMA — cadastro do gerador (RF-001). Cooperativas são cadastradas pelo
   Técnico da Prefeitura (RF-003) e cooperados pela própria cooperativa
   (RF-015); por isso esta página pública só cadastra estabelecimento. */

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { CabecalhoPublico } from '@/components/layout/CabecalhoPublico';
import { FormularioGerador, type AoMudar, type Dados, type EstadoBuscaCnpj, type ValorCampo } from '@/components/cadastro/Formularios';
import { useDominioPronto } from '@/components/layout/Bootstrap';
import { useRecado } from '@/components/layout/RecadoProvider';
import { Aviso, Cartao, Voltar } from '@/components/ui/Basicos';
import { Cadastro } from '@/lib/dominio/cadastro';
import { Conta } from '@/lib/dominio/conta';
import { casarPontoPorBairro, inferirRamoPorCnae } from '@/lib/dominio/formularios';
import { PERFIS } from '@/lib/dominio/perfis';
import { Sessao } from '@/lib/dominio/sessao';
import { buscarCnpj } from '@/lib/servicos/integracoes';
import type { Gerador } from '@/lib/dominio/tipos';
import { useCadastroVersao, usePgrsVersao } from '@/state/hooks';
import { Esqueleto } from '@/components/ui/Esqueleto';
import { Cadastros } from '@/lib/dados/cadastros';

function PaginaCadastroConteudo() {
  const pronto = useDominioPronto();
  useCadastroVersao();
  usePgrsVersao();
  const recado = useRecado();
  const router = useRouter();
  const busca = useSearchParams();
  const cnpjQuery = busca.get('cnpj');

  const [dados, setDados] = useState<Dados>(() => cnpjQuery ? { cnpj: Cadastro.formatarCnpj(cnpjQuery) } : {});
  const [erros, setErros] = useState<Record<string, string>>({});
  const [concluido, setConcluido] = useState<Gerador | null>(null);
  const [pulouPgrs, setPulouPgrs] = useState(false);
  const [buscaCnpj, setBuscaCnpj] = useState<EstadoBuscaCnpj>({ estado: 'ocioso' });

  if (!pronto) return <Esqueleto variante="publico" />;

  function entrarNaConta(registro: Gerador) {
    Conta.entrarComConta({ tipo: 'gerador', perfil: 'gerador', registro });
    Sessao.definirPerfil('gerador');
    Sessao.entrarComoGerador(registro.id);
    router.push(`/gerador/${PERFIS.gerador.abas[0].id}`);
  }

  if (concluido) {
    return (
      <main className="portao" id="conteudo">
        <div className="portao-caixa">
          <CabecalhoPublico />
          <div className="portao-grade modo-cadastro">
            <div className="cadastro-topo">
              <span className="cadastro-papel">CADASTRO CONCLUÍDO</span>
              <h2>{concluido.nome}</h2>
              <p>Guarde o código abaixo: é com ele que você volta ao sistema neste navegador.</p>
            </div>
            <Cartao classe="cartao-codigo" corpo={
              <>
                <div className="codigo-destaque">
                  <span>Seu código de acesso</span>
                  <b className="codigo-acesso">{concluido.codigo}</b>
                  <small>Gerador · ou entre com o CNPJ {concluido.cnpj}</small>
                </div>
                <div className="acoes-form">
                  <button className="btn" onClick={() => entrarNaConta(concluido)}>Entrar no sistema</button>
                  <button className="btn sec" onClick={() => {
                    if (!navigator.clipboard) { recado('Não foi possível copiar automaticamente — selecione e copie o código acima.'); return; }
                    navigator.clipboard.writeText(concluido.codigo!)
                      .then(() => recado('Código copiado.'))
                      .catch(() => recado('Não foi possível copiar automaticamente — selecione e copie o código acima.'));
                  }}>Copiar código</button>
                </div>
              </>
            } />
            <Aviso titulo="Anote antes de continuar"
              texto="O código fica guardado neste navegador. Se você limpar os dados do navegador ou usar outro aparelho, o cadastro se perde — é a limitação de um protótipo sem servidor." />
          </div>
        </div>
      </main>
    );
  }

  const quantos = Object.keys(erros).length;
  const aoMudar: AoMudar = (campo, valor) => setDados(d => ({ ...d, [campo]: valor }));

  /* Busca pública do CNPJ: preenche o que estiver vazio, nunca sobrescreve. */
  async function buscarDadosPorCnpj() {
    if (!dados.cnpj || !Cadastro.cnpjValido(dados.cnpj)) return;
    setBuscaCnpj({ estado: 'buscando' });
    try {
      const encontrados = await buscarCnpj(String(dados.cnpj));
      setBuscaCnpj({ estado: 'ok', dados: encontrados });
      setDados(d => {
        const proximo = { ...d };
        if (!proximo.nome) proximo.nome = encontrados.nomeFantasia || encontrados.razaoSocial;
        if (!proximo.razaoSocial) proximo.razaoSocial = encontrados.razaoSocial;
        if (!proximo.endereco && encontrados.logradouro) {
          proximo.endereco = [encontrados.logradouro, encontrados.numero].filter(Boolean).join(', ');
        }
        if (!proximo.ramo && encontrados.cnaePrincipal) {
          const ramo = inferirRamoPorCnae(encontrados.cnaePrincipal);
          if (ramo) proximo.ramo = ramo;
        }
        if (!proximo.ponto && encontrados.bairro) {
          const casado = casarPontoPorBairro(encontrados.bairro);
          if (casado) proximo.ponto = casado.id;
        }
        return proximo;
      });
    } catch (erro) {
      setBuscaCnpj({ estado: 'erro', motivo: erro instanceof Error ? erro.message : 'Falha na consulta.' });
    }
  }

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    const { registro, erros: novosErros } = await Cadastros.criar('gerador', dados as Record<string, ValorCampo>, true);
    if (!registro) { setErros(novosErros); return; }
    setConcluido(registro as Gerador);
  }

  if (!dados.cnpj && !pulouPgrs) {
    return (
      <main className="portao" id="conteudo">
        <div className="portao-caixa">
          <CabecalhoPublico />
          <div className="portao-grade modo-cadastro">
            <div className="cadastro-topo">
              <Voltar para="/" rotulo="Voltar para a entrada" />
              <span className="cadastro-papel">QUEM GERA O RESÍDUO</span>
              <h2>Cadastro de gerador</h2>
              <p>Se o estabelecimento ainda não tem PGRS, dá para montá-lo agora — ou pular esta etapa e cadastrar o essencial primeiro.</p>
            </div>
            <div className="colunas duas">
              <Cartao classe="acao-viva" titulo="Fazer o PGRS agora" sub="O plano volta anexado ao CNPJ"
                corpo={
                  <>
                    <p className="texto">Preenche identificação, classificação e manejo dos resíduos, com saída em PDF e Word.</p>
                    <button className="btn" type="button" onClick={() => router.push('/pgrs/gerar?retorno=cadastro')}>
                      Preencher PGRS completo
                    </button>
                  </>
                } />
              <Cartao titulo="Pular esta etapa" sub="Dá para enviar depois, em Documentos"
                corpo={
                  <>
                    <p className="texto">Sem PGRS, a situação regulatória começa como Irregular — o sistema explica o motivo.</p>
                    <button className="btn sec" type="button" onClick={() => setPulouPgrs(true)}>Pular e continuar cadastro</button>
                  </>
                } />
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="portao" id="conteudo">
      <div className="portao-caixa">
        <CabecalhoPublico />
        <div className="portao-grade modo-cadastro">
          <div className="cadastro-topo">
            <Voltar para="/" rotulo="Voltar para a entrada" />
            <span className="cadastro-papel">QUEM GERA O RESÍDUO</span>
            <h2>Cadastro de gerador</h2>
            <p>Estabelecimento que precisa destinar resíduo e comprovar a destinação.</p>
          </div>

          {quantos > 0 && <Aviso titulo="Confira antes de continuar" tom="problema"
            texto={`${quantos} campo(s) precisam de correção. O que falta está marcado abaixo.`} />}

          <Cartao classe="cartao-cadastro" corpo={
            <form className="form" onSubmit={enviar} noValidate>
              <FormularioGerador d={dados} e={erros} aoMudar={aoMudar} busca={buscaCnpj} aoBuscarCnpj={buscarDadosPorCnpj} />
              <div className="largo acoes-form">
                <button className="btn" type="submit">Concluir cadastro e entrar</button>
                <Link href="/" className="btn sec">Cancelar</Link>
              </div>
            </form>
          } />
          <Aviso titulo="Cadastro demonstrativo, sem senha"
            texto="Nada aqui sai deste navegador. Em produção, a identificação viria do login único do Município ou do Gov.br." />
        </div>
      </div>
    </main>
  );
}

export default function PaginaCadastro() {
  return (
    <Suspense fallback={null}>
      <PaginaCadastroConteudo />
    </Suspense>
  );
}
