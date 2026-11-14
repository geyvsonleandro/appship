# API do App Store Connect: referência rápida

Use `scripts/asc.mjs`, rodando a partir da raiz do projeto do usuário (ele lê `.assinaturas/apple.json`).

## Comandos

| Comando | O que faz |
|---|---|
| `check` | Testa a chave e lista os apps |
| `sub-status <bundle>` | Mostra grupos, assinaturas, estado e o que falta |
| `sub-setup <spec.json>` | Cria grupo, assinaturas, textos, disponibilidade, preços e teste grátis. Pode rodar de novo |
| `review-screenshot <subId> <png>` | Envia o print de revisão de uma assinatura |
| `upload <tipo> <relação> <tipoRel> <id> <arquivo>` | Upload genérico (reserva, envio, confirmação) |
| `request <MÉTODO> <caminho> [--body f.json] [--all]` | Chamada livre. `--all` segue a paginação |

## Valores aceitos

- `period`: `ONE_WEEK`, `ONE_MONTH`, `TWO_MONTHS`, `THREE_MONTHS`, `SIX_MONTHS`, `ONE_YEAR`
- `freeTrial`: `THREE_DAYS`, `ONE_WEEK`, `TWO_WEEKS`, `ONE_MONTH`, `TWO_MONTHS`, `THREE_MONTHS`, `SIX_MONTHS`, `ONE_YEAR`
- Território do Brasil: `BRA`. Idioma: `pt-BR`.

## Caminhos úteis para `request`

| Para | Caminho |
|---|---|
| App pelo bundle | `GET /v1/apps?filter[bundleId]=...` |
| Grupos do app | `GET /v1/apps/{id}/subscriptionGroups` |
| Assinaturas do grupo | `GET /v1/subscriptionGroups/{id}/subscriptions` |
| Preços possíveis no Brasil | `GET /v1/subscriptions/{id}/pricePoints?filter[territory]=BRA` |
| Período de tolerância | `PATCH /v1/subscriptionGracePeriods/{appId}` |
| Versões do app | `GET /v1/apps/{id}/appStoreVersions` |
| Textos por idioma | `GET /v1/appStoreVersions/{id}/appStoreVersionLocalizations` |
| Nome, subtítulo, classificação | `GET /v1/apps/{id}/appInfos?include=ageRatingDeclaration` |
| Builds | `GET /v1/builds?filter[app]={id}&sort=-uploadedDate&limit=5` |

O corpo de POST e PATCH segue o padrão `{ "data": { "type": "...", "id": "...", "attributes": {...}, "relationships": {...} } }`.

## Testado em conta real (nov/2026)

Funcionaram contra a Apple de verdade: `sub-setup` (grupo, assinaturas, preço e teste grátis em cerca de 175 países, sem `startDate`), disponibilidade das assinaturas, imagens da página por `appScreenshotSets`, preço e países do app, classificação etária e `revisao-status`.

A API muda. Se algo falhar, leia o erro, consulte developer.apple.com/documentation/appstoreconnectapi e ajuste o script. A Apple marcou `appScreenshotSets` como obsoleto em favor da App Asset Library: se parar de funcionar, siga a documentação nova.

## O que não tem API (faça pela tela)

- Aceitar contratos, banco e impostos.
- Gerar chaves.
- Criar o registro do app (o `eas submit` interativo faz isso com o login da Apple).
- Privacidade do app (dados coletados).
- Incluir as primeiras assinaturas na versão do app.
