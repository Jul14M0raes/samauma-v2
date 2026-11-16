/* Cadastros (doc 09): GGR, cooperativa e equipe de cooperados, com a trilha de
   cada ato (RF-001 a RF-003, RF-015) e a inconformidade grave (RN-037). */

import { Cadastro } from '../dominio/cadastro';
import type { DadosCadastro, Gerador, TipoCadastro } from '../dominio/tipos';
import { autor, comando, cooperativaDaSessao } from './comando';

type CamposGerador = Parameters<typeof Cadastro.editarGerador>[1];

export const Cadastros = {
  /* Autocadastro (sem sessão) assina como "Autocadastro"; o Técnico, com o próprio nome. */
  criar: comando((tipo: TipoCadastro, dados: DadosCadastro, porAutocadastro = false) =>
    Cadastro.criar(tipo, dados, porAutocadastro ? 'Autocadastro' : autor())),
  admitirCooperado: comando((dados: DadosCadastro) =>
    Cadastro.criar('catador', { ...dados, cooperativa: cooperativaDaSessao() }, autor())),
  editarGerador: comando((id: Gerador['id'], dados: CamposGerador, acesso?: string) =>
    Cadastro.editarGerador(id, dados, acesso, autor())),
  darBaixa: comando((id: string, motivo: string) => Cadastro.darBaixa('gerador', id, motivo, autor())),
  reativar: comando((id: string) => Cadastro.reativar('gerador', id, autor())),
  desligarCooperado: comando((id: string, motivo: string) => Cadastro.desligarCooperado(id, motivo, autor())),
  religarCooperado: comando((id: string) => Cadastro.religarCooperado(id, autor())),
  classificarInconformidade: comando((geradorId: string, fundamento: string) =>
    Cadastro.classificarInconformidade(geradorId, fundamento, autor())),
  revogarInconformidade: comando((geradorId: string, fundamento: string) =>
    Cadastro.revogarInconformidade(geradorId, fundamento, autor()))
};
