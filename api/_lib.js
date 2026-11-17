// Cliente mínimo da API Unipay (white-label FastSoft). A secret key fica SÓ aqui, no servidor.
const BASE = (process.env.UNIPAY_API_URL || 'https://api.unipaybr.com').replace(/\/+$/, '').replace(/\/api$/, '');

function auth() {
  const key = process.env.UNIPAY_SECRET_KEY;
  if (!key) throw new Error('UNIPAY_SECRET_KEY não configurada na Vercel.');
  return 'Basic ' + Buffer.from('x:' + key).toString('base64');
}

async function unipay(path, { method = 'GET', body } = {}) {
  const r = await fetch(BASE + path, {
    method,
    headers: { Authorization: auth(), 'Content-Type': 'application/json', Accept: 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await r.json(); } catch (_) {}
  return { ok: r.ok, status: r.status, json };
}

module.exports = { unipay };
