SAMAÚMA

PLATAFORMA DIGITAL DE GESTÃO E RASTREABILIDADE DA DESTINAÇÃO DE RESÍDUOS SÓLIDOS DE GRANDES GERADORES 

Documento descritivo da solução

Versão condensada do Escopo Mestre 1.0

Segmento: GovTech / WasteTech

Modelo de atuação: B2G

Estágio tecnológico: TRL 4 — protótipo funcional

Município de implantação inicial: Porto Velho, Rondônia  

PORTO VELHO — RO

2026

# 1 INTRODUÇÃO

Este documento descreve, de forma condensada, a solução tecnológica denominada SAMAÚMA, plataforma digital voltada à gestão e à rastreabilidade da destinação de resíduos sólidos produzidos por grandes geradores. O texto sintetiza o Escopo Mestre da solução e destina-se à apresentação institucional do produto, ao alinhamento das equipes de desenvolvimento e à comunicação com o poder público municipal.

A SAMAÚMA situa-se na interseção entre regulação ambiental, operação de coleta e comprovação documental. Sua proposta não consiste em substituir sistemas oficiais já existentes, tampouco em automatizar decisões administrativas de competência do Município, mas em organizar, integrar e conciliar os registros necessários para que o ciclo de destinação de resíduos possa ser acompanhado de ponta a ponta, de maneira verificável.

O documento apresenta, na sequência, o problema que motiva a solução, a justificativa normativa que a fundamenta, os objetivos pretendidos, os atores envolvidos, o fluxo operacional proposto, a regra de conciliação que constitui seu principal diferencial técnico, as macroáreas funcionais previstas, a arquitetura lógica adotada, os requisitos não funcionais aplicáveis, os indicadores de acompanhamento, o desenho do piloto de validação, as delimitações do escopo, os riscos identificados e o caminho de evolução tecnológica pretendido.

# 2 O PROBLEMA

A gestão municipal dos resíduos produzidos por grandes geradores apresenta uma lacuna persistente entre a regulação, a operação e a comprovação. Embora existam obrigações legais relacionadas ao cadastro, ao gerenciamento, à coleta, ao transporte e à destinação final dos resíduos, as informações necessárias para acompanhar esse processo permanecem distribuídas entre documentos avulsos, sistemas independentes, operadores privados e registros produzidos isoladamente por cada participante da cadeia.

Essa dispersão dificulta ao Município responder, de maneira integrada, a perguntas que deveriam ser elementares no exercício da política pública de resíduos: quem são os estabelecimentos sujeitos à regulamentação, quais deles se encontram regularizados, quem executou a coleta de seus resíduos, qual massa foi retirada do estabelecimento, quanto efetivamente chegou à unidade receptora, qual foi a destinação declarada, quanto do material foi recuperado, quanto terminou como rejeito e se há comprovação suficiente de cada operação. Sem essa visão consolidada, a fiscalização perde capacidade de priorização, os indicadores ambientais tornam-se pouco confiáveis e a própria avaliação da política municipal fica comprometida.

Há ainda um efeito econômico relevante sobre o serviço público de coleta. Os grandes geradores enquadrados na regulamentação municipal devem assumir os custos relacionados à coleta, ao transporte e à destinação dos resíduos que produzem. Quando esse fluxo não é adequadamente acompanhado, resíduos cuja gestão deveria ocorrer de maneira privada acabam absorvidos pelo sistema público, transferindo à coletividade um custo que a norma atribui ao gerador. A ausência de rastreabilidade, portanto, não é apenas um problema informacional: traduz-se em perda de arrecadação, em sobrecarga operacional e em distorção do desenho regulatório.

# 3 JUSTIFICATIVA

Em Porto Velho, o Decreto Municipal nº 15.603, de 2018, estabelece obrigações específicas aplicáveis aos grandes geradores de resíduos sólidos, entre as quais figura a responsabilidade do estabelecimento enquadrado pelo custeio da própria coleta, do transporte e da destinação, segundo os critérios fixados pela regulamentação municipal. O desafio, contudo, não reside na existência da norma, e sim na dificuldade operacional de aplicá-la.

