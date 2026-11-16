Quatro entidades têm estados suficientemente definidos para detalhamento: EST-001, Demanda e Coleta; EST-002, Situação Regulatória do Estabelecimento; EST-003, PGRS; EST-004, Pendência de Divergência de Medição.

Outras entidades foram cogitadas, mas as fontes não definem um ciclo de vida para elas: Contrato entre Gerador e Cooperativa (só é citado como vigente, sem eventos de início, renovação ou encerramento descritos); Cadastro da Cooperativa (não tem uma situação regulatória própria definida, apenas o cadastro do GGR tem RN-036 a RN-039); Equipe ou Cooperado (sem estados como ativo ou inativo definidos).

## EST-001, Demanda e Coleta

Estados possíveis: Rascunho, Criada, Disponível ou Programada, Não aceita, Aceita, Em coleta, Em transporte, Recebida, Em conciliação, Comprovada, Pendência de divergência, Pendência de execução.

Significado de cada estado:

- Criada: a coleta foi declarada pelo Gerador, prevista em contrato ou avulsa (E1, FL-002 passo 1).
- Disponível ou Programada: a demanda está visível para a Cooperativa avaliar, em Demandas existentes.
- Não aceita: a Cooperativa avaliou e concluiu que não consegue atender (FL-001-A, FL-004-A).
- Aceita: a Cooperativa decidiu atender a demanda (FL-004 passo 2).
- Em coleta: a Cooperativa designou quem executa e traçou a rota, e a coleta está em execução (FL-004 passos 3 e 4).
- Recebida: o recebimento foi confirmado, com responsável e horário registrados (RN-010, FL-004 passo 6).
- Em conciliação: as três medições (declarada, observada e aferida) estão sendo comparadas (MOD-004).
- Comprovada: a variação entre as medições ficou dentro da tolerância, ou a pendência foi decidida a favor da liberação (RN-021, RN-025).
- Pendência de divergência: a variação ultrapassou a tolerância configurada (RN-022), aguardando decisão do subperfil técnico da Prefeitura.
- Pendência de execução: a coleta prevista em contrato não foi executada dentro do prazo combinado (RN-034). Quando a causa é atribuída à cooperativa, a pendência tem saída definida: justificativa registrada em até 96 horas e remarcação da coleta (RN-041).

Transições:

| Estado atual             | Evento                                                      | Condição                                                  | Responsável                  | Novo estado                         |
| ------------------------ | ----------------------------------------------------------- | --------------------------------------------------------- | ---------------------------- | ----------------------------------- |
| Criada                   | Encaminhar para avaliação                                   | automático                                                | Sistema                      | Disponível ou Programada            |
| Disponível ou Programada | Avaliar a demanda                                           | Cooperativa consegue atender                              | Cooperativa, AT-002          | Aceita                              |
| Disponível ou Programada | Avaliar a demanda                                           | Cooperativa não consegue atender                          | Cooperativa, AT-002          | Não aceita                          |
| Não aceita               | Nova avaliação, após exigência de mais equipamento (RN-008) | RN-008                                                    | Cooperativa, AT-002          | Disponível ou Programada            |
| Aceita                   | Designar e traçar a rota                                    | RN-017                                                    | Cooperativa, AT-002          | Em coleta                           |
| Aceita ou Em coleta      | Prazo combinado em contrato não cumprido                    | RN-034                                                    | Sistema (cálculo automático) | Pendência de execução               |
| Em coleta                | Confirmar o recebimento                                     | registro de responsável e horário, RN-010                 | Cooperativa, AT-002          | Recebida                            |
| Recebida                 | Comparar as três medições                                   | existem as três medições                                  | Sistema                      | Em conciliação                      |
| Em conciliação           | Verificar tolerância                                        | variação dentro da tolerância, RN-021                     | Sistema                      | Comprovada                          |
| Em conciliação           | Verificar tolerância                                        | variação fora da tolerância, RN-022                       | Sistema                      | Pendência de divergência            |
| Pendência de divergência | Decidir a pendência                                         | subperfil técnico decide liberar, RN-024, RN-025          | Prefeitura, AT-003, técnico  | Comprovada                          |
| Pendência de execução    | Registrar justificativa e remarcar a coleta                 | causa atribuída à cooperativa, dentro de 96 horas, RN-041 | Cooperativa, AT-002          | Programada ou Aceita, com nova data |

Estados terminais: Comprovada é o sucesso do ciclo.

