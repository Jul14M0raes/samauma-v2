/* SAMAÚMA — cadastro de participantes (MOD-001).
   O gerador se cadastra (RF-001); o Técnico da Prefeitura cadastra geradores e
   cooperativas (RF-003); a cooperativa mantém a própria equipe (RF-015). O
   registro entra nas mesmas tabelas do catálogo. Toda alteração relevante fica
   na trilha do cadastro, com valor anterior, autor e data (RN-026).

   Não é autenticação: não há senha e nada sai deste navegador. */

import { CATADORES, Catalogo, COOPERATIVAS, DESTINOS, GERADORES, PONTOS, RESIDUOS } from './catalogo';
import { Conta } from './conta';
import { Pgrs, pgrsMinimamentePreenchido, soDigitos } from './pgrs';
import type {
  Catador, Cooperativa, DadosCadastro, Destino, Gerador, Inconformidade, Ponto, RegistrosCadastro, TipoCadastro
} from './tipos';

/* Registro da trilha do cadastro (RN-026, RNF-001). */
export interface EventoCadastro {
  alvo: string;
  acao: string;
  detalhe: string;
  por: string;
  quando: string;
}

function paraTexto(valor: unknown): string {
  return typeof valor === 'string' ? valor : '';
}

const CHAVE_CADASTRO = 'samauma.next.cadastros.v2';

type Ouvinte = () => void;

class CadastroParticipantes {
  registros: RegistrosCadastro = { geradores: [], catadores: [], destinos: [], cooperativas: [], pontos: [] };
  private desligamentos: Record<string, { quando: string; motivo: string; por: string }> = {};
  private baixas: Record<string, { quando: string; motivo: string; por: string }> = {};
  private inconformidades: Record<string, Inconformidade[]> = {};
  private trilha: EventoCadastro[] = [];
  private ouvintes = new Set<Ouvinte>();
  private instantaneo = {};

  subscribe = (ouvinte: Ouvinte): (() => void) => {
    this.ouvintes.add(ouvinte);
    return () => this.ouvintes.delete(ouvinte);
  };

  getSnapshot = () => this.instantaneo;

  private notificar() {
    this.instantaneo = {};
    this.ouvintes.forEach(o => o());
  }

  iniciar(): this {
    const salvo = this._ler();
    if (salvo) {
      this.registros = {
        geradores: salvo.geradores || [], catadores: salvo.catadores || [],
        destinos: salvo.destinos || [], cooperativas: salvo.cooperativas || [], pontos: salvo.pontos || []
      };
      this.desligamentos = salvo.desligamentos || {};
      this.baixas = salvo.baixas || {};
      this.inconformidades = salvo.inconformidades || {};
      this.trilha = salvo.trilha || [];
    }
    this.registros.pontos.forEach(p => { if (!Catalogo.ponto(p.id)) PONTOS.push(p); });
    this.registros.geradores.forEach(g => { if (!Catalogo.gerador(g.id)) GERADORES.push(g); });
    this.registros.catadores.forEach(c => { if (!Catalogo.catador(c.id)) CATADORES.push(c); });
    this.registros.cooperativas.forEach(c => { if (!Catalogo.cooperativa(c.id)) COOPERATIVAS.push(c); });
    this.registros.destinos.forEach(d => { if (!Catalogo.destino(d.id)) DESTINOS.push(d); });
    this._aplicarDesligamentos();
    Object.entries(this.baixas).forEach(([id, b]) => {
      const alvo = Catalogo.gerador(id) || Catalogo.destino(id);
      if (alvo) alvo.baixa = b;
    });
    return this;
  }

  /* Desligamento vive fora de `registros` porque atinge também cooperado que
     veio da semente, e esse não está em registro nenhum. Guardar por id, num
     mapa à parte, é o que faz o desligamento sobreviver ao recarregamento sem
     precisar copiar a semente inteira para o armazenamento. */
  private _aplicarDesligamentos() {
    Object.entries(this.desligamentos).forEach(([id, d]) => {
      const catador = Catalogo.catador(id);
      if (catador) catador.desligamento = d;
    });
  }

  /**
   * Desliga um cooperado: para de receber demanda nova, continua na produção
   * do período e na trilha do que já fez. Nada é apagado.
   */
  desligarCooperado(id: string, motivo: string, por: string): boolean {
    const catador = Catalogo.catador(id);
    if (!catador || catador.desligamento) return false;
    const registro = { quando: new Date().toISOString(), motivo: motivo.trim(), por };
    catador.desligamento = registro;
    this.desligamentos[id] = registro;
    this._auditar(id, 'Cooperado desligado', registro.motivo, por);
    this._gravar();
    this.notificar();
    return true;
  }

