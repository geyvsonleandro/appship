# Fase 3: Build e TestFlight

Comandos que fazem perguntas (login, certificados) precisam ser rodados **pelo usuário no terminal dele**. Você entrega o comando pronto e diz o que responder em cada pergunta. Os outros você mesmo roda.

## 1. Projeto EAS

1. Rode `npx eas-cli@latest whoami`. Se já estiver logado, pule o login. Senão, o usuário roda `npx eas-cli@latest login` (conta Expo, não a da Apple).
2. Se não houver `extra.eas.projectId`: `npx eas-cli@latest init`. Avise que ele pode reescrever o `app.json` com a configuração completa (permissões, opções do router). É normal, não é erro.
3. Garanta o perfil de produção no `eas.json`. Coloque em `node` a versão exata que `node --version` mostra na máquina do usuário:

```json
{
  "cli": { "appVersionSource": "remote" },
  "build": {
    "production": {
      "environment": "production",
      "node": "24.16.0",
      "autoIncrement": true
    }
  }
}
```

Se já existir `eas.json`, só acrescente o que falta. Não apague outros perfis.

## 2. Variáveis no EAS

O `.env` não sobe no build. Cadastre no ambiente `production` cada variável `EXPO_PUBLIC_*` que o app usa:

```
npx eas-cli@latest env:set --environment production --name NOME --value VALOR --visibility plaintext
```

Inclua `EXPO_PUBLIC_REVENUECAT_IOS_KEY`. **Nunca cadastre a `test_`**: build real com chave de teste fecha sozinho ao abrir.

Confira com `npx eas-cli@latest env:list --environment production`.

## 3. Build

**Antes de qualquer build, confira o ícone.** Abra a imagem de `expo.icon`. Se for o ícone de exemplo do Expo, **não rode o build**: peça o ícone do app (PNG 1024×1024, sem transparência), salve em `assets/` e aponte no `app.json`. Build com ícone errado custa um build novo.


Usuário roda: `npx eas-cli@latest build -p ios --profile production`

Diga o que responder:

| Pergunta | Resposta |
|---|---|
| Log in to your Apple account? | **Yes**. Apple ID, senha e código de 2 fatores |
| Escolher time | O time dele |
| Gerar Distribution Certificate e Provisioning Profile? | **Yes** |
| Set up Push Notifications? | **No**, a não ser que o app use notificação push remota |

O build leva de 10 a 20 minutos. Acompanhe com `npx eas-cli@latest build:list --platform ios --limit 1 --json --non-interactive`.

Se falhar, pegue o log (`eas build:view <id> --json`) e leia a fase que quebrou. Veja `referencia/armadilhas.md`.

## 4. Envio

Usuário roda: `npx eas-cli@latest submit -p ios --latest`

| Pergunta | Resposta |
|---|---|
| Generate a new App Store Connect API Key? | **Yes** |
| Select role | **APP_MANAGER** |

Na primeira vez esse comando também **cria o app no App Store Connect**. Sucesso: "Submitted your app to Apple App Store Connect!".

O app nasce com o idioma principal em inglês (en-US). Anote em `.assinaturas/estado.json` o idioma da loja que o usuário quer. A troca é feita na Fase 4, depois das imagens, porque a Apple só deixa trocar quando o novo idioma já tem imagens.

**Agora crie as assinaturas na Apple**, se ainda não criou: volte aos passos 6 e 7 de `fases/2-configurar.md`. O mesmo build serve, porque o app busca os planos na hora em que abre.

A Apple leva de 5 a 30 minutos para processar o build e manda e-mail. Use esse tempo para as assinaturas.

## 5. Teste no iPhone

1. Usuário instala o **TestFlight** pela App Store.
2. Abre o e-mail de convite no iPhone > **Ver no TestFlight** > **Instalar**. Testador **interno** não passa por revisão.
3. Abre o app e vai até o paywall.

Confira com ele:
- Preços em **reais**, iguais aos definidos.
- Texto do teste grátis correto.
- Ao tocar em assinar, abre a folha da Apple com o plano, o preço e "Apenas para fins de teste. Você não será cobrado".

Peça **um print do paywall** e que ele salve em `.assinaturas/paywall.png`, no lugar do provisório. Vai ser usado na revisão.

Antes dele confirmar a compra, avise:
- No TestFlight não há cobrança.
- O teste grátis daquele Apple ID é gasto uma vez e não volta.
- A assinatura de teste renova sozinha uma vez por dia, até 6 vezes, e depois para.

Se ele comprar: confira que o app liberou o premium e que o cliente apareceu no RevenueCat com o entitlement `premium` ativo.

## Se os planos não carregarem no TestFlight

Confira nesta ordem:
1. Acordo de apps pagos **Ativo** (Negócios).
2. `sub-status`: assinaturas com preço e idioma, fora do estado "Missing Metadata".
3. IDs dos produtos idênticos na Apple e no RevenueCat.
4. Offering marcada como atual, com produto da App Store em cada pacote.
5. Bundle do app no RevenueCat igual ao do projeto.
6. Variável `EXPO_PUBLIC_REVENUECAT_IOS_KEY` no EAS com a `appl_` certa.
7. Produto recém-criado pode levar até 1 hora para aparecer. Espere e tente de novo.
