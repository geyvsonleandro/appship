# Fase 5: Depois do envio

O usuário volta depois de enviar o app para o Google. Leia `.assinaturas/estado-android.json`, pergunte (ou descubra) em qual situação ele está e vá direto para ela.

Para ver o estado real: `node <skill>/scripts/gplay.mjs check <pacote>` mostra as faixas e o estado de cada versão. A **Visão geral da publicação** e a **Caixa de entrada** do Play Console mostram aprovação, recusa e avisos de política.

Antes de qualquer chamada nova (lançar, mudar preço, criar plano), **confira o formato na documentação oficial na hora**. As regras de sempre continuam: nada vai para revisão sem o usuário pedir, nada é apagado sem pedido explícito, declarações são clicadas por ele.

## 1. "Fui recusado"

1. **Acalme.** Recusa é comum, principalmente na primeira vez, e quase sempre tem solução.
2. **Peça a mensagem do Google.** Ela chega por e-mail e aparece no Play Console (Caixa de entrada e Visão geral da publicação). Peça para colar o texto ou mandar um print.
3. **Identifique a política.** A mensagem cita a política (ex.: "Política de dados do usuário", "Segurança dos dados", "Funcionalidade mínima") e às vezes mostra onde está o problema. Abra a política na hora na central de políticas (https://play.google/developer-content-policy/) e leia o texto atual.
4. **Explique em poucas linhas:** o que o Google pediu, o que você vai mudar e se precisa de build novo.
5. **Resolva:**
   - **Só na loja ou nas declarações** (texto, imagem, link, Segurança dos dados, Acesso ao app): corrija pela API ou pela tela. Não precisa de build.
   - **No app:** corrija o código, gere novo build (o `versionCode` sobe sozinho com `autoIncrement`) e envie (Fase 3, passos 3 e 4) para a mesma faixa.
   - **Discordância:** se a recusa parecer errada, existe o pedido de recurso (link na própria mensagem do Google). Escreva um texto educado e objetivo, em inglês, mostrando onde está o que o Google pediu.
6. Rode a **autorrevisão** (Fase 4, seção 8) de novo e reenvie só quando o usuário pedir.
7. **Aprenda:** anote na seção **Reprovações do Google** do arquivo de aprendizados (veja "Aprendizados" no `SKILL.md`) a política, o que o Google cobrou e como resolveu. Nas próximas autorrevisões, desse app ou de outro, confira esses itens. Só o que o Google de fato cobrou.

**Avisos mais graves** (app removido, suspenso, conta com advertência): leia a mensagem com calma, explique as consequências e não tente "contornar". O caminho é corrigir e, se for o caso, recorrer.

## 2. "Fui aprovado"

1. **Comemore com ele.**
2. **Teste fechado aprovado:** mande o link de participação para os testadores e acompanhe os 14 dias (Fase 4, seção 9). Lembre o usuário de pedir o acesso à produção quando completar.
3. **Produção aprovada:** a versão vai para a loja (pode levar algumas horas para aparecer na busca). Para as próximas versões, explique a **publicação gerenciada** (o usuário escolhe quando a versão aprovada entra no ar) e o **lançamento gradual** (porcentagem dos usuários). Leia na hora a ajuda de cada um.
4. Confira que as **assinaturas** estão ativas (`sub-status`).
5. Mande o link da página do app na Google Play (`https://play.google.com/store/apps/details?id=<pacote>`).
6. Onde acompanhar as vendas: painel do RevenueCat e Play Console > Relatórios financeiros.
7. Atualize `.assinaturas/estado-android.json`.

## 3. "Quero atualizar o app"

1. **Pergunte o que muda.** Decida com ele o caminho:
   - **Correção pequena só no JavaScript:** pode ir por atualização pelo ar (EAS Update), sem revisão. Não pode mudar o propósito do app nem driblar a revisão. Mudança em biblioteca nativa, permissão, ícone ou `app.json` exige build.
   - **Função nova ou mudança nativa:** nova versão na loja.
2. **Nova versão:**
   1. Aumente a versão no `app.json` (ex.: 1.0.0 para 1.1.0). O `versionCode` o EAS aumenta sozinho com `autoIncrement`.
   2. Gere o build e envie (Fase 3, passos 3 e 4). Teste no teste interno.
   3. Escreva as **notas da versão** (o que mudou), curtas, na língua da loja.
   4. Se mudaram telas importantes, ofereça trocar as imagens (Fase 4, seção 4).
   5. Se o app passou a coletar algo novo ou a pedir permissão nova, atualize a **Segurança dos dados** (Fase 4, seção 6).
   6. Promova para produção, rode a autorrevisão e envie só quando ele pedir.

## 4. "Quero mudar o preço ou criar um plano"

Leia na hora a ajuda do Play Console sobre mudança de preço de assinatura e a documentação do RevenueCat.

- **Mudar preço:** explique a escolha antes: manter o preço antigo para quem já assina (o Google chama de "legado") ou migrar quem já assina para o preço novo. Aumento para quem já assina tem regras de aviso e, em alguns casos, de aceite: confira o texto atual do Google e explique ao usuário. Mostre a conversão com `gplay.mjs prices` antes. O código não muda: o preço vem da loja.
- **Plano novo** (ex.: semanal): novo plano base na mesma assinatura (acrescente no `assinaturas-android.json` e rode `sub-setup`, que só cria o que falta), depois o produto no RevenueCat (`premium:<plano>`), anexe ao entitlement e a um pacote da offering. Confira se o paywall mostra o plano novo sem mudar código.
- **Ofertas:** teste grátis, preço de entrada, ofertas para quem cancelou. Explique cada uma em uma frase e faça a que ele escolher.
- **Tirar um plano de venda:** não apague. Desative o plano base (quem já assina continua) e tire da offering no RevenueCat.

Ao terminar, atualize `.assinaturas/estado-android.json`.