  /** Religa quem tinha sido desligado; o desligamento continua na trilha. */
  religarCooperado(id: string, por = 'Cooperativa'): boolean {
    const catador = Catalogo.catador(id);
    if (!catador || !catador.desligamento) return false;
    this._auditar(id, 'Cooperado religado', `Desligamento anterior: ${catador.desligamento.motivo}`, por);
    catador.desligamento = null;
    delete this.desligamentos[id];
    this._gravar();
    this.notificar();
    return true;
  }

  /** Cooperado ativo é o que não tem desligamento registrado. */
  ativo(catador: Catador): boolean {
    return !catador.desligamento;
  }

  /* ===================================== EDIÇÃO E BAIXA DE CADASTRO

     Estabelecimento muda de nome, troca o horário da doca, aumenta o volume,
     fecha as portas. Um cadastro que só aceita criação obriga a Secretaria a
     manter planilha paralela -- e planilha paralela é onde o dado do sistema
     morre. */

  /**
   * Altera campos de um gerador já cadastrado.
   *
   * CNPJ não se edita: é a chave que liga este cadastro ao MTR, à nota de
   * venda e à consulta na Receita. Estabelecimento com CNPJ diferente é outro
   * estabelecimento, e deve ser cadastrado como tal.
   */
  editarGerador(id: string, dados: Partial<Pick<Gerador,
    'nome' | 'ramo' | 'volumeMes' | 'km' | 'operador' | 'razaoSocial' | 'endereco' | 'responsavelTecnico'>>,
    acesso?: string, por = 'Gerador'): boolean {
    const gerador = Catalogo.gerador(id);
    if (!gerador) return false;
    const antes = { ...gerador };
    if (dados.nome !== undefined) {
      const nome = dados.nome.trim();
      if (nome.length < 3) return false;
      /* Nome repetido continua barrado, menos o próprio. */
      if (GERADORES.some(g => g.id !== id && g.nome.trim().toLowerCase() === nome.toLowerCase())) return false;
      gerador.nome = nome;
    }
    if (dados.ramo !== undefined) gerador.ramo = dados.ramo;
    if (dados.volumeMes !== undefined && dados.volumeMes > 0) gerador.volumeMes = dados.volumeMes;
    if (dados.km !== undefined && dados.km > 0) gerador.km = dados.km;
    if (dados.operador !== undefined) gerador.operador = dados.operador || null;
    if (dados.razaoSocial !== undefined) gerador.razaoSocial = dados.razaoSocial.trim();
    if (dados.endereco !== undefined) gerador.endereco = dados.endereco.trim();
    if (dados.responsavelTecnico !== undefined) gerador.responsavelTecnico = dados.responsavelTecnico.trim();

    const mudancas = (['nome', 'razaoSocial', 'endereco', 'responsavelTecnico', 'ramo', 'volumeMes', 'km', 'operador'] as const)
      .filter(campo => antes[campo] !== gerador[campo])
      .map(campo => `${campo}: "${antes[campo] ?? ''}" → "${gerador[campo] ?? ''}"`);
    if (mudancas.length) this._auditar(id, 'Cadastro alterado', mudancas.join('; '), por);

    if (acesso !== undefined) {
      const ponto = Catalogo.ponto(gerador.ponto);
      if (ponto && acesso.trim().length >= 5) ponto.acesso = acesso.trim();
    }
    this._sincronizarRegistro('geradores', gerador);
    this._gravar();
    this.notificar();
    return true;
  }

  /** Altera campos de uma unidade receptora. Como no gerador, o CNPJ é fixo. */
  editarDestino(id: string, dados: Partial<Pick<Destino, 'nome' | 'licenca' | 'capacidadeDiaria' | 'aceita' | 'destinoFinal'>>): boolean {
    const destino = Catalogo.destino(id);
    if (!destino) return false;
    if (dados.nome !== undefined) {
      const nome = dados.nome.trim();
      if (nome.length < 3) return false;
      if (DESTINOS.some(d => d.id !== id && d.nome.trim().toLowerCase() === nome.toLowerCase())) return false;
      destino.nome = nome;
    }
    if (dados.licenca !== undefined && dados.licenca.trim().length >= 3) destino.licenca = dados.licenca.trim();
    if (dados.capacidadeDiaria !== undefined && dados.capacidadeDiaria > 0) destino.capacidadeDiaria = dados.capacidadeDiaria;
    if (dados.aceita !== undefined && dados.aceita.length) destino.aceita = dados.aceita;
    if (dados.destinoFinal !== undefined && dados.destinoFinal.trim().length >= 5) destino.destinoFinal = dados.destinoFinal.trim();
    this._sincronizarRegistro('destinos', destino);
    this._gravar();
    this.notificar();
    return true;
  }

