Os fluxos deste documento continuam a numeração FL iniciada em [02 - Macrofluxo do Sistema](<02 - Macrofluxo do Sistema.md>), onde FL-001 é o macrofluxo do sistema. Por isso, os fluxos por ator começam em FL-002. Cada fluxo aqui detalha, no nível do ator, etapas já previstas no macrofluxo e nos módulos de [03 - Módulos Funcionais](<03 - Módulos Funcionais.md>), sem criar requisitos, apenas modelando o comportamento esperado.

Foram identificados sete fluxos: FL-002 e FL-003, do Gerador; FL-004 e FL-005, da Cooperativa; FL-006, FL-007 e FL-008, da Prefeitura.

## FL-002, Gerador: declarar coleta e obter comprovação

- Ator principal: AT-001. Atores secundários: AT-002, recebe a demanda e confirma o recebimento; AT-003, subperfil técnico, visualiza o MTR ao final.
- Objetivo: declarar uma coleta, prevista em contrato ou avulsa, e obter os documentos que comprovam sua regularidade.
- Gatilho: chegada da data prevista em contrato, ou necessidade de uma coleta avulsa.
- Pré-condições: cadastro do GGR completo (MOD-001); contrato vigente com uma cooperativa, quando a coleta for prevista em contrato.
- Fluxo principal:
  1. Gerador declara a coleta, prevista em contrato ou avulsa, informando a quantidade em litros (RN-006).
  2. Sistema registra a demanda e a encaminha para avaliação da Cooperativa (MOD-002).
  3. Cooperativa avalia, designa e executa a coleta, e confirma o recebimento (ver FL-004).
  4. Sistema libera a emissão de documentos ao Gerador, após o recebimento confirmado e, quando aplicável, a conciliação sem divergência.
  5. Gerador emite o MTR, o QR de regularização, o PGRS vigente e o comprovante simplificado (RN-002).
  6. Sistema disponibiliza o MTR para a Prefeitura, por demanda e contrato (RN-001).
- Fluxo alternativo, FL-002-A: Cooperativa não consegue atender a demanda, segue FL-001-A; o Gerador permanece sem coleta designada até nova avaliação, e o cadastro do GGR passa a registrar a exigência de mais equipamento junto à cooperativa (RN-008).
- Exceções:
  - FL-002-E01, divergência de medição grande: segue FL-001-E01; a emissão dos documentos (passo 5) fica suspensa até a decisão do subperfil técnico da Prefeitura.
  - FL-002-E02, cadastro incompleto ou PGRS vencido: a declaração da coleta é bloqueada até a regularização do cadastro (MOD-001).
- Pós-condições: coleta registrada e, quando concluída sem pendência, documentos emitidos e MTR visível para a Prefeitura.
- Dados envolvidos: dados cadastrais do GGR, quantidade declarada, dados do contrato, documentos emitidos.
- Módulos relacionados: MOD-002, MOD-003 (indireto via Cooperativa), MOD-004 (quando há divergência), MOD-005.
- Regras relacionadas: RN-001, RN-002, RN-006, RN-008.

## FL-003, Gerador: manter cadastro e regularidade

- Ator principal: AT-001. Atores secundários: AT-003, subperfil técnico, cadastra e classifica a situação regulatória.
- Objetivo: manter o cadastro, o contrato e o PGRS em dia, evitando a situação Irregular perante a Prefeitura.
- Gatilho: necessidade de atualizar o cadastro, ou proximidade do vencimento do PGRS.
- Pré-condições: nenhuma; é o primeiro contato do Gerador com o sistema quando ainda não há cadastro.
- Fluxo principal:
  1. Gerador informa ou atualiza os dados cadastrais: CNPJ, endereço, razão social, responsável técnico e contrato vigente (RN-004).
  2. Sistema verifica a completude do cadastro.
  3. Gerador envia o PGRS.
  4. Sistema registra a data de emissão e calcula o vencimento, 12 meses (RN-003).
  5. Sistema combina cadastro, PGRS e demandas para classificar a situação regulatória, Regular, Irregular ou Pendente (RN-036 a RN-039).
  6. Gerador visualiza a própria situação regulatória no painel (MOD-007).
