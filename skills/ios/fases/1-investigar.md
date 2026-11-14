# Fase 1: Investigar o projeto

Objetivo: entender o app desta pessoa antes de mexer em qualquer coisa. Não altere o código do app nesta fase. Só crie `.assinaturas/estado.json`.

## 0. Aviso inicial

Antes de qualquer leitura, dê ao usuário, de uma vez:

1. A lista "O que só o usuário faz" do `SKILL.md`, para ele não ser surpreendido.
2. "Você **não** precisa criar o app na Apple antes. O primeiro envio do build cria sozinho."
3. **Plugin do RevenueCat:** confira se as ferramentas do RevenueCat (nomes como `list-projects`) já existem. Se não, peça para instalar **agora**, porque depois de instalar é preciso reiniciar a conversa (veja como em `fases/2-configurar.md`, passo 2). Instalando no começo, o processo não é interrompido no meio.

## 1. Leia o projeto

Descubra e anote em `.assinaturas/estado.json`:

| O que | Onde olhar |
|---|---|
| É Expo? Qual versão do SDK? | `package.json`, `app.json` ou `app.config.*`. Compare com o SDK atual em https://docs.expo.dev/versions/latest/ (consulte na hora). Se estiver atrás, avise antes de seguir: o Expo Go da App Store só abre o SDK mais recente, e atualizar pode exigir trocar bibliotecas. Proponha atualizar como etapa separada, antes das assinaturas (`npx expo install expo@latest --fix` e o guia de atualização da versão) |
| Nome do app e bundle iOS | `expo.name`, `expo.ios.bundleIdentifier` |
| Tem iPad ligado? | `expo.ios.supportsTablet` |
| Ícone e splash são os de exemplo do Expo? | Abra a imagem que `expo.icon` aponta e olhe. O ícone do Expo é um "A" azul sobre linhas de grade, em fundo azul claro. Também compare o MD5 com `cb975bba2216ce10a60e6c0ffe9941a2` (ícone padrão de modelos recentes). O ícone precisa ser quadrado, 1024×1024, PNG sem transparência |
| Roteamento | `expo-router` (pasta `app/`) ou React Navigation |
| Login | Supabase, Firebase, Clerk, próprio, ou nenhum. Onde fica o código de cadastro, entrada e saída. Quais botões a tela de login mostra (e-mail, Apple, Google, outros). Confira cada um na seção 2 |
| Como o app decide quem é premium hoje | Procure `premium`, `isPro`, `subscription`, `plano`, limites de uso |
| Já existe paywall ou tela de planos? | Procure `paywall`, `planos`, `assinar`, `subscribe` |
| Já tem RevenueCat? | `react-native-purchases` no `package.json`, `Purchases.configure` no código |
| Fluxo de entrada | A ordem das telas: onboarding, paywall, cadastro, home. Se o paywall vem **antes** do cadastro, a compra é feita sem conta e é ligada à conta no `logIn` (Fase 2). Explique isso no plano |
| EAS | `eas.json`, `extra.eas.projectId`, `owner` |
| Variáveis de ambiente | `.env`, uso de `EXPO_PUBLIC_*`, se `.env` e `.assinaturas/` estão no `.gitignore`. O que faltar entra no plano |
| Exigências da Apple | Em Configurações (ou tela de perfil): existe **Restaurar compras**? **Excluir conta**? **Suporte / Fale conosco**? Links de **Termos** e **Privacidade** (no paywall e em Configurações)? |
| Permissões | Quais recursos o app pede: fotos (`expo-image-picker`, `expo-media-library`), câmera (`expo-camera`), microfone, localização (`expo-location`), contatos, calendário, notificações etc. Para cada um, existe texto de explicação no `app.json` (no plugin da biblioteca ou em `ios.infoPlist`)? Sem texto, o Expo usa um padrão genérico em inglês ("Allow $(PRODUCT_NAME) to access your photos"). Confira também o contrário: permissão declarada que o app **não usa** (algumas bibliotecas de áudio declaram microfone por padrão mesmo quando o app só toca som). Desligue na opção da biblioteca |
| O que o app coleta | E-mail, fotos, localização, saúde, contatos. Para onde envia (IA, analytics, anúncios) |
| Git | Existe e funciona (`git status` sem erro)? Está limpo? Existe commit recente? O EAS exige Git. Se não houver Git válido, proponha `git init` com o `.gitignore` conferido antes (assim `.env` e `.assinaturas/` não sobem) e um backup em zip da pasta, se o `.git` estiver quebrado |
| Máquina | `node --version`, Windows ou Mac |
| Android | Existe `expo.android.package`? Só anote. Esta skill cuida do iPhone |

