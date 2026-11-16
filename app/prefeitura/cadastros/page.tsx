'use client';

/* Cadastros do município (MOD-001): estabelecimentos, cooperados e
   cooperativas, e o cadastro novo feito pelo Técnico (RF-003). */

import { useState } from 'react';

import { VistaCatadores } from '@/components/prefeitura/VistaCatadores';
import { VistaCooperativas } from '@/components/prefeitura/VistaCooperativas';
import { VistaGeradores } from '@/components/prefeitura/VistaGeradores';
import { NovoCadastro } from '@/components/prefeitura/NovoCadastro';
import { idAba, idPainel, SubAbas } from '@/components/ui/SubAbas';
import { CATADORES, COOPERATIVAS, GERADORES } from '@/lib/dominio/catalogo';

type Vista = 'geradores' | 'catadores' | 'cooperativas' | 'novo';

export default function PaginaPrefeituraCadastros() {
  const [vista, setVista] = useState<Vista>('geradores');

  return (
    <>
      <SubAbas<Vista> idBase="cadastros" atual={vista} aoEscolher={setVista} rotulo="Registros do município"
        opcoes={[
          ['geradores', 'Estabelecimentos', GERADORES.length],
          ['catadores', 'Cooperados', CATADORES.length],
          ['cooperativas', 'Cooperativas', COOPERATIVAS.length],
          ['novo', 'Novo cadastro']
        ]} />
      <div role="tabpanel" id={idPainel('cadastros', vista)} aria-labelledby={idAba('cadastros', vista)}>
        {vista === 'geradores' ? <VistaGeradores /> : vista === 'catadores' ? <VistaCatadores />
          : vista === 'cooperativas' ? <VistaCooperativas /> : <NovoCadastro />}
      </div>
    </>
  );
}
