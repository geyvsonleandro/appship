# Fase 1: Investigar o projeto

Objetivo: entender o app desta pessoa antes de mexer em qualquer coisa. Não altere o código do app nesta fase. Só crie `.assinaturas/estado-android.json`.

## 0. Aviso inicial

Antes de qualquer leitura, dê ao usuário, de uma vez:

1. A lista "O que só o usuário faz" do `SKILL.md`, para ele não ser surpreendido.
2. **Plugin do RevenueCat:** confira se as ferramentas do RevenueCat (nomes como `list-projects`) já existem. Se não, peça para instalar **agora**, porque depois de instalar é preciso abrir uma conversa nova. Como instalar:
   - **VS Code:** no chat, digitar `/plugins` > **Manage plugins** > aba **Plugins** > procurar `revenuecat` > **Install** no que diz "Set up RevenueCat, integrate it, and access data". Instalar só um.
   - **Claude Code no terminal:** `/plugin` > procurar RevenueCat > instalar.
   - Depois, abrir uma conversa nova e chamar `/appship:android` de novo. O andamento fica salvo.

## 1. Leia o projeto

Descubra e anote em `.assinaturas/estado-android.json`:

| O que | Onde olhar |
|---|---|
| É Expo? Qual versão do SDK? | `package.json`, `app.json` ou `app.config.*`. Compare com o SDK atual em https://docs.expo.dev/versions/latest/ (consulte na hora). Se estiver atrás, avise antes de seguir e proponha atualizar como etapa separada (`npx expo install expo@latest --fix`) |
| Nível de API exigido pelo Google | Leia na hora https://developer.android.com/google/play/requirements/target-sdk (em nov/2026: apps novos precisam mirar o Android 16, API 36). Confira na documentação da versão do Expo do projeto qual API ela mira. Se o SDK do Expo não atender, a atualização do Expo vira bloqueio |
| Nome do app e pacote Android | `expo.name`, `expo.android.package`. Se não houver `android.package`, proponha um (em geral igual ao bundle do iOS). **O pacote é para sempre:** depois do primeiro envio ao Google, não muda mais |
| Ícone | Abra a imagem de `expo.icon` e de `expo.android.adaptiveIcon` (se existir) e olhe. O ícone do Expo é um "A" azul sobre linhas de grade. Compare também o MD5 com `cb975bba2216ce10a60e6c0ffe9941a2` (ícone padrão de modelos recentes). Para a loja, o Google pede um ícone de 512×512 (Fase 4) |
| Roteamento | `expo-router` (pasta `app/`) ou React Navigation |
| Login | Supabase, Firebase, Clerk, próprio, ou nenhum. Onde fica o código de cadastro, entrada e saída. Quais botões a tela de login mostra. Confira cada um na seção 2 |
| Como o app decide quem é premium hoje | Procure `premium`, `isPro`, `subscription`, `plano`, limites de uso |
| Já existe paywall ou tela de planos? | Procure `paywall`, `planos`, `assinar`, `subscribe` |
| Já tem RevenueCat? | `react-native-purchases` no `package.json`, `Purchases.configure` no código. Se a skill `ios` já fez o código, ele serve: confira só o que é do Android (Fase 2) |
| Fluxo de entrada | A ordem das telas: onboarding, paywall, cadastro, home. Se o paywall vem **antes** do cadastro, a compra é feita sem conta e é ligada à conta no `logIn` (Fase 2). Explique isso no plano |
| EAS | `eas.json`, `extra.eas.projectId`, `owner` |
| Variáveis de ambiente | `.env`, uso de `EXPO_PUBLIC_*`, se `.env` e `.assinaturas/` estão no `.gitignore`. O que faltar entra no plano |
| Exigências do Google | Em Configurações (ou tela de perfil): existe **Excluir conta**? **Suporte / Fale conosco**? Links de **Termos** e **Privacidade**? **Gerenciar assinatura** e **Restaurar compras**? |
| Permissões Android | Quais recursos o app pede e quais bibliotecas acrescentam permissões sozinhas. Exemplos: `expo-audio` e `expo-av` declaram microfone (`RECORD_AUDIO`) por padrão mesmo quando o app só toca som; câmera, localização, contatos. Permissão declarada e não usada atrapalha a revisão e a ficha de segurança dos dados. Desligue na opção da biblioteca (ex.: `["expo-audio", { "recordAudioAndroid": false }]`) ou em `android.blockedPermissions`. **Nunca bloqueie** `com.android.vending.BILLING`: é ela que permite vender assinatura |
| O que o app coleta | E-mail, fotos, localização, saúde, contatos. Para onde envia (IA, analytics, anúncios). Isso vai para a ficha de **segurança dos dados** (Fase 4) |
| Git | Existe e funciona (`git status` sem erro)? O EAS exige Git. Se não houver Git válido, proponha `git init` com o `.gitignore` conferido antes (assim `.env` e `.assinaturas/` não sobem) e um backup em zip da pasta, se o `.git` estiver quebrado |
| Máquina | `node --version`, Windows ou Mac |
| iPhone | Existe `expo.ios.bundleIdentifier` e `.assinaturas/estado.json`? Só anote. A skill `ios` cuida do iPhone |

