/* Atalhos dos testes: levam uma demanda pelos passos da cooperativa (EST-001). */

import { Catalogo } from '../catalogo';
import { Store } from '../store';
import type { Demanda } from '../tipos';

type Alvo = Demanda | string;
const idDe = (d: Alvo) => (typeof d === 'string' ? d : d.id);

export function cooperativaDe(d: Alvo): string {
  return Catalogo.destino(Store.obter(idDe(d))!.destino.id)!.cooperativa!;
}

export function aceitar(d: Alvo) {
  return Store.aceitar(idDe(d), { cooperativaId: cooperativaDe(d) });
}

/* Aceita (se preciso) e designa o primeiro cooperado ativo da equipe. */
export function designar(d: Alvo, catadorId?: string) {
  const id = idDe(d);
  if (Store.obter(id)!.status === 'DISPONIVEL') aceitar(id);
  const coop = cooperativaDe(id);
  return Store.designar(id, { cooperativaId: coop, catadorId: catadorId || Catalogo.equipeAtiva(coop)[0].id });
}

/* Leva até Em transporte com a massa observada informada. */
export function coletar(d: Alvo, kg: number) {
  const id = idDe(d);
  if (Store.obter(id)!.status !== 'EM_COLETA') designar(id);
  Store.registrarPeso(id, kg);
  return Store.finalizarColeta(id);
}

/* Ciclo inteiro: observada `kg`, aferida `balancaKg` (padrão: igual). */
export function ciclo(d: Alvo, kg = 500, balancaKg = kg, extra: Parameters<typeof Store.receber>[1] = { kg: balancaKg }) {
  const id = idDe(d);
  coletar(id, kg);
  return Store.receber(id, { ...extra, kg: balancaKg });
}
