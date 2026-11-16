Comparação entre o que a Doc Funcional ([10 - Visão Funcional Consolidada](<10 - Visão Funcional Consolidada.md>) e documentos 01 a 09) define e o que o código faz. **A Doc Funcional é a referência mestre**: o que o código faz diferente dela é divergência.

- Código analisado: branch `organiza-doc-funcional`, em 29/09/2026. A versão anterior desta nota comparava o `main` em `e721bdf`; o histórico está no git.
- Caminhos de arquivo são relativos à raiz do repositório.
- Legenda: ✅ atende · 🟡 parcial · ❌ ausente · ⚠️ contraria a doc.

## Resumo

O front segue a doc em atores, estados e regras centrais. O que falta é, na maior parte, o que depende de backend ou de decisão ainda aberta na doc.

1. **Perfis.** Gerador, Cooperativa, Prefeitura · Técnico e Prefeitura · Painel de gestão (RN-040). O cooperado não é usuário (RN-029); a cooperativa registra a coleta em nome da equipe.
2. **Medições.** Declarada (litros), observada e aferida ficam lado a lado e nunca são sobrescritas (RN-023). Não há correção de medição.
3. **Pendência de divergência.** Só o Técnico decide, liberar ou manter, com justificativa obrigatória (EST-004).
4. **Situação regulatória.** Pendente, Regular, A renovar e Irregular pelos critérios de RN-036 a RN-039; antecedência do PGRS como parâmetro; inconformidade grave manual (RN-037).
5. **Removido por conflitar com a doc:** selo e certidão (RN-030), cobrança pela Prefeitura (RN-019), catador com login (RN-029), cancelamento, recusa e devolução de carga (EST-001), correção de medição (RN-023), aterro e transportadora como operador (RN-035), logística reversa (RN-032). Vendas da cooperativa e rateio de produção por cooperado também saíram, por não estarem na doc.
6. **Pronto para backend:** as telas gravam só por `lib/dados`; o contrato está em [contratos de dados](<../tecnico/contratos-de-dados.md>).

## 1. Requisitos funcionais

| RF | Situação | Como está | O que falta |
|---|---|---|---|
| RF-001, cadastro do GGR | ✅ | Razão social, endereço, responsável técnico e contrato vigente no cadastro; cadastro incompleto impede Regular (RN-004) | — |
| RF-002, enviar e renovar PGRS | 🟡 | Guarda número e data de emissão; validade de 12 meses (RN-003); gera PDF e DOCX | Sem evento de envio e de renovação (ponto aberto no doc 09) |
| RF-003, cadastro pela Prefeitura | ✅ | Técnico cadastra GGR e cooperativa em `/prefeitura/cadastros`; CNPJ repetido é bloqueado (FL-006-E01) | — |
| RF-004, parâmetros | ✅ | Tolerância, piso, antecedência do PGRS; persistidos, com histórico de alterações | — |
| RF-005, situação regulatória | ✅ | Calculada em `lib/dominio/regulatorio.ts` | Saída de Irregular além da revogação está em aberto na doc |
| RF-006, coleta prevista em contrato | 🟡 | A agenda do contrato propõe; o Gerador confirma; a demanda nasce `CONTRATO` | Contrato como entidade própria (vigência, coletas por semana) não existe: a doc não define o ciclo de vida |
| RF-007, coleta avulsa | ✅ | Em litros | — |
| RF-008, avaliar a demanda | ✅ | Aceitar ou não aceitar com motivo; reavaliar; a ficha do GGR sinaliza a falta de equipamento (RN-008) | — |
| RF-009, designar | ✅ | Só cooperado ativo da própria equipe | — |
| RF-010, rota | 🟡 | Ordem sugerida por zona, distância e prazo em `/cooperativa/demandas` | Horário e capacidade (RN-017) não entram |
| RF-011, registrar recebimento e horário | ✅ | Autor e horário vêm da sessão | — |
| RF-012, foto, quantidade e tipo | ✅ | Foto, massa observada, balança, aferição, tíquete | — |
| RF-013, confirmar recebimento | 🟡 | Um ato confirma e já concilia | "Recebida" e "Em conciliação" viram eventos da trilha, não estados |
| RF-014, portaria | ✅ | Entrada e saída pela identificação do cooperado | — |
| RF-015, equipe | ✅ | Admitir, desligar, religar, com trilha | — |
| RF-016, identificação no programa municipal | ✅ | Mantida pela cooperativa; a Prefeitura só consulta | — |
| RF-017, comparar as medições | 🟡 | Tolerância sobre observada × aferida; declarada em litros ao lado | Regra de comparação litros × kg está em aberto na doc |
| RF-018, abrir pendência | ✅ | Automática, com a tolerância do parâmetro | — |
| RF-019, decidir a pendência | ✅ | Liberar ou manter, justificativa obrigatória, medições intactas | Desfecho de "mantida" está em aberto na doc |
| RF-020, vincular MTR | ✅ | Só o Gerador, depois do recebimento e sem pendência; guarda fonte, emissão, consulta e autor | Consulta real ao SINIR (INT-001) |
| RF-021, QR de regularização | ✅ | Situação, responsável técnico, última coleta e PGRS (D-06) | Quando o PGRS é "particular" não está definido; entra sempre |
| RF-022, emitir PGRS | ✅ | PDF e DOCX | — |
| RF-023, comprovante simplificado | ✅ | Composição da D-06 + número do MTR | — |
| RF-024, Técnico vê MTR | 🟡 | Por demanda e na conciliação do arquivo do SINIR | Visão por contrato depende da entidade Contrato |
| RF-025, prestação de contas do Gerador | ✅ | CSV, XLS e PDF; contrato e avulsa separados | — |
| RF-026, o que a unidade recebeu | ✅ | CSV, XLS e PDF | — |
| RF-027, processos do município | ✅ | CSV, XLS e PDF, também no Painel de gestão | — |
| RF-028, painel do Gerador | ✅ | — | — |
| RF-029, painel da Cooperativa | ✅ | — | — |
| RF-030, indicadores do município | ✅ | Completo no Painel de gestão, resumido para o Técnico | Escopo final e SGP (INT-003) em aberto |
| RF-031, justificar e remarcar em 96 h | ✅ | Pendência de execução no vencimento; remarcar bloqueado depois de 96 h | Encaminhamento depois das 96 h em aberto (RN-034) |

