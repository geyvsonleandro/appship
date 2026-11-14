# Fase 4: Preparar e enviar para revisão

Só entre aqui quando o usuário pedir e depois do teste no TestFlight ter funcionado. Antes de enviar de fato, mostre um resumo e peça a confirmação final.

Comece listando o que falta: monte a lista abaixo marcando o que já está pronto.

**Você faz tudo o que tem API, em sequência, sem esperar o usuário notar.** Depois de cada decisão dele, siga direto para o próximo item. Só pare para perguntar decisões (nome, categoria, se quer vídeo) ou pedir o que só ele tem (imagens, print). Os itens que só existem na tela (Privacidade do app) ficam **por último**, juntos, para o usuário não ficar pulando entre tarefas.

**Antes do botão de enviar, rode a autorrevisão (seção 9).** Nunca diga "está pronto" pela memória nem pelo que o usuário viu.

**Deixe o usuário acompanhar.** Ao terminar cada item (e antes de qualquer passo pela tela), mande o **link direto** da página, já com o ID do app, e o nome do menu:

| Item | Onde ver | Link |
|---|---|---|
| 3. Textos e 4. Imagens | **Distribuição > App para iOS > 1.0** (página da versão) | https://appstoreconnect.apple.com/apps/<APP ID>/distribution/ios/version/inflight |
| 3. Nome, subtítulo, categoria, direitos de conteúdo, 6. Classificação etária | **Geral > Informações do app** | https://appstoreconnect.apple.com/apps/<APP ID>/distribution/info |
| 5. Assinaturas | **Monetização > Assinaturas** > grupo > cada plano | https://appstoreconnect.apple.com/apps/<APP ID>/distribution/subscriptions |
| 7. Privacidade | **Geral > Privacidade do app** | https://appstoreconnect.apple.com/apps/<APP ID>/distribution/privacy |
| 8. Preço e países | **Monetização > Preços e disponibilidade** | https://appstoreconnect.apple.com/apps/<APP ID>/distribution/pricing |

Lembre que a página precisa ser recarregada (F5) para mostrar o que foi feito pela API.

## 0. Conta Apple: status de comerciante na União Europeia

É uma vez por conta e só pela tela (App Store Connect > **Negócios**, ou o aviso amarelo no topo de **Apps**). Sem isso, o app não é publicado nos países da UE.

**Quem é comerciante:** leia na hora a explicação da Apple (ajuda do App Store Connect sobre o Digital Services Act). Em geral, quem ganha dinheiro com o app (assinatura, venda ou anúncio) conta como comerciante, mesmo sendo pessoa física, sem empresa. "Não comerciante" é para app sem nenhuma receita. Para app com assinatura, ofereça a opção 1 ou a 3.

Ofereça os caminhos e deixe o usuário escolher:

1. **Vender na UE como comerciante** (quem tem empresa ou vende com fins comerciais): endereço, telefone e e-mail ficam públicos na loja.
2. **Declarar que não é comerciante.**
3. **Não vender na UE:** tire os países da UE da disponibilidade do app (passo 8). O status deixa de ser necessário.

Guie um clique por vez se ele escolher 1 ou 2. A Apple analisa e responde por e-mail (não é na hora). Reconfira o status antes do envio (seção 10).

## 1. Código (o que a Apple rejeita)

Confira no projeto e corrija o que faltar:

- **Seção Assinatura** em Configurações, com Gerenciar assinatura e Restaurar compras (Fase 2, passo 5).
- **Exclusão de conta dentro do app**, se o app tem criação de conta. Tem que apagar de verdade, não só pedir por e-mail.
- **Suporte / Fale conosco** em Configurações.
- **Termos de Uso e Política de Privacidade** no rodapé do paywall e em Configurações.
- **Textos de permissão** no `app.json`, na língua do app, dizendo para que o app usa cada recurso.
- **Todos os botões de login funcionando** (Fase 1, seção 2).
- Paywall mostra, perto do botão: nome do plano, duração, preço e o que acontece depois do teste grátis.
- Nada de preço fixo no código, nada de texto de exemplo, nada de tela vazia.
- Ícone e splash próprios.
- Se o app tem login, uma **conta de demonstração** para o revisor.

**Conta de demonstração (como criar e testar).** O revisor precisa entrar no app. Crie a conta com a mesma chamada que a tela de cadastro do app faz, usando o login que você identificou na Fase 1:

- **Supabase:** `POST https://<projeto>.supabase.co/auth/v1/signup` com o header `apikey: <chave pública do .env>` e o corpo `{ "email": "...", "password": "..." }`. Ou um script com `supabase.auth.signUp`.
- **Firebase, Clerk ou login próprio:** use o endpoint de cadastro equivalente. Consulte a documentação se precisar.

**Você faz tudo, o aluno não faz nada.** Ordem:

1. Descubra se o login exige confirmação de e-mail. Supabase: `GET https://<projeto>.supabase.co/auth/v1/settings` com o header `apikey`. Se `mailer_autoconfirm` for `true`, não exige.
2. **Não exige:** crie a conta com qualquer e-mail (ex.: `revisor@exemplo.com`) e teste o login.
3. **Exige:** use uma caixa de e-mail temporária com API (ex.: mail.tm). Crie a caixa, cadastre a conta com esse endereço, leia o e-mail de confirmação pela API, abra o link e teste o login. Nenhum dado do aluno é usado.
4. Só se tudo falhar, peça ajuda ao aluno (e-mail com "+" dele, ou a chave secreta do Supabase para criar já confirmada com `POST /auth/v1/admin/users` e `"email_confirm": true`).

**Teste o login** antes de gravar na Apple (Supabase: `POST /auth/v1/token?grant_type=password`). Só grave em `appStoreReviewDetails` se o login funcionar. A senha da conta de demonstração não é segredo da conta do aluno: crie uma só para isso.

**Premium do revisor:** o revisor faz a compra de teste. Se o aluno preferir, libere o entitlement direto na conta com a ferramenta do RevenueCat (`grant-customer-entitlement`).

**Nota para o revisor** (`notes` em `appStoreReviewDetails`, na língua inglesa, que é a que o revisor lê). Escreva em poucas linhas: como entrar (conta de demonstração), onde está a assinatura e onde restaurar. Exemplo de estrutura: "Subscriptions are offered on the paywall shown after onboarding. To restore purchases: Settings > Restore Purchases. Signing in with the same account also restores the subscription." Adapte ao caminho real do app.

Se mudou código, gere novo build e envie (Fase 3, passos 3 e 4).

## 2. Política de Privacidade e Termos

1. Escreva os dois textos com base no que o app realmente coleta e para onde envia (você levantou na Fase 1). Inclua as regras de renovação automática e cancelamento. Deixe nome do responsável e e-mail de contato para o usuário preencher.
2. O usuário revisa. Diga que você não é advogado e que o texto é um ponto de partida.
3. O usuário publica no site dele (Fase 1, decisão 7). Você precisa de dois links públicos: privacidade e suporte. Se ele aceitou que você monte o site, faça agora no projeto separado e publique onde ele escolher.
4. Troque os links no app e use os mesmos na Apple.

Para os Termos, é aceito usar o contrato padrão da Apple (EULA): `https://www.apple.com/legal/internet-services/itunes/dev/stdeula/`.

## 3. Textos da página

Escreva e mostre ao usuário para aprovar, respeitando os limites:

| Campo | Limite |
|---|---|
| Nome | 30 |
| Subtítulo | 30 |
| Texto promocional | 170 |
| Descrição | 4000 |
| Palavras-chave | 100, separadas por vírgula, sem espaço |
| URL de suporte | obrigatória |
| URL de marketing | opcional |

**Busca na App Store (ASO):** a Apple busca pelas palavras do **nome**, do **subtítulo** e das **palavras-chave**.

- **Nome:** sugira "Marca: o que o app faz", como os grandes apps fazem ("Duolingo: Learn Languages", "Headspace: Sono e Meditação", "Calm - Meditação e Sono"). Ofereça 2 ou 3 opções dentro de 30 caracteres. Explique ao usuário que existem dois nomes: o **da loja** (App Store Connect, muda pela API, sem build) e o **do ícone no iPhone** (`name` do `app.json`, vai no build). O do ícone deve ser curto, porque nome longo aparece cortado na tela inicial.
- **Não repita palavras** entre nome, subtítulo e palavras-chave. Repetir não ajuda e gasta espaço.
- Palavras-chave sem acento e sem plural duplicado.

Preencha também, pela API:

