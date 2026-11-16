'use client';

/* SAMAÚMA — configurações.
   Só existe o que já é real: tamanho da interface (zoom de página — o CSS
   inteiro é em px fixo, não rem, então "aumentar fonte" de verdade é isso),
   reduzir movimento (força a mesma redução que `prefers-reduced-motion` dá
   pra quem sabe mexer no sistema operacional, pra quem não sabe ou está num
   aparelho emprestado) e alto contraste (escurece texto e traço secundário
   além do mínimo AA que o site já cumpre). Fica no aparelho, não é dado do
   sistema — por isso não muda por perfil. */

import { useRef, useState } from 'react';
import { useRecado } from '@/components/layout/RecadoProvider';
import { Acessibilidade, type TamanhoInterface } from '@/lib/dominio/acessibilidade';
import { exportarBackup, importarBackup, lerBackup } from '@/lib/dominio/backup';
import { baixarBlob, carimboArquivo } from '@/lib/servicos/arquivo';
import { useAcessibilidadeVersao } from '@/state/hooks';
import { Aviso, Cabecalho, Cartao } from '../ui/Basicos';

const TAMANHOS: [TamanhoInterface, string][] = [
  ['padrao', 'Padrão'],
  ['grande', 'Grande'],
  ['maior', 'Maior']
];

function Interruptor({ ligado, aoAlternar, rotulo }: { ligado: boolean; aoAlternar: (v: boolean) => void; rotulo: string }) {
  return (
    <button type="button" role="switch" aria-checked={ligado} aria-label={rotulo}
      className={`interruptor ${ligado ? 'on' : ''}`} onClick={() => aoAlternar(!ligado)}>
      <span className="bola" aria-hidden="true"></span>
    </button>
  );
}

function LinhaConfig({ titulo, texto, controle }: { titulo: string; texto: string; controle: React.ReactNode }) {
  return (
    <div className="config-linha">
      <div>
        <b>{titulo}</b>
        <p>{texto}</p>
      </div>
      {controle}
    </div>
  );
}

function CopiaDeSeguranca() {
  const recado = useRecado();
  const entrada = useRef<HTMLInputElement>(null);
  const [pendente, setPendente] = useState<{ texto: string; chaves: number; geradoEm: string } | null>(null);

  function baixar() {
    const arquivo = exportarBackup(localStorage);
    baixarBlob(new Blob([JSON.stringify(arquivo, null, 2)], { type: 'application/json' }), `samauma-backup-${carimboArquivo()}.json`);
    recado(`Backup gerado com ${Object.keys(arquivo.chaves).length} grupo(s) de dados.`);
  }

  async function escolher(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    e.target.value = '';
    if (!arquivo) return;
    const texto = await arquivo.text();
    const lido = lerBackup(texto);
    if (!lido.ok) { recado(lido.erro); return; }
    setPendente({ texto, chaves: Object.keys(lido.arquivo.chaves).length, geradoEm: lido.arquivo.geradoEm });
  }

  function restaurar() {
    if (!pendente) return;
    const r = importarBackup(localStorage, pendente.texto);
    if (!r.ok) { recado(r.erro); setPendente(null); return; }
    window.location.reload();
  }

  return (
    <Cartao titulo="Dados deste aparelho" sub="Cópia de segurança, para não perder o histórico"
      corpo={
        <div className="config-lista">
          <LinhaConfig titulo="Baixar cópia dos dados"
            texto="Gera um arquivo com demandas, cadastros, carteiras, vendas e o restante guardado aqui. Sem servidor, limpar o cache do navegador apaga tudo."
            controle={<button className="btn sec sm" onClick={baixar}>Baixar backup</button>} />
          <LinhaConfig titulo="Restaurar de um arquivo"
            texto="Substitui os dados deste aparelho pelos do arquivo escolhido. Preferências de exibição não são alteradas."
            controle={
              <>
                <button className="btn sec sm" onClick={() => entrada.current?.click()}>Escolher arquivo</button>
                <input ref={entrada} type="file" accept="application/json,.json" className="oculto" tabIndex={-1} onChange={escolher} aria-label="Arquivo de backup" />
              </>
            } />
          {pendente && (
            <>
              <Aviso tom="alerta" titulo="Substituir os dados deste aparelho?"
                texto={`Arquivo de ${new Date(pendente.geradoEm).toLocaleString('pt-BR')} com ${pendente.chaves} grupo(s) de dados. O que existe aqui agora será apagado e não dá para desfazer.`} />
              <div className="config-linha">
                <span />
                <span style={{ display: 'flex', gap: 8 }}>
                  <button className="btn fantasma sm" onClick={() => setPendente(null)}>Cancelar</button>
                  <button className="btn erro sm" onClick={restaurar}>Substituir dados</button>
                </span>
              </div>
            </>
          )}
        </div>
      }
      nota="O arquivo fica com você e não passa por nenhum servidor." />
  );
}

export function Configuracoes() {
  useAcessibilidadeVersao();
  const { tamanho, movimentoReduzido, altoContraste, tema } = Acessibilidade;
  const alterado = tamanho !== 'padrao' || movimentoReduzido || altoContraste || tema !== 'claro';

  return (
    <>
      <Cabecalho titulo="Configurações" texto="Preferências de exibição e cópia de segurança dos dados, tudo salvo neste aparelho." />

      <Cartao titulo="Aparência" sub="Como a tela se apresenta"
        corpo={
          <div className="config-lista">
            <LinhaConfig titulo="Tema escuro" texto="Troca fundo, cartão e texto para um conjunto escuro pensado pra manter tudo legível."
              controle={<Interruptor ligado={tema === 'escuro'} aoAlternar={v => Acessibilidade.definirTema(v ? 'escuro' : 'claro')} rotulo="Tema escuro" />} />
          </div>
        } />

      <Cartao titulo="Acessibilidade" sub="Ajustes de leitura e navegação"
        corpo={
          <div className="config-lista">
            <LinhaConfig titulo="Tamanho da interface" texto="Aumenta texto, ícones e espaçamento juntos, como o zoom do navegador."
              controle={
                <div className="filtros" role="group" aria-label="Tamanho da interface">
                  {TAMANHOS.map(([id, rotulo]) => (
                    <button key={id} className={tamanho === id ? 'on' : ''} aria-pressed={tamanho === id}
                      onClick={() => Acessibilidade.definirTamanho(id)}>{rotulo}</button>
                  ))}
                </div>
              } />
            <LinhaConfig titulo="Reduzir movimento" texto="Desliga transição e animação da interface, mesmo que o sistema operacional não peça isso."
              controle={<Interruptor ligado={movimentoReduzido} aoAlternar={Acessibilidade.definirMovimentoReduzido.bind(Acessibilidade)} rotulo="Reduzir movimento" />} />
            <LinhaConfig titulo="Alto contraste" texto="Escurece texto secundário e linhas divisórias além do mínimo que o site já segue."
              controle={<Interruptor ligado={altoContraste} aoAlternar={Acessibilidade.definirAltoContraste.bind(Acessibilidade)} rotulo="Alto contraste" />} />
          </div>
        }
        nota={alterado ? undefined : 'Nada foi alterado — a interface está no padrão.'}
        acao={alterado ? <button className="btn sec sm" onClick={() => Acessibilidade.restaurar()}>Restaurar padrão</button> : undefined} />

      <CopiaDeSeguranca />
    </>
  );
}
