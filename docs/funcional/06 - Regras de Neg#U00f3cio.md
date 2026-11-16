Catálogo completo (ID, regra, tipo, origem, status): [Regras de negócio](<fontes/Regras de negócio.md>). Esta nota traz o que o levantamento funcional acrescenta ao catálogo: a diferenciação entre regra e requisito, a rastreabilidade de cada regra até atores, módulos e fluxos, e as lacunas e contradições encontradas entre regras.

## Regra de negócio x requisito x decisão de produto

- Regra de negócio (RN): condição, restrição ou cálculo que existe no domínio de negócio ou regulatório, independente de como o sistema é construído, normalmente um "se, então" ou uma restrição estrutural, de integridade ou de autorização. Exemplos: RN-003, o PGRS vence em 12 meses; RN-025, a decisão sobre uma divergência é sempre humana.
- Requisito funcional (RF): uma capacidade concreta que o sistema deve oferecer, derivada de uma ou mais RN, de um módulo ou de um fluxo, mas que descreve o que o sistema faz, não uma regra do domínio. Exemplo: exportar relatórios em .xls e .pdf não é regra de negócio, é requisito funcional de MOD-006 (ver [07 - Catálogo de Requisitos](<07 - Catálogo de Requisitos.md>)).
- Requisito técnico ou não funcional (RNF): características de qualidade, desempenho, segurança ou tecnologia de implementação. Exemplo: a tecnologia usada em campo para registrar a coleta é uma decisão técnica, não uma regra de negócio.
- Decisão de produto: escolha de modelagem ou de escopo tomada durante o levantamento funcional, sem corresponder a uma regra já existente no catálogo. Exemplo: "o cooperado não é usuário do sistema" ([01 - Atores e Perfis](<01 - Atores e Perfis.md>)) é uma decisão de produto sobre modelagem de atores, não uma RN extraída da fonte.
- Caso limítrofe: RN-016, toda demanda deve passar pelo estado "Demandas existentes" antes de mudar para "A caminho", mistura nomenclatura de estado com nomes de telas ou áreas de menu do ator Cooperativa ([01 - Atores e Perfis](<01 - Atores e Perfis.md>)). Foi mantida como RN por constar do catálogo fonte, mas é também uma das ambiguidades documentadas em [Contradições e Pontos em Aberto](<Contradições e Pontos em Aberto.md>).

## Rastreabilidade por regra

Para cada RN: justificativa (por que existe), atores, módulos e fluxos envolvidos, e exceções ou observações que o levantamento funcional acrescentou ao catálogo.

### Poder público

- **RN-001**, acesso do Poder Público aos dados de acompanhamento: dar à Prefeitura visibilidade sem depender de redigitação. Atores: AT-003 (ambos os subperfis). Módulos: MOD-005, MOD-007. Fluxos: FL-001 (E7), FL-002 (passo 6), FL-008 (passo 1).

### GGR, cadastro e documentos

- **RN-002**, emissão de documentos pelo GGR: reunir em um só lugar os documentos que comprovam a regularidade do descarte. Atores: AT-001. Módulos: MOD-005. Fluxos: FL-001 (E6), FL-002 (passo 5).
- **RN-003**, vencimento do PGRS: manter o PGRS sempre atualizado como pré-condição da regularidade. Atores: AT-001. Módulos: MOD-001. Fluxos: FL-001-E03, FL-003 (passo 4).
- **RN-004**, completude do cadastro do GGR: garantir os dados mínimos para calcular a situação regulatória. Atores: AT-001, AT-003 (verifica). Módulos: MOD-001. Fluxos: FL-003 (passo 1), FL-006.
- **RN-005**, definição do operador de coleta: mantém essa decisão exclusivamente com a cooperativa. Atores: AT-002 decide, AT-001 não decide. Módulos: MOD-001.
- **RN-006**, declaração da quantidade de resíduo: dá à cooperativa uma estimativa para avaliar a demanda, e serve de primeira medição na conciliação (RN-020). Atores: AT-001. Módulos: MOD-002. Fluxos: FL-001 (E1), FL-002 (passo 1).
- **RN-007**, prestação de contas do GGR: visibilidade completa do que foi coletado, contrato e avulso. Atores: AT-001. Módulos: MOD-006.
- **RN-033**, alerta de renovação do PGRS: dá ao GGR uma janela de aviso antes que o vencimento o torne Irregular (RN-036). Atores: AT-001 recebe o alerta; cálculo automático. Módulos: MOD-001. Fluxos: FL-001-E03, FL-003-A. Antecedência de 30 dias, valor configurável (decisão em revisão com o usuário).