Essa dificuldade se manifesta em etapas encadeadas: identificar os estabelecimentos enquadrados, acompanhar sua situação regulatória ao longo do tempo, organizar a documentação associada, verificar a execução efetiva das coletas, confirmar a destinação final, preservar as evidências produzidas em cada etapa e, por fim, converter todo esse conjunto de registros em informação gerencial utilizável pela Administração. É exatamente nessa camada intermediária, entre a norma e a operação, que a SAMAÚMA pretende atuar.

A plataforma parte do reconhecimento de que os sistemas oficiais devem permanecer oficiais. Quando determinada informação tem origem no licenciamento ambiental, no sistema de manifesto de transporte de resíduos ou no processo eletrônico municipal, a SAMAÚMA preserva a referência à fonte, a data da consulta, o identificador correspondente e a situação da integração, sem criar uma segunda fonte concorrente de verdade institucional.

# 4 OBJETIVOS

## 4.1 Objetivo geral

Desenvolver e validar uma plataforma digital capaz de permitir ao Município acompanhar a regularização e a destinação dos resíduos produzidos por grandes geradores, estruturando uma cadeia auditável desde o estabelecimento gerador até a unidade receptora.

## 4.2 Objetivos específicos

Para alcançar esse propósito, a solução centraliza o cadastro e a situação regulatória dos estabelecimentos enquadrados, relacionando-os às informações provenientes do Sistema Único de Licenciamento de Porto Velho conforme a disponibilidade técnica e institucional. Registra e acompanha os Planos de Gerenciamento de Resíduos Sólidos vinculados a cada estabelecimento, sinalizando vencimentos e pendências documentais.

No plano operacional, a plataforma permite a criação, o acompanhamento e a conclusão de demandas de coleta, o vínculo formal entre o grande gerador e a cooperativa ou operador habilitado, e a rastreabilidade de cada carga desde a origem até a unidade receptora. Sobre esses registros incide a conciliação das medições produzidas por participantes distintos da cadeia, da qual resultam comprovantes de destinação, quando os valores são compatíveis, ou pendências de análise, quando há divergência relevante.

Por fim, a solução preserva autoria, horário, origem e histórico de alteração dos eventos principais, transforma os registros operacionais em indicadores ambientais, regulatórios e operacionais, e mantém-se preparada para integração progressiva com os sistemas públicos relacionados ao processo.

# 5 PRINCÍPIOS ESTRUTURANTES

Seis princípios orientam as decisões de produto e de arquitetura da SAMAÚMA e devem prevalecer sobre preferências pontuais de implementação.

O primeiro estabelece a rastreabilidade como prioridade em relação à automação. Construir uma cadeia verificável antecede qualquer tentativa de automatizar decisões, uma vez que automatizar sobre dados pouco confiáveis produz apenas erro em escala. O segundo determina que o sistema não substitui a autoridade pública: a plataforma pode identificar situações, calcular indicadores, apontar divergências, organizar evidências, gerar minutas e emitir alertas, mas não pratica autonomamente atos administrativos cuja competência pertence ao Município.

O terceiro princípio afirma que correção não significa apagamento. Informações relevantes para auditoria não são sobrescritas; quando corrigidas, o sistema preserva o valor anterior, o valor posterior, o autor, a data, a hora, a justificativa e a relação entre os eventos. O quarto princípio determina que divergência gera análise: uma inconsistência entre informações não constitui automaticamente fraude ou infração, e a decisão permanece humana.

O quinto princípio reserva aos sistemas oficiais o seu papel institucional, conforme já exposto. O sexto reconhece que estimado e verificado são conceitos distintos: valores declarados, observados, medidos e calculados possuem naturezas diferentes e não podem ser apresentados ao usuário como se possuíssem o mesmo grau de confiabilidade.

# 6 ATORES DO ECOSSISTEMA

O poder público municipal é o principal cliente institucional da solução. Cabe-lhe acompanhar o funcionamento da política municipal, visualizar a regularização dos estabelecimentos, fiscalizar, analisar divergências e utilizar os dados produzidos para a tomada de decisão. Na implantação em Porto Velho, diferentes órgãos poderão participar conforme sua competência institucional.

O grande gerador é o estabelecimento submetido às regras municipais aplicáveis. Na plataforma, acompanha sua própria situação regulatória e os motivos que a determinam, mantém informações cadastrais atualizadas, registra o Plano de Gerenciamento de Resíduos Sólidos, indica o operador responsável pela coleta, cria demandas, acompanha o andamento das operações e consulta os comprovantes de destinação emitidos em seu nome.

