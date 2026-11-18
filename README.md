# Appship by GG

Leva seu app iOS ou Android do código até a loja, conversando com o Claude. Ele configura as assinaturas (mensal, anual, teste grátis), o paywall e o RevenueCat, gera o build, coloca no TestFlight, preenche a página da loja, faz uma autorrevisão antes do envio e cuida do que vem depois (reprovação, lançamento, atualização, mudança de preço).

Criado por **Geyvson Leandro, Engenheiro de IA**.

Versão 1.0.0. Testado em conta real da Apple até antes do envio para revisão.

Plataforma: iPhone (App Store). Comando: `/appship:ios`.

## Instalar (Claude Code)

No chat do Claude Code, digite um comando por vez:

```
/plugin marketplace add geyvsonleandro/appship
/plugin install appship@geyvsonleandro
```

Depois, abra uma conversa nova dentro do projeto do seu app e digite `/appship:ios`, ou peça: "quero colocar assinatura no meu app e publicar na App Store".

## Receber as atualizações

Ligue uma vez: `/plugin` > **Marketplaces** > `geyvsonleandro` > **Enable auto-update**.

Ou atualize quando quiser: `/plugin` > **Installed** > `appship` > **Update now**.

## Estrutura

- `skills/ios/SKILL.md`: regras e visão geral.
- `skills/ios/fases/`: uma fase por arquivo (investigar, configurar, TestFlight, revisão, depois do envio).
- `skills/ios/referencia/`: armadilhas conhecidas e referência da API da Apple.
- `skills/ios/scripts/asc.mjs`: ajudante da API do App Store Connect (Node, sem dependências).

© 2026 Geyvson Leandro. Todos os direitos reservados. Uso conforme o arquivo [LICENSE](LICENSE).
