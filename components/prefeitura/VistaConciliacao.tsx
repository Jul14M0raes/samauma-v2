'use client';

/* Conciliação do MTR, dentro da Fiscalização. Protótipo: cruza o arquivo
   exportado do SINIR com as cargas do sistema; não consulta o SINIR. */

import { useState } from 'react';
import { Cartao, Kpi, Kpis, Pino, Vazio } from '@/components/ui/Basicos';
import { useRecado } from '@/components/layout/RecadoProvider';
import { conciliarTexto, exemploDeArquivo, type Conciliacao } from '@/lib/dominio/conciliacaoMtr';
import { Catalogo } from '@/lib/dominio/catalogo';
import { Fmt } from '@/lib/dominio/formato';
import { PORTAL_MTR } from '@/lib/dominio/mtr';
import { Store } from '@/lib/dominio/store';
import { useDominio } from '@/state/hooks';

export function VistaConciliacao() {
  useDominio();
  const recado = useRecado();
  const [texto, setTexto] = useState('');
  const [resultado, setResultado] = useState<Conciliacao | null>(null);

  function conciliar() {
    const r = conciliarTexto(texto);
    setResultado(r);
    recado(`${r.resumo.lidas} manifesto(s) lido(s): ${r.resumo.casadas} casado(s), ` +
      `${r.resumo.divergentes} com divergência de massa.`);
  }

  return (
    <>
      <Cartao classe="sem-borda" corpo={
        <div className="aviso alerta">
          <b>Isto não é integração com o SINIR</b>
          <span>
            Não existe interface programável pública para consultar manifesto, e por isso o caminho
            aqui é o arquivo que o gerador exporta de {PORTAL_MTR}. Com credenciamento do órgão, a
            mesma conciliação passa a receber a lista por consulta, sem trocar nada do que está abaixo.
          </span>
        </div>
      } />

      <Cartao titulo="Arquivo exportado do SINIR"
        sub="Cole o conteúdo do arquivo, uma linha por manifesto"
        nota="Formato esperado: número, CNPJ do gerador, CNPJ do destinador, massa em quilos, data e CDF. Aceita vírgula ou ponto e vírgula, com ou sem cabeçalho — exportação de sistema público varia entre versões, e recusar o arquivo inteiro por uma linha torta empurraria de volta para a conferência manual."
        acao={
          <button className="btn sec sm" onClick={() => {
            setTexto(exemploDeArquivo(Store.todas()));
            recado('Arquivo de exemplo gerado a partir das cargas desta demonstração.');
          }}>Gerar exemplo</button>
        }
        corpo={
          <>
            <textarea rows={8} value={texto} onChange={e => setTexto(e.target.value)}
              placeholder={'numero;cnpj_gerador;cnpj_destinador;massa_kg;data;cdf\nMTR240001;12.345.678/0001-95;15.224.777/0001-07;820;2026-08-14;'}
              style={{ width: '100%', fontFamily: 'ui-monospace, monospace', fontSize: '12px' }} />
            <div className="acoes-form">
              <button className="btn" onClick={conciliar} disabled={!texto.trim()}>Conciliar</button>
              <span className="ajuda">Nada é gravado: a conciliação é uma conferência, não um registro.</span>
            </div>
          </>
        } />

      {resultado && <Resultado r={resultado} />}
    </>
  );
}

