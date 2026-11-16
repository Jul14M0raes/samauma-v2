Fonte de domínio: [Escopo Mestre](<Escopo Mestre.md>)

## Políticas (orientações gerais — não são regras, geram regras derivadas)

- O sistema não substitui a autoridade pública — decisões administrativas são sempre de uma pessoa, nunca automáticas (→ RN-025, RN-031)
- Correção não é apagamento — nada é sobrescrito sem preservar o rastro da alteração (→ RN-026)
- Sistemas oficiais (SUL, MTR/SINIR) mantêm seu papel institucional — a Samaúma não vira uma segunda fonte de verdade (→ RN-027)
- Estimado ≠ verificado — todo dado tem uma natureza que precisa ficar explícita (→ RN-028)

## Vocabulário

- **GGR** — estabelecimento (grande gerador) submetido às regras municipais de resíduos
- **Cooperativa / operador de coleta** — organização que executa a coleta e o transporte
- **Catador** — pessoa que executa a coleta dentro do fluxo da cooperativa; sem perfil próprio no sistema (ver RN-029)
- **Unidade receptora** — quem recebe a carga no destino (triagem, recuperação, aterro); no piloto PVH esse papel é exercido pela própria cooperativa (Catanorte), sem perfil de acesso separado (ver RN-035)
- **Demanda** — pedido de coleta criado a partir de um contrato
- **Carga** — unidade rastreável de resíduo, do momento da coleta até a destinação
- **Conciliação** — comparação entre as medições declarada, observada e aferida de uma carga

## Catálogo de regras de negócio

### Poder público

| ID | Regra | Tipo | Origem | Status |
|---|---|---|---|---|
| RN-001 | O Poder público tem acesso à situação regulatória dos estabelecimentos, aos indicadores, às divergências abertas e aos dados de MTR por demanda e por contrato aprovado ou finalizado | Autorização | Escopo Mestre | Validada |

### GGR — cadastro e documentos

| ID | Regra | Tipo | Origem | Status |
|---|---|---|---|---|
| RN-002 | O GGR pode emitir MTR (via SINIR), QR code de regularização, PGRS e comprovante simplificado com as informações principais do MTR | Estrutural | Reunião de revisão | Candidata |
| RN-003 | SE o PGRS completar 12 meses desde a emissão, ENTÃO ele é considerado vencido | Prazo | Reunião de revisão | Candidata |
| RN-004 | O cadastro do GGR deve possuir CNPJ, endereço, razão social, responsável técnico/gerenciador e o contrato vigente | Validação | Reunião de revisão | Candidata |
| RN-005 | A definição do operador de coleta vinculado a um GGR é de responsabilidade da Catanorte, não do próprio GGR | Autorização | Reunião de revisão | Candidata |
| RN-006 | O GGR deve declarar a quantidade de resíduo por contrato e por demanda diária, em litros | Validação | Reunião de revisão | Candidata |
| RN-007 | A prestação de contas do GGR deve incluir o contrato vigente e as coletas contratadas à parte (fora do contrato) | Estrutural | Reunião de revisão | Candidata |
| RN-033 | SE faltar um número configurável de dias para o vencimento do PGRS (RN-003), ENTÃO a situação do GGR passa a exibir o estado "a renovar", sinalizando a necessidade de reenvio antes do vencimento | Prazo | Revisão com usuário | Candidata |

### Cooperativa / operador de coleta

| ID | Regra | Tipo | Origem | Status |
|---|---|---|---|---|
| RN-008 | SE a cooperativa não conseguir atender à demanda de um GGR, ENTÃO o cadastro desse GGR junto à Prefeitura passa a exigir a disponibilização de mais equipamento para a cooperativa | Comportamental | Reunião de revisão | Candidata |
| RN-009 | A cooperativa deve organizar rotas de coleta mensais ou semanais, considerando a localidade e os dias definidos em contrato | Comportamental | Reunião de revisão | Candidata |
| RN-010 | Toda coleta deve registrar o responsável pelo recebimento e o horário em que ocorreu | Validação | Reunião de revisão | Candidata |

### Unidade receptora

