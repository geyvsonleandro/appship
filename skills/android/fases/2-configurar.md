# Fase 2: Configurar

A ordem importa:

1. O app precisa **existir no Play Console** antes de tudo. No Google, quem cria o app é o usuário, pela tela (não existe API para isso).
2. As **assinaturas** só podem ser criadas depois que o Google recebe um build do app com a biblioteca de cobrança do Google Play (a biblioteca do RevenueCat já inclui). O Google diz que vale qualquer faixa, inclusive o teste interno. Por isso o código vem primeiro, depois o build e o envio para o teste interno (Fase 3), e só então as assinaturas (passo 7 desta fase, rodado na Fase 3).

Se o app **já existe** no Play Console e já tem build enviado, faça o passo 7 aqui mesmo.

## 1. Criar o app no Play Console (o usuário faz, uma vez por app)

Pela tela. Se houver navegador (Claude in Chrome) e o usuário estiver logado, preencha você e deixe as declarações para ele. Senão, guie um clique por vez. Leia na hora a ajuda "Criar e configurar seu app" (support.google.com/googleplay/android-developer) se a tela estiver diferente.

1. Play Console > página inicial > **Criar app**.
2. **Nome do app** (até 30 caracteres; dá para mudar depois).
3. **Idioma padrão:** o da loja principal (ex.: Português (Brasil) – pt-BR). Anote em `.assinaturas/estado-android.json`: os textos das assinaturas precisam ter esse idioma.
4. **App ou jogo:** App.
5. **Gratuito ou pago:** **Gratuito** (o dinheiro vem da assinatura). Explique em uma frase: "Gratuito é o preço de baixar. A assinatura tem preço próprio lá dentro. E um app gratuito não pode virar pago depois."
6. **Declarações** (políticas do programa para desenvolvedores, leis de exportação dos EUA): quem marca é o usuário. Explique em uma frase o que cada uma diz.
7. **Criar app**.

Anote o pacote que vai ser usado (`expo.android.package`). O pacote só fica preso ao app no primeiro envio de build.

## 2. Chave do Google: conta de serviço (o usuário faz, uma vez por conta)

É o equivalente às chaves da Apple. **Uma chave só serve para três coisas:** você configurar o Google pelo script, o EAS enviar o build e o RevenueCat validar as compras. Crie a pasta `.assinaturas/` e adicione `.assinaturas/` ao `.gitignore` antes de tudo.

Leia na hora as duas fontes, porque as telas mudam:
- https://developers.google.com/android-publisher/getting_started
- https://www.revenuecat.com/docs/service-credentials/creating-play-service-credentials

Guie o usuário, um passo por vez (ou faça pelo navegador, se tiver a ferramenta e ele estiver logado na mesma conta Google do Play Console):