A cooperativa ou operador de coleta é a organização responsável pela execução do transporte e das etapas de campo. Recebe ou acompanha as demandas, programa atendimentos, registra as operações realizadas, identifica os responsáveis por cada carga e produz as evidências operacionais correspondentes. A implementação inicial prioriza um fluxo simples, compatível com a capacidade real da cooperativa participante do piloto e utilizável em dispositivos móveis sob conectividade instável.

A unidade receptora é a instalação responsável pelo recebimento do material, podendo corresponder a central de triagem, unidade de recuperação, instalação de transformação, operador de destinação ou aterro sanitário. Sua participação é decisiva, pois produz uma das principais evidências da cadeia: a medição da massa efetivamente recebida, registrada de forma independente do valor observado em campo.

# 7 FLUXO OPERACIONAL

O núcleo funcional da SAMAÚMA é um encadeamento único, que deve ser preservado durante todo o desenvolvimento. Ele se inicia com o cadastro do estabelecimento e a apuração de sua situação regulatória, apoiada nas informações documentais e no Plano de Gerenciamento de Resíduos Sólidos. Estabelecido o vínculo com um operador habilitado, o gerador cria uma demanda contendo, no mínimo, o tipo de material, a quantidade estimada, o ponto de coleta e o prazo pretendido.

A demanda é então aceita ou programada pelo operador, que executa a coleta e produz o registro de campo, incluindo a massa observada, a identificação do responsável pela operação e as evidências anexadas. Segue-se o transporte e o recebimento pela unidade receptora, que confirma a chegada da carga, registra a massa aferida, identifica o instrumento de medição quando aplicável, anexa o tíquete de pesagem, declara o rejeito e informa a destinação.

A conclusão do recebimento dispara a conciliação. Dela resulta a emissão de um comprovante de destinação, quando as medições são compatíveis, ou a abertura de uma pendência para análise municipal, quando a divergência ultrapassa a tolerância configurada. Em ambos os casos, os registros alimentam os indicadores apresentados no painel da Prefeitura. Funcionalidades que não contribuam diretamente para esse ciclo devem ser tratadas como secundárias ou futuras.

Cada demanda percorre um conjunto definido de estados — rascunho, criada, disponível ou programada, aceita, em coleta, em transporte, recebida, em conciliação e, ao final, comprovada ou convertida em pendência. Toda transição de estado produz um evento registrado na trilha de auditoria.

# 8 A REGRA DE CONCILIAÇÃO

O principal diferencial técnico da plataforma consiste na comparação de medições produzidas de forma independente em etapas distintas da cadeia. A arquitetura considera três referências, descritas no quadro a seguir.

Quadro 1 — Referências de medição consideradas na conciliação

|   |   |   |
|---|---|---|
|Medição|Responsável|Natureza do dado|
|Quantidade informada na origem|Grande gerador|Declarada|
|Massa registrada durante a operação|Operador de coleta|Observada ou medida|
|Massa aferida no destino|Unidade receptora|Medida|

Fonte: Escopo Mestre da SAMAÚMA, versão 1.0.

A plataforma compara essas informações a partir de parâmetros de tolerância configuráveis, que combinam um percentual de variação e um valor mínimo absoluto, de modo a evitar que pequenas cargas gerem divergências artificiais. Quando as medições permanecem dentro da tolerância estabelecida, a carga é considerada conciliada e o comprovante de destinação é emitido. Quando a divergência ultrapassa esse limite, a carga origina uma pendência encaminhada à análise municipal.

Em nenhuma hipótese a plataforma apaga ou ajusta qualquer das medições para fazer os valores coincidirem. As três referências permanecem preservadas em sua forma original, e a decisão administrativa tomada após a análise é registrada como um novo evento, acompanhado da respectiva justificativa. Esse desenho é o que permite reconstruir posteriormente a história completa de qualquer carga.

A plataforma distingue, ainda, a natureza de cada dado que armazena. São classificados como declarados os valores informados pelo responsável; como observados, os registrados durante operação de campo; como medidos, os obtidos por instrumento identificado; como calculados, os produzidos por regra explícita do sistema; e como parâmetros, os valores configurados para execução dessas regras. Essa classificação acompanha o registro e, quando relevante, é apresentada ao usuário.

