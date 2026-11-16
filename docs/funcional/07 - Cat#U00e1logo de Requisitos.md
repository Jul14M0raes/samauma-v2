Requisitos funcionais (RF) derivados dos módulos ([03 - Módulos Funcionais](<03 - Módulos Funcionais.md>)), fluxos ([02 - Macrofluxo do Sistema](<02 - Macrofluxo do Sistema.md>), [04 - Fluxos por Ator](<04 - Fluxos por Ator.md>)) e regras de negócio ([06 - Regras de Negócio](<06 - Regras de Negócio.md>)).

## RF do MOD-001, Cadastro e Regularização

- **RF-001**, manter cadastro do GGR: o Gerador informa e atualiza CNPJ, endereço, razão social, responsável técnico e contrato vigente. Ator: AT-001. RN-004. Critério de aceite: um cadastro incompleto não permite que a situação regulatória avance para Regular (RN-039).
- **RF-002**, enviar e renovar o PGRS: o Gerador envia o PGRS e o renova antes do vencimento. Ator: AT-001. RN-002, RN-003, RN-033. Depende de RF-001.
- **RF-003**, cadastrar grandes geradores e cooperativas, pela Prefeitura. Ator: AT-003, subperfil técnico.
- **RF-004**, definir parâmetros do município: tolerância de conciliação, antecedência do alerta de PGRS, entre outros. Ator: AT-003, subperfil técnico. A antecedência do alerta "a renovar" tem 30 dias como valor inicial (decisão D-05) e é configurável.
- **RF-005**, calcular e exibir a situação regulatória do estabelecimento: Pendente, Regular, A renovar ou Irregular, mais a classificação manual de inconformidade grave. Atores: AT-001 visualiza, AT-003 (subperfil técnico) classifica manualmente. RN-036 a RN-039. Depende de RF-001 e RF-002. A classificação de inconformidade grave nunca é automática (RN-037).

## RF do MOD-002, Contratação e Demandas

- **RF-006**, declarar coleta prevista em contrato: quantidade em litros. Ator: AT-001. RN-006. Depende de RF-001.
- **RF-007**, declarar coleta avulsa, fora do contrato: mesmos critérios de RF-006 quanto à unidade de medida.
- **RF-008**, avaliar quais demandas a cooperativa consegue atender. Ator: AT-002. RN-008. Depende de RF-006/RF-007. Quando não aceita, o cadastro do GGR passa a sinalizar a exigência de mais equipamento da cooperativa.

## RF do MOD-003, Execução da Coleta

- **RF-009**, designar quem executa a coleta. Ator: AT-002. RN-009, RN-017. Depende de RF-008.
- **RF-010**, traçar e sugerir a rota otimizada. Ator: AT-002. RN-009, RN-017. Depende de RF-009.
- **RF-011**, registrar o recebimento e o horário da coleta, obrigatório em toda coleta, sem exceção. Ator: AT-002. RN-010. Depende de RF-010.
- **RF-012**, registrar foto ou quantidade e tipo do resíduo, quando viável. Ator: AT-002. RN-011 a RN-014, todas aplicáveis apenas quando a pesagem de fato ocorre. Depende de RF-011.
- **RF-013**, confirmar o recebimento da coleta, ação distinta do simples registro (RF-011). Ator: AT-002. Depende de RF-011.
- **RF-014**, conferir entrada e saída de quem entrega a carga (Portaria). Ator: AT-002. Nenhuma RN específica. Depende de RF-015.
- **RF-015**, gerir a equipe de cooperados: cadastrar e atualizar dados. Ator: AT-002. O cooperado não é usuário do sistema; a execução em campo ocorre sob o acesso da própria Cooperativa (ver [01 - Atores e Perfis](<01 - Atores e Perfis.md>)).
- **RF-016**, manter a identificação dos cooperados no programa municipal de coleta seletiva. Ator: AT-002. Depende de RF-015; mantida pela cooperativa, nunca pelo próprio cooperado.
- **RF-031**, registrar justificativa e remarcar a coleta por falta de execução atribuída à Cooperativa, dentro de 96 horas. Ator: AT-002. RN-041. Depende de RF-009 e RF-011.

## RF do MOD-004, Divergências e Análise Municipal

- **RF-017**, comparar as três medições e classificar a carga conforme a tolerância. Atores: AT-002 fornece as medições, sistema calcula. RN-020 a RN-022. Depende de RF-013 e RF-004.
- **RF-018**, abrir pendência quando a variação é grande. Ator: AT-003, subperfil técnico, recebe. RN-022. Depende de RF-017. Suspende a emissão de documentos (RF-020 a RF-023) até a decisão do subperfil técnico.
- **RF-019**, registrar a decisão da Prefeitura sobre a divergência, com justificativa, liberando ou mantendo a pendência. Ator: AT-003, subperfil técnico. RN-024, RN-025. Depende de RF-018.

## RF do MOD-005, Documentos e Comprovação

