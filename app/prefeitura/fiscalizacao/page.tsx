'use client';

/* Fiscalização: as duas leituras do mesmo trabalho. Processos olha carga por
   carga; a fila de achados olha estabelecimento por estabelecimento, já
   priorizado. São recortes diferentes da mesma apuração, e ficavam em abas
   separadas obrigando o fiscal a trocar de tela para cruzar as duas. */

import { useState } from 'react';

import { VistaAchados } from '@/components/prefeitura/VistaAchados';
import { VistaProcessos } from '@/components/prefeitura/VistaProcessos';
import { VistaConciliacao } from '@/components/prefeitura/VistaConciliacao';
import { idAba, idPainel, SubAbas } from '@/components/ui/SubAbas';
import { GERADORES } from '@/lib/dominio/catalogo';
import { filaDeFiscalizacao } from '@/lib/dominio/notificacao';
import { Store } from '@/lib/dominio/store';
import { useDominio } from '@/state/hooks';

type Vista = 'processos' | 'achados' | 'conciliacao';

export default function PaginaPrefeituraFiscalizacao() {
  useDominio();
  const naFila = filaDeFiscalizacao(GERADORES.map(g => ({ gerador: g, demandas: Store.doGerador(g.id) }))).length;
  /* Abre pelo que exige ação: 71 processos em lista escondem os poucos achados prioritários. */
  const [vista, setVista] = useState<Vista>(naFila > 0 ? 'achados' : 'processos');

  return (
    <>
      <SubAbas<Vista> idBase="fiscalizacao" atual={vista} aoEscolher={setVista} rotulo="Frentes de fiscalização"
        opcoes={[['processos', 'Processos', Store.todas().length], ['achados', 'Fila de achados', naFila], ['conciliacao', 'Conciliação de MTR']]} />
      <div role="tabpanel" id={idPainel('fiscalizacao', vista)} aria-labelledby={idAba('fiscalizacao', vista)}>
        {vista === 'processos' ? <VistaProcessos /> : vista === 'achados' ? <VistaAchados /> : <VistaConciliacao />}
      </div>
    </>
  );
}