# 9 MACROÁREAS FUNCIONAIS

O produto organiza-se em quatorze macroáreas, definidas de modo a refletir o fluxo mestre. As três primeiras concentram a dimensão regulatória: identificação e cadastro dos grandes geradores, gestão da situação regulatória com seus documentos e pendências, e o módulo dedicado ao Plano de Gerenciamento de Resíduos Sólidos, responsável por registrar número, validade, arquivo, situação e alertas de vencimento.

A quarta e a quinta macroáreas tratam do cadastro e do vínculo dos operadores e cooperativas e do ciclo de vida das demandas, da criação ao encerramento. A sexta e a sétima cobrem, respectivamente, o registro dos eventos de coleta e o registro da chegada do material à unidade receptora. A oitava concentra a conciliação das medições e o tratamento das divergências, e a nona produz e disponibiliza os comprovantes de destinação.

As demais macroáreas atendem ao poder público e à sustentação da plataforma: fiscalização e pendências, reunindo os casos que exigem atuação humana; indicadores, que convertem registros em métricas; relatórios e exportações, voltados à prestação de contas; integrações, que abrigam os conectores com sistemas públicos e fontes oficiais; e administração e auditoria, responsável por usuários, permissões, parâmetros e trilha de eventos.

A situação regulatória de um estabelecimento não é uma etiqueta digitada manualmente, mas um resultado derivado de regras explícitas, que consideram a existência do cadastro, a situação no licenciamento, a validade do Plano de Gerenciamento de Resíduos Sólidos, a documentação vigente, o operador associado, as últimas destinações registradas, as pendências abertas e as divergências ainda não analisadas. Toda situação calculada é acompanhada de justificativa legível, e as regras definitivas serão validadas com o Município durante a implantação.

# 10 ARQUITETURA E MODELO DE DOMÍNIO

A plataforma organiza-se em camadas: apresentação, com interfaces web específicas por perfil; aplicação, responsável pelos casos de uso e pela coordenação dos fluxos; domínio, onde residem as regras centrais de situação regulatória, demandas, cargas, conciliação, comprovantes e indicadores; dados, com persistência estruturada; auditoria, baseada em eventos somente-adição; integrações, dedicada à comunicação com sistemas externos; relatórios, para geração de documentos e exportações; e observabilidade, reunindo registros de execução, disponibilidade e acompanhamento de falhas.

O modelo de domínio prevê, entre outras entidades, o estabelecimento, o plano de gerenciamento, o operador, o vínculo operacional entre gerador e operador, a demanda, a carga como unidade rastreável, a coleta, o recebimento, a pesagem, a conciliação, a pendência, o comprovante, a unidade receptora, o documento, o evento de trilha, o indicador, o usuário e a organização à qual ele pertence.

A trilha de auditoria adota o princípio de somente adição. Cada evento relevante registra o identificador, a entidade relacionada, o tipo de ocorrência, o valor anterior e o novo valor, o autor, seu perfil e organização, a data, a hora, a origem, a justificativa e os anexos aplicáveis. Não há exclusão destrutiva de eventos necessários à reconstrução da cadeia.

Determinadas regras não permanecem fixadas em código, mas em parâmetros administráveis: tolerância percentual e absoluta da conciliação, prazo considerado como ausência de destinação, antecedência dos alertas de vencimento, referências de custo e critérios operacionais diversos. Toda alteração preserva o valor anterior, o novo valor, o autor, a data e a justificativa, e não modifica retroativamente comprovantes já emitidos.

A plataforma pode associar identificadores verificáveis a seus principais registros, incluindo estabelecimento, carga e comprovante, admitindo o uso de QR Code como forma de acesso rápido. Nenhum processo crítico, contudo, depende exclusivamente de leitura óptica: todos os códigos possuem alternativa alfanumérica para consulta manual.

# 11 INTEGRAÇÕES INSTITUCIONAIS

