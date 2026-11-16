Tudo que é contradição, ambiguidade ou ponto em aberto nos 10 documentos funcionais do SAMAÚMA ([01 - Atores e Perfis](<01 - Atores e Perfis.md>) a [10 - Visão Funcional Consolidada](<10 - Visão Funcional Consolidada.md>)), reunido aqui para não poluir o conteúdo já decidido de cada nota.

## Pendências recorrentes (aparecem em vários documentos)

- **Se e quando a Cooperativa efetivamente pesa o resíduo** (por foto ou por balança, e em que momento do fluxo). Afeta RN-011 a RN-014, as entradas de MOD-003 e MOD-004, e a própria existência regular do tiquete de pesagem (DOC-005). É o risco funcional mais consequente do sistema: se a Catanorte não pesa de forma sistemática, MOD-004 inteiro, RF-017 a RF-019 e EST-004 ficam sem base garantida. Aparece em [01 - Atores e Perfis](<01 - Atores e Perfis.md>), [02 - Macrofluxo do Sistema](<02 - Macrofluxo do Sistema.md>), [03 - Módulos Funcionais](<03 - Módulos Funcionais.md>), [09 - Dados, Documentos e Integrações](<09 - Dados, Documentos e Integrações.md>) e [10 - Visão Funcional Consolidada](<10 - Visão Funcional Consolidada.md>).
- **Critério objetivo de aprovação ou recusa de uma divergência de medição grande** (FL-001-E01, FL-004-E01, FL-007, RF-018, RF-019, MOD-004). Ainda não definido pela Prefeitura; hoje a decisão fica inteiramente ao julgamento do subperfil técnico, sem critério verificável. Aparece em [01 - Atores e Perfis](<01 - Atores e Perfis.md>), [02 - Macrofluxo do Sistema](<02 - Macrofluxo do Sistema.md>), [03 - Módulos Funcionais](<03 - Módulos Funcionais.md>), [04 - Fluxos por Ator](<04 - Fluxos por Ator.md>) e [10 - Visão Funcional Consolidada](<10 - Visão Funcional Consolidada.md>).
- **Fluxo real de solicitação e execução de coleta junto à Catanorte**, necessário para atribuir responsabilidade (Gerador ou a própria Cooperativa) quando uma coleta prevista em contrato não é executada e a causa não é da cooperativa. RN-034 segue provisória para esses casos; RN-041 já resolve apenas os casos em que a causa é atribuída à cooperativa. Afeta FL-001-E02, FL-004-E02, MOD-002, MOD-003 e RF-031. Aparece em [02 - Macrofluxo do Sistema](<02 - Macrofluxo do Sistema.md>), [03 - Módulos Funcionais](<03 - Módulos Funcionais.md>), [04 - Fluxos por Ator](<04 - Fluxos por Ator.md>), [06 - Regras de Negócio](<06 - Regras de Negócio.md>) e [07 - Catálogo de Requisitos](<07 - Catálogo de Requisitos.md>).
- **Desfecho do estado "Decidida (mantida)" de EST-004**: quando o subperfil técnico mantém a divergência em vez de liberar, não está definido o que acontece com a carga e com o GGR (fica retida, vira inconformidade, abre processo fora do sistema). Também não há perfil com permissão explícita de dar sequência a esse estado. Afeta o critério de aceite de RF-019. Aparece em [05 - Estados e Ciclos de Vida](<05 - Estados e Ciclos de Vida.md>), [07 - Catálogo de Requisitos](<07 - Catálogo de Requisitos.md>), [08 - Matriz de Permissões](<08 - Matriz de Permissões.md>) e [10 - Visão Funcional Consolidada](<10 - Visão Funcional Consolidada.md>).
- **Caminho de regularização do estado "Irregular" (EST-002)**: nenhuma transição de volta a Pendente ou Regular está definida, nem existe perfil com permissão explícita de reverter essa classificação. Afeta o critério de aceite de RF-005. Aparece em [05 - Estados e Ciclos de Vida](<05 - Estados e Ciclos de Vida.md>), [07 - Catálogo de Requisitos](<07 - Catálogo de Requisitos.md>), [08 - Matriz de Permissões](<08 - Matriz de Permissões.md>) e [10 - Visão Funcional Consolidada](<10 - Visão Funcional Consolidada.md>).
- **Integração com o SUL, INT-002**: se a troca de dados é só de leitura (consulta aos cadastros autodeclaratórios do GGR) ou também de escrita de volta, qual a chave de vinculação (provavelmente CNPJ), a periodicidade da sincronização e qual fonte prevalece quando os dados divergem. Aparece em [03 - Módulos Funcionais](<03 - Módulos Funcionais.md>), [09 - Dados, Documentos e Integrações](<09 - Dados, Documentos e Integrações.md>) e [10 - Visão Funcional Consolidada](<10 - Visão Funcional Consolidada.md>).
- **Integração com o SINIR, INT-001**: meio técnico de consulta ao MTR emitido (consulta autenticada, arquivo exportado ou anexo manual pelo Gerador) e responsável pelo credenciamento, ainda não definidos. Aparece em [09 - Dados, Documentos e Integrações](<09 - Dados, Documentos e Integrações.md>) e [10 - Visão Funcional Consolidada](<10 - Visão Funcional Consolidada.md>).
- **Escopo exato dos indicadores do município (MOD-007) e integração com o SGP digital, INT-003**: ainda não definidos. Aparece em [03 - Módulos Funcionais](<03 - Módulos Funcionais.md>), [04 - Fluxos por Ator](<04 - Fluxos por Ator.md>), [09 - Dados, Documentos e Integrações](<09 - Dados, Documentos e Integrações.md>) e [10 - Visão Funcional Consolidada](<10 - Visão Funcional Consolidada.md>).