Se não for um projeto Expo, pare e avise que esta skill só cobre Expo.

## 2. Confira se o login funciona no Android

Botão de login que não funciona reprova o app. Para **cada botão** que a tela de login mostra, confira se está configurado de verdade **para Android**. Leia a documentação oficial do serviço na hora; abaixo, o que conferir nos casos mais comuns:

| Botão | O que conferir |
|---|---|
| E-mail e senha (Supabase) | `GET https://<projeto>.supabase.co/auth/v1/settings` com o header `apikey: <chave pública>`. Veja `external.email` e `mailer_autoconfirm` (se exige confirmar o e-mail) |
| Google (Supabase) | No mesmo `settings`, `external.google` precisa ser `true`. Se o app usa o login nativo do Google (biblioteca `@react-native-google-signin/google-signin` ou parecida), o Google exige a **impressão digital SHA-1** da chave de assinatura do app cadastrada no Google Cloud. Com a Assinatura de apps do Google Play, a SHA-1 certa é a que aparece no Play Console (Testar e lançar > Configuração > Integridade do app), não a do computador. Se o login do Google abre pelo navegador (OAuth com redirecionamento), confira o esquema de URL do app no `app.json` e na lista de redirecionamentos do Supabase |
| Apple | **"Entrar com a Apple" não funciona no Android do mesmo jeito que no iPhone.** `expo-apple-authentication` só existe no iOS. Confira se o código esconde esse botão no Android (`Platform.OS === 'ios'`). Se não esconde, isso é bloqueio: botão que não funciona reprova. Proponha esconder no Android |
| Firebase, Clerk, próprio | Consulte a documentação do serviço e confira os mesmos pontos: provedor ligado no painel, chaves no projeto, configuração do Android (SHA-1, `google-services.json` se houver) |

Se algum botão não estiver configurado, explique em uma frase o que falta e ensine o passo a passo (com os links da documentação oficial). Se o usuário não quiser configurar agora, ofereça esconder o botão até lá. Anote no plano como pendência obrigatória antes do envio.

## 3. Confira os pré-requisitos com o usuário

Pergunte, uma coisa por vez, só o que você não conseguiu descobrir sozinho. Se houver navegador (Claude in Chrome) e o usuário estiver logado no Play Console, confira você mesmo e só mostre o resultado.

1. **Conta no Google Play Console** existe? É **pessoal** ou **de organização** (empresa)? Quando foi criada? Isso importa: leia na hora https://support.google.com/googleplay/android-developer/answer/14151465. Em nov/2026, conta **pessoal criada depois de 13/11/2023** precisa de um **teste fechado com pelo menos 12 testadores, por 14 dias seguidos**, antes de poder pedir a publicação. Explique isso agora, porque muda o prazo: o app não vai para a loja no mesmo dia. Conta de organização não tem essa exigência.
2. **Verificação do aparelho Android** feita? Na página inicial do Play Console aparece a tarefa "Verifique se você tem acesso a um dispositivo móvel Android" enquanto não estiver feita. Precisa de um celular Android de verdade (Android 10 ou mais novo), com o app Play Console instalado. Leia https://support.google.com/googleplay/android-developer/answer/14316361. Sem isso, o app não pode ser publicado.
3. **Perfil de pagamentos** criado? Sem ele não dá para vender assinatura (é o equivalente ao contrato de apps pagos da Apple). Fica em Play Console > Gerenciar conta > Perfil para pagamentos. Leia https://support.google.com/googleplay/android-developer/answer/3092739. Avise: o perfil de pagamentos é ligado à conta **uma vez só** e não dá para trocar depois. Se aparecer pendência fiscal, oriente a falar com um contador.
4. Já tem conta no RevenueCat?
5. Já tem conta na Expo?
6. **Navegador:** se você não tem ferramenta de navegador (Claude in Chrome), sugira instalar a extensão. Explique em uma frase: "No Google, criar o app e preencher os formulários de conteúdo só dá pela tela. Com a extensão eu preencho por você; sem ela, eu te passo o clique a clique." É opcional. Como instalar: (1) no Chrome, abrir https://claude.ai/chrome e clicar em **Usar no Chrome**; (2) fixar o ícone e entrar com a mesma conta do Claude; (3) no Claude Code, digitar `/chrome`: o painel deve mostrar "Extension: Installed". No VS Code, ligar **Enabled by default**; (4) se as ferramentas não aparecerem, mandar a próxima mensagem com `@browser` ou fechar e abrir o Claude Code de novo. Confira procurando as ferramentas `mcp__claude-in-chrome__*` antes de seguir.