A integração com o Sistema Único de Licenciamento de Porto Velho é tratada como prioritária. Seus objetivos são evitar cadastro duplicado, relacionar estabelecimento e processo administrativo, recuperar informações de licenciamento quando tecnicamente disponíveis, identificar a situação documental e facilitar a análise municipal. Sua implementação depende de acesso institucional, documentação técnica, interfaces disponibilizadas, autorização para compartilhamento e definição de responsabilidade sobre a informação. Caso a integração automatizada não esteja disponível durante o piloto, o mesmo resultado será obtido por fluxo assistido.

Quanto ao Manifesto de Transporte de Resíduos, a plataforma opera de maneira interoperável com o fluxo oficial: reúne as informações da carga, prepara os campos já conhecidos, registra o número do manifesto e o certificado de destinação final quando aplicável, relaciona o documento à carga e identifica cargas sem referência ao manifesto quando este for exigível. A SAMAÚMA não se apresenta como emissora oficial desse documento enquanto a emissão permanecer atribuída ao sistema nacional correspondente.

A arquitetura permanece preparada para evoluir em direção a outras conexões, entre elas o geoportal municipal, as bases de dados abertos, o cadastro econômico municipal, o sistema eletrônico de informações, a identidade digital federal e os sistemas de contratos e de indicadores. Cada integração exibe explicitamente seu estado — ativa, parcial, assistida, pendente ou indisponível —, de modo que integrações ainda inexistentes jamais sejam apresentadas como operantes.

# 12 REQUISITOS NÃO FUNCIONAIS E PROTEÇÃO DE DADOS

No plano da segurança, a plataforma exige autenticação em ambiente de produção, autorização por perfil, controle de acesso às rotas de servidor, registro dos eventos relevantes, política de backup e plano de recuperação. O controle por perfil assegura que cada usuário visualize apenas as informações e ações compatíveis com sua função, contemplando inicialmente os perfis de gestor municipal, servidor ou fiscal, administrador técnico, grande gerador, cooperativa ou operador e unidade receptora.

As operações de campo são projetadas para conectividade móvel instável, e as interfaces devem funcionar adequadamente em computador, tablet e telefone celular, observando princípios de acessibilidade, especialmente nas telas utilizadas durante a coleta. Os dados devem ser exportáveis em formato aberto, e a arquitetura deve admitir novas integrações sem reconstrução dos módulos centrais.

Quanto à proteção de dados, a solução distingue dados empresariais de dados pessoais. Os dados pessoais observam finalidade definida, acesso mínimo necessário, controle por perfil, registro de acesso quando necessário, prazo de retenção compatível e proteção contra exposição indevida. Os indicadores municipais utilizam informações agregadas sempre que a identificação individual não for necessária ao propósito da análise.

# 13 INDICADORES DE ACOMPANHAMENTO

Para evitar um painel excessivamente amplo antes da existência de dados reais, o piloto concentra-se em um conjunto mínimo de indicadores. A cobertura mede o percentual de grandes geradores participantes com situação atualizada no sistema. A rastreabilidade mede o percentual de cargas que percorrem o fluxo completo. A conciliação mede o percentual de cargas cujas medições permanecem dentro da tolerância. A destinação comprovada mede o percentual de cargas concluídas com evidência de recebimento.

Somam-se a esses a taxa de recuperação, obtida pela razão entre a massa recuperada e a massa recebida quando houver evidência suficiente para o cálculo; o volume de rejeito destinado à disposição final; o tempo de análise, medido entre o início e a conclusão de determinado processo regulatório; e a qualidade do dado, expressa pelo percentual de registros que reúnem o conjunto de evidências exigido.

O painel municipal organiza esses resultados em quatro grupos. Os indicadores regulatórios apresentam o número de grandes geradores cadastrados, sua distribuição por situação, a validade dos planos de gerenciamento e os estabelecimentos com pendências ou sem destinação recente. Os indicadores operacionais acompanham demandas criadas e concluídas, cargas em trânsito, recebidas, conciliadas ou pendentes, e o tempo médio do ciclo. Os indicadores ambientais consolidam massa coletada, recebida, recuperada e rejeitada, bem como a taxa de recuperação. Os indicadores da operação, por fim, descrevem o volume processado por operador e o desempenho da conciliação.

A plataforma gera ainda relatórios em formato aberto e em documento imprimível, abrangendo o histórico do estabelecimento, as cargas realizadas no período, os recebimentos registrados, as pendências em aberto, o resumo municipal consolidado, o dossiê regulatório do estabelecimento e a evolução das principais métricas.