## [01 - Atores e Perfis](<01 - Atores e Perfis.md>)

- Se o responsável técnico do GGR terá login próprio no sistema ou permanece apenas como dado cadastral do perfil Gerador.
- Se o "operador contratado pela cooperativa" é um cargo interno da cooperativa ou apenas um dado cadastral sem uso operacional.
- Se o GGR consegue quantificar a demanda também em quilos, além de litros.
- Qual o papel exato da Prefeitura na fiscalização, além do que já está descrito para os dois subperfis.
- Contradição com a Visão Funcional do Sistema (documento externo a esta série): a decisão de que o cooperado não é usuário do sistema, atuando sob o perfil da Cooperativa, diverge do organograma da Visão Funcional corrigida, que mostrava o Cooperado como uma porta de entrada própria, com as telas Meu dia, Coletas, Meu painel, Minha carteira e Configurações. Recomendado sinalizar essa divergência a quem mantém a Visão Funcional.

## [02 - Macrofluxo do Sistema](<02 - Macrofluxo do Sistema.md>)

- FL-001-E03: não está definido se o vencimento do PGRS impede novas declarações de coleta do Gerador até a regularização, ou se apenas sinaliza a pendência sem bloquear.

## [04 - Fluxos por Ator](<04 - Fluxos por Ator.md>)

- FL-002-E02 e FL-003-E01: não está definido se o bloqueio da declaração de coleta por cadastro incompleto ou PGRS vencido é automático ou apenas sinalizado.
- FL-005-E01: comportamento não definido para quando uma pessoa não identificada na equipe tenta entregar uma carga na portaria.
- FL-005: se deve gerar uma regra de negócio própria no catálogo, hoje sem nenhuma RN associada.
- FL-006-E01: comportamento não definido diante de um cadastro duplicado de GGR ou cooperativa.

## [05 - Estados e Ciclos de Vida](<05 - Estados e Ciclos de Vida.md>)

- Confirmar se os estados "Rascunho" e "Em transporte" de EST-001 são de fato utilizados no sistema, ou se são apenas menções conceituais de RN-015 sem uso real nos fluxos aprovados (não têm transição nem significado detalhados).
- Confirmar a precedência entre as transições automáticas de EST-002 (RN-036, RN-038, RN-039) e a classificação manual de inconformidade grave (RN-037), para os casos em que apontariam para estados diferentes ao mesmo tempo.
- Validar se "A renovar" deve também ser modelado como estado próprio do documento PGRS (EST-003), já que na situação regulatória do estabelecimento (EST-002) ele foi confirmado como estado pleno e independente, não um alerta.
- Definir se e como Contrato, Cadastro da Cooperativa e Equipe ou Cooperado devem ter ciclos de vida próprios em documentação futura, hoje sem estados definidos.

## [06 - Regras de Negócio](<06 - Regras de Negócio.md>)

- RN-038 e RN-039 não definem precedência entre si: um estabelecimento com cadastro completo, PGRS válido e sem inconformidade grave, mas com uma demanda em aprovação, satisfaz ao mesmo tempo as condições de Regular e de Pendente.
- RN-016 descreve uma transição de estado usando "Demandas existentes" e "A caminho", que são áreas de menu do ator Cooperativa, não os nomes de estado usados por RN-015 (criada, aceita, em coleta): mistura regra de negócio com nomenclatura de interface.
- RN-034 aparece associada, num dos documentos-fonte, tanto a MOD-002/MOD-003 (execução da coleta) quanto à lista de regras de MOD-004 (divergências e análise municipal): classificação de domínio inconsistente entre módulos. RN-041 resolve parte da lacuna de saída para os casos atribuídos à cooperativa, mas não essa inconsistência de classificação.
- RN-008: a redação liga a consequência de a cooperativa não atender a uma demanda ao "cadastro desse GGR junto à Prefeitura", quando o gargalo é da cooperativa. A interpretação adotada foi a de uma sinalização no cadastro do GGR sobre a necessidade de mais equipamento da cooperativa, mas a redação original permanece ambígua quanto a qual cadastro é de fato alterado.
- RN-030 e RN-032 não têm nenhuma citação direta em nenhum dos documentos funcionais produzidos; permanecem no catálogo por delimitarem o escopo do piloto, mas não foram exercitadas por nenhum ator, módulo ou fluxo já modelado.

## [07 - Catálogo de Requisitos](<07 - Catálogo de Requisitos.md>)

