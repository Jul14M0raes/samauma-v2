Cruza os atores e subperfis ([01 - Atores e Perfis](<01 - Atores e Perfis.md>)) com os recursos e ações identificados nos módulos ([03 - Módulos Funcionais](<03 - Módulos Funcionais.md>)), nos fluxos ([02 - Macrofluxo do Sistema](<02 - Macrofluxo do Sistema.md>), [04 - Fluxos por Ator](<04 - Fluxos por Ator.md>)) e, principalmente, nos requisitos funcionais ([07 - Catálogo de Requisitos](<07 - Catálogo de Requisitos.md>)). Cada linha é justificada por pelo menos um RF, uma RN ou um fluxo já modelado.

Ações consideradas: visualizar, criar, editar, excluir, aprovar, rejeitar, cancelar, exportar, administrar, atribuir e compartilhar. A matriz só lista uma combinação de recurso e ação quando corresponde a um RF, uma RN ou um passo de fluxo já modelado.

## Tipos de acesso

- **Global**: alcança os dados de todos os estabelecimentos, cooperativas ou registros do sistema, sem se limitar à própria organização. Típico do subperfil Técnico/administrativo da regulação.
- **Organização**: alcança todos os registros da própria organização (o próprio GGR ou a própria cooperativa), mas nenhum dado de outra organização. É o tipo mais comum entre AT-001 e AT-002.
- **Próprios registros**: alcança apenas os registros criados ou tratados pelo próprio usuário dentro da organização. As fontes não definem múltiplos usuários com login próprio dentro de uma mesma organização (o Gerador e a Cooperativa são cada um um único perfil de acesso, RN-040), então este tipo quase não se aplica hoje; fica sinalizado como relevante se, por exemplo, o responsável técnico do GGR vier a ter login próprio.
- **Somente leitura**: permite visualizar um dado sem poder criá-lo, editá-lo ou excluí-lo.
- **Condicionado**: a permissão só existe sob uma condição de negócio específica, por exemplo apenas enquanto uma pendência está aberta, ou apenas dentro de uma janela de prazo (as 96 horas de RN-041).
- **Administrativo**: ações de configuração do próprio sistema ou de cadastro de outros atores, distintas da operação cotidiana do negócio.

Além dos quatro perfis humanos, algumas ações são executadas pelo próprio sistema, de forma automática (por exemplo o cálculo da situação regulatória ou a abertura de uma pendência de divergência). Essas ações aparecem com o executor "Sistema", sem tipo de acesso associado a um perfil humano.

## Perfis considerados

RN-040 define quatro perfis de acesso. Nenhum perfil novo é criado neste documento.

| Perfil | Ator ou subperfil | Organização que representa |
|---|---|---|
| Gerador | AT-001 | Um GGR, individualmente |
| Cooperativa | AT-002 | Uma cooperativa, individualmente; inclui a execução em campo e o papel implícito de unidade receptora |
| Prefeitura, Painel de gestão | AT-003, subperfil Painel de gestão | A Prefeitura de Porto Velho (SEMA), para apresentação e indicadores |
| Prefeitura, Técnico/administrativo da regulação | AT-003, subperfil Técnico | A Prefeitura de Porto Velho (SEMA), para cadastro, parâmetros e decisões de regulação |

O cooperado que executa a coleta em campo não é um perfil de acesso próprio, toda ação de campo ocorre sob o perfil Cooperativa. O responsável técnico do GGR também não tem perfil próprio, apenas dado cadastral do perfil Gerador. Nenhum dos dois aparece como linha independente nesta matriz.

Os dois subperfis de AT-003 são tratados como perfis distintos nesta matriz, mesmo pertencendo ao mesmo ator e à mesma organização, porque exercem funções diferentes (apresentação e verificação) e porque RN-040 os conta como perfis separados.

## MOD-001, Cadastro e Regularização

