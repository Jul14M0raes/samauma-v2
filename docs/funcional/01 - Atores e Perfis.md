## Ator, cargo interno, stakeholder e sistema externo

**Atores** (perfis com acesso direto ao sistema, cada um com tela e permissões próprias): Gerador (AT-001), Cooperativa (AT-002) e Prefeitura/SEMA (AT-003, com dois subperfis).

**Cargos internos** (papéis que não configuram perfil de acesso próprio, apenas dado cadastral ou função interna de uma organização já representada por um ator):

- Responsável técnico do GGR: dado cadastral do perfil Gerador (RN-004).
- Operador contratado pela cooperativa: fica a critério da Catanorte, sem área de configuração própria descrita.

**Stakeholders** (partes interessadas sem uso operacional direto do sistema, distintas dos atores acima mesmo quando pertencem à mesma organização):

- Prefeitura de Porto Velho como ente contratante da plataforma (distinto do uso operacional feito pelo ator AT-003).
- LUMMENUS: empresa que desenvolve e mantém o sistema.
- Catador autônomo: fora de escopo no piloto, sem perfil individual (RN-029).

**Sistemas externos** (trocam dados com o sistema, mas não são pessoas nem organizações que o operam):

- SINIR: emissão do MTR.
- SUL, Sistema Único de Licenciamento de Porto Velho.
- SGP digital: possível origem de indicadores do painel da Prefeitura.

## AT-001, Gerador (GGR)

### Identificação

- ID: AT-001
- Nome: Gerador (GGR, Grande Gerador de Resíduos)
- Tipo de ator: pessoa jurídica / estabelecimento
- Descrição: estabelecimento enquadrado como grande gerador de resíduos sólidos, submetido ao Decreto Municipal 15.603/2018, que contrata uma cooperativa para a coleta.
- Papel no ecossistema: origem da demanda de coleta e responsável legal pela regularidade do descarte perante a Prefeitura.

### Objetivos

- Manter PGRS, MTR e comprovantes organizados e ligados ao próprio contrato.
- Evitar a multa por descarte irregular (10 UPF, Unidade Padrão Fiscal, por dia) e a multa por não apresentar comprovantes à fiscalização.
- Não precisar lidar com a definição do operador contratado pela cooperativa (RN-005).

### Responsabilidades

- Declarar a coleta prevista em contrato ou uma coleta avulsa, fora do contrato.
- Declarar a quantidade de resíduo por contrato e por demanda diária, em litros (RN-006).
- Manter o cadastro atualizado: CNPJ, endereço, razão social, responsável técnico e contrato vigente (RN-004).
- Renovar o PGRS antes do vencimento, validade de 12 meses (RN-003), sinalizado pelo estado "a renovar" (RN-033).

### Necessidades

- Emitir e reunir em um só lugar o MTR (via SINIR), o QR code de regularização, o PGRS e o comprovante simplificado.
- Prestar contas do contrato vigente e das coletas contratadas à parte (RN-007).
- Visualizar a própria situação regulatória perante a Prefeitura.

### Interações

- Processos: declaração da coleta, emissão de documentos, prestação de contas.
- Outros atores: Cooperativa (contrato direto de coleta e cobrança, RN-018 e RN-019); Prefeitura/SEMA (cadastro e situação regulatória).
- Dados que fornece: dados cadastrais, quantidade de resíduo declarada em litros, dados do contrato.
- Dados que recebe: situação do contrato e das coletas em andamento; documentos emitidos a partir do registro confirmado.
- Áreas de menu: Painel, Demandas, Documentos, Relatórios, Perfil (detalhadas em [03 - Módulos Funcionais](<03 - Módulos Funcionais.md>)).

### Restrições

- Não define nem cobra o operador contratado pela cooperativa, decisão de negócio (RN-005).
- Não define o valor da cobrança com a Prefeitura; a cobrança é direta com a cooperativa (RN-018, RN-019).

### Níveis ou subperfis

