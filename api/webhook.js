// Postback da Unipay (status PAID, REFUSED, REFUNDED...). Aqui é o lugar certo para
// avisar no WhatsApp/e-mail ou salvar o pedido. Por enquanto só registra no log da Vercel.
module.exports = (req, res) => {
  const d = (req.body && req.body.data) || {};
  console.log('unipay webhook', d.id, d.status, d.externalRef || '');
  res.status(200).json({ ok: true });
};
