'use client';

import Link from 'next/link';
import { Aviso, Cabecalho, Cartao, Exportar, Pares } from '@/components/ui/Basicos';
import { useExportar } from '@/components/relatorio/useExportar';
import { CodigoQr } from '@/components/carteira/CodigoQr';
import { ListaComprovantes } from '@/components/ui/Listas';
import { Catalogo } from '@/lib/dominio/catalogo';
import { Fmt } from '@/lib/dominio/formato';
import { Painel } from '@/lib/dominio/indicadores';
import { soDigitos } from '@/lib/dominio/pgrs';
import { Regulatorio } from '@/lib/dominio/regulatorio';
import { Sessao } from '@/lib/dominio/sessao';
import { baixarDocxPgrs } from '@/lib/servicos/pgrsDocx';
import { baixarPdfPgrs } from '@/lib/servicos/pgrsPdf';
import { useDominio } from '@/state/hooks';
import { useComprovante } from '@/components/comprovante/ComprovanteProvider';

export default function PaginaGeradorDocumentos() {
  useDominio();
  const { abrir } = useComprovante();
  const { aoCsv, aoXls, aoPdf } = useExportar();
  const p = Painel.gerador(Sessao.gerador);
  const plano = p.situacao.pgrs;
  const pgrsCompleto = p.cadastro.pgrsCompleto;

  return (
    <>
      <Cabecalho titulo="Documentos e comprovação" texto="PGRS e os comprovantes emitidos no seu CNPJ." />

        <Cartao titulo="Plano de Gerenciamento de Resíduos Sólidos" sub={plano ? plano.numero : 'não cadastrado'}
          classe={plano && plano.vencido ? 'destaque-erro' : ''}
          corpo={plano ? (
            <>
              <Pares itens={[
                ['Número', plano.numero],
                ['Validade', Fmt.data(plano.validade)],
                ['Situação', plano.vencido
                  ? <span className="erro">{`vencido há ${Math.abs(plano.dias)} dias`}</span>
                  : plano.vencendo ? <span className="alerta">{`vence em ${plano.dias} dias`}</span> : <span className="ok">{`válido por ${plano.dias} dias`}</span>],
                ['Responsável técnico', p.cadastro.responsavelTecnico || 'não informado'],
                ['Volume declarado', Fmt.kg(p.cadastro.volumeMes) + ' / mês']
              ]} />
              <div className="acoes-form">
                <button className="btn" onClick={() => aoPdf('gerador', { id: Sessao.gerador })}>Baixar dossiê em PDF</button>
                {pgrsCompleto && (
                  <>
                    <button className="btn sec sm" onClick={() => baixarPdfPgrs(pgrsCompleto)}>PGRSS completo (PDF)</button>
                    <button className="btn sec sm" onClick={() => baixarDocxPgrs(pgrsCompleto)}>PGRSS completo (Word)</button>
                    <Link href={`/pgrs/gerar?cnpj=${soDigitos(p.cadastro.cnpj)}&retorno=documentos`} className="btn fantasma sm">Corrigir PGRS</Link>
                  </>
                )}
                <span className="ajuda">O dossiê reúne situação, massa destinada e a lista de processos.</span>
              </div>
            </>
          ) : <Aviso tom="problema" titulo="Sem PGRS cadastrado" texto="Enquanto não houver plano no sistema, o gerador permanece irregular." />} />

      <Cartao titulo="QR de regularização" sub="Situação, responsável técnico, última coleta e PGRS (RF-021)"
        corpo={p.situacao.ultimaDestinacao
          ? <div className="qr-regularizacao">
              <CodigoQr conteudo={Regulatorio.conteudoQr(p.cadastro, p.situacao)} tamanho={168} nivel="M"
                rotulo="QR de regularização" />
              <Pares itens={[
                ['Situação', p.situacao.rotulo],
                ['Responsável técnico', p.cadastro.responsavelTecnico || 'não informado'],
                ['Última coleta', Fmt.data(p.situacao.ultimaDestinacao)],
                ['PGRS', plano ? `${plano.numero} · válido até ${Fmt.data(plano.validade)}` : 'não enviado']
              ]} />
            </div>
          : <Aviso titulo="Ainda sem coleta comprovada" texto="O QR é gerado depois do primeiro recebimento confirmado." />} />

      <Cartao titulo="Comprovantes simplificados" sub={`${p.comprovadas} documento(s) emitido(s)`}
        acao={<Exportar escopo="gerador" aoCsv={e => aoCsv(e, { id: Sessao.gerador })} aoXls={e => aoXls(e, { id: Sessao.gerador })} aoPdf={e => aoPdf(e, { id: Sessao.gerador })} />}
        corpo={<ListaComprovantes demandas={p.comprovantes} visao="gerador" aoVer={abrir} />} />

      <Cartao titulo="Cooperativa contratada" sub="Quem executa a coleta para este gerador (RN-005)"
        corpo={p.operador
          ? <Pares itens={[
            ['Cooperativa', p.operador.nome],
            ['Instrumento', p.operador.detalhe],
            ['Ponto de coleta', Catalogo.endereco(p.cadastro.ponto)],
            ['Acesso', p.ponto.acesso]
          ]} />
          : <Aviso tom="problema" titulo="Sem contrato vigente" texto="Sem contrato com cooperativa o cadastro fica incompleto (RN-004) e a demanda vai à cooperativa do piloto." />} />
    </>
  );
}