# 14 O PILOTO DE VALIDAÇÃO

O piloto destina-se a validar a hipótese central da SAMAÚMA em escala controlada, no município de Porto Velho, com um grupo delimitado de estabelecimentos participantes, ao menos uma cooperativa ou operador de coleta e as unidades receptoras necessárias ao fechamento completo do ciclo. O prazo de referência é de até doze meses, no contexto de eventual contratação pública para solução inovadora, distribuídos entre mobilização, transformação do protótipo em plataforma de produção, integrações, operação assistida e avaliação final.

A validação não depende de implementar toda a visão futura do produto. O piloto precisa demonstrar que é possível acompanhar digitalmente uma carga desde o estabelecimento até seu destino; que é possível obter registros independentes das diferentes etapas da operação; que a conciliação automática consegue separar cargas regulares de casos que exigem análise humana; que a trilha gerada é suficientemente compreensível e verificável para uso pela Administração; que o Município consegue obter indicadores anteriormente dispersos ou inexistentes; que os diferentes atores utilizam o fluxo sem fricção incompatível com sua rotina; e que a plataforma consegue coexistir com os sistemas municipais existentes.

Considera-se o piloto tecnicamente bem-sucedido quando demonstrar, em condições reais, que o fluxo completo pode ser executado, que os registros são preservados, que as três medições podem ser relacionadas entre si, que as divergências são efetivamente detectadas, que a análise humana funciona sobre as pendências geradas, que os comprovantes podem ser produzidos, que os dados podem ser exportados, que o Município compreende a origem dos indicadores apresentados, que cada perfil executa suas atividades e que existe ganho mensurável em relação ao processo anterior. As metas quantitativas específicas serão definidas no plano de validação correspondente.

# 15 DELIMITAÇÃO DO ESCOPO

A definição do que não pertence à primeira implantação é tão relevante quanto a definição do que pertence. Não constituem requisito obrigatório inicial a automação de penalidades, a aplicação automática de multas ou qualquer forma de decisão administrativa automatizada, uma vez que tais atos são de competência exclusiva do Município. Também não integram o escopo a substituição dos sistemas oficiais de licenciamento, de manifesto de resíduos ou de processo eletrônico, nem a emissão autônoma de documentos juridicamente atribuídos a outros sistemas.

Permanecem igualmente fora do escopo inicial o rastreamento contínuo de pessoas, o marketplace aberto de âmbito nacional, o processamento de pagamentos, a gestão contábil completa das cooperativas, o emprego de inteligência artificial como elemento necessário ao funcionamento, o uso de blockchain, mecanismos de gamificação e a expansão territorial imediata. Quanto aos tipos de resíduo, a primeira implantação não abrange resíduos de serviços de saúde, resíduos da construção civil, logística reversa especializada nem coleta domiciliar comum.

Dois pontos merecem registro como decisões de produto deliberadamente adiadas. O primeiro é a inclusão do catador autônomo como perfil individual do sistema, presente em versões anteriores da solução e agora deslocada para etapa posterior, de modo que o piloto não precise resolver simultaneamente cadastro individual, identificação, renda e autonomia cooperativista. O segundo é o selo de regularidade do estabelecimento, classificado como funcionalidade complementar, condicionada à validação jurídica e operacional do Município, da qual o funcionamento central da plataforma não pode depender.

Toda nova funcionalidade proposta deve ser avaliada por seis perguntas: contribui diretamente para o fluxo mestre; é necessária para validar uma hipótese do piloto; decorre de obrigação legal; é necessária à segurança ou à integridade do dado; é necessária a alguma integração institucional; e existe um usuário claramente responsável por utilizá-la. Quanto menos respostas afirmativas, menor a prioridade atribuída.

# 16 RISCOS E DEPENDÊNCIAS

O sucesso do projeto não depende exclusivamente da equipe técnica. São dependências externas relevantes a disponibilização de acesso institucional, a colaboração das secretarias responsáveis, a autorização para as integrações pretendidas, a adesão dos grandes geradores, a participação da cooperativa ou operador e das unidades receptoras, a definição das regras municipais aplicáveis e as validações jurídica, de segurança e tecnológica.