- Critério objetivo de priorização dos requisitos (MoSCoW ou outro), hoje inexistente em qualquer fonte.
- Tecnologia usada em campo para o registro da coleta (RF-011, RF-012, RNF-007), ainda não definida.
- Metas de desempenho e disponibilidade do sistema (RNF-008), hoje sem nenhuma referência nas fontes.
- Fluxo por ator ausente para RF-025 (prestação de contas do Gerador) e RF-029 (painel da Cooperativa), hoje apoiados apenas em necessidades descritas em [01 - Atores e Perfis](<01 - Atores e Perfis.md>).

## [08 - Matriz de Permissões](<08 - Matriz de Permissões.md>)

- Se a própria Cooperativa deve ter permissão de editar seu próprio cadastro, hoje sem RF correspondente.
- Acúmulo de cadastro, parametrização e decisão no mesmo subperfil Técnico da Prefeitura: ele cadastra GGR e cooperativas (RF-003), define os parâmetros que afetam a tolerância de divergência (RF-004) e também decide as pendências e classifica inconformidades sobre esses mesmos estabelecimentos (RF-005, RF-019), sem segregação de funções entre quem cadastra, quem parametriza e quem decide.
- Se um mesmo usuário físico da Prefeitura pode acumular os dois subperfis (Painel de gestão e Técnico) simultaneamente; se puder, mistura apresentação e decisão regulatória num só login.
- Definição de uma ação de compartilhamento explícita entre perfis, hoje inexistente nas fontes, além da visualização já prevista (por exemplo do MTR pela Prefeitura).
- Sobreposição de papéis dentro do perfil Cooperativa: ela acumula a execução da coleta, que declara a quantidade observada, com o papel implícito de unidade receptora, que declara a massa aferida. Das três medições comparadas na conciliação, duas partem do mesmo perfil de acesso, sem segregação de permissão entre essas duas funções, o que reduz a independência pretendida pela comparação de três medições. Decisão já consolidada em [01 - Atores e Perfis](<01 - Atores e Perfis.md>); registrado aqui como risco de permissão, não como erro a corrigir sem nova decisão de negócio.

## [09 - Dados, Documentos e Integrações](<09 - Dados, Documentos e Integrações.md>)

- Formato exato do arquivo do MTR (DOC-001) e conteúdo codificado no QR de regularização (DOC-002).
- Evento de emissão inicial e de renovação do PGRS (DOC-003), sem detalhamento nas fontes.
- Onde e como o contrato entre GGR e Cooperativa (DOC-006) é de fato armazenado ou anexado ao sistema.
- Como comparar a quantidade declarada em litros (RN-006) com a massa aferida em quilos (RN-020). Sem uma regra de conversão, a conciliação só consegue comparar a massa observada na coleta com a aferida no recebimento; o protótipo faz isso e mostra a declarada em litros ao lado, como referência.
- Quando o PGRS é "documento particular" (D-06) e por isso sai do QR de regularização: não há atributo nas fontes que diga isso. O protótipo inclui o PGRS sempre.

## [10 - Visão Funcional Consolidada](<10 - Visão Funcional Consolidada.md>)

Riscos funcionais que a auditoria completa dos 10 documentos (achados AUD-001 a AUD-045) apontou como os mais relevantes:

- A conciliação pode não ter insumo garantido (ver pesagem, nas pendências recorrentes acima).
- Duas regras se contradizem sobre destinação: RN-014 exige destinação declarada, incluindo o volume de rejeito; RN-035 diz que ela não é rastreada no piloto. Uma das duas terá de ser suspensa.
- Cargas e estabelecimentos podem ficar presos: "Decidida (mantida)" (EST-004) e "Irregular" (EST-002) não têm saída definida nem perfil com permissão de reversão (ver pendências recorrentes acima).
- A decisão sobre divergência é subjetiva: sem critério, RF-019 não tem aceite verificável, e o mesmo caso pode ser decidido de dois jeitos por pessoas diferentes.
- A independência das três medições da conciliação é parcial: duas delas (observada e aferida) vêm do mesmo perfil, AT-002, que acumula o papel de operador e o de unidade receptora.
- O contrato entre GGR e Cooperativa não existe como entidade no sistema: o evento que inicia todo o macrofluxo não tem ciclo de vida próprio.
- Uma tela declarada não tem sustentação: "Minha carteira" aparece na Visão Funcional sem módulo, requisito ou dado associado, e a leitura mais direta do nome (ganhos ou repasses do cooperado) colide com RN-018, RN-019 e RN-029.
- As duas integrações confirmadas, SINIR e SUL, não têm meio técnico definido: decididas no plano funcional, seguem abertas no plano técnico (ver pendências recorrentes acima).

Volume de pendências registradas no processo de elaboração: 32 pendências com dono, sendo 14 com a Prefeitura (4 bloqueantes), 7 com a Catanorte (2 bloqueantes), 2 com o Gerador e 8 internas ao time de produto (nenhuma bloqueante). As seis bloqueantes cobrem pesagem, destinação, critério de divergência, tolerância de conciliação, desfecho de divergência mantida e saída do estado Irregular, todas já listadas acima ou nas pendências recorrentes deste documento.