| ID | Regra | Tipo | Origem | Status |
|---|---|---|---|---|
| RN-011 | Toda carga recebida deve ter a massa aferida registrada pela unidade receptora | Validação | Escopo Mestre | Validada |
| RN-012 | SE houver instrumento de medição, ENTÃO ele deve ser identificado no registro da pesagem | Validação | Escopo Mestre | Validada |
| RN-013 | Toda carga recebida deve ter o tíquete de pesagem anexado ao registro | Integridade | Escopo Mestre | Validada |
| RN-014 | Toda carga recebida deve ter a destinação declarada, incluindo o volume classificado como rejeito, se houver | Validação | Escopo Mestre | Validada |

### Fluxo e estados da demanda

| ID | Regra | Tipo | Origem | Status |
|---|---|---|---|---|
| RN-015 | Toda demanda deve seguir a sequência de estados: rascunho → criada → disponível/programada → aceita → em coleta → em transporte → recebida → em conciliação → comprovada ou pendência | Estado | Escopo Mestre | Validada |
| RN-016 | Toda demanda deve passar pelo estado "Demandas existentes" antes de mudar para "A caminho" | Estado | Reunião de revisão | Candidata |
| RN-017 | A rota de uma demanda deve ser definida considerando localização, horário, dia da semana e capacidade do caminhão disponível | Cálculo | Reunião de revisão | Candidata |
| RN-018 | A cobrança do contrato de coleta deve ser definida diretamente entre o GGR e a cooperativa | Estrutural | Reunião de revisão | Candidata |
| RN-019 | A Prefeitura não define nem cobra mensalmente o valor do contrato entre GGR e cooperativa | Estrutural | Reunião de revisão | Candidata |
| RN-034 | SE a coleta prevista na recorrência definida em contrato (RN-009) não for executada dentro do prazo combinado, ENTÃO é gerada uma pendência de execução — a atribuição de responsabilidade (GGR ou cooperativa) depende de confirmar com a Catanorte como a solicitação/execução de coleta funciona hoje | Comportamental | Revisão com usuário | Provisória — revisão urgente |
| RN-041 | SE a coleta não for executada no prazo combinado por responsabilidade atribuída à cooperativa (RN-034), ENTÃO a cooperativa tem até 96 horas para justificar e remarcar, saindo do estado de pendência de execução para esses casos | Prazo | Revisão Doc Funcional | Candidata, falta definir o que ocorre se a cooperativa não justificar dentro do prazo |

### Conciliação e divergências

| ID | Regra | Tipo | Origem | Status |
|---|---|---|---|---|
| RN-020 | A conciliação de uma carga deve comparar três medições independentes: a quantidade declarada pelo GGR, a massa observada/medida na coleta pelo operador e a massa aferida no destino pela unidade receptora | Estrutural | Escopo Mestre | Validada |
| RN-021 | SE a variação entre as três medições estiver dentro da tolerância configurada (percentual + valor mínimo absoluto), ENTÃO a carga é conciliada e o comprovante de destinação é emitido | Cálculo | Escopo Mestre | Validada |
| RN-022 | SE a variação entre as três medições ultrapassar a tolerância configurada, ENTÃO a carga gera uma pendência para análise municipal | Cálculo | Escopo Mestre | Validada |
| RN-023 | Nenhuma das três medições da conciliação pode ser apagada ou alterada para eliminar uma divergência | Integridade | Escopo Mestre | Validada |
| RN-024 | Toda decisão sobre uma pendência de divergência deve ser registrada como um novo evento, com justificativa | Integridade | Escopo Mestre | Validada |
| RN-025 | O sistema não classifica automaticamente uma divergência como irregularidade — a decisão é de um usuário responsável pela análise municipal | Autorização | Escopo Mestre | Validada |

### Integridade e proveniência dos dados

| ID | Regra | Tipo | Origem | Status |
|---|---|---|---|---|
| RN-026 | Toda alteração de um dado relevante para auditoria deve preservar o valor anterior, o novo valor, o autor, a data/hora e a justificativa | Integridade | Escopo Mestre | Validada |
| RN-027 | Todo dado com origem em um sistema oficial (SUL, MTR/SINIR) deve referenciar a fonte, a data da consulta e o identificador correspondente | Conformidade | Escopo Mestre | Validada |
| RN-028 | Todo dado armazenado deve ser classificado por natureza: declarado, observado, medido, calculado ou parâmetro | Estrutural | Escopo Mestre | Validada |

### Fora de escopo (piloto)

