# Appship by GG

Leva seu app iOS ou Android do código até a loja, conversando com o Claude. Ele configura as assinaturas (mensal, anual, teste grátis), o paywall e o RevenueCat, gera o build, coloca no TestFlight ou no teste interno do Google, preenche a página da loja, faz uma autorrevisão antes do envio e cuida do que vem depois (reprovação, lançamento, atualização, mudança de preço).

Criado por **Geyvson Leandro, Engenheiro de IA**.

Versão 1.0.0.
| Plataforma | Comando |
|---|---|
| iPhone (App Store) | `/appship:ios` |
| Android (Google Play) | `/appship:android` |
| Android (Google Play) | `/appship:android` | Testado em conta real do Google até a compra de teste no celular |

## Instalar

**No VS Code:** no chat do Claude, digite `/plugins` e clique em **Manage plugins**.

1. Aba **Marketplaces**: digite `geyvsonleandro/appship` e clique em **Add**.
2. Aba **Plugins**: procure `appship` e clique em **Install** (escolha **Install for you**).

**No Claude Code pelo terminal:** digite um comando por vez:

```
/plugin marketplace add geyvsonleandro/appship
/plugin install appship@geyvsonleandro
```

Depois, abra uma conversa nova dentro do projeto do seu app e digite `/appship:ios` ou `/appship:android`. Ou peça: "quero colocar assinatura no meu app e publicar na loja".

## Receber as atualizações

**No VS Code ou no app Claude** (no VS Code, digite `/plugins`; no app, botão **+** > **Plugins**). Abra **Manage plugins** e tente nesta ordem:

1. **Atualizar:** aba **Plugins** > ícone de atualizar (↻) ao lado de `appship`.
2. **Se não atualizar, desinstale e instale de novo:** aba **Marketplaces** > ↻ ao lado de `geyvsonleandro` (para a lista pegar a versão nova). Depois, aba **Plugins** > remova o `appship` > instale de novo (**Install for you**).

Depois, abra uma conversa nova para usar a versão nova.

**No terminal:** ligue uma vez `/plugin` > **Marketplaces** > `geyvsonleandro` > **Enable auto-update**, ou atualize quando quiser em `/plugin` > **Installed** > `appship` > **Update now**.

## Estrutura

- `skills/ios/` e `skills/android/`: uma pasta por plataforma.
  - `SKILL.md`: regras e visão geral.
  - `fases/`: uma fase por arquivo (investigar, configurar, teste, revisão ou publicação, depois do envio).
  - `referencia/`: armadilhas conhecidas e referência da API da loja.
  - `scripts/`: ajudantes da API da loja (`asc.mjs` para a Apple, `gplay.mjs` para o Google; Node, sem dependências).

© 2026 Geyvson Leandro. Todos os direitos reservados. Uso conforme o arquivo [LICENSE](LICENSE).