- Fluxo alternativo, FL-003-A: renovação do PGRS antes do vencimento. Quando faltar um número configurável de dias para o vencimento, o sistema exibe o estado "a renovar" (RN-033), e o Gerador reenvia o PGRS, retornando ao passo 3.
- Exceções:
  - FL-003-E01, PGRS vencido sem renovação: a situação regulatória passa a Irregular (RN-036).
  - FL-003-E02, inconformidade grave classificada manualmente: o subperfil técnico da Prefeitura classifica uma inconformidade grave, e a situação regulatória passa a Irregular, sempre por decisão humana (RN-037).
- Pós-condições: cadastro atualizado; situação regulatória calculada e visível ao Gerador e à Prefeitura.
- Dados envolvidos: dados cadastrais, data de emissão do PGRS, situação regulatória.
- Módulos relacionados: MOD-001, MOD-007.
- Regras relacionadas: RN-003, RN-004, RN-033, RN-036, RN-037, RN-038, RN-039.

## FL-004, Cooperativa: avaliar, designar e executar a coleta

- Ator principal: AT-002. Atores secundários: AT-001, declarou a demanda; AT-003, subperfil técnico, decide pendências de divergência, quando houver.
- Objetivo: avaliar as demandas recebidas, designar quem executa a coleta, realizar a coleta em campo e confirmar o recebimento.
- Gatilho: chegada de uma nova demanda declarada por um Gerador (MOD-002).
- Pré-condições: demanda declarada e visível em Demandas existentes; cadastro da cooperativa em dia (MOD-001).
- Fluxo principal:
  1. Cooperativa analisa a demanda e avalia se consegue atendê-la.
  2. Sistema registra a decisão, demanda aceita ou não aceita.
  3. Cooperativa designa quem executa a coleta e traça a rota, considerando localização, horário, dia da semana e capacidade do caminhão (RN-017).
  4. Coleta é executada; o responsável registra que recebeu a carga e a que horas (RN-010, obrigatório em toda coleta).
  5. Quando viável, registra foto ou declara a quantidade e o tipo do resíduo.
  6. Cooperativa confirma o recebimento da coleta.
  7. Sistema compara as três medições, quando aplicável, e libera a carga para comprovação (ver FL-001, etapa E5).
- Fluxo alternativo, FL-004-A: demanda não aceita, segue FL-001-A; o cadastro do Gerador junto à Prefeitura passa a exigir mais equipamento da cooperativa (RN-008).
- Exceções:
  - FL-004-E01, divergência de medição grande: segue FL-001-E01; a carga fica pendente até a decisão do subperfil técnico da Prefeitura (RN-025).
  - FL-004-E02, coleta prevista não executada dentro do prazo: segue FL-001-E02; gera pendência de execução. Quando a causa é atribuída à Cooperativa, esta deve registrar a justificativa em até 96 horas e remarcar a coleta (RN-041).
- Pós-condições: demanda avaliada; quando aceita, coleta executada e recebimento confirmado, liberando a etapa de documentos (FL-002).
- Dados envolvidos: demanda, rota, dados de recebimento, responsável e horário, eventualmente foto, quantidade e tipo do resíduo, massa aferida.
- Módulos relacionados: MOD-002, MOD-003, MOD-004 (quando há divergência).
- Regras relacionadas: RN-008, RN-009, RN-010, RN-011, RN-012, RN-013, RN-014, RN-017, RN-020, RN-021, RN-022, RN-023, RN-024, RN-025, RN-035.

## FL-005, Cooperativa: gerir equipe e portaria

