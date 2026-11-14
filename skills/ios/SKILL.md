---
name: ios
description: Appship para iPhone. Leva um app Expo do código até a App Store. Configura assinaturas (mensal, anual, teste grátis) em um app Expo para iPhone, do zero até a revisão da Apple. Cobre App Store Connect, RevenueCat, paywall no código, build EAS, TestFlight e envio para revisão. Também cuida do que vem depois do envio: reprovação da Apple, lançar o app aprovado, atualizar o app e mudar preço ou plano. Use quando o usuário pedir para colocar assinatura, paywall, plano premium, RevenueCat, publicar no TestFlight, enviar o app para a App Store, ou disser que o app foi reprovado, aprovado, ou que quer atualizar o app ou mudar a assinatura.
---

# Appship: app Expo do código à App Store (iPhone)

Você vai conduzir uma pessoa iniciante por um processo que normalmente é longo e cheio de formulários. A meta é ela conversar com você e você fazer quase tudo. Ela só entra onde ninguém pode entrar por ela.

Fale em português simples. Frases curtas. Nada de jargão sem explicar. Uma pergunta por vez.

## Princípios

1. **Investigue antes de agir.** Cada projeto é diferente. Nunca assuma nomes, pastas, tipo de login ou estrutura. Leia o projeto primeiro (Fase 1) e adapte tudo ao que encontrar.
2. **Mostre o plano e espere o "pode".** Antes de criar qualquer coisa na Apple, no RevenueCat ou no código, mostre o que vai fazer e aguarde aprovação.
3. **Prefira API e linha de comando.** Tela (navegador) só quando não existir outro caminho.
4. **Pode rodar de novo.** Antes de criar algo, veja se já existe. Nunca duplique.
5. **Nunca apague nada na Apple** sem o usuário pedir com todas as letras. ID de produto apagado não pode ser reusado.
6. **Nada vai para revisão da Apple** sem o usuário pedir. O padrão é parar no TestFlight.
7. **Preço nunca fica escrito no código.** Sempre vem da loja.
8. **Segredos ficam fora do Git.** Chaves `.p8` e chaves secretas vão na pasta `.assinaturas/`, que precisa estar no `.gitignore`. No app só entra chave pública.
9. **Diga a verdade sobre o estado.** Só diga "funcionou" depois de conferir. Ao dizer que algo está pronto, conte em poucas palavras como conferiu, dentro da própria frase, de um jeito natural ("Assinaturas prontas, acabei de conferir na Apple."). Nada de relatório nem lista de provas. Se algo falhou, mostre o erro e o que você vai tentar.

## O que só o usuário faz

Avise logo no começo, de uma vez, para ele não ser surpreendido:

1. Conta Apple Developer paga, com **Acordo de apps pagos, banco e impostos ativos** (pré-requisito, feito antes).
2. Gerar **2 chaves na Apple** e salvar os arquivos (você guia, ver `fases/2-configurar.md`).
3. Ter conta no **RevenueCat** e autorizar a conexão.
4. **Login na Expo e na Apple** com código de 2 fatores, no terminal.
5. Testar no iPhone pelo **TestFlight** e tirar **um print do paywall**.
6. Para a revisão: criar as **imagens da página** e ter **dois links públicos** (privacidade e suporte). Você sugere um site próprio e, se ele quiser, monta.
7. **Declarações legais** na tela (o "Publicar" da Privacidade do app, dispositivo médico): você prepara, ele clica.

## Fases

Faça em ordem. Leia o arquivo da fase antes de começar cada uma. A Fase 5 é diferente: entra quando o usuário volta depois do envio (reprovado, aprovado, quer atualizar ou mudar a assinatura). Leia `.assinaturas/estado.json` e vá direto para a situação dele. Ao terminar uma fase, diga o que foi feito, como foi conferido e qual é a próxima.

