# Contratos de dados

Especificação para implementar o backend e o banco a partir do front atual. A referência funcional é [docs/funcional](<../funcional/10 - Visão Funcional Consolidada.md>); este documento diz **como o front já espera receber e gravar** cada coisa.

## Como o front fala com os dados hoje

| Sentido | Onde | Hoje | Com backend |
|---|---|---|---|
| Escrita | `lib/dados/*` (comandos) | Chama o domínio no navegador e grava em `localStorage` | O corpo de cada comando vira uma chamada à API; a assinatura não muda |
| Leitura | `lib/dominio/*` (armazéns com `subscribe`/`getSnapshot`) e `lib/dominio/indicadores.ts` | Lê o estado local | O armazém é hidratado pela API (lista inicial + atualização depois de cada comando) |
| Autor | `lib/dados/comando.ts` → `autor()` | Nome derivado da sessão (`Sessao.autor`) | Vem do token de autenticação; o servidor não confia no autor enviado pelo cliente |
| Regras | `lib/dominio/store.ts`, `cadastro.ts`, `regulatorio.ts`, `demanda.ts` | Validadas no navegador | Validadas **no servidor**; o front mantém as mesmas mensagens como pré-validação |

Regras gerais para a API:

- Todo comando é assíncrono e devolve o registro atualizado. Erro de regra volta como `4xx` com `{ mensagem }`; o front mostra a mensagem como está.
- Data e hora são geradas no servidor, em ISO 8601 UTC. Nenhum comando aceita `quando` do cliente (exceção: o prazo e a data de emissão do MTR, que são dados do negócio).
- Identificadores (`DEM-0001`, `CMP-…`, `LT-…`) são gerados no servidor.
- Toda alteração gera um evento de trilha append-only: `{ quando, acao, autor, justificativa?, antes?, depois? }` (RNF-001, RN-026). Hoje o front guarda `{ quando, titulo, detalhe, autor }` e deriva a etapa pelo título (`DemandaRegras.etapaDoEvento`); com backend, `acao` passa a ser um código estável e `titulo`/`detalhe` são montados na tela.
- Medições nunca são sobrescritas (RN-023). Não existe endpoint de correção.

## Perfis e escopo (RN-040, matriz 08)

| Perfil | Sessão identifica | Escopo de leitura | Escopo de escrita |
|---|---|---|---|
| `gerador` (AT-001) | `geradorId` | Próprias demandas, cadastro, PGRS e documentos | Declarar, encaminhar, vincular MTR, editar o próprio cadastro, coletas do contrato |
| `cooperativa` (AT-002) | `cooperativaId` (e o galpão dela) | Demandas endereçadas a ela, equipe, portaria | Avaliar, designar, registrar coleta, receber, remarcar, equipe, identificação |
| `prefeitura` — Técnico (AT-003) | — | Tudo do município | Cadastrar GGR e cooperativa, decidir pendência, inconformidade, parâmetros, baixa |
| `gestao` — Painel de gestão (AT-003) | — | Indicadores e relatórios do município | Nenhuma (D-03) |

O cooperado não é usuário (RN-029). O guarda de rota do front (`components/layout/AppShell.tsx`) é só interface: a proteção real é do servidor.

## Agregados

### Demanda e Coleta — `lib/dados/demandas.ts`

Entidade: `Demanda` em `lib/dominio/tipos.ts`.