  /**
   * Dá baixa num gerador ou numa unidade: fechou, mudou de ramo, perdeu a
   * licença.
   *
   * Baixa não é exclusão, pela mesma razão do desligamento de cooperado: a
   * massa que passou por ali já sustenta comprovante emitido. O que a baixa
   * faz é tirar da fila de fiscalização e impedir demanda nova.
   */
  darBaixa(tipo: 'gerador' | 'destino', id: string, motivo: string, por: string): boolean {
    const alvo = tipo === 'gerador' ? Catalogo.gerador(id) : Catalogo.destino(id);
    if (!alvo || alvo.baixa) return false;
    alvo.baixa = { quando: new Date().toISOString(), motivo: motivo.trim(), por };
    this.baixas[id] = alvo.baixa;
    this._auditar(id, 'Baixa de cadastro', alvo.baixa.motivo, por);
    this._gravar();
    this.notificar();
    return true;
  }

  reativar(tipo: 'gerador' | 'destino', id: string, por = 'Prefeitura · Técnico'): boolean {
    const alvo = tipo === 'gerador' ? Catalogo.gerador(id) : Catalogo.destino(id);
    if (!alvo || !alvo.baixa) return false;
    this._auditar(id, 'Cadastro reativado', `Baixa anterior: ${alvo.baixa.motivo}`, por);
    alvo.baixa = null;
    delete this.baixas[id];
    this._gravar();
    this.notificar();
    return true;
  }

  /* ============================== INCONFORMIDADE GRAVE (RN-037, RNF-004)
     Sempre humana e sempre com fundamento. Classificar leva o estabelecimento
     a Irregular; revogar é um evento novo, e o histórico fica inteiro. O
     caminho de regularização além da revogação segue em aberto na doc. */

  classificarInconformidade(geradorId: string, fundamento: string, por: string): boolean {
    if (!Catalogo.gerador(geradorId) || fundamento.trim().length < 5) return false;
    if (this.inconformidadeVigente(geradorId)) return false;
    this._registrarInconformidade(geradorId, 'CLASSIFICADA', fundamento, por);
    return true;
  }

  revogarInconformidade(geradorId: string, fundamento: string, por: string): boolean {
    if (!this.inconformidadeVigente(geradorId) || fundamento.trim().length < 5) return false;
    this._registrarInconformidade(geradorId, 'REVOGADA', fundamento, por);
    return true;
  }

  inconformidadeVigente(geradorId: string): Inconformidade | null {
    const lista = this.inconformidades[geradorId] || [];
    const ultima = lista[lista.length - 1];
    return ultima && ultima.acao === 'CLASSIFICADA' ? ultima : null;
  }

  historicoDeInconformidade(geradorId: string): Inconformidade[] {
    return (this.inconformidades[geradorId] || []).slice().reverse();
  }

  private _registrarInconformidade(geradorId: string, acao: Inconformidade['acao'], fundamento: string, por: string) {
    const registro: Inconformidade = { acao, fundamento: fundamento.trim(), por, quando: new Date().toISOString() };
    this.inconformidades[geradorId] = [...(this.inconformidades[geradorId] || []), registro];
    this._auditar(geradorId, acao === 'CLASSIFICADA' ? 'Inconformidade grave classificada' : 'Inconformidade grave revogada',
      registro.fundamento, por);
    this._gravar();
    this.notificar();
  }

  /* ============================================== TRILHA DO CADASTRO */

  auditoria(alvo?: string): EventoCadastro[] {
    return this.trilha.filter(e => !alvo || e.alvo === alvo).slice().reverse();
  }

  private _auditar(alvo: string, acao: string, detalhe: string, por: string) {
    this.trilha.push({ alvo, acao, detalhe, por, quando: new Date().toISOString() });
  }

  /* Mantém o objeto do catálogo e o do registro apontando para o mesmo dado. */