Se não for um projeto Expo, pare e avise que esta skill só cobre Expo.

## 2. Confira se o login funciona

Botão de login que não funciona reprova o app (o revisor testa todos, regra 2.1). Para **cada botão** que a tela de login mostra, confira se está configurado de verdade. Leia a documentação oficial do serviço na hora para saber o que é preciso; abaixo, o que conferir nos casos mais comuns:

| Botão | O que conferir |
|---|---|
| E-mail e senha (Supabase) | `GET https://<projeto>.supabase.co/auth/v1/settings` com o header `apikey: <chave pública>`. Veja `external.email` e `mailer_autoconfirm` (se exige confirmar o e-mail) |
| Apple (Supabase) | No mesmo `settings`, `external.apple` precisa ser `true`. No projeto: `expo-apple-authentication` instalado, `ios.usesAppleSignIn: true` no `app.json` |
| Google (Supabase) | No mesmo `settings`, `external.google` precisa ser `true`. No projeto: biblioteca de login do Google configurada (IDs do cliente iOS e web, e o esquema de URL do iOS no `app.json`) |
| Firebase, Clerk, próprio | Consulte a documentação do serviço e confira os mesmos pontos: provedor ligado no painel, chaves no projeto, configuração do iOS |

Se algum botão não estiver configurado, explique em uma frase o que falta e ensine o passo a passo (com os links da documentação oficial). Se o usuário não quiser configurar agora, ofereça esconder o botão até lá. Anote no plano como pendência obrigatória antes do envio.

Lembre também a regra 4.8: se o app oferece login com Google (ou outra rede), precisa oferecer uma opção equivalente que só peça nome e e-mail e deixe esconder o e-mail. "Entrar com a Apple" cumpre.

## 3. Confira os pré-requisitos com o usuário

Pergunte, uma coisa por vez, só o que você não conseguiu descobrir sozinho:

1. A conta Apple Developer está paga e o **Acordo de apps pagos** está **Ativo** em App Store Connect > Negócios, com banco e formulários fiscais? Se não, pare: sem isso os produtos não carregam no app. Mande ele resolver primeiro. Peça também para olhar se há **avisos** em Negócios (pendências fiscais, de banco ou de contrato). Se houver, explique o que diz e, se for questão fiscal, oriente a falar com um contador.
2. Já tem conta no RevenueCat?
3. Já tem conta na Expo?
4. **Navegador:** se você não tem ferramenta de navegador (Claude in Chrome), sugira instalar a extensão Claude in Chrome. Explique em uma frase: "Algumas telas da Apple não têm outro caminho (a principal é a Privacidade do app). Com a extensão eu preencho por você; sem ela, eu te passo o clique a clique." É opcional. Como instalar: (1) no Chrome, abrir https://claude.ai/chrome e clicar em **Usar no Chrome**; (2) fixar o ícone e entrar com a mesma conta do Claude; (3) no Claude Code, digitar `/chrome`: o painel deve mostrar "Extension: Installed". No VS Code, ligar **Enabled by default** (senão a extensão só conecta quando a mensagem tem `@browser`); (4) se as ferramentas não aparecerem, mandar a próxima mensagem com `@browser` ou fechar e abrir o Claude Code de novo. Confira procurando as ferramentas `mcp__claude-in-chrome__*` antes de seguir.

