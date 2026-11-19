# Referência: Google Play Developer API

Documentação oficial (consulte na hora, ela muda): https://developers.google.com/android-publisher

## Credenciais

Uma **conta de serviço** do Google Cloud, com uma chave JSON, convidada no Play Console (Usuários e permissões) com as permissões da Fase 2, passo 2. O script lê `.assinaturas/google.json`:

```json
{ "keyPath": ".assinaturas/google-play-key.json" }
```

O script faz o login sozinho (JWT assinado com a chave, escopo `https://www.googleapis.com/auth/androidpublisher`). A mesma chave vai no `eas.json` (`serviceAccountKeyPath`) e no RevenueCat.

## Comandos do `gplay.mjs`

| Comando | O que faz |
|---|---|
| `check <pacote>` | Testa a chave e o acesso ao app. Mostra idioma padrão, contato e faixas com versões |
| `prices <pacote> <preço> [BRL]` | Mostra a conversão do preço para os outros países (não cria nada) |
| `sub-setup <assinaturas-android.json>` | Cria assinatura, planos base com preço em todos os países, ativa os planos, cria e ativa a oferta de teste grátis. Pode rodar de novo |
| `sub-status <pacote>` | Assinaturas, planos, estado, preço do Brasil, ofertas e o ID para o RevenueCat |
| `listing <loja-android.json>` | Envia textos, contato e imagens da página da loja (abre uma edição, envia, valida e salva) |
| `revisao-status <pacote>` | Autorrevisão, só leitura |
| `request <MÉTODO> <caminho> [--body arquivo.json]` | Chamada livre. O caminho começa pelo pacote, sem barra: `com.exemplo.app/edits` |

## `assinaturas-android.json`

```json
{
  "packageName": "com.exemplo.app",
  "homeRegion": "BR",
  "subscriptions": [
    {
      "productId": "premium",
      "listings": [
        { "languageCode": "pt-BR", "title": "Premium", "benefits": ["Acesso completo"], "description": "Acesso completo ao app." }
      ],
      "basePlans": [
        { "basePlanId": "mensal", "period": "P1M", "price": "19.90", "currency": "BRL", "gracePeriod": "P7D", "freeTrial": "P3D" },
        { "basePlanId": "anual", "period": "P1Y", "price": "129.90", "currency": "BRL", "gracePeriod": "P7D", "freeTrial": "P3D" }
      ]
    }
  ]
}
```

- `productId`: letras minúsculas, números, `_` e `.`; começa com letra ou número; até 40 caracteres.
- `basePlanId` e `offerId`: letras minúsculas, números e `-`; até 63 caracteres.
- `listings`: precisa ter o **idioma padrão do app**. `description` até 200 caracteres; `benefits` até 4.
- `period`: duração ISO 8601 (`P1W`, `P1M`, `P3M`, `P6M`, `P1Y`).
- `gracePeriod`: em dias, de `P0D` até o menor entre 30 dias e o período. Opcional. A retenção de conta fica no padrão do Google.
- `freeTrial`: duração do teste (`P3D`, `P7D`, `P1M`) ou ausente. A oferta vale só para quem nunca teve essa assinatura.
- `homeRegion`: país cujo preço fica exatamente o escolhido (os outros vêm da conversão do Google).
- `regionsVersion` (opcional): versão das regiões do Google. Se não vier, o script usa a versão que o próprio Google devolve na conversão de preços (é a atual).

## `loja-android.json`

```json
{
  "packageName": "com.exemplo.app",
  "language": "pt-BR",
  "title": "Exemplo: hábitos e rotina",
  "shortDescription": "Crie hábitos que duram, com lembretes e desafios.",
  "fullDescription": "...",
  "contactEmail": "contato@exemplo.com",
  "contactWebsite": "https://exemplo.com",
  "images": {
    "icon": ".assinaturas/loja/android/icone-512.png",
    "featureGraphic": ".assinaturas/loja/android/destaque.png",
    "phoneScreenshots": ".assinaturas/loja/android/capturas"
  }
}
```

Imagens: um arquivo para `icon` e `featureGraphic`, uma pasta para `phoneScreenshots` (enviadas na ordem dos nomes). O script apaga as imagens antigas daquele tipo e envia as novas.

## Endereços usados (base `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/{pacote}`)

| O quê | Chamada |
|---|---|
| Converter preço | `POST /pricing:convertRegionPrices` |
| Listar assinaturas | `GET /subscriptions` |
| Criar assinatura | `POST /subscriptions?productId=...&regionsVersion.version=...` |
| Ativar plano base | `POST /subscriptions/{id}/basePlans/{plano}:activate` |
| Ofertas | `GET` ou `POST /subscriptions/{id}/basePlans/{plano}/offers?offerId=...&regionsVersion.version=...` |
| Ativar oferta | `POST /subscriptions/{id}/basePlans/{plano}/offers/{oferta}:activate` |
| Edição (loja, faixas) | `POST /edits` > alterações > `POST /edits/{id}:validate` > `POST /edits/{id}:commit` |
| Textos | `PUT /edits/{id}/listings/{idioma}` |
| Contato e idioma padrão | `GET` e `PUT /edits/{id}/details` |
| Imagens | `POST https://androidpublisher.googleapis.com/upload/androidpublisher/v3/applications/{pacote}/edits/{id}/listings/{idioma}/{tipo}?uploadType=media` (tipos: `icon`, `featureGraphic`, `phoneScreenshots`) |
| Faixas | `GET /edits/{id}/tracks` |
| Segurança dos dados | `POST /dataSafety` com um CSV (formato na ajuda do Play Console). Preferimos a tela, onde o usuário confere cada resposta |

## O que só existe na tela

- Criar o app.
- Convidar a conta de serviço (Usuários e permissões).
- Conteúdo do app: classificação do conteúdo, público-alvo, anúncios, acesso ao app, política de privacidade, declarações (a Segurança dos dados tem API, mas use a tela).
- Categoria e tags.
- Países de cada faixa e lançamento das versões (o EAS envia como rascunho).
- Testadores por lista de e-mails (a API só aceita Grupos do Google).
- Pedido de acesso à produção.
- Perfil de pagamentos e verificação do aparelho.
