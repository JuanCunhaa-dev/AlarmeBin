# Segurança

## Assinatura privada

As releases privadas do AlarmeBin são assinadas pela identidade:

```text
CN=AlarmeBin Private Publisher
SHA-1: EF93510E6694345DCA8A960D634E0EA1C202D87D
```

O certificado público está em `distribution/AlarmeBin-Public.cer`. A chave privada não faz parte do repositório e é disponibilizada ao workflow somente por GitHub Actions Secrets.

O instalador privado adiciona confiança apenas ao usuário atual e verifica a assinatura Authenticode antes de executar qualquer `.exe`. Não instale o certificado em máquinas que você não controla.

## Relatando uma vulnerabilidade

Não publique gravações, configurações do Firebase ou outros dados pessoais em uma issue. Entre em contato diretamente com o mantenedor pelo perfil do GitHub.
