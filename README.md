# SAMAÚMA

**Sistema de Grandes Geradores e Inclusão Produtiva**, construído pela LUMMENUS para a Prefeitura de
Porto Velho (SEMA). Liga o grande gerador de resíduos, a cooperativa que coleta e a Prefeitura num
registro único do ciclo de uma coleta, da declaração à comprovação.

A documentação do produto está em [`docs/`](docs/README.md) e é a referência para qualquer mudança.

## Estado atual

Protótipo de front-end. Não há backend: o estado fica no `localStorage` do navegador e o site é
exportado como HTML estático. As telas gravam só por `lib/dados`; o contrato que o backend
precisa cumprir está em [docs/tecnico/contratos-de-dados.md](docs/tecnico/contratos-de-dados.md).

## Executar

```bash
npm install
npm run dev
```

Depois abra `http://localhost:3000/samauma`.

Em Windows com política de Controle de Aplicativo (o bloqueio do arquivo nativo
`@next/swc-win32-x64-msvc`), o Turbopack não sobe. Use o modo webpack:

```bash
npx next dev --webpack
npx next build --webpack
```

## Verificar

```bash
npm test
```

```bash
npm run lint
```

```bash
npm run build
```

O CI (`.github/workflows/verificacao.yml`) roda lint, testes e build em todo push e pull request.

## Estrutura

```text
app/            rotas (Next.js App Router), uma pasta por perfil
components/     componentes de tela, agrupados por área
lib/dados/      comandos de escrita das telas (a porta para o futuro backend)
lib/dominio/    regras do negócio e armazenamento local
lib/servicos/   documentos, relatórios, exportações e integrações externas
docs/           documentação funcional (fonte oficial) e contratos de dados
```

## Publicação

`next.config.ts` usa `output: "export"` com `basePath: "/samauma"`. A cada push no `main`, o
workflow `.github/workflows/publicar.yml` gera `out/` e publica no GitHub Pages.

## Aviso

Organizações, pessoas, documentos, coordenadas e valores são fictícios ou demonstrativos. O protótipo
não acessa sistemas oficiais, não movimenta dinheiro e não representa decisão ou procedimento
homologado pela Prefeitura de Porto Velho.
