# Armadilhas conhecidas

Erros reais que já aconteceram neste processo. Confira aqui antes de investigar do zero.

## Apple

| Sintoma | Causa | Solução |
|---|---|---|
| Planos não carregam no app | Acordo de apps pagos, banco ou impostos não estão Ativos | Resolver em Negócios. Pode levar um dia para ativar |
| Aviso amarelo de contrato continua depois de aceitar | Atraso da Apple | Esperar e atualizar a página |
| ID de produto recusado como "já usado" | Foi apagado antes. A Apple não deixa reusar | Usar outro ID. Por isso nunca apague produtos |
| Assinatura em "Missing Metadata" | Falta idioma, preço, disponibilidade ou print de revisão | Rodar `sub-status` e completar o que falta |
| Assinatura criada não aparece no app | Pode levar até 1 hora | Esperar |
| Teste grátis não aparece no TestFlight logo depois do `sub-setup` | A oferta nova leva até 1 hora para chegar aos aparelhos | Esperar antes de comprar. Quem compra sem o teste perde o direito a ele naquele Apple ID |
| `.p8` perdido | A Apple só deixa baixar uma vez | Revogar a chave e gerar outra |
| Botão "Adicionar para revisão" na assinatura | A primeira assinatura tem que ir junto com uma versão do app | Não clicar. Seguir a Fase 4 |
| `asc.mjs request` dá "ERRO: fetch failed" no Windows | O Git Bash troca `/v1/...` por `C:/Program Files/Git/v1/...` | O script já desfaz isso. Se persistir, rode com `MSYS_NO_PATHCONV=1` antes do comando |
| Imagem da página dá `ASSET_FAILED` no envio | PNG com transparência (canal alfa). Redimensionar com `Bitmap` padrão do .NET cria alfa sem avisar | Regravar sem alfa (fundo branco, 24 bits) e no tamanho exato (1206×2622) antes de enviar. Tipo do conjunto: `APP_IPHONE_61` |

| POST em `appStoreVersionLocalizations` dá 409 DUPLICATE | Criar o idioma no `appInfo` já cria o mesmo idioma na versão | Fazer GET antes e editar (PATCH) o que já existe |
| `GET` em `ageRatingDeclarations` dá 403 | Esse recurso só aceita PATCH | Ler por `/v1/appInfos/<id>?include=ageRatingDeclaration` |
| `appPriceSchedule` ou `v2/appAvailabilities` dão 404 | Preço e países do app ainda não existem | Criar com POST (Fase 4, seção 8), não editar |
| PATCH de `primaryLocale` dá 409 MISSING_SCREENSHOTS_PRIMARY_LOCALE | O novo idioma ainda não tem imagens | Enviar as imagens no novo idioma e trocar depois |

## RevenueCat

| Sintoma | Causa | Solução |
|---|---|---|
| Ferramentas do RevenueCat não aparecem depois de instalar o plugin | Plugin não ficou ativado | Conferir `enabledPlugins` no `~/.claude/settings.json` e reiniciar (Fase 2, passo 2) |
| "Invalid API key. The native store is not available when running inside Expo Go" | Chave `appl_` usada no Expo Go, que não tem a loja da Apple | Usar a `test_` no Expo Go (detecção por `expo-constants`) |
| App do TestFlight fecha ao abrir | Chave `test_` foi parar no build real | A `test_` nunca vai para o EAS. Só a `appl_` |
| Erro sumiu mas "não foi possível carregar os planos" no Expo Go | A offering não tem produtos da Test Store | Criar produtos na Test Store e anexar aos pacotes |
| Compra passa mas o app não libera nada | Produto não está anexado ao entitlement `premium` | Anexar todos os produtos ao entitlement |
| `offerings.current` vem vazio | Offering não está marcada como atual, ou pacotes sem produto | Marcar como atual e conferir os pacotes |
| `.monthly` ou `.annual` vem vazio | Pacote criado como Custom | Usar os identificadores `$rc_monthly` e `$rc_annual` |
| Não dá para apagar a offering padrão | Regra do RevenueCat | Tornar outra offering padrão primeiro |
| Preço em dólar no Expo Go | A Test Store só tem dólar | Normal. No build real aparece a moeda da conta Apple |
| Produto "Missing Metadata" no RevenueCat | O produto ainda não existe na Apple, ou a chave B não foi enviada | Criar na Apple e enviar a chave de Compras dentro do app |
| `create-app` dá erro 422 "Both Apple's Subscription Key ID and Private Key must be provided" | A ferramenta não aceita o arquivo `.p8`, só o ID | Criar o app só com o `bundle_id` e enviar a chave B pelo painel (Fase 2, passo 7) |

## Expo e EAS

| Sintoma | Causa | Solução |
|---|---|---|
| Build falha em "Install dependencies" com `npm ci` e "Missing ... from lock file" | Node do servidor EAS diferente do Node da máquina | Fixar `"node": "<versão local>"` no perfil do `eas.json` |
| App do build sem as chaves | `.env` não sobe no build | Cadastrar as variáveis com `eas env:set` e usar `"environment": "production"` |
| QR code não abre mais no Expo Go | `expo-dev-client` instalado | Desinstalar, se o usuário testa pelo Expo Go |
| Mudou o `.env` e o app não percebeu | Cache | `npx expo start --clear` |
| Lint quebra com "Cannot find native binding" no Windows | Falta o Visual C++ Redistributable x64 | Instalar. Não é problema do código |
| Apple recusa o build enviado | Número de build repetido | `autoIncrement: true` no perfil |
| Pergunta de criptografia a cada envio | Falta a declaração | `ios.config.usesNonExemptEncryption: false` no `app.json` |
| No Windows, o Node mostra "Assertion failed ... async.c" quando um script sai com erro | Ruído do próprio Node | Ignorar e ler a mensagem de erro de verdade, que vem antes |
| `env:list` falha com "Nonexistent flag: --non-interactive" | Esse comando não aceita a opção | Usar `npx eas-cli@latest env:list production --format short` |

## Revisão da Apple (motivos comuns de rejeição)

- Falta restaurar compras.
- Falta exclusão de conta dentro do app.
- Paywall sem preço, duração ou termos claros perto do botão.
- Links de Termos ou Privacidade quebrados ou de exemplo.
- Privacidade do app não bate com o que o app coleta.
- Revisor não conseguiu entrar: falta conta de demonstração.
- Assinaturas não foram incluídas na versão enviada.
