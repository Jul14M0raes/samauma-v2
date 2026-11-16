'use client';

/* RF-003: o Técnico da Prefeitura cadastra grandes geradores e cooperativas.
   O mesmo CNPJ não entra duas vezes (FL-006-E01). */

import { useState } from 'react';
import { FormularioCooperativa, FormularioGerador, type AoMudar, type Dados, type ValorCampo } from '@/components/cadastro/Formularios';
import { useRecado } from '@/components/layout/RecadoProvider';
import { Aviso, Cabecalho, Cartao } from '@/components/ui/Basicos';
import { Cadastros } from '@/lib/dados/cadastros';

type Tipo = 'gerador' | 'cooperativa';

export function NovoCadastro() {
  const recado = useRecado();
  const [tipo, setTipo] = useState<Tipo>('gerador');
  const [dados, setDados] = useState<Dados>({});
  const [erros, setErros] = useState<Record<string, string>>({});
  const aoMudar: AoMudar = (campo, valor) => setDados(d => ({ ...d, [campo]: valor }));

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    const { registro, erros: novos } = await Cadastros.criar(tipo, dados as Record<string, ValorCampo>);
    if (!registro) { setErros(novos); return; }
    recado(`${registro.nome} cadastrado. Código de acesso: ${registro.codigo}.`);
    setDados({}); setErros({});
  }

  const quantos = Object.keys(erros).length;

  return (
    <>
      <Cabecalho titulo="Novo cadastro" texto="Cadastre um grande gerador ou uma cooperativa do município." />
      <div className="filtros">
        {(['gerador', 'cooperativa'] as Tipo[]).map(t => (
          <button key={t} className={tipo === t ? 'on' : ''} aria-pressed={tipo === t}
            onClick={() => { setTipo(t); setDados({}); setErros({}); }}>
            {t === 'gerador' ? 'Grande gerador' : 'Cooperativa'}
          </button>
        ))}
      </div>
      {quantos > 0 && <Aviso tom="problema" titulo="Confira antes de continuar"
        texto={`${quantos} campo(s) precisam de correção.`} />}
      <Cartao classe="cartao-cadastro" corpo={
        <form className="form" onSubmit={enviar} noValidate>
          {tipo === 'gerador'
            ? <FormularioGerador d={dados} e={erros} aoMudar={aoMudar} />
            : <FormularioCooperativa d={dados} e={erros} aoMudar={aoMudar} />}
          <div className="largo acoes-form">
            <button className="btn" type="submit">Cadastrar</button>
            <span className="ajuda">O cadastro entra na trilha com autor e data.</span>
          </div>
        </form>
      } />
    </>
  );
}
