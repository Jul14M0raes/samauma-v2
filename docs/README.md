# Documentação do SAMAÚMA

Esta pasta é a **fonte oficial** da documentação do produto. Mudanças de regra, requisito ou escopo
são feitas aqui, junto com o código, e revisadas no mesmo pull request.

## Visão funcional (`funcional/`)

Comece por [10 - Visão Funcional Consolidada](<funcional/10 - Visão Funcional Consolidada.md>): ela
resume o produto inteiro e aponta onde está cada detalhe.

| Documento | Conteúdo |
|---|---|
| [01 - Atores e Perfis](<funcional/01 - Atores e Perfis.md>) | AT-001 a AT-003 e os quatro perfis de acesso |
| [02 - Macrofluxo do Sistema](<funcional/02 - Macrofluxo do Sistema.md>) | FL-001, etapas E1 a E7 e desvios |
| [03 - Módulos Funcionais](<funcional/03 - Módulos Funcionais.md>) | MOD-001 a MOD-007 |
| [04 - Fluxos por Ator](<funcional/04 - Fluxos por Ator.md>) | FL-002 a FL-008 |
| [05 - Estados e Ciclos de Vida](<funcional/05 - Estados e Ciclos de Vida.md>) | EST-001 a EST-004 |
| [06 - Regras de Negócio](<funcional/06 - Regras de Negócio.md>) | Rastreabilidade de RN-001 a RN-041 |
| [07 - Catálogo de Requisitos](<funcional/07 - Catálogo de Requisitos.md>) | RF-001 a RF-031, RNF-001 a RNF-009 |
| [08 - Matriz de Permissões](<funcional/08 - Matriz de Permissões.md>) | Recurso × ação × perfil |
| [09 - Dados, Documentos e Integrações](<funcional/09 - Dados, Documentos e Integrações.md>) | Entidades, DOC-001 a DOC-007, INT-001 a INT-003 |
| [Contradições e Pontos em Aberto](<funcional/Contradições e Pontos em Aberto.md>) | O que ainda depende de decisão |
| [Aderência do Código à Doc Funcional](<funcional/Aderência do Código à Doc Funcional.md>) | Diferenças entre o código e a doc |

`funcional/fontes/` guarda os documentos de origem: o catálogo de [Regras de negócio](<funcional/fontes/Regras de negócio.md>)
e o [Escopo Mestre](<funcional/fontes/Escopo Mestre.md>).

## Visão técnica (`tecnico/`)

[Contratos de dados](<tecnico/contratos-de-dados.md>): entidades, estados e comandos de cada agregado, mapeados
aos RF e aos perfis. É a especificação que o backend implementa.

## Ordem de leitura

- **Quem chega agora:** 10, depois 06 e 07.
- **Quem implementa:** 07, 08 e 09, com o 05 ao lado para os estados, e os contratos de dados.
- **Quem decide:** Contradições e Pontos em Aberto.

## Convenção de identificadores

| Prefixo | Identifica |
|---|---|
| `AT-` | Ator ou perfil |
| `FL-` | Fluxo |
| `MOD-` | Módulo |
| `EST-` | Entidade com ciclo de vida |
| `RN-` | Regra de negócio |
| `RF-`, `RNF-` | Requisito funcional e não funcional |
| `DOC-`, `INT-` | Documento e integração |
| `D-` | Decisão registrada em revisão |

No código, comentários citam esses identificadores para ligar a regra à implementação.