- **RF-020**, consultar e vincular o MTR emitido no SINIR: o Gerador emite o MTR no próprio SINIR, o sistema consulta e vincula o MTR já emitido (decisão D-01, o sistema não emite documento fiscal, apenas consome). Ator: AT-001. RN-002. Depende de RF-013.
- **RF-021**, emitir QR code de regularização. Ator: AT-001. Depende de RF-013. Mesma suspensão de RF-020 em caso de pendência aberta.
- **RF-022**, emitir PGRS. Ator: AT-001. Depende de RF-002. Reflete o estado atual do PGRS, Válido ou Vencido.
- **RF-023**, emitir comprovante simplificado, com as informações principais do MTR. Ator: AT-001. Depende de RF-020.
- **RF-024**, visualizar o MTR por demanda e por contrato aprovado ou finalizado, sem redigitar. Ator: AT-003, subperfil técnico. RN-001. Depende de RF-020.

## RF do MOD-006, Relatórios e Prestação de Contas

- **RF-025**, exportar prestação de contas do contrato e das coletas avulsas, em .xls ou .pdf. Ator: AT-001. RN-007. Depende de RF-006 e RF-020.
- **RF-026**, exportar o que a unidade recebeu, em .xls ou .pdf. Ator: AT-002. Depende de RF-011.
- **RF-027**, exportar os processos do município, em .xls ou .pdf. Ator: AT-003, ambos os subperfis. Depende de RF-024.

## RF do MOD-007, Indicadores e Painel de Gestão

- **RF-028**, exibir a situação do contrato e das coletas em andamento. Ator: AT-001. Depende de RF-005.
- **RF-029**, exibir o que está a caminho e o que foi recebido. Ator: AT-002. Depende de RF-011.
- **RF-030**, exibir indicadores do município e a situação regulatória geral dos estabelecimentos. Ator: AT-003, subperfil Painel de gestão (visão completa) e subperfil técnico (visão resumida). RN-001, parcial. Depende de RF-005.

## Requisitos não funcionais (RNF)

Exigências transversais, extraídas de regras de negócio com natureza de restrição de sistema. Nenhum RNF foi criado sem uma RN de origem, exceto onde declarado como lacuna.

- **RNF-001**, auditoria e histórico de alterações: nenhuma alteração sobrescreve o registro anterior, toda decisão vira um novo evento (RN-026, RN-024). Módulos: MOD-004, principalmente.
- **RNF-002**, classificação por natureza do dado: distinguir dado autodeclarado de dado vindo de um sistema oficial (RN-028). Módulos: MOD-005, principalmente. Detalhamento no Documento 9.
- **RNF-003**, controle de acesso por perfil: restringir ações e telas conforme os quatro perfis (RN-040). Detalhamento fino em [08 - Matriz de Permissões](<08 - Matriz de Permissões.md>).
- **RNF-004**, não automação de decisões administrativas: classificações de irregularidade, penalidades, multas ou selos de regularidade são sempre decisão humana (RN-025, RN-030, RN-031, RN-037).
- **RNF-005**, integridade das medições originais: as três medições de uma carga não podem ser apagadas ou alteradas para eliminar uma divergência (RN-023).
- **RNF-006**, rastreabilidade e referência a sistemas oficiais: todo dado vindo do SINIR (e do SUL, quando integrado) referencia a fonte, a data da consulta e o identificador de origem (RN-027).
- **RNF-007**, tecnologia de registro em campo: o sistema deve suportar o registro em campo da coleta, sob o acesso da Cooperativa.
- **RNF-008**, desempenho e disponibilidade: o sistema deve atender a metas compatíveis com o uso diário pelos três atores.
- **RNF-009**, alerta e contagem de prazos: vencimento do PGRS (RN-033) e janela de justificativa por falta de execução (RN-041, 96 horas a partir da constatação).

## Cobertura

Todas as funcionalidades listadas em [03 - Módulos Funcionais](<03 - Módulos Funcionais.md>) foram cobertas por pelo menos um RF, com algumas fusões explícitas onde duas funcionalidades descreviam o mesmo processamento (por exemplo, RF-006/RF-007 absorvem a declaração de quantidade como dado, não como RF à parte; RF-017 funde comparação das três medições e verificação de tolerância). RF-013 foi desdobrado à parte de "registro de recebimento" por ser uma etapa de negócio distinta (confirmação). RF-031 foi incluído por decorrência da RN-041, sem corresponder a uma funcionalidade já listada em [03 - Módulos Funcionais](<03 - Módulos Funcionais.md>).

Todas as etapas do macrofluxo ([02 - Macrofluxo do Sistema](<02 - Macrofluxo do Sistema.md>)) e dos fluxos por ator ([04 - Fluxos por Ator](<04 - Fluxos por Ator.md>)) têm RF correspondente, com exceção de FL-001-E02 para os casos não atribuídos à Cooperativa.

Requisitos sem RN ou fluxo por ator diretamente associado nas fontes (mantidos por corresponderem a uma funcionalidade já listada em [03 - Módulos Funcionais](<03 - Módulos Funcionais.md>), não por invenção): RF-003, RF-004, RF-014, RF-015, RF-016, RF-025 a RF-030.

Pontos em aberto ligados a este documento: ver [Contradições e Pontos em Aberto](<Contradições e Pontos em Aberto.md>).
