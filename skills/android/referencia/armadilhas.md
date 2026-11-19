# Armadilhas conhecidas

Problemas que a documentação oficial avisa ou que já aconteceram neste processo. Confira aqui antes de investigar do zero. Os itens marcados com "(doc)" vêm da documentação e ainda não foram vistos num teste real: se o comportamento for outro, corrija nos aprendizados.

## Google Play

| Sintoma | Causa | Solução |
|---|---|---|
| Faixa de produção bloqueada | Conta pessoal nova sem o teste fechado de 12 testadores por 14 dias (doc) | Fazer o teste fechado e pedir o acesso à produção (Fase 4, seção 9) |
| Não aparece a opção de criar assinatura | Nenhum build com a biblioteca de cobrança enviado, ou sem perfil de pagamentos (doc) | Enviar o build para o teste interno (Fase 3) e criar o perfil de pagamentos |
| Envio do EAS recusado com "Only releases with status draft may be created on draft app" | O app ainda não terminou a configuração no Play Console | `releaseStatus: "draft"` no `eas.json` e lançar a versão pela tela (Fase 3, passo 6) |
| `gplay.mjs` dá 401/403 ("The caller does not have permission") logo depois de convidar a conta de serviço | O Google demora para liberar a permissão, ou falta permissão no convite | Conferir as permissões em Usuários e permissões. Esperar e tentar de novo |
| Erro ao criar a chave JSON no Google Cloud ("criação de chave desativada") | Política da organização do Google Cloud (contas de empresa) | Usar um projeto fora da organização ou pedir ao administrador para liberar |
| ID de assinatura ou plano recusado como já usado | Foi apagado antes. O Google não deixa reusar | Usar outro ID. Por isso nunca apague |
| Pacote não pode mudar | O pacote fica preso ao app no primeiro envio | Escolher certo na Fase 1. Pacote novo = app novo no Play Console |
| Imagem de destaque recusada | PNG com transparência (doc) | Regravar sem transparência, 1024×500 |
| Login do Google funciona no teste local e falha na versão da Play Store | A SHA-1 cadastrada é a do computador, não a da Assinatura de apps do Google Play | Cadastrar a SHA-1 que aparece em Integridade do app, no Play Console |

## RevenueCat

| Sintoma | Causa | Solução |
|---|---|---|
| "Invalid Play Store credentials" | Chave nova do Google ainda não validada: pode levar até 36 horas (doc) | Esperar. Não apagar a chave no Google Cloud. Conferir as permissões da conta de serviço |
| Compra passa no Google mas o app não libera | Chave do Google ainda não validada no RevenueCat, ou produto fora do entitlement | Esperar a validação e restaurar; anexar todos os produtos ao entitlement `premium` |
| Planos não carregam no teste interno | App instalado por fora da Play Store, conta do celular fora da lista de testadores, ou várias contas no celular (doc) | Instalar pelo link de participação, com uma conta só, que esteja na lista |
| Na compra aparece cartão de verdade | A conta não está no teste de licença (doc) | Acrescentar o e-mail em Teste de licença (Fase 3, passo 5) |
| Produto "não encontrado" no RevenueCat | O ID não segue `assinatura:plano`, ou a assinatura não existe no Google | Conferir o `idRevenueCat` no `sub-status` |
| Offerings vazias com aviso de SDK antigo | Biblioteca antiga só enxerga produtos marcados como compatíveis (doc) | Usar `react-native-purchases` atual |
| `.monthly` ou `.annual` vem vazio | Pacote criado como Custom | Usar `$rc_monthly` e `$rc_annual` |

## Expo e EAS

| Sintoma | Causa | Solução |
|---|---|---|
| Build falha em "Install dependencies" com `npm ci` e "Missing ... from lock file" | Node do servidor EAS diferente do Node da máquina | Fixar `"node": "<versão local>"` no perfil do `eas.json` |
| App do build sem as chaves | `.env` não sobe no build | Cadastrar as variáveis com `eas env:create` e usar `"environment": "production"` |
| App da loja fecha ao abrir | Chave da Test Store foi parar no build real | A chave de teste nunca vai para o EAS |
| Google recusa o build por número repetido | `versionCode` repetido | `autoIncrement: true` e `appVersionSource: "remote"` |
| Permissão de microfone aparece sem o app gravar áudio | `expo-audio`/`expo-av` declaram por padrão | `["expo-audio", { "recordAudioAndroid": false }]` ou `android.blockedPermissions` |
| `env:list` falha com "Nonexistent flag: --non-interactive" | Esse comando não aceita a opção | `npx eas-cli@latest env:list production --format short` |
| No Windows, o Node mostra "Assertion failed ... async.c" quando um script sai com erro | Ruído do próprio Node | Ignorar e ler a mensagem de erro de verdade, que vem antes |

## Revisão do Google (motivos comuns de recusa)

- Falta excluir conta dentro do app ou o link web de exclusão.
- Segurança dos dados não bate com o que o app coleta.
- Política de privacidade ausente, quebrada ou só na loja.
- Revisor não conseguiu entrar: falta conta de demonstração em Acesso ao app.
- Permissões que o app não usa.
- Metadados com preço, "grátis", "melhor" ou imagens de outra plataforma.
