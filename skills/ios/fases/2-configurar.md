# Fase 2: Configurar

A ordem importa. O app precisa existir na Apple antes das assinaturas, e na primeira vez quem cria o app na Apple é o envio do build. Por isso o código vem primeiro e as assinaturas da Apple vêm depois do primeiro envio (Fase 3, passo 4). Se o app **já existe** no App Store Connect, faça o passo 6 aqui mesmo.

Para saber se o app já existe: depois do passo 1, rode `node <skill>/scripts/asc.mjs check` e procure o bundle na lista.

## 1. Chaves da Apple (o usuário faz, uma vez por conta)

Crie a pasta `.assinaturas/` e adicione `.assinaturas/` ao `.gitignore`.

Guie o usuário, um passo por vez (ou faça pelo navegador, se tiver a ferramenta e ele estiver logado):

**Chave A, API do App Store Connect** (deixa você configurar a Apple):
1. App Store Connect > **Usuários e acesso** > aba **Integrações** > **API do App Store Connect**.
2. Na primeira vez aparece **Solicitar acesso**. Clicar e aceitar.
3. Em **Chaves da equipe** > **+**. Nome: `Claude`. Acesso: **Gerente de apps**.
4. Baixar o arquivo `AuthKey_XXXX.p8`. **A Apple só deixa baixar uma vez.**
5. Anotar o **ID da chave** e o **Issuer ID** (fica no topo da página).

**Chave B, Compras dentro do app** (o RevenueCat usa para validar compras):
1. Mesma tela, menu à esquerda > **Compras dentro do app** > **Gerar chave**. Nome: `RevenueCat`.
2. Baixar o `SubscriptionKey_XXXX.p8` e anotar o **ID da chave**.

Peça para mover os dois arquivos para `.assinaturas/`. Depois crie `.assinaturas/apple.json`:

```json
{ "keyId": "ID DA CHAVE A", "issuerId": "ISSUER ID", "keyPath": ".assinaturas/AuthKey_XXXX.p8" }
```

Confirme com `node <skill>/scripts/asc.mjs check`. Tem que listar os apps da conta sem erro.

## 2. RevenueCat: conexão

Verifique se você tem as ferramentas do RevenueCat (nomes como `list-projects`, `create-project`). O ideal é isso já ter sido resolvido no aviso inicial da Fase 1. Se não tiver, peça ao usuário para instalar o plugin oficial e reiniciar o Claude Code:

1. **VS Code:** no chat, digitar `/plugins` > **Manage plugins** > aba **Plugins** > procurar `revenuecat` > **Install** no que diz "Set up RevenueCat, integrate it, and access data". Instalar só um. (No VS Code, `/plugin` sem o "s" não funciona.)
2. **Claude Code no terminal:** `/plugin` > procurar RevenueCat > instalar.
3. Depois, abrir uma conversa nova e chamar a skill de novo. O andamento fica salvo.

Se na conversa nova as ferramentas não aparecerem, confira em `/plugins` (ou `/plugin`) se o RevenueCat está como instalado e ligado. Se só o catálogo foi adicionado e o plugin não, instale pela aba **Plugins**. Em último caso, confira o `~/.claude/settings.json`: precisa ter o plugin em `"enabledPlugins"` (o nome exato aparece na lista de plugins).

Na primeira chamada abre o navegador para o usuário autorizar o acesso.

Se o plugin não puder ser usado, use a API v2 do RevenueCat com uma chave secreta v2 que o usuário cria em RevenueCat > API keys. Guarde em `.assinaturas/revenuecat.json`. Consulte o formato das chamadas em revenuecat.com/docs/api-v2 antes de usar.

## 3. RevenueCat: projeto e app

Com as ferramentas (confira os parâmetros no esquema de cada uma):

