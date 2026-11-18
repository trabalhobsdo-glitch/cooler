const { unipay } = require('./_lib');

const PRICE = 8790; // centavos. O valor é definido AQUI, nunca pelo navegador.
const SHIPPING = { PAC: 985, SEDEX: 1892 }; // frete em centavos, também definido AQUI.
const MODELS = ['Heineken', 'Coca-Cola', 'Skol', 'Michelob', 'Budweiser', 'Antárctica', 'Monster', 'Amstel', 'Red Bull', 'Brahma'];
const digits = v => String(v == null ? '' : v).replace(/\D/g, '');
const text = (v, max = 120) => String(v == null ? '' : v).trim().slice(0, max);
const fail = (res, code, error) => res.status(code).json({ error });

function cpfOk(c) {
  if (c.length !== 11 || /^(\d)\1+$/.test(c)) return false;
  for (let t = 9; t < 11; t++) {
    let s = 0;
    for (let i = 0; i < t; i++) s += Number(c[i]) * (t + 1 - i);
    if (((s * 10) % 11) % 10 !== Number(c[t])) return false;
  }
  return true;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return fail(res, 405, 'Método não permitido.');
  try {
    const b = req.body || {}, c = b.customer || {}, a = b.address || {};
    const method = b.method === 'CREDIT_CARD' ? 'CREDIT_CARD' : 'PIX';
    const name = text(c.name), email = text(c.email), cpf = digits(c.cpf), phone = digits(c.phone);
    const zip = digits(a.zip), uf = text(a.state, 2).toUpperCase();

    if (!MODELS.includes(b.model)) return fail(res, 400, 'Modelo inválido.');
    if (!Object.prototype.hasOwnProperty.call(SHIPPING, b.shipping)) return fail(res, 400, 'Escolha a forma de envio.');
    const fee = SHIPPING[b.shipping];
    if (name.split(/\s+/).length < 2) return fail(res, 400, 'Informe o nome completo.');
    if (!/^\S+@\S+\.\S+$/.test(email)) return fail(res, 400, 'E-mail inválido.');
    if (!cpfOk(cpf)) return fail(res, 400, 'CPF inválido.');
    if (phone.length < 10 || phone.length > 11) return fail(res, 400, 'Telefone inválido.');
    if (zip.length !== 8 || !text(a.street) || !text(a.number) || !text(a.neighborhood) || !text(a.city) || uf.length !== 2)
      return fail(res, 400, 'Endereço incompleto.');

    const ref = 'cooler-' + Date.now().toString(36);
    const body = {
      amount: PRICE + fee, // produto + frete
      paymentMethod: method,
      customer: { name, email, phone, document: { number: cpf, type: 'CPF' } },
      shipping: {
        fee,
        address: {
          street: text(a.street), streetNumber: text(a.number, 20), complement: text(a.complement) || '-',
          zipCode: zip, neighborhood: text(a.neighborhood), city: text(a.city), state: uf, country: 'br',
        },
      },
      items: [{ title: 'Cooler do Verão - ' + b.model, unitPrice: PRICE, quantity: 1, tangible: true, externalRef: ref }],
      traceable: true,
      ip: (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || undefined,
      postbackUrl: 'https://' + req.headers.host + '/api/webhook',
      metadata: { pedido: ref, modelo: b.model, envio: b.shipping },
    };

    let r;
    if (method === 'PIX') {
      body.pix = { expiresInDays: 1 };
      r = await unipay('/api/user/transactions', { method: 'POST', body });
    } else {
      const token = text(b.cardToken, 2000);
      if (!token) return fail(res, 400, 'Cartão não tokenizado.');
      body.installments = Math.min(3, Math.max(1, parseInt(b.installments, 10) || 1));
      // A doc não mostra o nome do campo do token dentro de "card". Tentamos "token" e, se a API
      // rejeitar o formato (400, nada é cobrado), "id". Depois de confirmar, deixe só o que funcionar.
      for (const card of [{ token }, { id: token }]) {
        r = await unipay('/api/user/transactions', { method: 'POST', body: { ...body, card } });
        if (r.status !== 400) break;
      }
    }

    const t = r.json && r.json.data;
    if (!r.ok || !t) {
      console.error('unipay erro', r.status, JSON.stringify(r.json));
      const msg = r.json && typeof r.json.message === 'string' ? r.json.message : 'Não foi possível processar o pagamento.';
      return fail(res, r.status >= 500 ? 502 : 400, msg);
    }
    res.status(200).json({
      id: t.id,
      status: String(t.status || '').toUpperCase(),
      pix: t.pix ? { qrcode: t.pix.qrcode } : null,
    });
  } catch (e) {
    console.error(e);
    fail(res, 500, 'Erro interno ao criar o pagamento.');
  }
};
