'use client';

/* O código e o QR da própria demanda: etiquetam a carga e abrem a demanda no
   perfil da cooperativa, que executa a coleta em campo (RNF-007). */

import { CodigoQr } from '@/components/carteira/CodigoQr';
import { Cartao, Pino } from '@/components/ui/Basicos';
import { enderecoPublico } from '@/lib/caminhos';
import { Catalogo } from '@/lib/dominio/catalogo';
import { DemandaRegras as Demanda } from '@/lib/dominio/demanda';
import { Fmt } from '@/lib/dominio/formato';
import type { Demanda as TDemanda } from '@/lib/dominio/tipos';

export function CodigoDaDemanda({ demanda }: { demanda: TDemanda }) {
  const codigo = Demanda.codigoVerificacao(demanda);
  return (
    <Cartao classe="cartao-codigo-carga" titulo="Código desta demanda" sub="Para etiquetar a carga e localizar no campo"
      nota="O QR abre esta demanda no sistema. Quem não tiver câmera digita o código; os dois últimos caracteres evitam abrir a demanda vizinha por engano."
      corpo={
        <div className="codigo-demanda">
          <CodigoQr conteudo={enderecoPublico(`/cooperativa/demandas/${demanda.id}`)} tamanho={96} nivel="Q"
            rotulo={`QR Code da demanda ${codigo}`} />
          <div>
            <span className="etiqueta">Código da carga</span>
            <b className="mono">{codigo}</b>
            <p>{Catalogo.nomeResiduo(demanda.residuo)} · {Fmt.litros(demanda.declaradoL)} declarados</p>
            <p>{Catalogo.endereco(demanda.ponto)}</p>
            <Pino rotulo={Demanda.rotulo(demanda)} tom="neutro" />
          </div>
        </div>
      } />
  );
}
