/* Demanda e Coleta (doc 09; EST-001, EST-004). Comandos do Gerador, da
   Cooperativa e do Técnico sobre uma demanda. */

import { Sessao } from '../dominio/sessao';
import { Store } from '../dominio/store';
import type { QualidadeId, TipoOcorrencia } from '../dominio/tipos';
import { autor, comando, cooperativaDaSessao } from './comando';

export const Demandas = {
  /* RF-006/RF-007: o Gerador da sessão declara e encaminha. */
  declarar: comando((dados: { residuo: string; declaradoL: number; ponto?: string; prazo: string; observacao?: string }) => {
    const demanda = Store.criar({ ...dados, geradorId: Sessao.gerador });
    return Store.publicar(demanda.id);
  }),
  publicar: comando((id: string) => Store.publicar(id)),

  /* RF-008 */
  aceitar: comando((id: string) => Store.aceitar(id, { cooperativaId: cooperativaDaSessao(), por: autor() })),
  naoAceitar: comando((id: string, motivo: string) =>
    Store.naoAceitar(id, { cooperativaId: cooperativaDaSessao(), motivo, por: autor() })),
  reavaliar: comando((id: string) => Store.reavaliar(id, { cooperativaId: cooperativaDaSessao(), por: autor() })),

  /* RF-009, RF-011, RF-012 */
  designar: comando((id: string, catadorId: string) =>
    Store.designar(id, { catadorId, cooperativaId: cooperativaDaSessao(), por: autor() })),
  registrarPeso: comando((id: string, kg: number, canal?: string) => Store.registrarPeso(id, kg, canal)),
  anexarFoto: comando((id: string, imagem: string) => Store.anexarFoto(id, imagem)),
  fecharCarga: comando((id: string) => Store.finalizarColeta(id)),
  registrarOcorrencia: comando((id: string, tipo: TipoOcorrencia, nota: string) =>
    Store.registrarOcorrencia(id, { tipo, nota, por: autor() })),

  /* RF-031 */
  remarcar: comando((id: string, justificativa: string, novoPrazo: string) =>
    Store.remarcar(id, { justificativa, novoPrazo, por: autor() })),

  /* RF-013, RF-017, RF-018 */
  receber: comando((id: string, dados: {
    kg: number; rejeitoKg?: number; destinoFinal?: string; nota?: string; lote?: string;
    balanca?: string; afericao?: string; tiquete?: string | null; qualidade?: QualidadeId;
    origemPesagem?: 'DIGITADA' | 'INSTRUMENTO'; leitura?: string | null;
  }) => Store.receber(id, { ...dados, conferente: autor() })),

  /* RF-019 */
  decidirPendencia: comando((id: string, resultado: 'LIBERADA' | 'MANTIDA', justificativa: string) =>
    Store.decidirPendencia(id, { resultado, justificativa, por: autor() }))
};