| Recurso | Ação | Perfil | Tipo de acesso | Justificativa |
|---|---|---|---|---|
| Cadastro do GGR | Criar, editar | Gerador | Organização | RF-001, RN-004 |
| Cadastro do GGR | Criar, editar | Técnico | Global | RF-003 |
| Cadastro do GGR | Visualizar | Técnico | Global, somente leitura | RF-003, RF-005 |
| PGRS | Criar, editar, exportar | Gerador | Organização | RF-002, RN-002, RN-003 |
| PGRS | Visualizar | Técnico | Global, somente leitura | RF-005, verificação do vencimento |
| Cadastro da Cooperativa | Criar, editar | Técnico | Global | RF-003 |
| Parâmetros do município | Criar, editar, administrar | Técnico | Administrativo | RF-004 |
| Situação regulatória (EST-002) | Visualizar | Gerador | Organização, somente leitura | RF-005 |
| Situação regulatória (EST-002) | Visualizar | Técnico | Global, somente leitura | RF-005 |
| Situação regulatória (EST-002) | Aprovar, rejeitar, classificar inconformidade grave | Técnico | Global, condicionado, decisão sempre humana | RF-005, RN-025, RN-037 |
| Situação regulatória (EST-002) | Editar, calcular (Regular, Irregular, Pendente, A renovar) | Sistema | Automático | RF-005, RN-036, RN-038, RN-039 |

## MOD-002, Contratação e Demandas

| Recurso | Ação | Perfil | Tipo de acesso | Justificativa |
|---|---|---|---|---|
| Demanda, coleta prevista em contrato | Criar | Gerador | Organização | RF-006, RN-006 |
| Demanda, coleta avulsa | Criar | Gerador | Organização | RF-007, RN-006 |
| Demanda | Visualizar | Gerador | Organização, somente leitura | RF-006, RF-007, acompanhamento da própria demanda |
| Demanda | Visualizar, as endereçadas a si | Cooperativa | Organização | RF-008 |
| Demanda | Aprovar, rejeitar, atender ou não atender | Cooperativa | Organização | RF-008, RN-008 |
| Cadastro do GGR, sinalização de mais equipamento | Editar | Sistema | Automático, decorrente da rejeição da Cooperativa | RF-008, RN-008; a Cooperativa não tem permissão de edição direta sobre o cadastro do GGR, apenas o sistema sinaliza a partir da decisão |

## MOD-003, Execução da Coleta

| Recurso | Ação | Perfil | Tipo de acesso | Justificativa |
|---|---|---|---|---|
| Designação e rota | Criar, editar, atribuir | Cooperativa | Organização | RF-009, RF-010, RN-017 |
| Recebimento | Criar, editar | Cooperativa | Organização | RF-011, RF-012, RN-010 a RN-014 |
| Recebimento | Aprovar, confirmar | Cooperativa | Organização | RF-013 |
| Portaria, entrada e saída da carga | Criar | Cooperativa | Organização | RF-014 |
| Equipe de cooperados | Criar, editar, excluir, administrar | Cooperativa | Organização, administrativo | RF-015 |
| Identificação no programa municipal | Criar, editar | Cooperativa | Organização | RF-016; mantida pela cooperativa, nunca pelo próprio cooperado |
| Pendência de execução (EST-001) | Criar, justificar | Cooperativa | Organização, condicionado, apenas dentro de 96 horas | RF-031, RN-041 |
| Pendência de execução (EST-001) | Editar, remarcar a coleta | Cooperativa | Organização, condicionado, apenas dentro de 96 horas | RF-031, RN-041 |

## MOD-004, Divergências e Análise Municipal

| Recurso | Ação | Perfil | Tipo de acesso | Justificativa |
|---|---|---|---|---|
| Conciliação de medições | Criar, calcular, classificar | Sistema | Automático | RF-017, RN-020 a RN-022 |
| Conciliação de medições | Visualizar | Cooperativa | Organização, somente leitura | RF-017, fornece as medições |
| Conciliação de medições | Editar, excluir a medição original | nenhum perfil | bloqueado por regra | RN-023, integridade das medições; nenhum perfil tem esta permissão, por desenho |
| Pendência de divergência (EST-004) | Criar, abrir | Sistema | Automático | RF-018, RN-022 |
| Pendência de divergência (EST-004) | Visualizar | Técnico | Global | RF-019 |
| Pendência de divergência (EST-004) | Visualizar, a própria | Cooperativa | Organização, somente leitura | Decorrente de fornecer as medições (RF-017) |
| Pendência de divergência (EST-004) | Aprovar, liberar a carga | Técnico | Global, condicionado, apenas enquanto a pendência está Aberta | RF-019, RN-024, RN-025 |
| Pendência de divergência (EST-004) | Rejeitar, manter a divergência | Técnico | Global, condicionado | RF-019, RN-024, RN-025 |

