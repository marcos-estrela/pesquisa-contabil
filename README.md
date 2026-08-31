# pesquisa-contabil

Página de pesquisa com contadores (Simples de serviço) — serve o formulário e
envia cada resposta por e-mail. Serviço mínimo em Bun, sem dependências.

## Rotas
- `GET /` — o formulário. Aceita `?de=<nome>` para identificar quem responde
  (link por pessoa: `.../?de=Ygor`, `.../?de=Marilia`).
- `POST /enviar` — recebe `{ respondente, respostas }` e e-maila o `DESTINO_EMAIL`.
- `GET /health` — healthcheck.

## Variáveis de ambiente (setar no Dokploy)
| Var | Descrição |
|---|---|
| `RESEND_API_KEY` | chave do Resend (do Vault / resource `f/trama/resources/email`) |
| `RESEND_FROM` | remetente verificado, ex. `Pesquisa Trama <nao-responder@trama.ac>` |
| `DESTINO_EMAIL` | quem recebe as respostas (default `marcos@trama.ac`) |
| `PORT` | porta (default 3000) |

## Deploy no Dokploy
Aplicação do tipo Dockerfile. Build a partir deste repo; expõe a `:3000`;
define as env vars acima; anexa um domínio (TLS automático).

## Local
```
RESEND_API_KEY=... RESEND_FROM='...' bun run server.ts
```