1. Projeto: use o existente se o usuário já tiver um para este app. Senão, crie com o nome do app.
2. App da **App Store** dentro do projeto, com o bundle iOS do projeto.
3. Pegue a **chave pública** do app (`list-app-public-api-keys`). Começa com `appl_`.
4. Pegue a chave pública da **Test Store** (começa com `test_`). Todo projeto do RevenueCat já tem uma Test Store.

## 4. RevenueCat: catálogo

1. Produtos do app da App Store: um por plano, com o mesmo ID do produto que será criado na Apple, tipo assinatura.
2. Produtos da **Test Store** com os mesmos IDs e a mesma duração. A Test Store só aceita preço em dólar e o preço não pode ser editado depois. Se a ferramenta não tiver campo de teste grátis, tudo bem: avise que no Expo Go o teste grátis não aparece, só no build real.
3. Entitlement `premium`. Anexe **todos** os produtos (App Store e Test Store).
4. Offering `default` com os pacotes `$rc_monthly` e `$rc_annual`. Em cada pacote, anexe o produto da App Store e o da Test Store.
5. Marque a offering como **atual** (current).
6. Confira lendo de volta: a offering atual tem os pacotes, e cada pacote tem um produto por loja.

## 5. Código

Adapte ao projeto que você investigou. Reaproveite o que já existe. Não troque o estilo visual nem a estrutura de pastas do usuário.

**Instalação:** `npx expo install react-native-purchases`. Não instale `expo-dev-client` se o usuário testa pelo Expo Go: com ele, o QR code para de abrir no Expo Go.

**Módulo de compras** (por exemplo `lib/revenuecat.ts`, no padrão do projeto):

```ts
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
const apiKey = isExpoGo
  ? process.env.EXPO_PUBLIC_REVENUECAT_TEST_KEY
  : Platform.select({
      ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY,
      android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY,
    });
```

Funções necessárias: configurar o SDK uma vez na abertura do app; ler a offering atual (`offerings.current.monthly` e `.annual`); comprar um pacote e conferir se o entitlement `premium` ficou ativo; restaurar compras; `logIn` com o id do usuário do sistema de login do projeto; `logOut` ao sair da conta; consultar se o usuário é premium.

**Paywall:** se o usuário mandou um modelo (Fase 1), siga o layout dele. O conteúdo é sempre este:
- Os planos, cada um com nome, duração e preço.
- Preço vem de `product.priceString`. Nunca escreva valor no código.
- "Economize X%" é calculado a partir dos dois preços.
- Texto do teste grátis vem de `product.introPrice`. Se não houver, não mencione teste.
- **Só prometa teste grátis para quem tem direito.** A Apple dá o teste uma vez por grupo. Antes de mostrar "X dias grátis", confira com `Purchases.checkTrialOrIntroductoryPriceEligibility([ids])` e só mostre se o status for `INTRO_ELIGIBILITY_STATUS_ELIGIBLE`. Sem isso, quem já assinou vê "grátis" e é cobrado (motivo de rejeição).
- Botão: "Começar teste grátis" quando há teste, "Assinar" quando não há.
- Logo abaixo do botão: o preço depois do teste e "Cancele quando quiser".
- Embaixo de tudo, um rodapé pequeno com links de **Termos de Uso** e **Política de Privacidade**.
- Se os planos não carregarem, mostre uma mensagem clara e um botão de tentar de novo.
- Usuário cancelar a compra não é erro: não mostre alerta.

**Login:** depois de cadastro ou entrada, chame `logIn` para ligar a compra ao usuário. Se o paywall vem antes do cadastro, a compra anônima é transferida no `logIn`.

**Liberação do premium:** ligue o entitlement ao ponto onde o app decide quem é premium (você achou isso na Fase 1). Se a regra fica no servidor, avise que o servidor precisa saber quem é premium (webhook do RevenueCat) e proponha fazer isso como etapa separada.