### Cooperativa, operador de coleta

- **RN-008**, insuficiência de atendimento da cooperativa: sinaliza à Prefeitura um gargalo operacional a partir do histórico de demandas não atendidas. Atores: AT-001 (demanda não atendida), AT-002 (não atende), AT-003 (cadastro sinalizado). Módulos: MOD-002. Fluxos: FL-001-A, FL-002-A, FL-004-A.
- **RN-009**, organização de rotas: previsibilidade para a cooperativa planejar a operação. Atores: AT-002. Módulos: MOD-002, MOD-003. Fluxos: FL-004; base da recorrência contratual em FL-001-E02.
- **RN-010**, registro obrigatório do recebimento: rastreabilidade mínima de quem recebeu a carga e quando, base do histórico de conciliação (RN-026). Atores: AT-002. Módulos: MOD-003. Fluxos: FL-001 (E4), FL-004 (passo 4).

### Unidade receptora

- **RN-011**, massa aferida obrigatória: terceira medição independente exigida pela conciliação (RN-020). Atores: AT-002, no papel de unidade receptora (RN-035). Módulos: MOD-003.
- **RN-012**, identificação do instrumento de medição: rastreabilidade da origem da medição aferida. Atores: AT-002. Módulos: MOD-003.
- **RN-013**, tíquete de pesagem obrigatório: evidência documental complementar à massa aferida (RN-011). Atores: AT-002. Módulos: MOD-003.
- **RN-014**, destinação declarada: visibilidade ao destino final do material, incluindo a parcela não aproveitada. Atores: AT-002. Módulos: MOD-003. Alcance reduzido por RN-035 no piloto (destinação após o recebimento pela cooperativa não é rastreada).

### Fluxo e estados da demanda

- **RN-015**, sequência de estados da demanda: descreve o ciclo de vida completo, da criação à comprovação ou pendência. Atores: AT-001, AT-002, AT-003. Módulos: MOD-002 a MOD-005 (ver [05 - Estados e Ciclos de Vida](<05 - Estados e Ciclos de Vida.md>)).
- **RN-016**, ordem entre telas de demanda: preserva a ordem operacional entre a demanda aguardando avaliação e a demanda em rota. Atores: AT-002. Módulos: MOD-002.
- **RN-017**, critérios de definição de rota: otimiza a coleta dentro das restrições físicas e contratuais. Atores: AT-002. Módulos: MOD-003. Fluxos: FL-001 (E3), FL-004 (passo 3).
- **RN-018**, cobrança direta entre GGR e cooperativa: mantém a relação comercial fora da intermediação da Prefeitura. Atores: AT-001, AT-002. Módulos: MOD-002.
- **RN-019**, não intervenção da Prefeitura na cobrança: reforça o papel regulador, sem função de intermediação comercial. Atores: AT-001, AT-002, AT-003. Módulos: MOD-002.
- **RN-034**, pendência por coleta não executada: identifica falhas no cumprimento da recorrência contratual. Atores: AT-001, AT-002. Módulos: MOD-002 e MOD-003. Fluxos: FL-001-E02, FL-004-E02. Estado Pendência de execução (ver [05 - Estados e Ciclos de Vida](<05 - Estados e Ciclos de Vida.md>)); resolvida pela RN-041 para os casos atribuídos à cooperativa.
- **RN-041**, justificativa e remarcação por falta de execução atribuída à cooperativa: dá um prazo objetivo e uma consequência concreta à RN-034 para os casos em que a responsabilidade é da cooperativa. Atores: AT-002 deve justificar e remarcar; AT-001 é afetado. Módulos: MOD-002, MOD-003. Fluxos: FL-001-E02, FL-004-E02. Define a saída do estado Pendência de execução para esse caso: justificativa registrada em até 96 horas e remarcação com nova data.

### Conciliação e divergências

