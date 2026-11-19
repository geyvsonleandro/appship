# Fase 3: Build e teste interno

Comandos que fazem perguntas (login, chave de assinatura) precisam ser rodados **pelo usuário no terminal dele**. Você entrega o comando pronto e diz o que responder em cada pergunta. Os outros você mesmo roda.

## 1. Projeto EAS

1. Rode `npx eas-cli@latest whoami`. Se já estiver logado, pule o login. Senão, o usuário roda `npx eas-cli@latest login` (conta Expo).
2. Se não houver `extra.eas.projectId`: `npx eas-cli@latest init`. Avise que ele pode reescrever o `app.json` com a configuração completa. É normal.
3. Garanta no `eas.json` o perfil de produção e o envio para o Google. Coloque em `node` a versão exata que `node --version` mostra na máquina do usuário:

```json
{
  "cli": { "appVersionSource": "remote" },
  "build": {
    "production": {
      "environment": "production",
      "node": "24.16.0",
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": ".assinaturas/google-play-key.json",
        "track": "internal",
        "releaseStatus": "draft"
      }
    }
  }
}
```

Se já existir `eas.json` (por exemplo, da skill `ios`), só acrescente o que falta. Não apague outros perfis nem a parte do iOS. Confira os campos em https://docs.expo.dev/eas/json/ na hora.

`releaseStatus: "draft"` é de propósito: enquanto o app ainda não terminou a configuração no Play Console, o Google só aceita versões em rascunho. Depois você lança a versão de teste pela tela (passo 6).

## 2. Variáveis no EAS

O `.env` não sobe no build. Cadastre no ambiente `production` cada variável `EXPO_PUBLIC_*` que o app usa e que ainda não está lá:

```
npx eas-cli@latest env:create --environment production --name NOME --value VALOR --visibility plaintext
```

Inclua `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY`. **Nunca cadastre a chave da Test Store**: build real com chave de teste fecha sozinho ao abrir.

Confira com `npx eas-cli@latest env:list production --format short`.

## 3. Build

**Antes de qualquer build, confira o ícone.** Abra a imagem de `expo.icon` (e `android.adaptiveIcon`, se houver). Se for o de exemplo do Expo, **não rode o build**. Build com ícone errado custa um build novo.

Usuário roda: `npx eas-cli@latest build -p android --profile production`

Diga o que responder:

| Pergunta | Resposta |
|---|---|
| Generate a new Android Keystore? | **Yes**. O EAS cria e guarda a chave de assinatura do app. Avise: essa chave assina todas as versões; ela fica guardada na Expo, e dá para baixar uma cópia com `eas credentials` |
| Outras perguntas | Se aparecer algo fora desta lista, peça um print antes de responder |

O build leva de 10 a 20 minutos e gera um arquivo `.aab` (o formato que o Google aceita). Acompanhe com `npx eas-cli@latest build:list --platform android --limit 1 --json --non-interactive`.

Se falhar, pegue o log (`npx eas-cli@latest build:view <id> --json`) e leia a fase que quebrou. Veja `referencia/armadilhas.md`.

## 4. Envio para o teste interno

Usuário roda (ou você, já que não faz perguntas): `npx eas-cli@latest submit -p android --latest --profile production`

Ele usa a chave do Google do `eas.json` e manda o build para a faixa de **teste interno**, como rascunho. Leia https://docs.expo.dev/submit/android/ se aparecer pergunta nova.

- Se der erro de que o app não foi encontrado: confira se o app foi criado no Play Console (Fase 2, passo 1) com a mesma conta e se o pacote é igual ao do `app.json`.
- Se der erro de permissão: a conta de serviço precisa de "Lançar apps para faixas de teste" (Fase 2, passo 2), e pode demorar para valer.
- **Plano B, envio pela tela:** baixe o `.aab` na página do build (link que o EAS mostra) e, no Play Console > app > **Testar e lançar** > **Teste interno** > **Criar nova versão**, envie o arquivo.