O `.xls` é gerado como SpreadsheetML (XML do Excel 2003). O Excel avisa que a extensão não corresponde ao formato ao abrir; se isso incomodar, gerar `.xlsx` com uma biblioteca.

## 2. Requisitos não funcionais

| RNF | Situação | Observação |
|---|---|---|
| RNF-001, auditoria | 🟡 | Demanda, cadastro, carteira e parâmetros têm trilha com autor e horário. O formato ainda é texto (`titulo`, `detalhe`); o evento estruturado está especificado nos contratos de dados |
| RNF-002, natureza do dado | 🟡 | "Força da prova" distingue declarado de medido; não há marcação de dado do SUL |
| RNF-003, perfis | 🟡 | Quatro perfis e guarda de rota na interface; a proteção real depende de backend |
| RNF-004, nada administrativo automático | ✅ | Selo e certidão removidos; a minuta de notificação continua sendo minuta |
| RNF-005, medições inalteráveis | ✅ | Nenhuma função sobrescreve medição |
| RNF-006, referência à fonte | 🟡 | MTR com fonte, emissão e consulta, mas digitado |
| RNF-007, campo sob a Cooperativa | ✅ | — |
| RNF-008, desempenho | ❌ | Sem meta e sem backend (lacuna também na doc) |
| RNF-009, prazos | ✅ | 96 h e antecedência do PGRS |

## 3. Estados

| Estado | Situação |
|---|---|
| EST-001, Demanda e Coleta | 🟡 Criada, Disponível, Não aceita, Aceita, Em coleta, Pendência de execução, Em transporte, Pendência de divergência, Comprovada. Recebida e Em conciliação são eventos, não estados |
| EST-002, Situação regulatória | ✅ Pendente, Regular, A renovar, Irregular |
| EST-003, PGRS | ✅ Válido e Vencido pela data de emissão + 12 meses |
| EST-004, Pendência de divergência | ✅ Aberta, Liberada, Mantida, com as decisões guardadas. É um objeto dentro da demanda, não uma tabela própria |

## 4. O que o código tem a mais (extras neutros, mantidos)

Não estão na doc e não contrariam nenhuma RN. Ficam até decisão de escopo.

| Funcionalidade | Onde |
|---|---|
| Mapa e massa por bairro e zona | `app/prefeitura/mapa`, `app/gestao/mapa` |
| Metodologia e base legal | `app/prefeitura/metodologia` |
| Indicadores ambientais, sociais e financeiros, rankings | `lib/dominio/indicadores.ts` |
| Fiscalização: achados, minuta, dossiê | `app/prefeitura/fiscalizacao` |
| Alertas, acessibilidade, tema escuro | `lib/dominio/alertas.ts`, `acessibilidade.ts` |
| Certificado de Destinação Final (CDF) no manifesto | `lib/dados/documentos.ts` |
| Força da prova da pesagem e balança simulada | `lib/dominio/demanda.ts`, `lib/servicos/balanca.ts` |
| Conciliação do arquivo exportado do SINIR | `lib/dominio/conciliacaoMtr.ts` |
| Exportação CSV, além de XLS e PDF | `lib/servicos/relatorio.ts` |

## 5. Lacunas técnicas

- **Sem backend e sem banco.** Estado no `localStorage`; cada navegador tem seus próprios dados. A escrita já passa por `lib/dados`; as leituras ainda saem dos armazéns do domínio.
- **Sem autenticação real.** Login por código ou CNPJ, sem senha.
- **IDs e horário** ainda nascem no navegador.
- **Testes** só de domínio e serviços (Vitest); nenhum teste de interface.

## 6. Pontos que dependem de decisão

Estão em [Contradições e Pontos em Aberto](<Contradições e Pontos em Aberto.md>) e aparecem na tela como "pendente de definição", nunca como regra inventada:

- Pesagem sistemática pela Catanorte.
- Critério da divergência e desfecho de "mantida".
- Saída do estado Irregular.
- Comparação litros × kg.
- PGRS "particular" no QR.
- Contrato como entidade, com ciclo de vida.
- Meio técnico do SINIR, do SUL e do SGP.
