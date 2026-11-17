// Entrega a chave PÚBLICA (pk_...) ao navegador. Defina UNIPAY_PUBLIC_KEY na Vercel.
module.exports = (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({
    publicKey: process.env.UNIPAY_PUBLIC_KEY || '',
    sdkUrl: process.env.UNIPAY_SDK_URL || 'https://js.fastsoftbrasil.com/security.js',
  });
};