- **Categoria** principal e secundária: explique que a categoria define em qual seção da App Store o app aparece e com quais apps ele concorre. Sugira as duas com base no que o app faz, dizendo o motivo de cada uma (ex.: "Saúde e fitness, porque é onde ficam os apps de hábitos; Produtividade, por causa do pomodoro"), e peça confirmação. Fica em `appInfos` (relações `primaryCategory` e `secondaryCategory`). Liste as categorias com `GET /v1/appCategories`.
- **Copyright:** ano + nome do aluno, ou da empresa dele se publica como empresa. Ex.: `2026 Fulano de Tal`. Fica na `appStoreVersions` (atributo `copyright`).
- **Direitos de conteúdo:** antes de perguntar, olhe a pasta `assets/` (nomes de músicas, imagens e fontes que pareçam de outra pessoa). Depois pergunte "o app mostra ou usa conteúdo de terceiros (músicas, imagens, textos de outros)?". Explique que material "livre de direitos" feito por outra pessoa conta como conteúdo de terceiros, com direito de uso: a resposta é "usa", e vale guardar as licenças. Fica em `apps` (atributo `contentRightsDeclaration`: `USES_THIRD_PARTY_CONTENT` ou `DOES_NOT_USE_THIRD_PARTY_CONTENT`).

Na descrição de app com assinatura, inclua no final os planos, que a renovação é automática e os links de Termos e Privacidade.

Envie pela API (`asc.mjs request`): a versão do app fica em `/v1/apps/{id}/appStoreVersions`, os textos por idioma em `appStoreVersionLocalizations`, nome e subtítulo em `appInfoLocalizations` (via `/v1/apps/{id}/appInfos`). Faça GET primeiro para ver os nomes dos campos, depois PATCH. Preencha também os dados de contato e a conta de demonstração em `appStoreReviewDetails`.

## 4. Imagens da página

O usuário cria as imagens e coloca numa pasta (por exemplo `.assinaturas/screenshots/`). Sugira primeiro o ChatGPT (com prints reais do app como base), depois Canva ou Figma.

**Tamanhos:** não use tamanho decorado. Peça ao usuário um print da página da versão no App Store Connect, ou consulte a documentação: a Apple mostra embaixo de cada aparelho os tamanhos aceitos. Em nov/2026 o iPhone pedia a tela de 6,1/6,3" (1206×2622 ou 1179×2556 na vertical). Só faça imagens de iPad se o app suporta iPad (decisão da Fase 1).

**Mande os links para o usuário ver** antes de criar as imagens:

- A página da versão do app dele, onde as imagens vão aparecer: `https://appstoreconnect.apple.com/apps/<APP ID>/distribution/ios/version/inflight`
- Tamanhos aceitos das imagens: https://developer.apple.com/help/app-store-connect/reference/screenshot-specifications
- Tamanhos aceitos dos vídeos: https://developer.apple.com/help/app-store-connect/reference/app-preview-specifications
- Para o cabeçalho e os resultados da busca, indique os links "Veja as práticas recomendadas" e "Explore os modelos" que a Apple mostra na própria página da versão.

**Imagens opcionais da página:** pergunte se ele quer usar os "ativos criativos" da Apple: imagem de **Cabeçalho** (ex.: 5244×2950 ou 3840×1646) e de **Resultados da busca**. Também há até 3 **prévias em vídeo** por aparelho. Nada disso é obrigatório.

**Passo a passo para o usuário** (entregue assim, pronto):

1. Tire prints reais do app no iPhone (pelo TestFlight). Eles já saem no tamanho certo e servem de base.
2. No ChatGPT, mande os prints e peça, uma imagem por vez: "Crie uma imagem de divulgação para a App Store, vertical, 1206×2622 pixels, usando este print do meu app dentro de um iPhone, com a frase: <frase curta>. Fundo nas cores do app." Sugira as frases com base nos recursos do app (uma ideia por imagem; a primeira é a mais importante, porque aparece na busca).
3. Salve todas numa pasta qualquer (ex.: `Downloads/imagens-loja`) com os nomes na ordem em que devem aparecer: `01.png`, `02.png`, `03.png`... Opcionais: `cabecalho.png` e `busca.png`.
4. Me diga onde está a pasta. O resto é comigo.

Diga também ao usuário que **ele não precisa acertar o tamanho**: o ChatGPT quase nunca entrega no tamanho pedido, e você ajusta.

**Antes de enviar, regrave TODAS as imagens** (sem exceção, mesmo que pareçam certas). A Apple recusa com `ASSET_FAILED`, sem dizer o motivo, se qualquer regra abaixo falhar:

| Regra da Apple | Como garantir |
|---|---|
| Tamanho exato de um dos aceitos (ex.: 1206×2622) | Redimensionar para o tamanho exato. Se a proporção for diferente, cortar ou completar o fundo em vez de esticar |
| **Sem transparência** (canal alfa). Ferramentas de redimensionar costumam criar alfa sem avisar (ex.: `Bitmap` padrão do .NET) | Regravar em RGB 24 bits com fundo sólido. No PNG, o byte 25 do arquivo (tipo de cor) tem que ser 2, não 6 |
| PNG ou JPG, em RGB | Regravar como PNG RGB |
| De 1 a 10 imagens por aparelho, na ordem certa | Enviar na ordem dos nomes (`01`, `02`...) |

Como regravar: no Windows, `System.Drawing` pelo PowerShell (`Bitmap` com `Format24bppRgb`, `Clear` com cor sólida, `DrawImage` em `HighQualityBicubic`). No Mac, `sips -z <altura> <largura>` e depois remova o alfa (ex.: converter para JPG e de volta para PNG). Ou use `npx sharp-cli` em qualquer sistema (`.flatten()` remove o alfa). Copie o resultado para `.assinaturas/loja/iphone/`.

**Envio:** crie o conjunto com `POST /v1/appScreenshotSets` e `screenshotDisplayType: "APP_IPHONE_61"` (é o tipo de 1206×2622 e 1179×2556) ligado à localização da versão. Depois rode `asc.mjs upload appScreenshots appScreenshotSet appScreenshotSets <id do conjunto> <arquivo>` para cada imagem, na ordem. Se alguma der `ASSET_FAILED`, apague as que falharam (`DELETE /v1/appScreenshots/<id>`), confira a tabela acima e envie de novo.

**Depois das imagens:** se o idioma principal ainda não é o do aluno, troque agora (`PATCH /v1/apps/<APP ID>` com `primaryLocale`). A Apple só deixa trocar depois que o novo idioma tem imagens. Em seguida, peça permissão e apague o idioma vazio (apagar a localização da versão já apaga a do app junto).

**Vídeos (prévias), se ele quiser:** até 3 por aparelho, opcionais.

