/* SAMAÚMA — alertas do sino no topo do perfil.

   Não é um log de eventos novo: é uma leitura do que já está calculado em
   `Painel`/`Store` para cada perfil, reorganizado como "o que precisa da sua
   atenção agora". Nada aqui inventa dado — só junta o que a própria tela do
   perfil já mostra (situação regulatória, pendências, fila) num lugar que
   não exige abrir a tela pra saber que existe. */

import { Painel } from './indicadores';
import { Store } from './store';

export interface Alerta {
  id: string;
  titulo: string;
  texto: string;
  href: string;
  tom: 'alerta' | 'erro';
}

export function alertasGerador(geradorId: string): Alerta[] {
  const p = Painel.gerador(geradorId);
  const alertas: Alerta[] = [];

  if (p.situacao.id !== 'REGULAR') {
    p.situacao.motivos.forEach((motivo, i) => {
      alertas.push({
        id: `situacao-${i}`, titulo: p.situacao.rotulo, texto: motivo,
        href: '/gerador/painel', tom: p.situacao.id === 'IRREGULAR' ? 'erro' : 'alerta'
      });
    });
  }
  if (p.pendencias > 0) {
    alertas.push({
      id: 'pendencias', titulo: 'Pendências',
      texto: `${p.pendencias} demanda(s) com divergência aguardando decisão da Prefeitura`,
      href: '/gerador/demandas?filtro=pendencias', tom: 'erro'
    });
  }
  if (p.naoAtendidas > 0) {
    alertas.push({
      id: 'naoAtendidas', titulo: 'Demanda não aceita',
      texto: `${p.naoAtendidas} demanda(s) que a cooperativa não conseguiu atender (RN-008)`,
      href: '/gerador/demandas', tom: 'alerta'
    });
  }
  return alertas;
}

export function alertasDestino(destinoId: string): Alerta[] {
  const p = Painel.destino(destinoId);
  const alertas: Alerta[] = [];

  const paraAvaliar = p.previsao.possivel.cargas;
  if (paraAvaliar > 0) {
    alertas.push({
      id: 'avaliar', titulo: 'Demandas para avaliar',
      texto: `${paraAvaliar} demanda(s) aguardando a avaliação da cooperativa`,
      href: '/cooperativa/demandas', tom: 'alerta'
    });
  }
  const execucao = Store.paraDestino(destinoId).filter(d => d.status === 'PENDENCIA_EXECUCAO').length;
  if (execucao > 0) {
    alertas.push({
      id: 'execucao', titulo: 'Coleta não executada',
      texto: `${execucao} coleta(s) com prazo vencido: justifique e remarque em até 96 horas`,
      href: '/cooperativa/demandas', tom: 'erro'
    });
  }

  if (p.aCaminho.length > 0) {
    alertas.push({
      id: 'acaminho', titulo: 'Cargas a caminho',
      texto: `${p.aCaminho.length} carga(s) aguardando confirmação de peso`,
      href: '/cooperativa/fila', tom: 'alerta'
    });
  }
  if (p.pendencias > 0) {
    alertas.push({
      id: 'pendencias', titulo: 'Pendências',
      texto: `${p.pendencias} carga(s) com divergência aguardando a Prefeitura`,
      href: '/cooperativa/recebidas?filtro=pendentes', tom: 'erro'
    });
  }
  return alertas;
}

export function alertasMunicipio(): Alerta[] {
  const alertas: Alerta[] = [];

  const pendentes = Store.pendentes().length;
  if (pendentes > 0) {
    alertas.push({
      id: 'pendencias', titulo: 'Divergências',
      texto: `${pendentes} divergência(s) acima da tolerância aguardando decisão`,
      href: '/prefeitura/fiscalizacao', tom: 'erro'
    });
  }

  const irregulares = Painel.geradores().filter(g => g.situacao.id === 'IRREGULAR').length;
  if (irregulares > 0) {
    alertas.push({
      id: 'irregulares', titulo: 'Geradores irregulares',
      texto: `${irregulares} gerador(es) com cadastro incompleto, PGRS vencido ou inconformidade grave`,
      href: '/prefeitura/cadastros', tom: 'erro'
    });
  }

  return alertas;
}