function Resultado({ r }: { r: Conciliacao }) {
  const tudoCerto = !r.resumo.divergentes && !r.resumo.semCarga && !r.resumo.semMtr;

  return (
    <>
      <Kpis>
        <Kpi rotulo="Manifestos lidos" valor={r.resumo.lidas} sub="linhas válidas no arquivo" tom="marca" />
        <Kpi rotulo="Casados com carga" valor={r.resumo.casadas}
          sub="manifesto e carga são o mesmo transporte" tom="ok" />
        <Kpi rotulo="Massa divergente" valor={r.resumo.divergentes}
          sub="acima da tolerância de 5%" tom={r.resumo.divergentes ? 'erro' : 'ok'} />
        <Kpi rotulo="Manifesto sem carga" valor={r.resumo.semCarga}
          sub="emitido no SINIR, ausente aqui" tom={r.resumo.semCarga ? 'alerta' : 'ok'} />
        <Kpi rotulo="Carga sem manifesto" valor={r.resumo.semMtr}
          sub="registrada aqui, ausente no arquivo" tom={r.resumo.semMtr ? 'alerta' : 'ok'} />
      </Kpis>

      {tudoCerto && (
        <Cartao classe="sem-borda" corpo={
          <div className="aviso bom">
            <b>Manifesto e sistema contam a mesma história</b>
            <span>Todas as linhas casaram com carga registrada, dentro da tolerância de massa.</span>
          </div>
        } />
      )}

      {!!r.invalidas.length && (
        <Cartao titulo="Linhas que não deu para ler" sub={`${r.invalidas.length} no arquivo`}
          corpo={
            <div className="lista-def">
              {r.invalidas.map(l => (
                <div className="def" key={l.linha}>
                  <b>Linha {l.linha} · {l.motivo}</b>
                  <p style={{ fontFamily: 'ui-monospace, monospace', fontSize: '12px' }}>{l.texto}</p>
                </div>
              ))}
            </div>
          } />
      )}

      {!!r.pares.length && (
        <Cartao titulo="Manifestos casados com carga"
          sub="Como o par foi encontrado importa: por número é identidade, por CNPJ e massa é inferência"
          corpo={
            <div className="tabela-rolagem">
              <table className="tabela">
                <thead>
                  <tr>
                    <th>MTR</th><th>Carga</th><th>Gerador</th>
                    <th className="num">Massa no MTR</th><th className="num">Massa no sistema</th>
                    <th className="num">Diferença</th><th>Casamento</th>
                  </tr>
                </thead>
                <tbody>
                  {r.pares.map(p => (
                    <tr key={p.mtr.linha}>
                      <td><b>{p.mtr.numero}</b><br /><span className="ajuda">linha {p.mtr.linha}</span></td>
                      <td>{p.demanda.id.replace('DEM-', '#')}</td>
                      <td>{p.demanda.gerador.nome}<br />
                        <span className="ajuda">{Catalogo.nomeResiduo(p.demanda.residuo)}</span></td>
                      <td className="num">{Fmt.kg(p.mtr.massaKg)}</td>
                      <td className="num">{Fmt.kg(p.demanda.verificadoKg ?? p.demanda.coletadoKg)}</td>
                      <td className="num">
                        {p.confere
                          ? <Pino rotulo={Fmt.kg(p.divergenciaKg)} tom="ok" />
                          : <Pino rotulo={`${Fmt.kg(p.divergenciaKg)} · ${Fmt.percentual(p.divergenciaPercentual)}`} tom="erro" />}
                      </td>
                      <td>
                        <Pino rotulo={p.por === 'NUMERO' ? 'por número' : 'inferido'}
                          tom={p.por === 'NUMERO' ? 'ok' : 'alerta'} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          } />
      )}

      <div className="colunas duas">
        <Cartao titulo="Manifesto sem carga no sistema"
          sub={r.mtrSemCarga.length ? `${r.mtrSemCarga.length} no arquivo` : undefined}
          nota="Transporte manifestado no SINIR que não tem carga correspondente aqui. Pode ser coleta feita fora do sistema, ou manifesto emitido por engano."
          corpo={r.mtrSemCarga.length
            ? <div className="lista-def">
                {r.mtrSemCarga.map(m => (
                  <div className="def" key={m.linha}>
                    <b>{m.numero}</b>
                    <p>{Fmt.kg(m.massaKg)} · gerador {m.cnpjGerador || '—'} · {m.data || 'sem data'}</p>
                  </div>
                ))}
              </div>
            : <Vazio titulo="Nenhum" texto="Todo manifesto do arquivo encontrou carga correspondente." />} />

        <Cartao titulo="Carga sem manifesto no arquivo"
          sub={r.cargaSemMtr.length ? `${r.cargaSemMtr.length} no sistema` : undefined}
          nota="Carga que saiu do gerador e não aparece no arquivo. É a hipótese mais séria das duas: transporte de resíduo sem manifesto é infração, e aqui ela aparece com nome e data."
          corpo={r.cargaSemMtr.length
            ? <div className="lista-def">
                {r.cargaSemMtr.slice(0, 12).map(d => (
                  <div className="def" key={d.id}>
                    <b>{d.id.replace('DEM-', '#')} · {d.gerador.nome}</b>
                    <p>{Catalogo.nomeResiduo(d.residuo)} · {Fmt.kg(d.verificadoKg ?? d.coletadoKg)} · {Fmt.data(d.recebidaEm || d.prazo)}</p>
                  </div>
                ))}
                {r.cargaSemMtr.length > 12 && (
                  <p className="ajuda">e mais {r.cargaSemMtr.length - 12} carga(s).</p>
                )}
              </div>
            : <Vazio titulo="Nenhuma" texto="Toda carga em transporte ou recebida tem manifesto no arquivo." />} />
      </div>
    </>
  );
}