## 4. Colete as decisões

Se a skill `ios` já rodou (existe `.assinaturas/estado.json`), mostre as decisões de lá e pergunte se valem também para o Android. Senão, pergunte:

1. Quais planos: mensal, anual, ou os dois?
2. Preço de cada um em reais. (O Google converte para os outros países sozinho; você mostra a conversão antes de criar.)
3. Teste grátis? De quantos dias? (O Google aceita a duração em dias, semanas ou meses; o teste vale só para quem nunca assinou.)
4. O que o premium libera no app?
5. **Paywall de referência (opcional):** "Tem algum app que você gosta e quer usar de modelo? Pode mandar prints do paywall e das configurações."
6. **Site:** o Google exige **três** links públicos para app com assinatura e conta: **Política de Privacidade**, **Suporte** (ou contato) e uma página para **pedir a exclusão da conta** (o Google exige esse link, além do botão dentro do app). Pergunte se ele tem site. Se não tiver, sugira um domínio próprio e ofereça montar o site como **projeto separado**, em outra pasta. Sem site, as páginas podem ficar num serviço gratuito (Notion público, Google Sites).
7. **Período de carência:** se a cobrança da renovação falhar, a pessoa continua usando o premium por alguns dias enquanto o Google tenta cobrar de novo? Recomende ligar (por exemplo, 7 dias). Confira na documentação as opções aceitas no dia.

Sugira os nomes e deixe o usuário trocar se quiser:

- **Uma assinatura** com **um plano base por período** (é o modelo do Google): ID da assinatura `premium`; planos base `mensal` e `anual`.
- Regras do Google para os IDs: assinatura com letras minúsculas, números, `_` e `.`; plano base e oferta com letras minúsculas, números e `-`.
- No RevenueCat, o produto do Google fica `premium:mensal` e `premium:anual` (ID da assinatura + `:` + ID do plano base). Confira esse formato na documentação do RevenueCat na hora.
- Entitlement no RevenueCat: `premium`. Offering: `default`, com pacotes `$rc_monthly` e `$rc_annual`. Se a skill `ios` já criou, reaproveite.

Avise uma vez: os IDs são para sempre. Se apagar no Google, não dá para usar o mesmo ID de novo.

## 5. Mostre o plano

Apresente em linguagem simples:

1. **Como é o seu app** (3 a 5 linhas com o que você encontrou).
2. **O que já está pronto** e será reaproveitado (inclusive o que a skill `ios` já fez).
3. **O que falta**, incluindo o que o Google exige e o projeto não tem (exclusão de conta dentro do app e por link, suporte, termos e privacidade, botões de login que não funcionam no Android, permissões sobrando, ícone).
   - **Ícone é bloqueio.** Pergunte: "Você já tem o ícone do app?" Se não tiver, avise que precisa criar antes do build (PNG quadrado de 1024×1024, sem transparência). Sugira primeiro o ChatGPT, depois Canva ou Figma. Se tiver, abra a imagem, mostre e peça confirmação.
4. **Prazo realista:** se a conta for pessoal e nova, diga que, depois do teste interno, ainda vêm 14 dias de teste fechado com 12 testadores e a análise do pedido de produção (o Google fala em até 7 dias ou mais).
5. **O que eu vou fazer**, em ordem.
6. **O que você vai precisar fazer** e em que momento.

Antes de alterar código, garanta um ponto de retorno: se houver mudanças sem commit, proponha um commit "Ponto de partida, antes das assinaturas no Android".

Só siga para a Fase 2 depois do usuário aprovar.
