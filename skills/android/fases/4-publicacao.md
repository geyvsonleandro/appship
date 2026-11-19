# Fase 4: Preparar e publicar

Só entre aqui quando o usuário pedir e depois do teste interno ter funcionado. Nada vai para revisão do Google sem o "pode enviar" dele. Antes de enviar de fato, mostre um resumo e peça a confirmação final.

Comece listando o que falta: monte a lista abaixo marcando o que já está pronto.

**Você faz tudo o que tem API, em sequência, sem esperar o usuário notar** (textos, imagens, contato, assinaturas). Só pare para perguntar decisões ou pedir o que só ele tem (imagens, links). Os itens que só existem na tela ficam juntos, **por último**, para ele não ficar pulando entre tarefas.

**Antes de qualquer envio para revisão, rode a autorrevisão (seção 8).** Nunca diga "está pronto" pela memória nem pelo que o usuário viu.

**Deixe o usuário acompanhar.** Ao terminar cada item, diga onde ver no Play Console (o nome do menu) e mande o link. Os links do Play Console levam o ID da conta e do app: pegue-os da barra de endereço quando estiver no navegador, ou diga o caminho pelos menus. A página precisa ser recarregada (F5) para mostrar o que foi feito pela API.

## 0. Situação da conta e o caminho até a loja

Leia na hora https://support.google.com/googleplay/android-developer/answer/14151465 e confira o tipo de conta (Fase 1).

- **Conta pessoal criada depois de 13/11/2023** (regra em nov/2026): antes da produção, um **teste fechado com pelo menos 12 testadores** que fiquem inscritos **14 dias seguidos**. Quem entra e sai antes dos 14 dias não conta. Depois, o usuário pede o **acesso à produção** pelo painel, respondendo perguntas sobre o teste, e o Google analisa (em geral até 7 dias). Sem isso, a faixa de produção fica bloqueada.
- **Conta de organização** (ou pessoal antiga): pode ir direto para produção.
- **Verificação do aparelho Android** precisa estar feita para publicar.

Explique o caminho em 3 linhas para o usuário saber o que vem pela frente.

## 1. Código (o que o Google cobra)

Confira no projeto e corrija o que faltar:

- **Excluir conta dentro do app**, se o app cria conta. Tem que apagar de verdade.
- **Seção Assinatura** em Configurações, com Gerenciar assinatura e Restaurar compras.
- **Suporte / Fale conosco** em Configurações.
- **Termos de Uso e Política de Privacidade** no rodapé do paywall e em Configurações. O Google exige a política **dentro do app** e na loja.
- **Todos os botões de login funcionando no Android** (Fase 1, seção 2). Nada de "Entrar com a Apple" aparecendo no Android.
- **Permissões:** só as que o app usa.
- Paywall mostra, perto do botão: plano, duração, preço e o que acontece depois do teste grátis. Cancelamento explicado sem esconder.
- Nada de preço fixo no código, texto de exemplo ou tela vazia. Ícone próprio.
- Se o app tem login, uma **conta de demonstração** para o revisor.

**Conta de demonstração:** crie com a mesma chamada que a tela de cadastro do app faz (Supabase: `POST https://<projeto>.supabase.co/auth/v1/signup` com o header `apikey` e `{ "email", "password" }`). Se o login exige confirmar e-mail (`GET /auth/v1/settings`, campo `mailer_autoconfirm`), use uma caixa de e-mail temporária com API (ex.: mail.tm) para confirmar. **Teste o login** (`POST /auth/v1/token?grant_type=password`) antes de informar ao Google. Você faz tudo; o aluno não faz nada. A senha é só dessa conta, não da conta do aluno. Ela vai na declaração **Acesso ao app** (seção 6).

Se mudou código, gere novo build e envie (Fase 3, passos 3 e 4).

## 2. Links públicos: privacidade, termos, suporte e exclusão de conta