| Campo | Tipo | Observação |
|---|---|---|
| `id` | string | `DEM-0001`, gerado no servidor |
| `gerador` | `{ id, nome }` | GGR que declarou |
| `origem` | `CONTRATO` \| `AVULSA` | RF-006, RF-007 |
| `residuo` | id do catálogo | Fluxo: reciclável, orgânico ou rejeito (RN-032) |
| `declaradoL` | number | Medição declarada, em litros (RN-006) |
| `ponto`, `bairro`, `zona`, `km` | — | Local da coleta |
| `prazo` | ISO | Data prevista |
| `status` | EST-001 | Ver abaixo |
| `destino` | `{ id, nome }` | Galpão da cooperativa que atende (RN-035) |
| `catador` | `{ id, nome, cooperativa }` \| null | Cooperado designado (RF-009) |
| `coletadoKg` | number \| null | Medição observada, gravada uma vez (RN-023) |
| `verificadoKg`, `rejeitoKg` | number \| null | Medição aferida no recebimento e rejeito |
| `pesagem` | `{ balanca, afericao, tiquete, origem, leitura }` \| null | Evidência (RN-012, RN-013) |
| `pendencia` | `PendenciaDivergencia` \| null | EST-004 |
| `execucao` | `{ constatadaEm, prazoJustificativa, justificativa }` \| null | RN-041 |
| `naoAceites` | `{ cooperativa, motivo, quando }[]` | RN-008 |
| `mtr` | `{ numero, fonte, emitidoEm, consultadoEm, registradoPor, cdf }` \| null | RF-020, RN-027 |
| `comprovante` | `{ codigo, emitidoEm, divergencia }` \| null | Emitido ao comprovar |
| `ocorrencias` | `{ tipo, nota, quando, registradaPor }[]` | Não mudam o estado |
| `eventos` | trilha | Append-only |

Estados (EST-001): `CRIADA → DISPONIVEL → (NAO_ACEITA ⇄ DISPONIVEL) → ACEITA → EM_COLETA → EM_TRANSPORTE → COMPROVADA | PENDENCIA_DIVERGENCIA`. `ACEITA` ou `EM_COLETA` com prazo vencido vira `PENDENCIA_EXECUCAO` (tarefa agendada no servidor, hoje `Store.verificarPrazos`); remarcar dentro de 96 h volta a `ACEITA`.

| Comando | Perfil | Estado exigido | Efeito | RF |
|---|---|---|---|---|
| `declarar({ residuo, declaradoL, ponto?, prazo, observacao? })` | gerador | — | Cria e encaminha (`DISPONIVEL`), endereçada à cooperativa do contrato | RF-006, RF-007 |
| `publicar(id)` | gerador | `CRIADA` | `DISPONIVEL` | RF-007 |
| `aceitar(id)` | cooperativa | `DISPONIVEL` | `ACEITA` | RF-008 |
| `naoAceitar(id, motivo)` | cooperativa | `DISPONIVEL` | `NAO_ACEITA`, registra motivo | RF-008, RN-008 |
| `reavaliar(id)` | cooperativa | `NAO_ACEITA` | `DISPONIVEL` | EST-001 |
| `designar(id, catadorId)` | cooperativa | `ACEITA` | `EM_COLETA`; só cooperado ativo da própria equipe | RF-009 |
| `registrarPeso(id, kg, canal?)` | cooperativa | `EM_COLETA` | Grava `coletadoKg` uma única vez | RF-012, RN-023 |
| `anexarFoto(id, imagem)` | cooperativa | `EM_COLETA` | Evidência | RF-011 |
| `fecharCarga(id)` | cooperativa | `EM_COLETA` com peso | `EM_TRANSPORTE` | RF-011 |
| `registrarOcorrencia(id, tipo, nota)` | cooperativa | qualquer em campo | Só trilha | — |
| `remarcar(id, justificativa, novoPrazo)` | cooperativa | `PENDENCIA_EXECUCAO`, dentro de 96 h | `ACEITA` com novo prazo | RF-031, RN-041 |
| `receber(id, { kg, rejeitoKg?, destinoFinal?, balanca?, afericao?, tiquete?, qualidade?, … })` | cooperativa | `EM_TRANSPORTE` | Grava aferida; concilia: `COMPROVADA` se `|aferida − observada| ≤ tolerância`, senão `PENDENCIA_DIVERGENCIA` | RF-013, RF-017, RF-018 |
| `decidirPendencia(id, LIBERADA \| MANTIDA, justificativa)` | prefeitura | `PENDENCIA_DIVERGENCIA` aberta | Liberar → `COMPROVADA`; manter → retida (desfecho em aberto na doc) | RF-019, RN-024, RN-025 |

Tolerância: `max(observada × tolerância%, piso em kg)`, com os valores de Parâmetros no momento do recebimento. A comparação é observada × aferida; a declarada em litros é só referência (ponto em aberto na doc).

### Documentos — `lib/dados/documentos.ts`