Nenhum subperfil identificado. Não há área de "Configurações" separada, ela se chama "Perfil" e não inclui a definição do operador contratado.

## AT-002, Cooperativa

### Identificação

- ID: AT-002
- Nome: Cooperativa / Operador de coleta
- Tipo de ator: organização (pessoa jurídica)
- Descrição: organização que executa a coleta e o transporte de resíduos contratados pelo GGR; no piloto de Porto Velho, a Catanorte.
- Papel no ecossistema: ponte operacional entre a declaração do GGR e a confirmação do recebimento, acumulando também o papel de unidade receptora no piloto.
- O cooperado não é usuário do sistema. Toda a coleta, incluindo o registro em campo, é executada sob o perfil e o acesso da Cooperativa; não há subperfil ou ator próprio para o cooperado.

### Objetivos

- Saber com antecedência quais demandas consegue atender, antes de assumir a rota.
- Otimizar rotas por contrato, localidade e dia, mensal ou semanalmente.
- Transformar o registro do recebimento em histórico rastreável.

### Responsabilidades

Incluindo a execução da coleta em campo, feita por pessoas vinculadas à cooperativa, mas sob o perfil e o acesso da própria Cooperativa:

- Avaliar quais demandas consegue atender, antes de entrarem na rota.
- Designar quem vai executar a coleta e traçar a rota, considerando localização, horário, dia da semana e capacidade do caminhão (RN-017).
- Executar a coleta e registrar que a recebeu e a que horas, obrigatório em toda coleta (RN-010).
- Quando viável, tirar foto ou declarar a quantidade e o tipo do resíduo coletado.
- Confirmar o recebimento da coleta.
- Gerir a equipe de cooperados e conferir a entrada e saída de quem entrega a carga (Portaria).

### Necessidades

- Visibilidade sobre o que está a caminho e o que já foi recebido pela unidade.
- Identificação dos cooperados no programa municipal de coleta seletiva, mantida pela cooperativa, sem ser um acesso próprio do cooperado ao sistema.
- Entender o próprio gargalo: se não atende toda a demanda de um GGR, o cadastro desse GGR passa a exigir mais equipamento (RN-008).

### Interações

- Processos: avaliação de demandas, designação e rota, coleta e registro, confirmação do recebimento e, de forma implícita, pesagem e destinação como unidade receptora.
- Outros atores: Gerador (contrato direto de coleta e cobrança); Prefeitura/SEMA (o cadastro do GGR junto à Prefeitura é afetado quando a cooperativa não atende toda a demanda, RN-008).
- Dados que fornece: confirmação de recebimento e horário, eventualmente massa aferida e tíquete de pesagem (RN-011 a RN-014), dados da equipe de cooperados.
- Dados que recebe: as demandas do GGR a avaliar, o cadastro dos cooperados.
- Áreas de menu, uso administrativo: Painel, Demandas existentes, A caminho, Recebidas, Equipe, Portaria, Relatórios, Configurações. Uso em campo, por pessoas vinculadas à cooperativa sem login próprio distinto: Meu dia, Coletas, Meu painel, Minha carteira (ver [03 - Módulos Funcionais](<03 - Módulos Funcionais.md>)).

### Restrições

- A cobrança do contrato é direta com o GGR, fora do sistema de permissões da Prefeitura (RN-018, RN-019).
- Fora de escopo no piloto: o papel de unidade receptora não gera perfil de acesso separado, e a destinação após o recebimento pela cooperativa não é rastreada nesta fase (RN-035).

### Níveis ou subperfis

Não há subperfis para este ator. O cooperado é a pessoa que executa fisicamente a coleta em campo, mas atua sob o perfil e o acesso da Cooperativa; não é um ator nem um subperfil do sistema.

## AT-003, Prefeitura (SEMA)

### Identificação