- Ator principal: AT-002. Sem atores secundários.
- Objetivo: manter a equipe de cooperados cadastrada e identificada, e controlar a entrada e saída de quem entrega a carga na unidade.
- Gatilho: entrada ou saída de um cooperado da equipe; chegada de uma carga na unidade.
- Pré-condições: cadastro da cooperativa em dia.
- Fluxo principal:
  1. Cooperativa cadastra ou atualiza os dados de um cooperado na equipe.
  2. Sistema mantém a identificação do cooperado no programa municipal de coleta seletiva.
  3. Ao chegar uma carga na unidade, a cooperativa confere quem está entregando (Portaria).
  4. Sistema registra a conferência de entrada e saída.
- Fluxo alternativo: nenhum identificado.
- Exceção, FL-005-E01: pessoa não identificada na equipe tenta entregar uma carga.
- Pós-condições: equipe atualizada; entrada e saída da carga registradas.
- Dados envolvidos: dados dos cooperados, identificação no programa municipal, registro de entrada e saída.
- Módulos relacionados: MOD-003.
- Regras relacionadas: nenhuma RN especificamente citada para este fluxo hoje.

## FL-006, Prefeitura (subperfil técnico): cadastrar GGR e cooperativa, definir parâmetros

- Ator principal: AT-003, subperfil técnico. Atores secundários: AT-001, AT-002, são cadastrados.
- Objetivo: manter o cadastro centralizado de grandes geradores e cooperativas, e definir os parâmetros do município.
- Gatilho: necessidade de cadastrar um novo GGR ou cooperativa, ou de ajustar um parâmetro do município.
- Pré-condições: nenhuma.
- Fluxo principal:
  1. Subperfil técnico cadastra um grande gerador ou uma cooperativa.
  2. Sistema registra o cadastro (MOD-001).
  3. Subperfil técnico define ou ajusta um parâmetro do município, por exemplo a tolerância de conciliação ou a antecedência do alerta de PGRS.
  4. Sistema aplica o parâmetro aos módulos que dependem dele (MOD-001 e MOD-004).
- Fluxo alternativo: nenhum identificado.
- Exceção, FL-006-E01: cadastro duplicado de um GGR ou cooperativa.
- Pós-condições: cadastro de GGR ou cooperativa criado ou atualizado; parâmetros do município aplicados.
- Dados envolvidos: dados cadastrais do GGR e da cooperativa, parâmetros do município.
- Módulos relacionados: MOD-001, MOD-004 (parâmetro de tolerância).
- Regras relacionadas: nenhuma RN especificamente citada; RN-004 e RN-005 tratam do cadastro do GGR sob a ótica do próprio GGR.

## FL-007, Prefeitura (subperfil técnico): analisar e decidir pendências de divergência

- Ator principal: AT-003, subperfil técnico. Atores secundários: AT-001, AT-002, partes da carga em análise.
- Objetivo: analisar uma divergência de medição grande e decidir se a carga é aceita ou tratada como irregularidade.
- Gatilho: abertura de uma pendência de divergência, quando a variação entre as três medições ultrapassa a tolerância configurada (RN-022).
- Pré-condições: carga com as três medições registradas, declarada, observada e aferida.
- Fluxo principal:
  1. Sistema apresenta a pendência ao subperfil técnico, com as três medições.
  2. Subperfil técnico analisa a divergência.
  3. Subperfil técnico decide, registrando a decisão como um novo evento, com justificativa (RN-024).
  4. Sistema libera a carga para comprovação, ou mantém a pendência, conforme a decisão (RN-025).
- Fluxo alternativo: nenhum identificado.
- Exceção, FL-007-E01: sem critério objetivo definido, a decisão fica inteiramente ao julgamento do subperfil técnico.
- Pós-condições: pendência decidida; carga liberada ou mantida pendente, com o histórico de decisão preservado.
- Dados envolvidos: as três medições da carga, decisão registrada, justificativa.
- Módulos relacionados: MOD-004.
- Regras relacionadas: RN-020, RN-021, RN-022, RN-023, RN-024, RN-025.