  private _sincronizarRegistro(lista: 'geradores' | 'destinos', item: { id: string }) {
    const i = (this.registros[lista] as { id: string }[]).findIndex(x => x.id === item.id);
    if (i >= 0) (this.registros[lista] as unknown[])[i] = item;
  }

  cnpjValido(bruto: unknown): boolean {
    const n = String(bruto || '').replace(/\D/g, '');
    if (n.length !== 14 || /^(\d)\1{13}$/.test(n)) return false;
    const digito = (base: number[], pesos: number[]) => {
      const soma = base.reduce((total, valor, i) => total + valor * pesos[i], 0);
      const resto = soma % 11;
      return resto < 2 ? 0 : 11 - resto;
    };
    const nums = n.split('').map(Number);
    const d1 = digito(nums.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
    const d2 = digito(nums.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
    return d1 === nums[12] && d2 === nums[13];
  }

  formatarCnpj(bruto: unknown): string {
    const n = String(bruto || '').replace(/\D/g, '').slice(0, 14);
    return n.replace(/^(\d{2})(\d{3})?(\d{3})?(\d{4})?(\d{2})?$/,
      (_todo, a, b, c, d, e) => [a, b && '.' + b, c && '.' + c, d && '/' + d, e && '-' + e].filter(Boolean).join(''));
  }

  conferir(tipo: TipoCadastro, dados: DadosCadastro): Record<string, string> {
    const erros: Record<string, string> = {};
    const texto = (campo: string, minimo: number, rotulo: string) => {
      if (!dados[campo] || String(dados[campo]).trim().length < minimo) {
        erros[campo] = `${rotulo} precisa de pelo menos ${minimo} caracteres.`;
      }
    };
    const numero = (campo: string, minimo: number, rotulo: string) => {
      const valor = Number(dados[campo]);
      if (!valor || valor < minimo) erros[campo] = `${rotulo} precisa ser maior que ${minimo}.`;
    };

    texto('nome', 3, 'O nome');
    if (dados.nome && this._nomeEmUso(tipo, paraTexto(dados.nome))) {
      erros.nome = 'Já existe um cadastro com esse nome no sistema.';
    }
    /* FL-006-E01: o mesmo CNPJ não é cadastrado duas vezes. */
    if (tipo !== 'catador' && this.cnpjValido(dados.cnpj) && this.cnpjEmUso(paraTexto(dados.cnpj))) {
      erros.cnpj = 'Este CNPJ já está cadastrado no sistema.';
    }

    if (tipo === 'gerador') {
      if (!this.cnpjValido(dados.cnpj)) erros.cnpj = erros.cnpj || 'CNPJ inválido: confira os 14 dígitos.';
      texto('razaoSocial', 3, 'A razão social');
      texto('endereco', 5, 'O endereço');
      if (!dados.ramo) erros.ramo = 'Escolha o ramo de atividade.';
      if (!dados.ponto) erros.ponto = 'Escolha o bairro do ponto de coleta.';
      texto('acesso', 5, 'A instrução de acesso');
      numero('volumeMes', 1, 'O volume mensal estimado');
    }

    if (tipo === 'catador') {
      texto('veiculo', 3, 'O veículo ou equipamento');
      if (!dados.zona) erros.zona = 'Escolha a zona de atuação.';
      numero('metaSemanal', 1, 'A meta semanal');
    }

    if (tipo === 'cooperativa') {
      /* O MTR identifica o transportador e o destinador por CNPJ. */
      if (!this.cnpjValido(dados.cnpj)) erros.cnpj = erros.cnpj || 'Informe um CNPJ válido.';
      texto('razao', 3, 'A razão social');
      texto('contrato', 3, 'O instrumento de cooperação');
      texto('licenca', 3, 'A licença do galpão');
      numero('capacidadeDiaria', 1, 'A capacidade diária do galpão');
      if (!dados.ponto) erros.ponto = 'Escolha o bairro do galpão.';
    }

    return erros;
  }

  cnpjEmUso(bruto: string): boolean {
    const alvo = soDigitos(bruto);
    return [...GERADORES, ...COOPERATIVAS].some(item => soDigitos(item.cnpj) === alvo);
  }

  private _nomeEmUso(tipo: TipoCadastro, nome: string): boolean {
    const alvo = nome.trim().toLowerCase();
    const listas: Record<TipoCadastro, { nome: string }[]> = { gerador: GERADORES, catador: CATADORES, cooperativa: COOPERATIVAS };
    return (listas[tipo] || []).some(item => item.nome.trim().toLowerCase() === alvo);
  }

  criar(tipo: TipoCadastro, dados: DadosCadastro, por = 'Autocadastro'):
    { registro?: Gerador | Catador | Destino; erros: Record<string, string> } {
    const erros = this.conferir(tipo, dados);
    if (Object.keys(erros).length) return { erros };

    const registro = tipo === 'gerador' ? this._criarGerador(dados)
      : tipo === 'catador' ? this._criarCatador(dados)
        : this._criarCooperativa(dados);
    this._auditar(registro.id, 'Cadastro criado', registro.nome, por);
    this._gravar();
    return { registro, erros: {} };
  }

  private _criarGerador(dados: DadosCadastro): Gerador {
    const base = Catalogo.ponto(paraTexto(dados.ponto))!;
    const ponto: Ponto = {
      id: this._novoId('pt-c', PONTOS),
      bairro: base.bairro, zona: base.zona,
      lat: base.lat, lng: base.lng,
      acesso: paraTexto(dados.acesso).trim()
    };

    /* Quem preencheu o gerador padrão de PGRS antes de se cadastrar, com o
       mesmo CNPJ, tem o plano anexado aqui automaticamente. */
    const rascunhoPgrs = Pgrs.obter(paraTexto(dados.cnpj));
    const pgrsCompleto = rascunhoPgrs && pgrsMinimamentePreenchido(rascunhoPgrs) ? rascunhoPgrs : undefined;

    const id = this._novoId('ger-c', GERADORES);
    const gerador: Gerador = {
      id,
      nome: paraTexto(dados.nome).trim(),
      cnpj: this.formatarCnpj(paraTexto(dados.cnpj)),
      razaoSocial: paraTexto(dados.razaoSocial).trim(),
      endereco: paraTexto(dados.endereco).trim(),
      responsavelTecnico: paraTexto(dados.responsavelTecnico).trim() || undefined,
      ramo: paraTexto(dados.ramo),
      ponto: ponto.id,
      km: Number(dados.km) || 5,
      volumeMes: Number(dados.volumeMes),
      operador: paraTexto(dados.operador) || null,
      pgrs: dados.pgrsNumero
        ? { numero: paraTexto(dados.pgrsNumero).trim(), emitidoEm: paraTexto(dados.pgrsEmitidoEm) || new Date().toISOString() }
        : pgrsCompleto
          ? { numero: `PGRS ${new Date().getFullYear()}/${soDigitos(id).padStart(4, '0')}`, emitidoEm: new Date().toISOString() }
          : null,
      cadastradoAqui: true,
      codigo: Conta.gerarCodigo('gerador')
    };
    if (pgrsCompleto) gerador.pgrsCompleto = pgrsCompleto;
    PONTOS.push(ponto);
    GERADORES.push(gerador);
    this.registros.pontos.push(ponto);
    this.registros.geradores.push(gerador);
    this._gravar();
    this.notificar();
    return gerador;
  }

  private _criarCatador(dados: DadosCadastro): Catador {
    const catador: Catador = {
      id: this._novoId('cat-c', CATADORES),
      nome: paraTexto(dados.nome).trim(),
      cooperativa: paraTexto(dados.cooperativa) || null,
      desde: new Date().toISOString().slice(0, 10),
      metaSemanal: Number(dados.metaSemanal),
      veiculo: paraTexto(dados.veiculo).trim(),
      zona: paraTexto(dados.zona),
      cadastradoAqui: true
    };
    CATADORES.push(catador);
    this.registros.catadores.push(catador);
    this._gravar();
    this.notificar();
    return catador;
  }

  /* RF-003: a cooperativa é cadastrada com o galpão onde recebe (RN-035). O
     código de acesso fica no galpão, que é a porta de entrada do perfil. */
  private _criarCooperativa(dados: DadosCadastro): Destino {
    const base = Catalogo.ponto(paraTexto(dados.ponto))!;
    const ponto: Ponto = {
      id: this._novoId('pt-c', PONTOS),
      bairro: base.bairro, zona: base.zona,
      lat: base.lat, lng: base.lng,
      acesso: paraTexto(dados.acesso || 'Balança da entrada').trim()
    };
    const nome = paraTexto(dados.nome).trim();
    const cnpj = this.formatarCnpj(dados.cnpj);
    const cooperativa: Cooperativa = {
      id: this._novoId('coop-c', COOPERATIVAS),
      nome,
      razao: paraTexto(dados.razao).trim(),
      cnpj,
      fundada: new Date().toISOString().slice(0, 10),
      bairro: base.bairro,
      ponto: ponto.id,
      contrato: paraTexto(dados.contrato).trim()
    };
    const destino: Destino = {
      id: this._novoId('dst-c', DESTINOS),
      nome: `Galpão ${nome}`,
      tipo: 'Central de triagem',
      cnpj,
      cooperativa: cooperativa.id,
      ponto: ponto.id,
      licenca: paraTexto(dados.licenca).trim(),
      capacidadeDiaria: Number(dados.capacidadeDiaria),
      aceita: RESIDUOS.map(r => r.id),
      destinoFinal: 'Triagem e venda à indústria recicladora; rejeito ao aterro sanitário',
      triagem: true,
      cadastradoAqui: true,
      codigo: Conta.gerarCodigo('cooperativa')
    };
    cooperativa.galpao = destino.id;
    PONTOS.push(ponto);
    COOPERATIVAS.push(cooperativa);
    DESTINOS.push(destino);
    this.registros.pontos.push(ponto);
    this.registros.cooperativas.push(cooperativa);
    this.registros.destinos.push(destino);
    this._gravar();
    this.notificar();
    return destino;
  }

  total(): number {
    return this.registros.geradores.length + this.registros.catadores.length + this.registros.cooperativas.length;
  }

  private _novoId(prefixo: string, lista: { id: string }[]): string {
    let n = 1;
    while (lista.some(item => item.id === `${prefixo}-${String(n).padStart(2, '0')}`)) n += 1;
    return `${prefixo}-${String(n).padStart(2, '0')}`;
  }

  private _ler(): (RegistrosCadastro & {
    desligamentos?: Record<string, { quando: string; motivo: string; por: string }>;
    baixas?: Record<string, { quando: string; motivo: string; por: string }>;
    inconformidades?: Record<string, Inconformidade[]>;
    trilha?: EventoCadastro[];
  }) | null {
    if (typeof localStorage === 'undefined') return null;
    try {
      const bruto = localStorage.getItem(CHAVE_CADASTRO);
      if (!bruto) return null;
      const dados = JSON.parse(bruto);
      return dados && dados.geradores ? dados : null;
    } catch {
      return null;
    }
  }

  private _gravar() {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(CHAVE_CADASTRO,
        JSON.stringify({ ...this.registros, desligamentos: this.desligamentos, baixas: this.baixas,
          inconformidades: this.inconformidades, trilha: this.trilha }));
    } catch {
      /* sem armazenamento, o cadastro vale para esta sessão */
    }
  }

  limpar() {
    /* Reiniciar a demonstração devolve os cooperados desligados ao ativo:
       o desligamento é dado da sessão, como o resto do cadastro. */
    Object.keys(this.desligamentos).forEach(id => {
      const catador = Catalogo.catador(id);
      if (catador) catador.desligamento = null;
    });
    this.desligamentos = {};
    Object.keys(this.baixas).forEach(id => {
      const alvo = Catalogo.gerador(id) || Catalogo.destino(id);
      if (alvo) alvo.baixa = null;
    });
    this.baixas = {};
    this.inconformidades = {};
    this.trilha = [];

    /* Tirar dos arrays do catálogo também.

       Esvaziar só `registros` deixava quem tinha sido cadastrado vivo em
       GERADORES/CATADORES até o recarregamento da página: o botão "Voltar aos
       dados iniciais" limpava o armazenamento e a pessoa continuava lá, agora
       sem registro que a explicasse. Reiniciar tem que reiniciar. */
    const remover = <T extends { id: string }>(alvo: T[], registrados: T[]) => {
      registrados.forEach(r => {
        const i = alvo.findIndex(x => x.id === r.id);
        if (i >= 0) alvo.splice(i, 1);
      });
    };
    remover(GERADORES, this.registros.geradores);
    remover(CATADORES, this.registros.catadores);
    remover(COOPERATIVAS, this.registros.cooperativas);
    remover(DESTINOS, this.registros.destinos);
    remover(PONTOS, this.registros.pontos);

    this.registros = { geradores: [], catadores: [], destinos: [], cooperativas: [], pontos: [] };
    if (typeof localStorage !== 'undefined') {
      try { localStorage.removeItem(CHAVE_CADASTRO); } catch { /* nada a fazer */ }
    }
    this.notificar();
  }
}

export const Cadastro = new CadastroParticipantes();

/* Referenciado por formulários de cadastro. */
export { COOPERATIVAS };