1. Escreva a Política de Privacidade e os Termos com base no que o app realmente coleta e para onde envia (Fase 1). Inclua as regras de renovação automática e cancelamento pela Google Play. Deixe nome do responsável e e-mail para o usuário preencher. Diga que você não é advogado e que o texto é um ponto de partida.
2. **Página de exclusão de conta** (exigência do Google, leia https://support.google.com/googleplay/android-developer/answer/13327111): uma página pública que cita o nome do app ou do desenvolvedor e explica, de forma fácil de achar, como pedir a exclusão da conta e dos dados (por exemplo, o passo a passo no app e um e-mail ou formulário para quem não tem mais o app). Diga quais dados são apagados e quais ficam guardados, e por quanto tempo.
3. O usuário publica no site dele (Fase 1, decisão 6). Se ele aceitou que você monte o site, faça agora no projeto separado.
4. A política precisa estar numa página web comum (não PDF), aberta a todos, sem login.
5. Troque os links no app e use os mesmos no Google.

## 3. Textos da página

Escreva e mostre ao usuário para aprovar. Confira os limites na ajuda do Play Console na hora; em nov/2026:

| Campo | Limite |
|---|---|
| Nome do app | 30 |
| Descrição curta | 80 |
| Descrição completa | 4000 |
| E-mail de contato | obrigatório |
| Site | opcional |

**Busca na Google Play:** o Google lê o **nome**, a **descrição curta** e a **descrição completa** (não existe campo de palavras-chave como na Apple). Por isso a descrição completa deve citar, de forma natural, as palavras que as pessoas buscam. Não repita palavras sem sentido: o Google trata isso como spam.

- **Nome:** sugira "Marca: o que o app faz", dentro de 30 caracteres. Ofereça 2 ou 3 opções. Explique que o nome da loja muda sem build; o nome embaixo do ícone no celular é o `name` do `app.json` e vai no build.
- **Proibido** no nome, no ícone e nas imagens: preço, "grátis", "nº 1", "melhor app", emojis em excesso, letras maiúsculas só para chamar atenção (política de metadados).
- Descrição de app com assinatura: no final, os planos, que a renovação é automática, como cancelar e os links de Termos e Privacidade.

Envie pela API com um arquivo `.assinaturas/loja-android.json` (formato em `referencia/google-api.md`) e `node <skill>/scripts/gplay.mjs listing .assinaturas/loja-android.json`. O mesmo comando envia o e-mail de contato e as imagens (seção 4).

## 4. Imagens da página

Regras do Google (confira na hora em https://support.google.com/googleplay/android-developer/answer/9866151):

| Imagem | Regra |
|---|---|
| Ícone da loja | PNG de 512×512, até 1 MB |
| Imagem de destaque (feature graphic) | 1024×500, JPG ou PNG **sem transparência** |
| Capturas de tela do celular | De 2 a 8. PNG ou JPG, até 8 MB cada. Cada lado entre 320 e 3840 pixels, o lado maior no máximo 2,3 vezes o menor |

- **Reaproveite as imagens do iPhone**, se a skill `ios` já fez: 1206×2622 está dentro das regras do Google. Só tire da imagem qualquer coisa que mostre iPhone, Apple ou App Store: a loja do Google não pode mostrar outra plataforma.
- **Ícone de 512×512:** gere a partir do ícone de 1024×1024 do app.
- **Imagem de destaque:** o usuário cria (sugira o ChatGPT: "Crie uma imagem de destaque para a Google Play, 1024×500 pixels, horizontal, com o nome <app> e a frase <frase>, nas cores do app"). Você ajusta o tamanho.
- Diga ao usuário que **ele não precisa acertar o tamanho**: você ajusta.

**Antes de enviar, regrave todas as imagens** no tamanho exato e, na imagem de destaque e nas capturas, **sem transparência** (RGB 24 bits com fundo sólido; no PNG, o byte 25 do arquivo tem que ser 2). Como regravar: no Windows, `System.Drawing` pelo PowerShell (`Bitmap` com `Format24bppRgb`); no Mac, `sips`; em qualquer sistema, `npx sharp-cli` (`.flatten()` remove a transparência). Guarde em `.assinaturas/loja/android/` (`icone-512.png`, `destaque.png` e a pasta `capturas/` com `01.png`, `02.png`... na ordem).

## 5. Configurações da loja

Pela tela (Play Console > app > **Crescer** > **Presença na loja** > **Configurações da loja**, o caminho pode mudar): **categoria** do app e **tags**. Explique em uma frase que a categoria define onde o app aparece e com quem concorre, sugira com o motivo e peça confirmação.

## 6. Conteúdo do app (declarações)

Fica em Play Console > app > **Política e programas** > **Conteúdo do app** (o caminho pode mudar). **Não existe API para a maioria destes itens.** Abra a página e responda **tudo o que aparecer como pendente** (a lista muda com o tempo; leia a ajuda de cada item na hora). Os mais comuns:

| Declaração | O que responder |
|---|---|
| Política de privacidade | O link da seção 2 |
| Acesso ao app | "Todas ou algumas funções são restritas": instruções em inglês com a conta de demonstração (e-mail e senha) e o caminho até o paywall |
| Anúncios | Se o app mostra anúncios (procure SDKs de anúncio no código) |
| Classificação do conteúdo | Questionário (IARC), com o e-mail do usuário. Procure no código: violência, conteúdo de usuários, chat, compras, localização compartilhada. Mostre as respostas antes |
| Público-alvo e conteúdo | Faixas de idade. Se incluir crianças, entram as regras de famílias: explique e recomende não incluir menores de 13 se o app não foi feito para elas |
| Segurança dos dados | Veja abaixo |
| ID de publicidade | Se o app usa o identificador de publicidade (SDKs de anúncio ou de atribuição) |
| Outras (apps governamentais, recursos financeiros, saúde, notícias) | Responda conforme o app. App de hábitos ou bem-estar: leia a declaração de saúde na hora e responda com o que o app faz de verdade |

**Segurança dos dados:** monte as respostas a partir do código (como na Fase 1): quais dados coleta, se compartilha com terceiros, para quê, se são criptografados no envio (HTTPS: sim) e se o usuário pode pedir a exclusão (sim, com o **link da página de exclusão** da seção 2). Login (nome, e-mail, ID do usuário), foto de perfil, conteúdo do usuário no banco, compras (o RevenueCat processa o histórico de compras). Sem análise nem anúncios, a finalidade é "Funcionalidade do app". As respostas têm que bater com a Política de Privacidade.

**Como preencher:** pelo navegador, se houver Claude in Chrome (o usuário só precisa estar logado). Sem navegador, entregue o passo a passo pronto, um clique por linha, com as respostas exatas. Cada declaração termina num botão **Salvar** ou **Enviar**: são declarações do usuário. Você prepara e mostra o resumo; **quem clica no envio final é ele**. Peça um print no fim para conferir.

## 7. Países

O app já foi criado como gratuito (Fase 2). Os países são escolhidos **por faixa** (teste fechado e produção): em cada faixa, **Países/regiões** > adicionar. Pergunte se o usuário quer o mundo todo ou só alguns países. As assinaturas já têm preço em todos (Fase 2, passo 7).

## 8. Autorrevisão (antes de qualquer envio para revisão)

Rode sempre, mesmo que tudo pareça feito.

### Parte A: o Play Console está completo? (API)

`node <skill>/scripts/gplay.mjs revisao-status <pacote>`

Ele só lê. Confere contato, textos por idioma (com os tamanhos), imagens, faixas com versão e assinaturas ativas. Os itens `tela` (Conteúdo do app, categoria, países, perfil de pagamentos, verificação) você confere pelo navegador ou pede um print. No Play Console, o **Painel** do app e a **Visão geral da publicação** mostram o que ainda falta: leia os dois.

### Parte B: o Google vai aprovar? (código e loja, risco)

A base são as **políticas do programa para desenvolvedores do Google Play**. **Leia na hora, toda vez**, nunca de memória:

- https://play.google/developer-content-policy/ (central de políticas)
- A política de assinaturas (dentro de Pagamentos) e a de exclusão de conta (https://support.google.com/googleplay/android-developer/answer/13327111)

A tabela abaixo é só um roteiro do que costuma barrar apps como este. **Se o texto atual do Google disser outra coisa, vale o texto atual.** Diga ao usuário a data em que leu. Rode também as **Checagens automáticas** dos aprendizados e some as reprovações já anotadas lá.

| Risco | O que procurar | Política |
|---|---|---|
| Vermelho | Ícone de exemplo do Expo, textos ou telas de exemplo | Funcionalidade mínima / metadados |
| Vermelho | Paywall sem plano, duração, preço da renovação e como cancelar perto do botão; teste grátis sem dizer quantos dias e quanto custa depois | Assinaturas |
| Vermelho | App cria conta e não tem excluir conta dentro do app, ou falta o link web de exclusão na Segurança dos dados | Exclusão de conta |
| Vermelho | Política de privacidade ausente no app ou na loja, ou link quebrado | Dados do usuário |
| Vermelho | Segurança dos dados diferente do que o código coleta (ex.: SDK de análise não declarado) | Segurança dos dados |
| Vermelho | Botão de login que não funciona no Android (ex.: Apple aparecendo) | Funcionalidade |
| Vermelho | Conta de demonstração que não entra, ou premium bloqueado para o revisor sem explicação | Acesso ao app |
| Vermelho | Compra de conteúdo digital fora da Google Play (Stripe, link de pagamento) sem estar num programa permitido | Pagamentos |
| Vermelho | Nível de API abaixo do exigido no dia | Requisito de API |
| Amarelo | Permissão pedida sem necessidade (microfone, localização) ou declarada e não usada | Permissões |
| Amarelo | Preço, "grátis", "nº 1" ou emojis em excesso no nome, ícone ou imagens; imagens mostrando iPhone ou App Store | Metadados |
| Amarelo | Dados enviados para uma IA de terceiros sem avisar e pedir permissão | Dados do usuário |
| Amarelo | App de saúde ou bem-estar com promessa de resultado médico | Saúde |
| Amarelo | Conteúdo criado por usuário sem denúncia e bloqueio | Conteúdo gerado pelo usuário |
| Amarelo | Notificações de marketing sem a pessoa ter aceitado | Spam / notificações |
| Amarelo | App que é só um site embrulhado | Funcionalidade mínima |

### O relatório

Mostre uma lista curta: primeiro os vermelhos, depois os amarelos, e no fim "X itens ok". Para cada vermelho, diga em uma linha o que fazer e se precisa de build novo. Se houver vermelho, **não ofereça o envio**.

## 9. Teste fechado (conta pessoal nova)

Só com pedido do usuário. Leia na hora a ajuda "Configurar um teste aberto, fechado ou interno".

1. Play Console > app > **Testar e lançar** > **Teste fechado** > faixa (ex.: "Teste fechado - Alpha") > **Testadores**: uma lista de e-mails (ou um Grupo do Google) com **pelo menos 12 pessoas**. Explique: precisam ser contas Google reais, que aceitem pelo link de participação e **fiquem inscritas 14 dias seguidos**. Sugira chamar mais que 12, porque alguém sempre sai.
2. **Países/regiões** da faixa.
3. **Criar nova versão** com o build que já passou no teste interno (dá para reaproveitar o mesmo `.aab` da biblioteca) > nome > **Avançar** > **Salvar**.
4. **Visão geral da publicação** > **Enviar alterações para revisão**. O teste fechado também passa pela revisão do Google. **Este é o botão final:** só depois da autorrevisão sem vermelhos, do resumo e do "pode enviar" do usuário.
5. Depois de aprovado, mande o link de participação para os testadores. Anote em `.assinaturas/estado-android.json` a data em que o 12º testador entrou: os 14 dias contam a partir daí.
6. Passados os 14 dias, no **Painel**: **Solicitar acesso à produção**. O formulário pergunta sobre o teste (como achou os testadores, quanto usaram, o que disseram), sobre o app (público, valor, instalações esperadas no primeiro ano) e sobre o que mudou depois do teste. Ajude a responder **com a verdade**, com base no que aconteceu. O Google responde em geral em até 7 dias.

## 10. Produção

Só com pedido do usuário e com o acesso à produção liberado (ou conta que não precisa dele).

1. **Testar e lançar** > **Produção** > **Países/regiões** > **Criar nova versão** (pode promover a versão testada) > nome e **notas da versão** (o que há de novo, curto, na língua da loja) > **Salvar**.
2. Autorrevisão de novo (seção 8).
3. Resumo final ao usuário (versão, assinaturas ativas, textos, links, países) e o "pode enviar".
4. **Visão geral da publicação** > **Enviar alterações para revisão**.

Depois de enviar, diga o que esperar, com estas palavras ou parecidas:

"A análise do Google costuma levar de algumas horas a 7 dias, e conta nova pode demorar mais. A resposta chega por e-mail e aparece no Play Console. **É comum o app ser recusado na primeira vez**, mesmo app bom: isso faz parte. Se acontecer, me chame e cole a mensagem do Google que eu resolvo com você."

Atualize `.assinaturas/estado-android.json` com a data do envio. O que vem depois está na Fase 5.