Reversibilidade: as três medições registradas na conciliação não podem ser apagadas ou alteradas para eliminar uma divergência (RN-023). Uma nova decisão sobre uma pendência exige um novo evento registrado (RN-024), nunca a sobrescrita da decisão anterior.

Cancelamento: não há, nas fontes, uma funcionalidade explícita de cancelamento de uma demanda ou coleta já criada.

Histórico: RN-026 exige que toda alteração de dado relevante para auditoria preserve o valor anterior, o novo valor, o autor, a data e hora, e a justificativa; aplica-se às transições de conciliação e de pendência.

Representação textual do caminho principal: Criada → Programada → Aceita → Em coleta → Recebida → Em conciliação → Comprovada.

## EST-002, Situação Regulatória do Estabelecimento (GGR)

Atributo calculado que resume a conformidade do cadastro perante a Prefeitura/SEMA. Relacionada a AT-001 (Gerador) e AT-003 (Prefeitura/SEMA), aos módulos MOD-001 e MOD-004, e à entidade EST-003 (PGRS), da qual depende diretamente.

Estados possíveis: Pendente, Regular, A renovar, Irregular.

Significado de cada estado:

- Pendente: cadastro, PGRS ou demandas do estabelecimento estão em processo de aprovação (RN-038). É o estado em que o estabelecimento aguarda análise antes de ser classificado como Regular ou Irregular.
- Regular: o estabelecimento possui cadastro completo, PGRS válido dentro da vigência e nenhuma inconformidade grave registrada (RN-039).
- A renovar: faltam 30 dias para o vencimento do PGRS, valor inicial configurável (RN-033). Sinaliza a necessidade de reenvio antes do vencimento. É um estado intermediário e independente, distinto de Regular; se o PGRS não for renovado antes do vencimento efetivo, a situação avança para Irregular (RN-036).
- Irregular: ocorre quando o cadastro está incompleto, ou o PGRS não foi enviado, ou o PGRS está vencido (RN-036), ou a Prefeitura classifica manualmente uma inconformidade como grave (RN-037, decisão sempre humana, nunca automática, alinhada a RN-025).

Transições:

| De | Para | Evento ou condição | Responsável | Observação |
|---|---|---|---|---|
| (criação do cadastro) | Pendente | Cadastro, PGRS ou demandas em processo de aprovação | Sistema (cálculo automático) | RN-038 |
| Pendente | Regular | Cadastro completo, PGRS válido e sem inconformidade grave | Sistema (cálculo automático) | RN-039 |
| Regular | A renovar | Proximidade do vencimento do PGRS | Sistema (cálculo automático) | RN-033, 30 dias, configurável |
| A renovar | Regular | PGRS renovado antes do vencimento | Sistema (cálculo automático) | Confirmado em revisão: a renovação retorna o estabelecimento a Regular |
| A renovar | Irregular | PGRS vence sem renovação | Sistema (cálculo automático) | RN-036 |
| Regular ou Pendente | Irregular | Cadastro incompleto, PGRS não enviado ou vencido | Sistema (cálculo automático) | RN-036 |
| Regular, Pendente ou A renovar | Irregular | Classificação manual de inconformidade grave | Prefeitura/SEMA (AT-003) | RN-037, decisão sempre humana |

Estados terminais: nenhum estado desta entidade é terminal; a situação regulatória é recalculada continuamente enquanto o estabelecimento existir no sistema.

Reversibilidade: as transições calculadas automaticamente (RN-036, RN-038, RN-039) parecem reversíveis por natureza, já que dependem de condições recalculáveis.

Cancelamento: não há previsão de cancelamento desta entidade nas fontes.

Histórico: não há regra explícita exigindo histórico de mudanças de situação regulatória, diferente da RN-026 (histórico de conciliação).

## EST-003, PGRS (Plano de Gerenciamento de Resíduos Sólidos)

Documento vinculado ao estabelecimento gerador (AT-001). Relacionado ao módulo MOD-001 e à entidade EST-002, que consome o estado do PGRS como uma de suas condições de cálculo (RN-033, RN-036, RN-039).

Estados possíveis: Válido, Vencido. As fontes não definem explicitamente um terceiro estado "a renovar" pertencente ao próprio PGRS: a RN-033 descreve "a renovar" como um estado exibido na situação do GGR (EST-002), não necessariamente um estado próprio do PGRS. Por isso, "A renovar" é tratado aqui como um alerta derivado, não como estado autônomo.