## 4. Colete as decisões

Pergunte:

1. Quais planos: mensal, anual, ou os dois?
2. Preço de cada um em reais.
3. Teste grátis? De quantos dias? (A Apple aceita 3 dias, 1 semana, 2 semanas, 1 mês, entre outros.)
4. O que o premium libera no app?
5. **iPhone e iPad, ou só iPhone?** Explique: depois que uma versão com iPad é publicada, as atualizações não podem mais tirar o iPad. E quem escolhe iPad precisa fazer as imagens da loja de iPad também. Se o app não foi pensado para tela grande, recomende só iPhone (`ios.supportsTablet: false`).
6. **Paywall de referência (opcional):** "Tem algum app que você gosta e quer usar de modelo? Pode mandar prints do paywall e das configurações." Se mandar, siga o modelo no layout. As exigências da Apple (Fase 2, passo 5) entram do mesmo jeito.
7. **Site:** explique que a Apple exige dois links públicos: **Política de Privacidade** e **Suporte**. Pergunte se ele tem site. Se não tiver, sugira comprar um domínio próprio: além dos links da Apple, serve para e-mail com o nome do app (por exemplo, os e-mails de login do Supabase saindo do domínio do app em vez de um e-mail genérico). Se ele quiser, ofereça montar o site como um **projeto separado**, em outra pasta, com as páginas de privacidade, suporte e termos. A decisão é dele. Sem site, as páginas podem ficar num serviço gratuito (Notion público, Google Sites).
8. **Período de carência:** se a cobrança da renovação falhar (cartão vencido, sem saldo), a pessoa continua usando o premium por alguns dias enquanto a Apple tenta cobrar de novo? Opções da Apple: 3, 16 ou 28 dias, ou desligado. Recomende ligar: a Apple recupera boa parte desses pagamentos e a pessoa não perde o acesso por um problema no cartão. Para plano mensal, sugira 16 dias.

Sugira os nomes e deixe o usuário trocar se quiser:

- Grupo de assinatura: `<Nome do app> Premium`
- IDs dos produtos: `<bundle>.premium.monthly` e `<bundle>.premium.yearly`
- Entitlement no RevenueCat: `premium`
- Offering: `default`, com pacotes `$rc_monthly` e `$rc_annual`

Avise uma vez: os IDs dos produtos são para sempre. Se apagar na Apple, não dá para usar o mesmo ID de novo.

## 5. Mostre o plano

Apresente em linguagem simples:

1. **Como é o seu app** (3 a 5 linhas com o que você encontrou).
2. **O que já está pronto** e será reaproveitado.
3. **O que falta**, incluindo o que a Apple exige e o projeto não tem (restaurar compras, exclusão de conta, suporte, termos e privacidade, textos de permissão, botões de login sem configurar, iPad).
   - **Ícone é bloqueio.** Pergunte: "Você já tem o ícone do app?"
     - **Não tem:** avise que precisa criar antes do build. Requisitos: PNG quadrado de 1024×1024, sem transparência e sem cantos arredondados (a Apple arredonda sozinha). Sugira primeiro o ChatGPT (pedir: "crie o ícone do meu app, 1024×1024, quadrado, sem transparência, sem cantos arredondados"). Outras opções: Canva ou Figma. Siga com o resto e volte a pedir antes da Fase 3.
     - **Tem:** peça o caminho, abra a imagem, mostre ao usuário e pergunte "É este o ícone certo?". Confira tamanho e transparência. Só então coloque em `assets/` e aponte no `app.json`.
     - Se o projeto já aponta para um ícone que não é o do Expo, mostre a imagem e peça a confirmação do mesmo jeito.
4. **O que eu vou fazer**, em ordem.
5. **O que você vai precisar fazer** e em que momento.

Antes de alterar código, garanta um ponto de retorno: se houver mudanças sem commit, proponha um commit "Ponto de partida, antes das assinaturas".

Só siga para a Fase 2 depois do usuário aprovar.
