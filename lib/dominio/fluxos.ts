/* SAMAÚMA — os fluxos de resíduo do piloto: reciclável, orgânico e rejeito
   (logística reversa fica fora, RN-032). Cada fluxo tem responsável legal e
   destinação próprios, por isso a taxa de recuperação é sempre por fluxo. */

import { Catalogo, FLUXOS } from './catalogo';
import { DemandaRegras as Demanda } from './demanda';
import { somar } from './formato';
import { Store } from './store';
import type { Demanda as TDemanda, FluxoId, Fluxo } from './tipos';

export const Fluxos = {

  obter: (id: FluxoId | null | undefined): Fluxo | null =>
    FLUXOS.find(f => f.id === id) || null,

  /* Material sem fluxo declarado cai em rejeito: na dúvida, o sistema não
     credita recuperação a ninguém. */
  daDemanda(demanda: TDemanda): FluxoId {
    return Catalogo.residuo(demanda.residuo)?.fluxo || 'REJEITO';
  },

  responsavel(demanda: TDemanda): string {
    return Fluxos.obter(Fluxos.daDemanda(demanda))?.responsavel || '—';
  },

  /* Apuração por fluxo, com o que "recuperado" significa em cada um. */
  apurar(demandas: TDemanda[]) {
    const comprovadas = Store.comprovantes(demandas);
    return FLUXOS.map(fluxo => {
      const doFluxo = comprovadas.filter(d => Fluxos.daDemanda(d) === fluxo.id);
      const massa = somar(doFluxo, d => d.verificadoKg || 0);
      const recuperado = fluxo.id === 'REJEITO' ? 0 : somar(doFluxo, d => Demanda.reciclado(d) || 0);
      return {
        fluxo,
        cargas: doFluxo.length,
        massa,
        recuperado,
        taxa: massa ? (recuperado / massa) * 100 : null
      };
    });
  }
};