Depois do envio, o pacote fica preso a este app para sempre.

**Agora crie as assinaturas no Google:** volte ao passo 7 de `fases/2-configurar.md`. O build não precisa ser refeito: o app busca os planos na hora em que abre.

## 5. Testadores

**Lista do teste interno** (quem pode baixar a versão de teste):
1. Play Console > app > **Testar e lançar** > **Teste interno** > aba **Testadores**.
2. Criar uma lista de e-mails com o e-mail da conta Google que está no celular do usuário. Salvar.
3. Copiar o **link de participação** que aparece nessa aba.

**Teste de licença** (compra sem cobrança):
4. Play Console > **Gerenciar conta** > Configurações do app Google Play > **Teste de licença**. Acrescentar o mesmo e-mail e salvar. A conta dona do Play Console já é testadora de licença.

Leia https://support.google.com/googleplay/android-developer/answer/6062777 se a tela estiver diferente.

## 6. Lançar a versão de teste

1. Play Console > app > **Testar e lançar** > **Teste interno**: a versão enviada aparece como rascunho.
2. **Editar versão** > dar um nome (ex.: `1.0.0 (1)`) > **Avançar** > **Salvar e publicar** (ou "Iniciar lançamento para teste interno"; o nome do botão muda).
3. Se o Play Console pedir para terminar alguma configuração antes (o painel do app mostra uma lista "Configure seu app"), faça agora os itens que ele pedir. São os mesmos da Fase 4, então nada se perde. Comece pelos que têm resposta pronta (Fase 4, seção 6).

## 7. Teste no celular Android

1. No celular, use **só uma conta Google** (a da lista de testadores). Com várias contas, a Play Store às vezes usa a errada e a compra não aparece como teste.
2. Abra o **link de participação** no celular > **Tornar-se testador** > **Fazer download no Google Play** > instalar. Instale sempre pela Play Store: app instalado por fora não carrega os planos.
3. Abra o app e vá até o paywall.

Confira com ele:
- Preços em **reais**, iguais aos definidos.
- Texto do teste grátis correto.
- Ao tocar em assinar, abre a folha do Google Play. A forma de pagamento deve ser um **cartão de teste** ("Instrumento de teste, sempre aprova"). Se aparecer só cartão de verdade, a conta não está no teste de licença: pare e confira o passo 5.

Antes dele confirmar a compra, avise:
- Com o cartão de teste não há cobrança.
- Na compra de teste, o tempo anda mais rápido: segundo o Google (developer.android.com/google/play/billing/test), o teste grátis dura cerca de 3 minutos, o plano mensal renova a cada 5 minutos e o anual a cada 30, até 6 renovações. Confira na página, porque os tempos podem mudar.

Peça **um print do paywall** e salve em `.assinaturas/paywall-android.png`.

Se ele comprar: confira que o app liberou o premium e que o cliente apareceu no RevenueCat (com "View Sandbox Data" ligado) com o entitlement `premium` ativo. **Se a compra passou no Google mas o app não liberou**, olhe a chave do Google no RevenueCat: se ainda não foi validada (até 36 horas), o RevenueCat não consegue confirmar a compra. Espere a validação e toque em Restaurar compras.

## Se os planos não carregarem

Confira nesta ordem:
1. Perfil de pagamentos ativo no Play Console.
2. `sub-status`: planos e oferta `ACTIVE`.
3. App instalado pela Play Store, pelo link de participação, com a conta da lista de testadores.
4. IDs no RevenueCat iguais ao `idRevenueCat` do `sub-status` (`premium:mensal`).
5. Offering atual com produto da Play Store em cada pacote.
6. Pacote do app no RevenueCat igual ao do projeto.
7. `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` no EAS com a chave certa.
8. Chave do Google validada no RevenueCat.
9. Assinatura recém-criada pode levar algumas horas para aparecer. Espere e tente de novo.