Significado de cada estado:

- Válido: o PGRS foi emitido e ainda não completou 12 meses desde a emissão (RN-003).
- Vencido: o PGRS completou 12 meses desde a emissão (RN-003).

Transições:

| De | Para | Evento ou condição | Responsável | Observação |
|---|---|---|---|---|
| Válido | (alerta "a renovar" projetado em EST-002) | Dias configuráveis antes do vencimento | Sistema (cálculo automático) | RN-033; não altera o estado do PGRS em si |
| Válido | Vencido | Decorrência de 12 meses desde a emissão | Sistema (cálculo automático) | RN-003 |

Estados terminais: nenhum estado é terminal; um PGRS vencido pode, em princípio, ser renovado.

Reversibilidade: a transição Válido para Vencido é automática e baseada em prazo (RN-003).

Cancelamento: não há previsão de cancelamento do PGRS nas fontes.

Histórico: não há regra explícita sobre manter histórico de versões do PGRS.

## EST-004, Pendência de Divergência de Medição

Entidade criada quando a conciliação de uma carga (EST-001, estado "Em conciliação") identifica variação acima da tolerância entre as três medições. Relacionada a AT-001, AT-002 e AT-003, ao módulo MOD-004, e à entidade EST-001, cujo desfecho depende diretamente da resolução desta pendência.

Estados possíveis: Aberta, Decidida (liberada), Decidida (mantida). Os rótulos "liberada" e "mantida" foram adotados para diferenciar os dois caminhos descritos em RN-021 e RN-022, sem terminologia própria nas fontes.

Significado de cada estado:

- Aberta: a variação entre as três medições ultrapassou a tolerância configurada, e a carga gera uma pendência para análise municipal (RN-022).
- Decidida (liberada): um usuário responsável pela análise municipal decide que a carga pode ser conciliada apesar da variação; a carga retorna ao fluxo de EST-001 em direção a Comprovada. Decisão sempre humana, nunca automática (RN-025).
- Decidida (mantida): o usuário responsável mantém a divergência como tal, sem liberar a conciliação.

Transições:

| De | Para | Evento ou condição | Responsável | Observação |
|---|---|---|---|---|
| (conciliação da carga, EST-001) | Aberta | Variação entre as três medições ultrapassa a tolerância | Sistema (cálculo automático) | RN-022 |
| Aberta | Decidida (liberada) | Decisão humana favorável à conciliação | Prefeitura/SEMA (análise municipal) | RN-025; evento registrado com justificativa (RN-024) |
| Aberta | Decidida (mantida) | Decisão humana de manter a divergência | Prefeitura/SEMA (análise municipal) | RN-025; RN-024 |

Estados terminais: "Decidida (liberada)" é terminal para esta entidade (a carga segue seu curso em EST-001).

Reversibilidade: RN-023 estabelece que nenhuma das três medições originais pode ser apagada ou alterada para eliminar a divergência, preservando a integridade dos dados de origem.

Cancelamento: não há previsão de cancelamento desta pendência nas fontes.

Histórico: RN-024 exige que toda decisão sobre uma pendência de divergência seja registrada como um novo evento, com justificativa. O histórico é, portanto, uma exigência estrutural desta entidade.

## Tabela consolidada de entidades e estados

| ID      | Entidade                                | Estados principais                                                                                                                                                              | Estados terminais                 |
| ------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| EST-001 | Demanda e Coleta                        | Rascunho, Criada, Disponível ou Programada, Não aceita, Aceita, Em coleta, Em transporte, Recebida, Em conciliação, Comprovada, Pendência de divergência, Pendência de execução | Comprovada                        |
| EST-002 | Situação Regulatória do Estabelecimento | Pendente, Regular, A renovar, Irregular                                                                                                                                         | Nenhum, recalculada continuamente |
| EST-003 | PGRS                                    | Válido, Vencido (alerta derivado "a renovar" projetado em EST-002)                                                                                                              | Nenhum, renovável                 |
| EST-004 | Pendência de Divergência de Medição     | Aberta, Decidida (liberada), Decidida (mantida)                                                                                                                                 | Decidida (liberada) é terminal    |

Entidades consideradas e não detalhadas por falta de definição de ciclo de vida nas fontes: Contrato, Cadastro da Cooperativa, Equipe/Cooperado.

Pontos em aberto ligados a este documento: ver [Contradições e Pontos em Aberto](<Contradições e Pontos em Aberto.md>).
