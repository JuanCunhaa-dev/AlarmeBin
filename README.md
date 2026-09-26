# AlarmeBin

Aplicativo desktop de alarmes pessoais para Windows, com gravação de voz integrada, escolha da saída de áudio por alarme e sincronização opcional entre computadores.

## Usar o aplicativo

Baixe o arquivo `AlarmeBin-Private-Kit-x.y.z.zip` na página de Releases. Extraia os arquivos juntos e execute `Instalar-AlarmeBin.cmd`. O kit verifica o certificado público, confia nele apenas para o usuário atual e só abre o instalador se a assinatura for exatamente a esperada.

> O certificado é privado e foi criado para computadores pessoais controlados pelo proprietário. Ele não substitui uma identidade pública da Microsoft Store e não deve ser instalado em computadores de terceiros.

1. Clique em **Novo alarme**.
2. Escolha horário e dias.
3. Escolha o tratamento da voz, grave a mensagem e clique em parar. **Voz natural** preserva o timbre; use redução de ruído apenas para ventilador ou ruído constante e cancelamento de eco apenas quando houver som saindo pelas caixas.
4. Selecione a caixa, fone ou monitor em **Onde vai tocar** e use **Testar**.
5. Salve.

O áudio sempre termina o ciclo atual. Ele é repetido em ciclos inteiros até totalizar pelo menos 30 segundos; um áudio de 16 segundos toca duas vezes (32 segundos). Quando acaba ou é fechado, aquele alarme é desativado.

> O Windows precisa estar ligado e acordado no horário. Fechar a janela apenas envia o app para a bandeja; use **Sair** no ícone da bandeja para encerrar de verdade.

## Sincronização opcional

O app funciona localmente sem conta. Para usar os mesmos alarmes em outros PCs:

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com/).
2. Crie um **Realtime Database**.
3. Configure regras de leitura e escrita adequadas ao uso pretendido.
4. Em **Configurações** no app, cole a URL do banco e use a mesma chave compartilhada em cada PC.

Sem autenticação, quem souber a URL e a chave compartilhada poderá acessar esses dados. A gravação de voz faz parte dos dados sincronizados, então use uma chave longa e mantenha a URL privada.

## Desenvolvimento

```bash
npm install
npm run dev
```

Validação e empacotamento local assinado:

```bash
npm run check
npm test
npm run test:e2e
npm run dist
```

`npm run dist` exige que o certificado privado de release esteja no repositório de certificados do Windows. A chave privada nunca fica neste repositório. O certificado público e sua impressão digital podem ser auditados em [`distribution/`](distribution/).

## Releases assinadas

Tags no formato `v*` acionam o workflow `Signed private release`. O workflow:

1. Restaura o certificado a partir de secrets criptografados do GitHub.
2. Executa lint, TypeScript e testes.
3. Assina o aplicativo e o instalador.
4. Recusa a publicação se a assinatura ou o thumbprint divergirem.
5. Publica o instalador e o kit privado na página de Releases.

Identidade esperada:

```text
Subject: CN=AlarmeBin Private Publisher
SHA-1: EF93510E6694345DCA8A960D634E0EA1C202D87D
Validade: 26/09/2026 a 26/09/2036
```

Os secrets necessários são `WINDOWS_CERTIFICATE_BASE64` e `WINDOWS_CERTIFICATE_PASSWORD`. Nunca coloque um arquivo `.pfx` ou sua senha no Git.