## FL-008, Prefeitura: acompanhar MTR e indicadores

- Ator principal: AT-003, ambos os subperfis. Atores secundários: AT-001, emitiu os documentos.
- Objetivo: acompanhar o MTR por demanda e contrato, e visualizar indicadores consolidados do município.
- Gatilho: necessidade de consultar a situação de um contrato ou de revisar os indicadores do município.
- Pré-condições: existência de ao menos uma demanda ou contrato com documentos emitidos, para o MTR; dados consolidados disponíveis, para os indicadores.
- Fluxo principal:
  1. Subperfil técnico visualiza o MTR por demanda e por contrato aprovado ou finalizado (RN-001).
  2. Subperfil painel de gestão visualiza os indicadores do município (MOD-007).
  3. Prefeitura exporta relatórios dos processos do município, quando necessário (MOD-006).
- Fluxo alternativo: nenhum identificado. Exceções: nenhuma identificada.
- Pós-condições: nenhuma alteração de estado; fluxo de consulta e leitura.
- Dados envolvidos: MTR por demanda e contrato, indicadores do município.
- Módulos relacionados: MOD-005, MOD-006, MOD-007.
- Regras relacionadas: RN-001.

## Tabela consolidada de fluxos

| ID | Fluxo | Ator principal | Atores secundários | Módulos relacionados |
|---|---|---|---|---|
| FL-001 | Macrofluxo do sistema ([02 - Macrofluxo do Sistema](<02 - Macrofluxo do Sistema.md>)) | AT-001, AT-002, AT-003 | todos | MOD-001 a MOD-007 |
| FL-002 | Declarar coleta e obter comprovação | AT-001 | AT-002, AT-003 | MOD-002, MOD-003, MOD-004, MOD-005 |
| FL-003 | Manter cadastro e regularidade | AT-001 | AT-003 | MOD-001, MOD-007 |
| FL-004 | Avaliar, designar e executar a coleta | AT-002 | AT-001, AT-003 | MOD-002, MOD-003, MOD-004 |
| FL-005 | Gerir equipe e portaria | AT-002 | nenhum | MOD-003 |
| FL-006 | Cadastrar GGR e cooperativa, definir parâmetros | AT-003 | AT-001, AT-002 | MOD-001, MOD-004 |
| FL-007 | Analisar e decidir pendências de divergência | AT-003 | AT-001, AT-002 | MOD-004 |
| FL-008 | Acompanhar MTR e indicadores | AT-003 | AT-001 | MOD-005, MOD-006, MOD-007 |

## Cobertura do macrofluxo pelos fluxos por ator

| Elemento do macrofluxo | Fluxo por ator que detalha |
|---|---|
| E1, Declaração da coleta | FL-002 |
| E2, Avaliação da demanda | FL-004 |
| E3, Designação e rota | FL-004 |
| E4, Coleta e registro | FL-004 |
| E5, Confirmação do recebimento | FL-004 |
| E6, Emissão de documentos | FL-002 |
| E7, Acompanhamento pela Prefeitura | FL-008 |
| FL-001-A, demanda não atendida | FL-002-A, FL-004-A |
| FL-001-B, situação regulatória em paralelo | FL-003 |
| FL-001-E01, divergência de medição grande | FL-002-E01, FL-004-E01, FL-007 |
| FL-001-E02, coleta prevista não executada | FL-004-E02 |
| FL-001-E03, PGRS vencido ou próximo do vencimento | FL-003-E01 |

Todo elemento do macrofluxo foi detalhado por pelo menos um fluxo por ator. FL-005 e FL-006 detalham capacidades de MOD-003 e MOD-001 que não apareciam como etapas explícitas do macrofluxo, mas são necessárias para que ele funcione: gestão de equipe e portaria, e cadastro inicial de GGR e cooperativa.

Pontos em aberto ligados a este documento: ver [Contradições e Pontos em Aberto](<Contradições e Pontos em Aberto.md>).