**No Google Cloud** (https://console.cloud.google.com):
1. Criar um projeto (ex.: `<app>-play`). Pode ser um só para todos os apps do usuário.
2. Ativar as APIs (menu **APIs e serviços** > **Biblioteca**): **Google Play Android Developer API**, **Google Play Developer Reporting API** e **Cloud Pub/Sub API**.
3. **IAM e administrador** > **Contas de serviço** > **Criar conta de serviço**. Nome: `appship-play`.
4. Papéis da conta de serviço (o RevenueCat usa para as notificações): **Editor do Pub/Sub** e **Leitor do Monitoring**.
5. Abrir a conta criada > aba **Chaves** > **Adicionar chave** > **Criar nova chave** > **JSON**. O arquivo baixa sozinho. Ele dá acesso à conta: não mande para ninguém nem coloque no Git.
6. Anotar o **e-mail da conta de serviço** (termina em `.iam.gserviceaccount.com`, também está dentro do arquivo, no campo `client_email`).

**No Play Console:**
7. **Usuários e permissões** > **Convidar novos usuários** > colar o e-mail da conta de serviço.
8. Permissões da conta (os nomes da tela podem variar um pouco; confira na fonte do RevenueCat):
   - Ver informações do app e fazer o download de relatórios em massa (somente leitura)
   - Ver dados financeiros, pedidos e respostas da pesquisa de cancelamento
   - Gerenciar pedidos e assinaturas
   - Gerenciar presença na loja
   - Lançar apps para faixas de teste (o EAS usa para enviar ao teste interno)
9. **Convidar usuário** e confirmar.

**No computador:** mova o arquivo JSON para `.assinaturas/google-play-key.json` e crie `.assinaturas/google.json`:

```json
{ "keyPath": ".assinaturas/google-play-key.json" }
```

Confirme com `node <skill>/scripts/gplay.mjs check <pacote>`. Tem que mostrar "Login no Google: ok" e o idioma padrão do app. Se der erro de permissão logo depois de convidar, pode ser só demora do Google para liberar: veja `referencia/armadilhas.md`.

## 3. RevenueCat: projeto e app

Com as ferramentas do RevenueCat (confira os parâmetros no esquema de cada uma):

1. Projeto: use o existente se o usuário já tiver um para este app (a skill `ios` pode ter criado). Senão, crie com o nome do app.
2. App da **Play Store** dentro do projeto, com o pacote Android.
3. Pegue a **chave pública** do app da Play Store (`list-app-public-api-keys`). Confira o prefixo que a ferramenta mostrar (em geral `goog_`).
4. Pegue a chave pública da **Test Store** (em geral começa com `test_`). Todo projeto do RevenueCat já tem uma Test Store.

**Enviar a chave do Google ao RevenueCat** (pela tela; as ferramentas não recebem arquivos):
5. RevenueCat > projeto > **Apps** > app da Play Store > campo **Service Account Credentials JSON**: arrastar o `google-play-key.json` e salvar. Faça pelo navegador (o envio do arquivo é do usuário) ou guie.
6. Avise: o próprio RevenueCat diz que **pode levar até 36 horas** para a chave nova funcionar. Até lá aparece "Invalid Play Store credentials". Isso não impede seguir: o resto da configuração continua. Confira depois com `validate-app-credentials` ou no selo da tela.

**Notificações do Google para o RevenueCat** (deixam o RevenueCat saber na hora de renovações e cancelamentos):
7. RevenueCat > app da Play Store > **Google developer notifications** > **Connect to Google** > copiar o **Topic ID** gerado.
8. Play Console > app > **Monetizar com o Google Play** > **Configuração de monetização** > **Notificações do desenvolvedor em tempo real**: colar o tópico, escolher "Assinaturas, compras anuladas e todos os produtos de compra única" e salvar.
9. Clicar em **Enviar notificação de teste** e conferir no RevenueCat o "Last received" com horário recente. Se falhar, siga a fonte do RevenueCat (dar o papel "Publicador do Pub/Sub" a `google-play-developer-notifications@system.gserviceaccount.com` no tópico).

## 4. RevenueCat: catálogo

1. Produtos do app da Play Store, um por plano: `premium:mensal` e `premium:anual` (ID da assinatura + `:` + ID do plano base, decididos na Fase 1). Confira o formato no esquema da ferramenta `create-product` e na documentação do RevenueCat na hora.
2. Produtos da **Test Store**: se a skill `ios` já criou, reaproveite. Senão, crie com a mesma duração (só aceita dólar e o preço não muda depois).
3. Entitlement `premium`: anexe **todos** os produtos (Play Store e Test Store, e App Store se houver).
4. Offering `default` com os pacotes `$rc_monthly` e `$rc_annual`. Em cada pacote, um produto por loja.
5. Offering marcada como **atual** (current).
6. Confira lendo de volta: a offering atual tem os pacotes, e cada pacote tem um produto da Play Store.

Os produtos da Play Store vão aparecer como "não encontrados" até as assinaturas existirem no Google (passo 7) e a chave do Google ser validada. É normal.

## 5. Código

Adapte ao projeto que você investigou. Reaproveite o que já existe (inclusive o que a skill `ios` fez). Não troque o estilo visual nem a estrutura de pastas do usuário.

**Instalação:** `npx expo install react-native-purchases`, se ainda não houver. Não instale `expo-dev-client` se o usuário testa pelo Expo Go.

**Módulo de compras** (por exemplo `lib/revenuecat.ts`): a chave muda por sistema e no Expo Go.

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

Funções necessárias: configurar o SDK uma vez na abertura do app; ler a offering atual (`offerings.current.monthly` e `.annual`); comprar um pacote e conferir se o entitlement `premium` ficou ativo; restaurar compras; `logIn` com o id do usuário do sistema de login; `logOut` ao sair da conta; consultar se o usuário é premium.

**Paywall:** se o usuário mandou um modelo (Fase 1), siga o layout dele. O conteúdo é sempre este:
- Os planos, cada um com nome, duração e preço. Preço vem de `product.priceString`. Nunca escreva valor no código.
- "Economize X%" calculado a partir dos dois preços.
- **Teste grátis no Android:** o Google só entrega a oferta de teste a quem tem direito, e o RevenueCat escolhe sozinho a oferta padrão na compra (a de teste grátis mais longo). Para saber se mostra "X dias grátis", leia a opção padrão do produto (`product.defaultOption`) e veja se ela tem uma fase grátis. Os nomes dos campos mudam entre versões: confira nos tipos do pacote instalado (procure `SubscriptionOption` dentro de `node_modules/@revenuecat/`) antes de escrever o código. Se não houver fase grátis, não mencione teste. A checagem de direito ao teste da Apple (`checkTrialOrIntroductoryPriceEligibility`) é só do iOS: no Android, não dependa dela.
- Botão: "Começar teste grátis" quando há teste, "Assinar" quando não há.
- Logo abaixo do botão: o preço depois do teste e "Cancele quando quiser".
- Embaixo de tudo, um rodapé pequeno com links de **Termos de Uso** e **Política de Privacidade**.
- Se os planos não carregarem, mostre uma mensagem clara e um botão de tentar de novo.
- Usuário cancelar a compra não é erro: não mostre alerta.

**Login:** depois de cadastro ou entrada, chame `logIn` para ligar a compra ao usuário. Se o paywall vem antes do cadastro, a compra anônima é transferida no `logIn`. **Esconda no Android** os botões de login que só existem no iOS (Entrar com a Apple), se a Fase 1 apontou.

**Liberação do premium:** ligue o entitlement ao ponto onde o app decide quem é premium (achado na Fase 1). Se a regra fica no servidor, avise que o servidor precisa saber quem é premium (webhook do RevenueCat) e proponha fazer isso como etapa separada.

**Configurações:** confira o que já existe. Crie apenas o que faltar, no estilo das telas do app:
- **Seção Assinatura:** o plano atual (lido do RevenueCat), **Gerenciar assinatura** (no Android abre a tela de assinaturas da Google Play; use `customerInfo.managementURL` ou a função do SDK, confira na documentação) e **Restaurar compras** (`Purchases.restorePurchases()`, avisando o resultado). Para quem não assina, o botão para ver os planos no lugar do plano atual.
- **Suporte / Fale conosco:** abre o e-mail ou a URL de suporte.
- **Termos de Uso** e **Política de Privacidade:** os mesmos links do paywall.
- **Excluir conta** (se o app cria conta): discreto, mas visível, no fim da tela. Pede confirmação, apaga a conta de verdade, chama `logOut` do RevenueCat e volta para o início. Na confirmação, avise que a assinatura não é cancelada sozinha e mostre como cancelar no Android (Play Store > foto do perfil > Pagamentos e assinaturas > Assinaturas). No Supabase, o app não apaga o próprio usuário com a chave pública: crie uma função no servidor (Edge Function com a chave secreta). **O Google também exige um link na web** para pedir a exclusão (Fase 4, seção 2).

Se o usuário preferir, registre o que faltar como pendência obrigatória da Fase 4 em vez de fazer agora.

**Permissões:** aplique o que a Fase 1 achou. Desligue as que o app não usa (opção da biblioteca ou `android.blockedPermissions` no `app.json`). Nunca bloqueie `com.android.vending.BILLING`.

**Variáveis:** grave no `.env` a `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` (chave pública da Play Store) e, se ainda não existir, a `EXPO_PUBLIC_REVENUECAT_TEST_KEY`. Confirme que `.env` está no `.gitignore`.

**`app.json`:** `android.package` definido (o da Fase 1), ícone próprio (e o `adaptiveIcon`, se o projeto usa), permissões revisadas.

**Verificação:** `npx tsc --noEmit` sem erros.

**Teste rápido no Expo Go (celular Android):** `npx expo start --clear` (com `--tunnel` se o usuário já usa). No paywall devem aparecer os planos em dólar (Test Store). Ao assinar abre a compra de teste: tocar em **Test valid purchase** e conferir se o app liberou o premium. Se o Expo Go não mostrar os planos ou disser que está em modo de prévia, não perca tempo: o teste de verdade é no teste interno (Fase 3).

**Peça um print do paywall** desse teste e salve em `.assinaturas/paywall-android.png`. Ele ajuda nas imagens da loja (Fase 4).

## 6. Arquivo das assinaturas

Crie `.assinaturas/assinaturas-android.json` com as decisões da Fase 1. Os textos precisam ter o **idioma padrão do app** (passo 1). O formato completo está em `referencia/google-api.md`:

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

Antes de criar, mostre a conversão: `node <skill>/scripts/gplay.mjs prices <pacote> 19.90 BRL`. O Google ajusta os preços dos outros países ao padrão de cada um. O preço do Brasil fica exatamente o que o usuário escolheu.

## 7. Google: assinaturas (depois do primeiro build enviado, Fase 3)

Precisa: app criado, build enviado para o teste interno (Fase 3, passo 4), perfil de pagamentos ativo.

Rode `node <skill>/scripts/gplay.mjs sub-setup .assinaturas/assinaturas-android.json`. Ele cria a assinatura, os planos base com preço em todos os países, ativa os planos, cria a oferta de teste grátis (só para quem nunca assinou) e ativa a oferta. Pode rodar de novo: o que já existe não é recriado.

Confira com `sub-status <pacote>`: cada plano `ACTIVE`, preço do Brasil certo, oferta de teste `ACTIVE`, e o `idRevenueCat` igual aos produtos do passo 4.

Se o Google recusar o formato (por exemplo, a versão de regiões), leia a mensagem, confira em https://developers.google.com/android-publisher/api-ref/rest/v3/monetization.subscriptions e ajuste o JSON ou o script.

Mande o link para o usuário ver: Play Console > app > **Monetizar com o Google Play** > **Produtos** > **Assinaturas**.

No código não muda nada: o app busca os planos na hora em que abre.