- **RN-020**, três medições da conciliação: reduz a dependência de uma única fonte e permite detectar divergências. Atores: AT-001 (declarada), AT-002 (observada e aferida). Módulos: MOD-004. Fluxos: FL-001 (E5), FL-004 (passo 7), FL-007.
- **RN-021**, conciliação dentro da tolerância: libera automaticamente as cargas com variação aceitável. Módulos: MOD-004, MOD-005. O parâmetro de tolerância é definido pela Prefeitura (FL-006).
- **RN-022**, divergência acima da tolerância: reserva a decisão humana para variações grandes. Atores: AT-003, subperfil técnico. Módulos: MOD-004. Fluxos: FL-001-E01, FL-004-E01, FL-007.
- **RN-023**, integridade das medições: impede que uma divergência seja resolvida por manipulação de dado em vez de decisão registrada. Módulos: MOD-004. Fluxos: FL-007.
- **RN-024**, registro obrigatório da decisão: preserva o histórico completo, alinhado à política de que correção não é apagamento. Atores: AT-003, subperfil técnico. Módulos: MOD-004. Fluxos: FL-007 (passo 3).
- **RN-025**, decisão humana sobre divergência: mantém a decisão administrativa sob responsabilidade humana. Atores: AT-003, subperfil técnico. Módulos: MOD-004. Fluxos: FL-001-E01, FL-004-E01, FL-007.

### Integridade e proveniência dos dados

- **RN-026**, histórico de alterações: aplica de forma geral a política de que correção não é apagamento. Módulos: MOD-004, MOD-005, e transversalmente os demais módulos que registram decisões.
- **RN-027**, referência a sistemas oficiais: preserva o papel institucional do SINIR e do SUL, sem transformar o sistema em uma segunda fonte de verdade. Atores: AT-001 (emite via SINIR), AT-003 (consulta o SUL). Módulos: MOD-005.
- **RN-028**, classificação por natureza do dado: deixa explícita a natureza de cada dado, aplicando a política de que estimado não é o mesmo que verificado. Módulos: MOD-004 (as três medições são o exemplo mais direto), MOD-005.

### Fora de escopo no piloto

- **RN-029**, catador sem perfil individual: mantém a execução da coleta sob o perfil único da cooperativa.
- **RN-030**, selo de regularidade não automatizado: impede que o sistema emita um selo com efeito jurídico antes de validação formal do Município.
- **RN-031**, sem automação de penalidades: aplica a política de que o sistema não substitui a autoridade pública.
- **RN-032**, limites do piloto por tipo de resíduo: delimita o escopo aos grandes geradores de resíduos sólidos comuns (Decreto Municipal 15.603/2018).
- **RN-035**, unidade receptora absorvida pela cooperativa: simplifica o modelo de atores no piloto. Atores: AT-002. Módulos: MOD-003. É, ela mesma, uma exceção de escopo à RN-014.

### Situação regulatória do estabelecimento

- **RN-036**, condições para Irregular: automatiza a classificação a partir de condições objetivas de cadastro e documentação. Módulos: MOD-001. Fluxos: FL-001-B, FL-003-E01.
- **RN-037**, inconformidade grave classificada manualmente: reserva a classificação a julgamento humano, mesmo motivo da RN-025. Atores: AT-003, subperfil técnico. Módulos: MOD-001. Fluxos: FL-003-E02.
- **RN-038**, condições para Pendente: dá um estado intermediário enquanto a situação está sob análise. Módulos: MOD-001. Fluxos: FL-001-B.
- **RN-039**, condições para Regular: define a condição positiva de conformidade. Módulos: MOD-001. Fluxos: FL-001-B, FL-003. A sobreposição com RN-033 ("a renovar") foi resolvida: é um estado intermediário e independente, RN-039 aplica-se apenas fora dessa janela.

### Perfis e acesso

- **RN-040**, quatro perfis de acesso: delimita o acesso de cada perfil às próprias funções, base da matriz de permissões ([08 - Matriz de Permissões](<08 - Matriz de Permissões.md>)). Atores: AT-001, AT-002, AT-003 (ambos os subperfis). Módulos: transversal a todos, base do controle de acesso. Os quatro perfis correspondem exatamente aos três atores e dois subperfis de AT-003 de [01 - Atores e Perfis](<01 - Atores e Perfis.md>), sem contradição.

Pontos em aberto ligados a este documento: ver [Contradições e Pontos em Aberto](<Contradições e Pontos em Aberto.md>).