## MOD-005, Documentos e Comprovação

| Recurso | Ação | Perfil | Tipo de acesso | Justificativa |
|---|---|---|---|---|
| MTR | Criar, exportar | Gerador | Organização, condicionado, apenas após recebimento confirmado e sem pendência aberta | RF-020, RN-002, RN-027 |
| QR code de regularização | Criar, exportar | Gerador | Organização, condicionado | RF-021, RN-002 |
| PGRS, documento emitido | Criar, exportar | Gerador | Organização | RF-022, RN-002 |
| Comprovante simplificado | Criar, exportar | Gerador | Organização, condicionado | RF-023, RN-002 |
| MTR, QR, PGRS emitido, comprovante | Visualizar | Técnico | Global, somente leitura | RF-024, RN-001 |
| MTR, QR, PGRS emitido, comprovante | Visualizar, editar, excluir | Cooperativa | não coberto | Sem acesso; MOD-005 relaciona apenas AT-001 e AT-003 |

## MOD-006, Relatórios e Prestação de Contas

| Recurso | Ação | Perfil | Tipo de acesso | Justificativa |
|---|---|---|---|---|
| Prestação de contas do contrato e coletas avulsas | Exportar | Gerador | Organização | RF-025, RN-007 |
| Prestação de contas do contrato e coletas avulsas | Visualizar, editar | Cooperativa, Técnico | não coberto | Relatório é exclusivo do escopo do Gerador (RN-007) |
| O que a unidade recebeu | Exportar | Cooperativa | Organização | RF-026 |
| Processos do município | Exportar | Técnico | Global | RF-027 |
| Processos do município | Exportar | Painel de gestão | Global | Decisão: o subperfil Painel de gestão também exporta relatório do município em .pdf e .xls (RF-027) |

## MOD-007, Indicadores e Painel de Gestão

| Recurso | Ação | Perfil | Tipo de acesso | Justificativa |
|---|---|---|---|---|
| Painel do Gerador, contrato e coletas em andamento | Visualizar | Gerador | Organização, somente leitura | RF-028 |
| Painel da Cooperativa, a caminho e recebido | Visualizar | Cooperativa | Organização, somente leitura | RF-029 |
| Indicadores do município | Visualizar | Painel de gestão | Global, somente leitura | RF-030, RN-001 parcial |
| Indicadores do município | Visualizar | Técnico | Global, somente leitura, versão resumida | Decisão: o subperfil Técnico visualiza os indicadores em versão resumida (RF-030) |
| Situação regulatória geral, para apresentação | Visualizar | Painel de gestão | Global, somente leitura | Necessidade do subperfil Painel de gestão ([01 - Atores e Perfis](<01 - Atores e Perfis.md>)); sem RF próprio, apenas mencionado como parte de RF-030 |

## Ações sem cobertura

Das onze ações pedidas (visualizar, criar, editar, excluir, aprovar, rejeitar, cancelar, exportar, administrar, atribuir, compartilhar), duas não aparecem em nenhuma linha da matriz, por ausência de base nas fontes:

- **Compartilhar**: nenhum RF, RN ou fluxo descreve o compartilhamento de um registro, documento ou relatório entre perfis diferentes, além da visualização já prevista (por exemplo do MTR pela Prefeitura, RF-024).
- **Excluir**: nenhuma funcionalidade de exclusão de cadastro, demanda, coleta ou documento já emitido foi descrita nas fontes (mesma ausência de cancelamento já registrada em [05 - Estados e Ciclos de Vida](<05 - Estados e Ciclos de Vida.md>) para EST-001, estendida aqui à exclusão em geral).

A ação **atribuir** aparece de forma clara apenas em RF-009 (designação de quem executa a coleta). As ações **cancelar** e **rejeitar** aparecem apenas onde já listadas (RF-008, RF-019); nenhum outro recurso das fontes admite cancelamento ou rejeição.

Pontos em aberto ligados a este documento: ver [Contradições e Pontos em Aberto](<Contradições e Pontos em Aberto.md>).