Entre os riscos prioritários, a baixa adesão dos estabelecimentos é mitigada por piloto controlado, comunicação institucional e seleção inicial assistida. A eventual insuficiência de capacidade operacional da cooperativa é mitigada por dimensionamento prévio e limitação do número de participantes. A indisponibilidade das integrações é enfrentada por arquitetura desacoplada e fluxo assistido. A inconsistência dos dados é tratada por validação de entrada, classificação da natureza do dado e saneamento humano.

A ocorrência de divergências frequentes exige calibração dos parâmetros de tolerância e investigação de suas causas, e não endurecimento automático da regra. A conectividade limitada é endereçada por desenho orientado à operação móvel. O conflito de competência é evitado pelo princípio de que o software não pratica decisão administrativa. A exposição indevida de dados é mitigada por controle de acesso, agregação e política explícita. Por fim, a ampliação excessiva do escopo é contida por controle formal de mudanças e priorização estrita pelo fluxo mestre.

# 17 EVOLUÇÃO TECNOLÓGICA

A solução encontra-se atualmente no nível de maturidade tecnológica quatro, correspondente a protótipo funcional com regras e fluxos principais demonstráveis em ambiente de desenvolvimento. O estágio seguinte pretendido é a validação da tecnologia em ambiente relevante, o que exige backend de produção, banco de dados persistente, autenticação e controle de acesso, trilha auditável, integrações institucionais, operação com usuários reais, coleta de dados reais, monitoramento, suporte e avaliação sistemática de resultados.

O projeto organiza-se em fases sucessivas. A fase de organização valida o escopo, define responsáveis, arquitetura, custos, riscos e cronograma. A preparação institucional identifica participantes, reúne documentos e acordos, obtém acessos e estabelece a linha de base. A fase de produto de produção implementa backend, banco, autenticação, autorização, segurança, auditoria e monitoramento. A fase de integrações conecta a plataforma ao licenciamento municipal e às demais fontes aprovadas. O piloto assistido conduz a operação real com acompanhamento e suporte, e a fase de avaliação analisa indicadores, audita registros e verifica as hipóteses formuladas.

Considera-se o produto pronto para iniciar a operação assistida quando for possível executar, com persistência real, o ciclo completo: o gerador possui cadastro e situação regulatória, registra operador e cria demanda; o operador recebe a demanda, executa a coleta e registra a medição de campo; a unidade receptora recebe a carga, registra a massa e declara rejeito e destinação; o sistema concilia e emite comprovante ou pendência; e a Prefeitura acompanha a carga, consulta a trilha, resolve a pendência e visualiza o resultado nos indicadores. Enquanto esse ciclo não estiver funcionando, funcionalidades periféricas não podem ser consideradas substitutas da conclusão do núcleo.

Confirmada a validação, a evolução prevista contempla a ampliação do universo de grandes geradores atendidos, a inclusão de novos operadores habilitados, a automação progressiva das integrações municipais, o desenvolvimento de inteligência regulatória para priorização da fiscalização, a mensuração de custos evitados, o acompanhamento da comercialização efetiva dos materiais recuperados, a eventual inclusão dos catadores individuais mediante desenho institucional adequado e a adaptação da plataforma para outros municípios. Nessa expansão, o núcleo do software permanece comum, concentrando-se as adaptações na legislação aplicável, nos parâmetros, nas integrações, nas bases oficiais e na identidade institucional de cada município.

# 18 CONSIDERAÇÕES FINAIS

A proposta da SAMAÚMA pode ser reduzida a uma única afirmação: a plataforma transforma a destinação de resíduos de grandes geradores em uma cadeia digital verificável, conectando gerador, operador, unidade receptora e Município, e conciliando os registros produzidos em cada etapa para gerar comprovação, pendências e indicadores de gestão.

Tecnicamente, esse propósito se traduz em um encadeamento que vai do gerador à demanda, desta à coleta e à medição de campo, seguindo pelo transporte, pelo recebimento, pela pesagem e pela declaração de destinação, até a conciliação que produz comprovante ou pendência e, por fim, os indicadores municipais. Esse é o escopo que deve ser protegido durante todo o desenvolvimento, e é sobre ele que se apoiam as decisões de priorização descritas neste documento.
