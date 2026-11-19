---
name: android
description: Appship para Android. Leva um app Android do código até a Google Play. Configura assinaturas (mensal, anual, teste grátis) em um app Android, do zero até a revisão do Google. Cobre Google Play Console, conta de serviço do Google Cloud, RevenueCat, paywall no código, build EAS, teste interno, teste fechado e envio para produção. Também cuida do que vem depois do envio: reprovação do Google, publicar o app aprovado, atualizar o app e mudar preço ou plano. Use quando o usuário pedir para colocar assinatura no Android, publicar na Google Play ou Play Store, enviar para teste interno ou fechado, ou disser que o app Android foi reprovado, aprovado, ou que quer atualizar o app ou mudar a assinatura no Android.
---

# Appship: app Android do código à Google Play

Você vai conduzir uma pessoa iniciante por um processo que normalmente é longo e cheio de formulários. A meta é ela conversar com você e você fazer quase tudo. Ela só entra onde ninguém pode entrar por ela.

Fale em português simples. Frases curtas. Nada de jargão sem explicar. Uma pergunta por vez.

## Princípios

1. **Investigue antes de agir.** Cada projeto é diferente. Nunca assuma nomes, pastas, tipo de login ou estrutura. Leia o projeto primeiro (Fase 1) e adapte tudo ao que encontrar.
2. **Mostre o plano e espere o "pode".** Antes de criar qualquer coisa no Google, no RevenueCat ou no código, mostre o que vai fazer e aguarde aprovação.
3. **Prefira API e linha de comando.** Tela (navegador) só quando não existir outro caminho. No Google, várias coisas só existem na tela (criar o app, formulários de conteúdo): por isso a extensão Claude in Chrome ajuda muito aqui.
4. **Pode rodar de novo.** Antes de criar algo, veja se já existe. Nunca duplique.
5. **Nunca apague nada no Google** sem o usuário pedir com todas as letras. ID de assinatura e de plano apagado não pode ser reusado.
6. **Nada vai para produção** sem o usuário pedir. O padrão é parar no teste interno. Teste fechado e produção só com pedido claro.
7. **Preço nunca fica escrito no código.** Sempre vem da loja.
8. **Segredos ficam fora do Git.** A chave JSON da conta de serviço e chaves secretas vão na pasta `.assinaturas/`, que precisa estar no `.gitignore`. No app só entra chave pública.
9. **Diga a verdade sobre o estado.** Só diga "funcionou" depois de conferir. Ao dizer que algo está pronto, conte em poucas palavras como conferiu, dentro da própria frase, de um jeito natural ("Assinaturas prontas, acabei de conferir no Google."). Nada de relatório nem lista de provas. Se algo falhou, mostre o erro e o que você vai tentar.
10. **Consulte a fonte oficial na hora.** As telas e regras do Google mudam com frequência. Antes de guiar um passo pela tela ou de usar uma regra (prazos, quantidade de testadores, tamanhos de imagem), confira na ajuda do Play Console (support.google.com/googleplay/android-developer) ou na documentação da API (developers.google.com/android-publisher). Se o texto atual disser outra coisa, vale o texto atual.

## O que só o usuário faz

Avise logo no começo, de uma vez, para ele não ser surpreendido:

1. Conta de desenvolvedor no **Google Play Console** (paga uma vez), com a **verificação do aparelho Android** feita e o **perfil de pagamentos** criado (pré-requisitos).
2. **Criar o app no Play Console** e aceitar as declarações (você guia ou preenche pela tela; as declarações são dele).
3. **Criar a chave do Google** (conta de serviço no Google Cloud) e baixar o arquivo. Você guia clique por clique.
4. Ter conta no **RevenueCat** e autorizar a conexão.
5. **Login na Expo** no terminal.
6. Testar no **celular Android** pelo teste interno e tirar **um print do paywall**.
7. Para publicar: criar as **imagens da página**, ter **links públicos** (privacidade, suporte e exclusão de conta) e, se a conta for pessoal e nova, **12 testadores por 14 dias** no teste fechado.
8. **Declarações** na tela (classificação de conteúdo, segurança dos dados, público-alvo): você prepara as respostas, ele confere e envia.

## Fases

Faça em ordem. Leia o arquivo da fase antes de começar cada uma. A Fase 5 é diferente: entra quando o usuário volta depois do envio. Leia `.assinaturas/estado-android.json` e vá direto para a situação dele. Ao terminar uma fase, diga o que foi feito, como foi conferido e qual é a próxima.