| Comando | Perfil | Condição | RF |
|---|---|---|---|
| `vincularMtr(id, numero, emitidoEm?)` | gerador | Demanda `COMPROVADA`, sem MTR | RF-020, RN-027 |
| `registrarCdf(id, numero)` | cooperativa | MTR já vinculado | — (extra) |

Documentos gerados no front a partir dos dados, sem endpoint próprio: QR de regularização (`Regulatorio.conteudoQr`, D-06), comprovante simplificado (`lib/servicos/comprovante.ts`, D-06 + MTR), relatórios CSV/XLS/PDF (`lib/servicos/relatorio.ts`, RF-025 a RF-027).

### Cadastros — `lib/dados/cadastros.ts`

Entidades: `Gerador`, `Cooperativa` (+ galpão em `Destino`), `Catador` (cooperado), `Inconformidade`. O CNPJ é único entre GGR e cooperativas (FL-006-E01). Baixa e desligamento não apagam nada.

| Comando | Perfil | RF |
|---|---|---|
| `criar('gerador' \| 'cooperativa', dados)` | prefeitura (autocadastro do GGR com `porAutocadastro`) | RF-001, RF-003 |
| `admitirCooperado(dados)` | cooperativa | RF-015 |
| `editarGerador(id, campos, acesso?)` | gerador (o próprio) ou prefeitura | RF-001 |
| `darBaixa(id, motivo)` / `reativar(id)` | prefeitura | — |
| `desligarCooperado(id, motivo)` / `religarCooperado(id)` | cooperativa | RF-015 |
| `classificarInconformidade(geradorId, fundamento)` / `revogarInconformidade(…)` | prefeitura | RN-037, D-05 |

Situação regulatória (EST-002) é **calculada** (`Regulatorio.situacao`): Irregular (cadastro incompleto, PGRS ausente ou vencido, inconformidade grave), Pendente (divergência aguardando decisão), A renovar (PGRS vence dentro da antecedência), Regular. Não há comando para defini-la.

### Contrato e coletas previstas — `lib/dados/contratos.ts`

Hoje o contrato é o vínculo `Gerador.operador` e uma agenda de coletas (`Agendamento`). A agenda só propõe; o Gerador confirma, e a confirmação cria uma demanda `CONTRATO`.

| Comando | Perfil | RF |
|---|---|---|
| `preverColeta({ residuo, declaradoL, dias, observacao? })` | gerador | RF-006 |
| `confirmar(agendamentoId)` | gerador | RF-006 |
| `alternar(agendamentoId)` / `remover(agendamentoId)` | gerador | — |

O Contrato como entidade própria (vigência, coletas por semana, DOC-006) ainda não existe: a doc não define seu ciclo de vida.

### Parâmetros — `lib/dados/parametros.ts` (`Configuracao`)

| Comando | Perfil | RF |
|---|---|---|
| `definir(id, valor)` — `tolerancia`, `toleranciaMinimaKg`, `antecedenciaPgrsDias`, `tarifaAterro` | prefeitura | RF-004 |
| `definirPreco(residuo, valor)` | prefeitura | extra |
| `restaurar()` | prefeitura | RF-004 |

Toda alteração entra no histórico `{ parametro, anterior, novo, por, quando }`. Parâmetro muda o futuro, nunca reabre o que já foi comprovado.

### Identificação e portaria — `lib/dados/carteiras.ts` (`Identificacao`)

| Comando | Perfil | RF |
|---|---|---|
| `registrarPassagem(codigo, tipo, cargaKg)` | cooperativa | RF-014 |
| `emitir(catadorId, motivo?)`, `renovar`, `reativar`, `suspender(numero, motivo)` | cooperativa | RF-016 |

A verificação pública `/carteira/[codigo]` é só leitura.

## O que ainda depende do backend

- Leituras continuam síncronas nos armazéns do domínio; a troca é hidratar esses armazéns pela API, sem mexer nas telas.
- A trilha ainda guarda `titulo`/`detalhe` em texto; o evento estruturado acima é o formato-alvo.
- IDs e horário ainda nascem no navegador (`Store._novoId`, `new Date()`); no servidor eles saem do comando.
- Sessão e login (`lib/dominio/conta.ts`, `sessao.ts`) são demonstrativos: código sem senha, sem token.
- Integrações (SINIR, SUL, SGP) não existem; o MTR é digitado com a origem declarada.
