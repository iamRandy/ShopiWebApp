const shareCart = require("./_lib/shareCart");
const sharedCart = require("./_lib/sharedCart");

// Cart sharing, as one function: the Hobby plan allows 12 per deployment.
// vercel.json rewrites the public URLs here:
//   /api/carts/:cartId/share -> /api/share?cartId=:cartId    (owner: POST, DELETE)
//   /api/shared/:shareId     -> /api/share?shareId=:shareId  (anyone: GET)
module.exports = async function handler(req, res) {
  if (req.query.shareId !== undefined) return sharedCart(req, res);
  if (req.query.cartId !== undefined) return shareCart(req, res);
  res.setHeader("Access-Control-Allow-Origin", "*");
  return res.status(404).json({ error: "Not found" });
};