**Restaurar compras:** a Apple exige um jeito de restaurar a assinatura (regra 3.1.1), mas não diz onde. Faça como os grandes apps:
- Fica em Configurações, numa seção **Assinatura**, como fazem os grandes apps (é onde Claude e ChatGPT colocam). A linha **Restaurar compras** chama `Purchases.restorePurchases()` e avisa o resultado ("Assinatura restaurada" ou "Nenhuma assinatura encontrada").
- Em app com login, entrar na conta de novo já devolve a assinatura (`logIn`). Isso vai na nota para o revisor (Fase 4).
- **Exceção:** se o app não tem login e só abre com assinatura, quem reinstala não chega em Configurações. Avise o usuário desse risco e pergunte onde ele quer o restaurar.

**Configurações:** confira o que já existe (Fase 1). Se já existe, só confira se funciona. Crie apenas o que faltar, no estilo das telas do app:
- **Seção Assinatura:** o plano atual (por exemplo, "Premium mensal", lido do RevenueCat), **Gerenciar assinatura** (abre a tela de assinaturas da Apple, onde a pessoa cancela ou troca de plano; o SDK do RevenueCat tem função para isso, confira na documentação, ou use `customerInfo.managementURL`) e **Restaurar compras** (acima). Para quem não assina, mostre o botão para ver os planos no lugar do plano atual.
- **Suporte / Fale conosco:** abre o e-mail de suporte ou a URL de suporte.
- **Termos de Uso** e **Política de Privacidade:** os mesmos links do paywall.
- **Excluir conta** (se o app cria conta): discreto, mas visível, no fim da tela. Pede confirmação, apaga a conta de verdade (não só pede por e-mail), chama `logOut` do RevenueCat e volta para o início. Avise na confirmação que a assinatura da Apple não é cancelada sozinha e mostre como cancelar (Ajustes do iPhone > nome > Assinaturas). No Supabase, o app não consegue apagar o próprio usuário com a chave pública: crie uma função no servidor (Edge Function com a chave secreta) que apaga o usuário que fez a chamada. Consulte a documentação do login do projeto para o caminho certo.

Se o usuário preferir, registre o que faltar como pendência obrigatória da Fase 4 em vez de fazer agora.

**Textos de permissão:** para cada permissão que o app pede (Fase 1), escreva o texto de explicação no `app.json`, na opção da biblioteca (por exemplo, `photosPermission` no plugin do `expo-image-picker`) ou em `ios.infoPlist`. Use a língua do app e o padrão "O <App> usa <recurso> para <motivo>". Exemplo: "O <App> usa suas fotos para colocar a foto do seu perfil." A Apple pede que o texto diga para que o app usa (regra 5.1.1(ii)). Texto novo só vale depois de um build novo.

**Variáveis:** grave no `.env` as chaves `EXPO_PUBLIC_REVENUECAT_IOS_KEY` (`appl_`) e `EXPO_PUBLIC_REVENUECAT_TEST_KEY` (`test_`). Confirme que `.env` está no `.gitignore`.

**`app.json`:** confira os textos de permissão (acima) e `ios.config.usesNonExemptEncryption: false` (se o app não usa criptografia própria). **iPad:** aplique a resposta da Fase 1 no `app.json`: `ios.supportsTablet: true` se ele quer iPad, `false` se é só iPhone. Faça isso antes do primeiro build e confirme lendo o arquivo. Confira se ícone e splash não são os de exemplo do Expo.

**Verificação:** `npx tsc --noEmit` sem erros.

**Teste rápido no Expo Go:** `npx expo start --clear` (com `--tunnel` se o usuário já usa). No paywall devem aparecer os planos em dólar (é a Test Store). Ao assinar abre "Test Store Purchase": tocar em **Test valid purchase** e conferir se o app liberou o premium. Explique que o dólar é só no teste; na Apple aparece na moeda da conta.

**Peça um print do paywall** desse teste e salve em `.assinaturas/paywall.png`. Ele serve de print de revisão provisório das assinaturas (passo 6): sem print, as assinaturas ficam em "Missing Metadata" e podem não carregar no TestFlight. Na Fase 3 ele é trocado pelo print real.