- Regras da Apple: de 15 a 30 segundos, só imagens reais do app funcionando (nada de pessoas, mãos ou o aparelho por fora), no tamanho que a página da versão mostra (em nov/2026, iPhone 6,1/6,3": 886×1920 na vertical). Confira na página de especificações de vídeo.
- Passo a passo: gravar a tela do iPhone (Central de Controle > Gravar tela) usando o app; cortar para 15 a 30 segundos no CapCut (ou no app de edição que preferir); salvar na mesma pasta como `video-01.mp4`, `video-02.mp4`...
- Seu papel: conferir duração, tamanho e taxa de quadros (máx. 30 fps) com `ffprobe` (use `npx ffmpeg-static` se não houver ffmpeg) e ajustar com `ffmpeg` se precisar; enviar pela API (`appPreviewSets` e `appPreviews` na localização da versão). Se a API recusar, guie o envio pela tela.

**Onde guardar:** copie a pasta do usuário para `.assinaturas/loja/iphone/` (opcionais em `.assinaturas/loja/opcionais/`), mantendo a ordem dos nomes. A Apple está migrando o envio de imagens para a "App Asset Library": consulte a documentação atual antes de enviar. Se a API recusar, faça pela tela.

## 5. Assinaturas prontas para revisão

1. Print de revisão: `node <skill>/scripts/asc.mjs review-screenshot <subscriptionId> .assinaturas/paywall.png`, para cada assinatura, trocando o provisório da Fase 2 pelo print real do TestFlight. Os IDs saem do `sub-status`.
2. Nota de revisão em cada assinatura, explicando onde o paywall aparece no app.
3. `sub-status` deve mostrar as assinaturas em "Ready to Submit", com print, idioma, preço e oferta.

## 6. Classificação etária

Obrigatória. Leia com `GET /v1/appInfos/<appInfo id>?include=ageRatingDeclaration` (o GET direto em `ageRatingDeclarations` dá 403). O ID da declaração é o mesmo do `appInfo`. Antes de responder, procure no código: chat, conteúdo de usuários, anúncios, `WebView`/navegador livre, sorteios. Mostre as respostas ao usuário numa tabela simples antes de gravar.

Grave com `PATCH /v1/ageRatingDeclarations/<id>` mandando todos os campos (testado em nov/2026):
- Texto `"NONE"`, `"INFREQUENT"` ou `"FREQUENT"`: `alcoholTobaccoOrDrugUseOrReferences`, `contests`, `gamblingSimulated`, `gunsOrOtherWeapons`, `horrorOrFearThemes`, `matureOrSuggestiveThemes`, `medicalOrTreatmentInformation`, `profanityOrCrudeHumor`, `sexualContentGraphicAndNudity`, `sexualContentOrNudity`, `violenceCartoonOrFantasy`, `violenceRealistic`, `violenceRealisticProlongedGraphicOrSadistic`.
- Sim/não (`true`/`false`): `advertising`, `ageAssurance`, `gambling`, `healthOrWellnessTopics`, `lootBox`, `messagingAndChat`, `parentalControls`, `socialMedia`, `unrestrictedWebAccess`, `userGeneratedContent`.

App comum fica tudo `NONE`/`false`. App de hábitos, saúde, sono ou exercício marca `healthOrWellnessTopics: true`. **Não diga a idade pelo campo `appStoreAgeRating`** (é do sistema antigo e mostra 4+). A Apple usa faixas novas (4+, 9+, 13+, 16+, 18+) que variam por país: leia `GET appInfos/<id>/territoryAgeRatings` ou a página Informações do app. Marcar saúde e bem-estar pode subir a faixa (ex.: 9+ no iOS 26 e 4+ em sistemas antigos). Mostre ao usuário a faixa real por país, não um número só.

**Dispositivo médico (2026):** apps nas categorias Saúde e fitness ou Medicina (ou com informação médica frequente) precisam declarar se são dispositivo médico regulamentado, senão saem da UE, Reino Unido e EUA. Fica em Informações do app > Dispositivos médicos regulamentados. É uma declaração legal: **a resposta é do usuário**. Explique (app de hábitos, treino ou dieta comum = Não) e peça para ele marcar e salvar.

## 7. Privacidade do app (dados coletados)

Obrigatória. Monte as respostas a partir do código: quais dados coleta, para quê, se ficam ligados à identidade do usuário e se há rastreamento. Elas têm que bater com a Política de Privacidade.

**A Apple não tem API para isso.** É um dos poucos itens da Fase 4 que exigem clicar na tela. Pelo navegador: marque os tipos, salve, e para cada tipo clique em Configurar > finalidade > Próximo > vinculado > Próximo (passa 2 telas de explicação) > rastreamento > Salvar. No fim, o botão **Publicar** pede uma declaração de que as respostas são verdadeiras: **quem clica é o usuário**. Ordem de preferência:

1. **Você preenche pelo navegador**, se houver ferramenta de navegador (Claude in Chrome). Na Fase 1, se não houver, sugira instalar a extensão Claude in Chrome justamente por causa deste item. O usuário só precisa estar logado no App Store Connect.
2. **Sem navegador:** explique em uma frase que a Apple não deixa fazer isso por fora, mande o link direto (`https://appstoreconnect.apple.com/apps/<APP ID>/distribution/privacy`) e entregue o passo a passo pronto, um clique por linha:
   - URL da Política de Privacidade.
   - **Começar** > "Sim, coletamos dados deste app".
   - Os tipos exatos para marcar, com o nome que aparece na tela (ex.: Informações de contato > Nome, Endereço de e-mail; Conteúdo do usuário > Fotos ou vídeos, Outro conteúdo do usuário; Identificadores > ID do usuário; Compras > Histórico de compras).
   - Para cada tipo, as 3 respostas (finalidade, vinculado à identidade, rastreamento).
   - **Publicar**.
   Peça um print no fim para conferir.

Como montar a lista a partir do código: login (nome, e-mail, ID do usuário), foto de perfil (`expo-image-picker` + armazenamento), tabelas do banco com conteúdo do usuário, RevenueCat (histórico de compras), ferramentas de análise ou anúncios (se houver, mudam a finalidade e podem contar como rastreamento). Sem análise nem anúncios, a finalidade de tudo é "Funcionalidade do app" e rastreamento é "Não".

## 8. Preço do app e disponibilidade

Defina o app como gratuito e disponível nos países desejados, se ainda não estiver definido. Explique ao usuário em uma frase, porque confunde: "Esse preço é o de **baixar** o app. Fica R$ 0 para qualquer um instalar; o dinheiro vem da assinatura lá dentro, que já tem preço próprio." Num app novo os dois vêm vazios (404): é criar, não editar. Testado em nov/2026:

1. **Grátis:** pegue o ponto de preço zero em `GET /v1/apps/<APP ID>/appPricePoints?filter[territory]=USA` (o de `customerPrice "0.0"`). Depois `POST /v1/appPriceSchedules` com `app`, `baseTerritory` USA e `manualPrices` apontando para um `appPrices` inline (`id: "${p0}"`, `startDate: null`, `appPricePoint` = o ponto zero).
2. **Países:** liste `GET /v1/territories?limit=200` e faça `POST /v2/appAvailabilities` com `availableInNewTerritories: true` e uma `territoryAvailabilities` inline por país (`id: "${t0}"`, `"${t1}"`..., `available: true`). Respeite a decisão da UE da seção 0.

A página também traz Mac (Apple silicon) e Apple Vision Pro marcados por padrão. Deixe como está, a não ser que o usuário peça.

## 9. Autorrevisão (antes do botão de enviar)

Rode sempre, mesmo que tudo pareça feito. Tem duas partes e um relatório.

### Parte A: a Apple está completa? (API, certeira)

`node <skill>/scripts/asc.mjs revisao-status <bundleId>`

Ele só lê, não altera nada. Confere versão, build, textos e imagens por idioma, URLs (se abrem e se não são provisórias), categoria, classificação etária e faixa por país, contato e conta de demonstração, assinaturas, preço e países. Cada item sai como `falta`, `aviso`, `tela` (a API não mostra) ou `ok`. Os itens `tela` (Privacidade do app, dispositivo médico) você confere pelo navegador ou pede um print.

### Parte B: a Apple vai aprovar? (código e loja, risco)

A base são as **Diretrizes de Revisão da Apple** e a página de assinaturas. **Leia as duas na hora, toda vez que rodar a autorrevisão**, nunca de memória:

- https://developer.apple.com/app-store/review/guidelines/ (seções 1 a 5)
- https://developer.apple.com/app-store/subscriptions/

A tabela abaixo é só um roteiro do que costuma reprovar apps como este. **Se o texto atual da Apple disser outra coisa, vale o texto atual**: use a regra e o número que estão no site naquele dia, e acrescente ao relatório qualquer exigência nova que se aplique ao app. Diga ao usuário a data da versão das diretrizes que você leu. Se não conseguir abrir o site, use a tabela e avise que ela pode estar desatualizada.

Rode também as **Checagens automáticas** dos aprendizados do usuário e some à tabela as reprovações já anotadas lá (veja "Aprendizados" no `SKILL.md`). Leia o código e a página da loja e marque cada item. Cite o número da regra no relatório, porque é o número que aparece numa reprovação.

| Risco | O que procurar | Regra |
|---|---|---|
| Vermelho | Ícone ainda é o padrão do Expo, ou textos e telas de exemplo ("Lorem ipsum", "TODO", dados falsos) | 2.1(a) |
| Vermelho | Tela de assinatura sem: nome e duração de cada plano, preço total da renovação em destaque, links de Termos de Uso (EULA) e de Política de Privacidade | 3.1.2 + página de assinaturas |
| Vermelho | Nenhum jeito de restaurar a assinatura (linha em Configurações; em app com login, entrar de novo também devolve) ou a nota para o revisor não diz onde fica | 3.1.1 |
| Vermelho | Botão de login que não funciona (provedor não configurado) | 2.1(a) |
| Vermelho | Teste grátis sem dizer quantos dias dura e quanto custa depois; ou prometido a quem já não tem direito | 3.1.2 + página de assinaturas |
| Vermelho | Política de privacidade só no App Store Connect e não dentro do app (ou o contrário) | 5.1.1(i) |
| Vermelho | App cria conta e não tem "excluir conta" dentro do app | 5.1.1(v) |
| Vermelho | Login com Google ou outra rede como principal, sem uma opção equivalente que só peça nome e e-mail e deixe esconder o e-mail ("Entrar com a Apple" cumpre) | 4.8 |
| Vermelho | Compra de conteúdo digital fora da Apple (Stripe, link de pagamento, checkout em webview) | 3.1.1 |
| Vermelho | Conta de demonstração que não entra, servidor desligado, ou premium bloqueado para o revisor | 2.1(a) |
| Vermelho | Compra que o revisor não consegue achar, sem explicação nas notas | 2.1(b) |
| Vermelho | Código baixado depois da aprovação que muda ou acrescenta funções (atualização OTA que muda o app) | 2.5.2 |
| Amarelo | Função escondida ou que só aparece depois da aprovação, sem estar descrita nas notas para o revisor | 2.3.1(a) |
| Amarelo | Paywall enganoso: preço cobrado menos visível que o preço "por dia/semana", botão de fechar escondido ou que demora, oferta trocada depois de assinar | 3.1.2 / 2.3.1(a) |
| Amarelo | Assinatura sem valor contínuo (algo que a pessoa usa sempre) ou com período menor que 7 dias | 3.1.2(a) |
| Amarelo | Ferramenta de análise, anúncio ou atribuição no código (Firebase Analytics, AppsFlyer, Meta SDK etc.) que não está na Privacidade do app; se rastreia, falta o pedido de rastreamento (ATT) | 5.1.1 / 5.1.2(i) |
| Amarelo | Dados enviados para uma IA de terceiros (OpenAI, Gemini etc.) sem avisar e pedir permissão | 5.1.2(i) |
| Amarelo | Texto que explica cada permissão (fotos, câmera, notificação) genérico, em inglês ou ausente no `app.json` | 5.1.1(ii) |
| Amarelo | Permissão pedida sem necessidade, ou o app travado até a pessoa aceitar | 5.1.1(iii) / 5.1.1(iv) |
| Amarelo | Login obrigatório antes de usar, sem a conta ser essencial ao app; ou pedir telefone, nome etc. como obrigatório sem precisar | 5.1.1(v) / 5.1.1(x) |
| Amarelo | Notificação de marketing sem a pessoa ter aceitado dentro do app e sem opção de desligar | 4.5.4 |
| Amarelo | Pedido de avaliação próprio em vez do da Apple (`expo-store-review`) | 5.6.1 |
| Amarelo | Loja ou imagens citando Android ou outra plataforma | 2.3.10 |
| Amarelo | Preço escrito nos textos ou nas imagens da loja; "beta", "teste" ou "demo" no app ou na loja | 2.3.7 / 2.3.14 / 2.2 |
| Amarelo | Contato de suporte difícil de achar no app e na URL de suporte | 1.5 |
| Amarelo | App de saúde ou bem-estar com promessa de resultado médico sem explicar a base, ou sem lembrar de procurar um médico | 1.4.1 |
| Amarelo | Conteúdo criado por usuário (chat, posts, IA que gera conteúdo) sem filtro, denúncia, bloqueio e contato publicado | 1.2 |
| Amarelo | App que é só um site embrulhado, ou com pouca função própria | 4.2 |

### O relatório

Mostre ao usuário uma lista curta: primeiro os vermelhos, depois os amarelos, e no fim "X itens ok". Para cada vermelho, diga em uma linha o que fazer e se precisa de build novo. Não esconda amarelo: explique o risco e deixe ele decidir.

Se houver vermelho, **não ofereça o botão de enviar**. Resolva, gere o build se precisar e rode a autorrevisão de novo.

### Quando a Apple reprovar mesmo assim

Siga a Fase 5, situação 1.

## 10. Enviar

1. Selecione o build na versão.
2. **Primeira vez com assinaturas:** elas precisam ir junto com a versão do app. Em nov/2026 a página da versão **não tem mais** a seção "Compras dentro do app e assinaturas". As assinaturas prontas entram na mesma tela de envio que abre ao clicar em **Adicionar para revisão** (ela lista os itens que vão juntos, antes do botão final **Enviar para revisão**). Confira lá que as duas aparecem.
3. Só depois da autorrevisão sem vermelhos: mostre o resumo final ao usuário (versão, build, assinaturas incluídas, textos, links) e peça o "pode enviar".
4. Envie para revisão (pela tela, botão **Adicionar para revisão** e depois **Enviar**, ou pela API de `reviewSubmissions`).

Depois de enviar, diga o que esperar, com estas palavras ou parecidas:

"A revisão costuma levar de 1 a 3 dias e a resposta chega por e-mail. **É comum o app ser reprovado na primeira vez**, mesmo app bom: isso faz parte. Se acontecer, me chame e cole a mensagem da Apple que eu resolvo com você. Se for aprovado, me chame também que eu coloco o app à venda."

Atualize `.assinaturas/estado.json` com a data do envio. O que vem depois está na Fase 5.
