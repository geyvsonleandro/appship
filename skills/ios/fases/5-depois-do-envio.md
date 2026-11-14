# Fase 5: Depois do envio

O usuário volta depois de enviar o app para a Apple. Leia `.assinaturas/estado.json`, pergunte (ou descubra) em qual situação ele está e vá direto para ela.

Para ver o estado real do app, leia as versões: `node <skill>/scripts/asc.mjs request GET "/v1/apps/<APP ID>/appStoreVersions?filter[platform]=IOS"`. O campo de estado diz se está em revisão, reprovado, aprovado esperando lançamento ou à venda. Os nomes dos estados mudam com o tempo: confira na documentação da API (developer.apple.com/documentation/appstoreconnectapi) o que cada valor significa.

Antes de qualquer chamada nova (lançar, criar versão, mudar preço), **confira o formato na documentação oficial na hora**. As regras de sempre continuam: nada vai para a Apple sem o usuário pedir, nada é apagado sem pedido explícito, declarações legais são clicadas por ele.

## 1. "Fui reprovado"

1. **Acalme.** Reprovação é comum, principalmente na primeira vez, e quase sempre tem solução.
2. **Peça a mensagem da Apple.** Ela chega por e-mail e fica no App Store Connect, na página do app (aviso no topo da versão). A API não mostra essa mensagem: peça para o usuário colar o texto ou mandar um print.
3. **Identifique a regra.** A mensagem cita um número (ex.: "Guideline 3.1.2"). Abra as Diretrizes na hora (https://developer.apple.com/app-store/review/guidelines/) e leia o texto atual dessa regra.
4. **Explique em poucas linhas:** o que a Apple pediu, o que você vai mudar e se precisa de build novo.
5. **Resolva:**
   - **Só na loja** (texto, imagem, link, nota, conta de demonstração): corrija pela API. Não precisa de build.
   - **No app:** corrija o código, aumente a versão do build e gere novo build (Fase 3, passos 3 e 4). Ligue o build novo à mesma versão.
   - **Pedido de informação** (a Apple só fez uma pergunta, "Guideline 2.1 - Information Needed"): escreva a resposta para o usuário colar na conversa com a Apple. Não muda nada no app.
   - **Discordância:** se a reprovação parecer errada, escreva uma resposta educada explicando onde está o que a Apple pediu (com o caminho no app). Se não resolver, existe o pedido de recurso (App Review Board).
6. **Resposta à Apple:** escreva em inglês, curta, dizendo o que foi corrigido. O usuário cola na conversa da revisão (é pela tela).
7. Rode a **autorrevisão** (Fase 4, seção 9) de novo e reenvie só quando o usuário pedir.
8. **Aprenda:** anote na seção **Reprovações da Apple** do arquivo de aprendizados (veja "Aprendizados" no `SKILL.md`) a regra, o que a Apple cobrou e como resolveu. Nas próximas autorrevisões, desse app ou de outro, confira esses itens junto com a tabela da Parte B. Só o que a Apple de fato cobrou.

## 2. "Fui aprovado"

1. **Comemore com ele.**
2. Veja como a versão foi configurada para lançar:
   - **Automático:** já está à venda (pode levar algumas horas para aparecer na busca).
   - **Manual:** a versão fica esperando o lançamento. Pergunte se pode lançar agora. Com o "pode", lance pela API (pedido de lançamento da versão) ou mande o link da página para ele clicar.
   - **Data marcada:** confirme a data com ele.
3. **Lançamento em fases (opcional, só para atualizações):** a Apple libera a atualização automática aos poucos, em 7 dias. Explique e pergunte se ele quer. Na primeira versão não faz diferença.
4. Confira que as **assinaturas** também foram aprovadas (`sub-status <bundle>`).
5. Mande o link da página do app na App Store para ele compartilhar.
6. Explique onde acompanhar as vendas: painel do RevenueCat (assinantes, receita, testes grátis) e App Store Connect > Tendências.
7. Atualize `.assinaturas/estado.json`.

## 3. "Quero atualizar o app"

1. **Pergunte o que muda.** Decida com ele o caminho:
   - **Correção pequena só no JavaScript:** pode ir por atualização pelo ar (EAS Update), sem revisão. Não pode acrescentar função nova nem mudar o propósito do app (regra 2.5.2). Mudança em biblioteca nativa, permissão, ícone ou `app.json` exige build.
   - **Função nova ou mudança nativa:** nova versão na loja.
2. **Nova versão:**
   1. Aumente a versão no `app.json` (ex.: 1.0.0 para 1.1.0). O número do build o EAS aumenta sozinho se `autoIncrement` estiver ligado.
   2. Crie a versão no App Store Connect pela API com o mesmo número.
   3. Gere o build e envie (Fase 3, passos 3 e 4). Teste no TestFlight.
   4. Escreva o texto de **Novidades** (o que mudou), curto, na língua da loja, e grave pela API.
   5. Se mudaram telas importantes, ofereça trocar as imagens da página (Fase 4, seção 4).
   6. Se o app passou a coletar algo novo, atualize a Privacidade do app (Fase 4, seção 7).
   7. Rode a autorrevisão e envie só quando ele pedir. Pergunte antes se quer lançamento automático ou manual.

## 4. "Quero mudar o preço ou criar um plano"

Leia na hora as regras atuais da Apple sobre mudança de preço e ofertas (https://developer.apple.com/app-store/subscriptions/) e a documentação do RevenueCat.

- **Mudar preço:** explique a escolha antes de mudar: manter o preço antigo para quem já assina, ou aplicar a todos. Aumento para quem já assina tem regras de aviso e, em alguns casos, de consentimento: confira o texto atual da Apple e explique ao usuário. O preço novo vem da tabela de preços da Apple (o script mostra os mais próximos). O código não muda: o preço vem da loja.
- **Plano novo** (ex.: semanal, vitalício): crie no mesmo grupo de assinatura na Apple, depois o produto no RevenueCat (App Store e Test Store), anexe ao entitlement e a um pacote da offering. Confira se o paywall mostra o plano novo sem mudar código; se não, ajuste. Plano novo vai para revisão da Apple: pergunte antes de enviar.
- **Ofertas:** teste grátis ou preço de entrada para novos assinantes, ofertas para quem já assinou e cancelou, códigos de oferta. Explique cada uma em uma frase e faça a que ele escolher.
- **Tirar um plano de venda:** não apague. Tire o plano das vendas na Apple e da offering no RevenueCat. Quem já assina continua.

Ao terminar, atualize `.assinaturas/estado.json`.