## 6. Apple: assinaturas (quando o app já existe no App Store Connect)

Crie `.assinaturas/assinaturas.json` com as decisões da Fase 1:

```json
{
  "bundleId": "com.exemplo.app",
  "baseTerritory": "BRA",
  "group": {
    "referenceName": "Exemplo Premium",
    "localizations": [{ "locale": "pt-BR", "name": "Exemplo Premium" }]
  },
  "subscriptions": [
    {
      "productId": "com.exemplo.app.premium.monthly",
      "referenceName": "Exemplo Premium Mensal",
      "period": "ONE_MONTH",
      "groupLevel": 2,
      "price": "19.90",
      "freeTrial": "THREE_DAYS",
      "localizations": [{ "locale": "pt-BR", "name": "Premium Mensal", "description": "Acesso completo, cobrado todo mês." }]
    },
    {
      "productId": "com.exemplo.app.premium.yearly",
      "referenceName": "Exemplo Premium Anual",
      "period": "ONE_YEAR",
      "groupLevel": 1,
      "price": "129.00",
      "freeTrial": "THREE_DAYS",
      "localizations": [{ "locale": "pt-BR", "name": "Premium Anual", "description": "Acesso completo, cobrado uma vez por ano." }]
    }
  ]
}
```

Limites da Apple: nome com até 30 caracteres, descrição com até 45. `freeTrial` pode ser `null`.

Rode `node <skill>/scripts/asc.mjs sub-setup .assinaturas/assinaturas.json`. Leva alguns minutos, porque define preço e teste grátis país por país. Depois confira com `sub-status <bundle>`: cada assinatura deve ter preço em cerca de 175 países e o idioma `pt-BR`.

Se o preço pedido não existir na tabela da Apple, o script mostra os mais próximos. Pergunte ao usuário qual prefere.

Envie o print provisório do paywall em cada assinatura: `node <skill>/scripts/asc.mjs review-screenshot <subscriptionId> .assinaturas/paywall.png` (regrave sem transparência antes, como na Fase 4, seção 4).

**Período de carência** (decidido na Fase 1). Vale para o app inteiro. Crie `.assinaturas/carencia.json`:

```json
{ "data": { "type": "subscriptionGracePeriods", "id": "<APP ID>", "attributes": { "optIn": true, "sandboxOptIn": true, "duration": "SIXTEEN_DAYS", "renewalType": "ALL_RENEWALS" } } }
```

`duration`: `THREE_DAYS`, `SIXTEEN_DAYS` ou `TWENTY_EIGHT_DAYS`. Rode `node <skill>/scripts/asc.mjs request PATCH /v1/subscriptionGracePeriods/<APP ID> --body .assinaturas/carencia.json` e confira com `GET` no mesmo caminho. Se o usuário não quiser carência, use `"optIn": false`.

No código não muda nada: durante a carência o RevenueCat mantém o entitlement `premium` ativo.

## 7. Ligar a Apple ao RevenueCat

O RevenueCat precisa da **Chave B** (`SubscriptionKey_XXXX.p8`), do **ID da chave** e do **Issuer ID** para validar compras.

1. As ferramentas do RevenueCat (`create-app`, `update-app`) não aceitam o arquivo `.p8`, só o ID. Na primeira vez, o envio é **pela tela**. Leia o esquema da ferramenta na hora: se um dia ela aceitar o arquivo, use.
2. RevenueCat > projeto > **Apps** > app iOS > **In-app purchase key configuration**. Selecionar o `.p8`, preencher Key ID e Issuer ID, **Save changes**. Faça pelo navegador (o envio do arquivo é do usuário) ou guie o usuário.
3. Confira: selo **Valid credentials** (ou `validate-app-credentials`).

Sem isso o paywall até mostra os preços, mas a compra não libera o premium.