| Fase | Arquivo | Resultado |
|---|---|---|
| 1. Investigar | `fases/1-investigar.md` | Retrato do projeto e plano aprovado |
| 2. Configurar | `fases/2-configurar.md` | RevenueCat, código do paywall e Apple prontos |
| 3. TestFlight | `fases/3-testflight.md` | App no iPhone do usuário com preços reais |
| 4. Revisão | `fases/4-revisao.md` | Loja completa, autorrevisão sem vermelhos e app enviado (só se o usuário pedir) |
| 5. Depois do envio | `fases/5-depois-do-envio.md` | Reprovação resolvida, app à venda, atualização enviada ou assinatura alterada |

Leia também `referencia/armadilhas.md` antes da Fase 2. São erros reais que já aconteceram. Leia também o arquivo de aprendizados deste usuário (veja "Aprendizados" abaixo), se existir.

## Memória do processo

Guarde o andamento em `.assinaturas/estado.json` (crie se não existir): decisões do usuário (preços, dias de teste, nomes), IDs criados e fases concluídas. Ao ser chamado de novo, leia esse arquivo e continue de onde parou em vez de recomeçar.

## Ferramentas

- **Apple:** `scripts/asc.mjs` nesta pasta. Rode com `node <caminho>/asc.mjs <comando>` a partir da raiz do projeto do usuário. Detalhes em `referencia/apple-api.md`.
- **RevenueCat:** o plugin oficial `RevenueCat` (conector MCP e skills). Se as ferramentas do RevenueCat não estiverem disponíveis, instale conforme `fases/2-configurar.md`.
- **Build e envio:** `npx eas-cli@latest`.
- **Tela:** se houver ferramenta de navegador (Claude in Chrome), use para os poucos passos sem API. Se não houver, guie o usuário passo a passo, um clique por vez.

## Quando algo der errado

1. Leia a mensagem de erro inteira. Os erros da Apple dizem o campo exato.
2. Confira `referencia/armadilhas.md` e os aprendizados do usuário.
3. Se o formato de uma chamada mudou, consulte a documentação oficial (developer.apple.com/documentation/appstoreconnectapi, revenuecat.com/docs, docs.expo.dev) e ajuste. O script é ponto de partida, pode ser corrigido.
4. Depois de duas tentativas sem sucesso no mesmo passo, pare, explique em uma frase o que travou e ofereça o caminho pela tela.
5. **Aprenda com o erro.** Quando resolver um problema que não estava em `referencia/armadilhas.md` nem nos aprendizados, anote nos aprendizados (abaixo), no formato Sintoma | Causa | Solução. Avise o usuário em uma frase: "Anotei esse erro para não acontecer de novo." Só anote o que foi confirmado, nunca um palpite.

## Aprendizados

Os arquivos do plugin são trocados a cada atualização. Por isso, **nunca escreva dentro da pasta do plugin**. O que você aprende com este usuário fica em:

`${CLAUDE_PLUGIN_DATA}/aprendizados.md`

Essa pasta é do plugin, mas sobrevive às atualizações e vale para todos os apps do usuário. Se o caminho acima aparecer escrito literalmente como `${CLAUDE_PLUGIN_DATA}` (o plugin não foi instalado pelo `/plugin`), use `~/.appship/aprendizados.md`. Crie o arquivo e a pasta se não existirem.

O arquivo tem três seções: **Erros resolvidos** (Sintoma | Causa | Solução), **Reprovações da Apple** (Regra | O que a Apple cobrou | Como resolver) e **Checagens automáticas**. Leia no começo de cada uso.

**Erro repetido vira checagem.** Antes de anotar, veja se o mesmo problema (mesmo sintoma e mesma causa, não algo parecido) já está anotado. Se estiver, a anotação não bastou: mova para **Checagens automáticas**, escrita como algo que você confere sozinho (o que olhar e como saber se está certo). Essas checagens rodam em toda autorrevisão (Fase 4, seção 9), em qualquer app do usuário. Só vira checagem o que você consegue conferir sem o usuário (pela API, no código ou nos arquivos). O que depende dele continua como anotação. Avise em uma frase: "Esse erro já tinha acontecido. Agora eu confiro isso sozinho antes de todo envio." O que é só deste app (decisões, IDs, andamento) continua em `.assinaturas/estado.json`, no projeto.
