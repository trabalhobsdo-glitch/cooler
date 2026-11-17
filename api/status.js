const { unipay } = require('./_lib');

module.exports = async (req, res) => {
  const id = String(req.query.id || '');
  if (!/^[\w-]{8,64}$/.test(id)) return res.status(400).json({ error: 'ID inválido.' });
  try {
    const r = await unipay('/api/user/transactions/' + id);
    const t = r.json && r.json.data;
    if (!r.ok || !t) return res.status(502).json({ error: 'Não foi possível consultar o pagamento.' });
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({ status: String(t.status || '').toUpperCase() });
  } catch (e) {
    res.status(500).json({ error: 'Erro interno.' });
  }
};