- ID: AT-003
- Nome: Prefeitura de Porto Velho (SEMA)
- Tipo de ator: organização / órgão público
- Descrição: órgão municipal responsável por cadastrar grandes geradores e cooperativas e acompanhar o MTR por demanda e contrato.
- Papel no ecossistema: regulador e fiscalizador do sistema; não participa da operação da coleta nem da cobrança entre GGR e cooperativa.
- O ator tem dois subperfis (RN-040), com a divisão de função descrita abaixo.

### Objetivos

- Ter um cadastro centralizado de grandes geradores e cooperativas.
- Ter visibilidade do MTR por demanda e por contrato, sem precisar redigitar informações.

### Responsabilidades

Subperfil Painel de gestão, apresentação:

- Visualizar indicadores do município.
- Acompanhar a situação regulatória geral dos estabelecimentos, para fins de apresentação.

Subperfil Técnico/administrativo da regulação, verificação:

- Cadastrar grandes geradores e cooperativas.
- Definir parâmetros do município.
- Verificar e validar pendências, incluindo divergências de medição grandes (RN-025).
- Classificar manualmente uma inconformidade grave de um estabelecimento, quando aplicável (RN-037), sempre por decisão humana.

### Necessidades

- Saber, sem redigitar, a situação de MTR por demanda e contrato aprovado ou finalizado.
- Ter um critério objetivo para aprovar ou recusar uma divergência de medição grande.

### Interações

- Processos: cadastro de GGR e cooperativas, acompanhamento de MTR, tratamento de divergências e definição da situação regulatória (Regular, Irregular, Pendente).
- Outros atores: Gerador (cadastro e situação regulatória); Cooperativa (cadastro).
- Dados que recebe: dados cadastrais do GGR e da cooperativa, dados de MTR por demanda e contrato.
- Dados que fornece: situação regulatória do estabelecimento, parâmetros do município.
- Áreas de menu: Painel, Cadastros, MTR e contratos, Relatórios, Configurações (ver [03 - Módulos Funcionais](<03 - Módulos Funcionais.md>)).

### Restrições

- Não define nem cobra o valor do contrato entre GGR e cooperativa (RN-019).
- O sistema não classifica automaticamente uma divergência como irregularidade; a decisão é sempre de um usuário responsável pela análise municipal (RN-025).
- O sistema não executa automação de penalidades, multas ou qualquer ato administrativo (RN-031, fora de escopo).

### Níveis ou subperfis

- Painel de gestão: acesso voltado a apresentação e visualização de indicadores.
- Técnico/administrativo da regulação: acesso operacional, verifica e valida pendências, incluindo divergências de medição.

## Tabela consolidada de atores

| ID | Ator | Objetivo | Responsabilidades | Principais ações | Módulos relacionados |
|---|---|---|---|---|---|
| AT-001 | Gerador (GGR) | Manter regularidade documental e evitar multas | Declarar coleta, manter cadastro e PGRS em dia, prestar contas | Declarar demanda avulsa ou contratual, emitir MTR/QR/PGRS/comprovante, exportar relatórios | Painel, Demandas, Documentos, Relatórios, Perfil |
| AT-002 | Cooperativa | Atender contratos com previsibilidade e registrar recebimento rastreável | Avaliar demandas, designar rota, coletar, confirmar recebimento, gerir equipe | Avaliar demanda, designar quem coleta, registrar recebimento, confirmar recebimento, controlar portaria | Demandas existentes, A caminho, Recebidas, Equipe, Portaria, Meu dia, Coletas, Relatórios |
| AT-003 | Prefeitura (SEMA), subperfis Painel de gestão e Técnico/administrativo da regulação | Regular e acompanhar geradores e cooperativas sem redigitar dados | Cadastrar GGR e cooperativa, acompanhar MTR, validar pendências | Cadastrar, definir parâmetros, visualizar MTR e indicadores, aprovar ou recusar divergência | Painel, Cadastros, MTR e contratos, Relatórios, Configurações |

Pontos em aberto ligados a este documento: ver [Contradições e Pontos em Aberto](<Contradições e Pontos em Aberto.md>).
