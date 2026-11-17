# Cooler do Verão

Site estático (`index.html`) + funções serverless na Vercel (`api/`) com checkout Pix e cartão pela Unipay.

## Deploy
1. Suba tudo no GitHub e importe o repositório na Vercel (sem build, sem framework).
2. Em **Settings > Environment Variables** crie:
   - `UNIPAY_SECRET_KEY` (sk_...)
   - `UNIPAY_PUBLIC_KEY` (pk_...)
3. Faça redeploy. Na Unipay o postback aponta sozinho para `https://SEU-DOMINIO/api/webhook`.

Preço (R$ 87,90) e modelos válidos ficam em `api/checkout.js`.