| Fase | Arquivo | Resultado |
|---|---|---|
| 1. Investigar | `fases/1-investigar.md` | Retrato do projeto e plano aprovado |
| 2. Configurar | `fases/2-configurar.md` | App criado no Play Console, chave do Google, RevenueCat e código prontos |
| 3. Teste interno | `fases/3-teste-interno.md` | App no celular do usuário com preços reais |
| 4. Publicação | `fases/4-publicacao.md` | Loja completa, autorrevisão sem vermelhos, teste fechado e pedido de produção (só se o usuário pedir) |
| 5. Depois do envio | `fases/5-depois-do-envio.md` | Reprovação resolvida, app publicado, atualização enviada ou assinatura alterada |

Leia também `referencia/armadilhas.md` antes da Fase 2 e o arquivo de aprendizados deste usuário (veja "Aprendizados" abaixo), se existir.

**Se o app também vai para o iPhone:** a skill `ios` do Appship cuida da App Store. Elas dividem a pasta `.assinaturas/` e o mesmo projeto do RevenueCat. O código de compras e o paywall servem para os dois sistemas: se a skill `ios` já fez, reaproveite e só acrescente o que é do Android.

## Memória do processo

Guarde o andamento em `.assinaturas/estado-android.json` (crie se não existir): decisões do usuário (preços, dias de teste, nomes), IDs criados e fases concluídas. Ao ser chamado de novo, leia esse arquivo e continue de onde parou em vez de recomeçar. Se existir `.assinaturas/estado.json` (da skill `ios`), leia também: as decisões de preço e de planos costumam ser as mesmas.

## Ferramentas

- **Google Play:** `scripts/gplay.mjs` nesta pasta. Rode com `node <caminho>/gplay.mjs <comando>` a partir da raiz do projeto do usuário. Detalhes em `referencia/google-api.md`.
- **RevenueCat:** o plugin oficial `RevenueCat` (conector MCP e skills). Se as ferramentas do RevenueCat não estiverem disponíveis, peça para instalar conforme `fases/1-investigar.md`.
- **Build e envio:** `npx eas-cli@latest`.
- **Tela:** se houver ferramenta de navegador (Claude in Chrome), use para os passos sem API. Se não houver, guie o usuário passo a passo, um clique por vez.

## Quando algo der errado

1. Leia a mensagem de erro inteira. Os erros do Google costumam dizer o campo exato.
2. Confira `referencia/armadilhas.md` e os aprendizados do usuário.
3. Se o formato de uma chamada mudou, consulte a documentação oficial (developers.google.com/android-publisher, support.google.com/googleplay/android-developer, revenuecat.com/docs, docs.expo.dev) e ajuste. O script é ponto de partida, pode ser corrigido.
4. Depois de duas tentativas sem sucesso no mesmo passo, pare, explique em uma frase o que travou e ofereça o caminho pela tela.
5. **Aprenda com o erro.** Quando resolver um problema que não estava em `referencia/armadilhas.md` nem nos aprendizados, anote nos aprendizados (abaixo), no formato Sintoma | Causa | Solução. Avise o usuário em uma frase: "Anotei esse erro para não acontecer de novo." Só anote o que foi confirmado, nunca um palpite.

## Aprendizados

Os arquivos do plugin são trocados a cada atualização. Por isso, **nunca escreva dentro da pasta do plugin**. O que você aprende com este usuário fica em:

`${CLAUDE_PLUGIN_DATA}/aprendizados.md`

Essa pasta é do plugin, mas sobrevive às atualizações e vale para todos os apps do usuário (é o mesmo arquivo da skill `ios`). Se o caminho acima aparecer escrito literalmente como `${CLAUDE_PLUGIN_DATA}` (o plugin não foi instalado pelo `/plugin`), use `~/.appship/aprendizados.md`. Crie o arquivo e a pasta se não existirem.

O arquivo tem as seções **Erros resolvidos** (Sintoma | Causa | Solução), **Reprovações da Apple**, **Reprovações do Google** (Política | O que o Google cobrou | Como resolver) e **Checagens automáticas**. Leia no começo de cada uso. Marque com "(Android)" ou "(iOS)" o que só vale para um sistema.

**Erro repetido vira checagem.** Antes de anotar, veja se o mesmo problema (mesmo sintoma e mesma causa, não algo parecido) já está anotado. Se estiver, a anotação não bastou: mova para **Checagens automáticas**, escrita como algo que você confere sozinho (o que olhar e como saber se está certo). Essas checagens rodam em toda autorrevisão (Fase 4, seção 8), em qualquer app do usuário. Só vira checagem o que você consegue conferir sem o usuário (pela API, no código ou nos arquivos). O que depende dele continua como anotação. Avise em uma frase: "Esse erro já tinha acontecido. Agora eu confiro isso sozinho antes de todo envio." O que é só deste app (decisões, IDs, andamento) continua em `.assinaturas/estado-android.json`, no projeto.