| ID | Regra | Tipo | Origem | Status |
|---|---|---|---|---|
| RN-029 | O catador autônomo não possui perfil individual no sistema durante o piloto | Estrutural | Escopo Mestre | Fora de escopo |
| RN-030 | O selo de regularidade do estabelecimento não é emitido pelo sistema até validação jurídica/operacional do Município | Estrutural | Escopo Mestre | Fora de escopo |
| RN-031 | O sistema não executa automação de penalidades, multas ou qualquer ato administrativo — essas decisões permanecem com o Município | Autorização | Escopo Mestre | Fora de escopo |
| RN-032 | O piloto não abrange resíduos de serviços de saúde, construção civil, logística reversa especializada ou coleta domiciliar comum | Estrutural | Escopo Mestre | Fora de escopo |
| RN-035 | No piloto PVH, o papel de unidade receptora é exercido pela própria cooperativa (Catanorte) — não há perfil de acesso separado, e a destinação do material após o recebimento por ela (ex.: encaminhamento a recicladores, aterro) não é rastreada nesta fase | Estrutural | Revisão com usuário | Fora de escopo |

### Situação regulatória do estabelecimento

| ID | Regra | Tipo | Origem | Status |
|---|---|---|---|---|
| RN-036 | SE o estabelecimento não possui cadastro completo (RN-004) OU não enviou o PGRS OU o PGRS está vencido (RN-003), ENTÃO a situação regulatória é Irregular | Estado | Revisão com usuário | Candidata |
| RN-037 | SE a prefeitura classificar manualmente uma inconformidade do estabelecimento como grave, ENTÃO a situação regulatória passa a Irregular; essa classificação é sempre um evento humano — o sistema não classifica inconformidade automaticamente (alinhado a RN-025) | Autorização | Revisão com usuário | Candidata |
| RN-038 | SE o cadastro, o PGRS ou as demandas do estabelecimento estão em processo de aprovação, ENTÃO a situação regulatória é Pendente | Estado | Revisão com usuário | Candidata |
| RN-039 | SE o estabelecimento possui cadastro completo, PGRS válido dentro da vigência e nenhuma inconformidade grave registrada, ENTÃO a situação regulatória é Regular | Estado | Revisão com usuário | Candidata |

### Perfis e acesso

| ID | Regra | Tipo | Origem | Status |
|---|---|---|---|---|
| RN-040 | O sistema distingue quatro perfis de acesso — grande gerador, cooperativa (coleta e recebimento), painel de gestão e técnico/administrativo da regulação — e cada perfil visualiza e executa apenas as ações compatíveis com sua função | Autorização | Revisão com usuário | Candidata |

## Não é regra de negócio (requisito ou processo)

- Exportar relatórios em .xls e .pdf → requisito funcional, não regra
- Fluxograma e telas de permissões → requisito/interface, não regra

## Pontos em aberto

Sem condição objetiva definida — não viram regra até serem resolvidos:

- Indicadores da Prefeitura ainda não detalhados (possível integração com o SGP digital)
- Visibilidade para quem coleta quando a cooperativa não consegue atender toda a demanda
- Se a cooperativa (Catanorte, também unidade receptora — RN-035) de fato pesa os resíduos e em que momento (viabilidade de balança/fotos) — confirmar com a Catanorte
- Se a cooperativa realmente presta contas da forma descrita
- Se o GGR consegue quantificar em Kg, além de litros
- Registro de foto e quantidade/tipo do resíduo na coleta "quando viável" — "viável" não é um critério objetivo, falta definir a condição exata
- **Urgente**: fluxo real de solicitação/execução de coleta junto à Catanorte (quem aciona, o que conta como falha) — RN-034 é provisória até essa conversa acontecer; sem isso não dá pra saber se a irregularidade é do GGR ou da cooperativa
- Critério e responsável para aprovar ou não uma divergência grande (RN-025 já define que a decisão é humana, falta o critério em si)
- Prestação de contas e relatórios: detalhar a recorrência para cada ator (ex.: MTR é emitido enquanto a demanda é feita; DMR é trimestral para os geradores)
- Antecedência exata (em dias) do alerta "a renovar" do PGRS (RN-033) — hoje só definido como "um pouco antes" do vencimento
- Funcionalidade de viabilizar a contratação (GGR–cooperativa) via sistema — a ser detalhada em próxima reunião, ainda sem RN
- Conteúdo do Cenário Ji-Paraná (reconciliação mensal pesagem/MTR/NF/CDF, créditos de reciclagem) é pesquisa de mercado para o segundo piloto — não vira RN enquanto Jipa não for ativado
