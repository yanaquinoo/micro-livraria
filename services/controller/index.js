const express = require('express');
const path    = require('path');
const grpc    = require('@grpc/grpc-js');
const loader  = require('@grpc/proto-loader');

const PORT = process.env.CONTROLLER_PORT || 3000;
const app  = express();

/* ---------- Utilidade gRPC → Promise ---------- */
function promisify(client, method) {
  return (payload = {}) =>
    new Promise((resolve, reject) =>
      client[method](payload, (err, res) => (err ? reject(err) : resolve(res)))
    );
}

/* ---------- Carrega clientes ---------- */
function loadProto(rel) {
  const def = loader.loadSync(path.join(__dirname, rel), {
    keepCase: true, longs: String, enums: String, defaults: true, oneofs: true,
  });
  return grpc.loadPackageDefinition(def);
}

const inventory = new (loadProto('../../proto/inventory.proto')
  .inventory.InventoryService)('localhost:3002', grpc.credentials.createInsecure());

const shipping  = new (loadProto('../../proto/shipping.proto')
  .shipping.ShippingService)('localhost:3001', grpc.credentials.createInsecure());

/* ---------- Roteamento ---------- */
app.get('/products', async (_req, res, next) => {
  try {
    const list = await promisify(inventory, 'ListProducts')();
    res.json(list);
  } catch (e) { next(e); }
});

app.get('/product/:id', async (req, res, next) => {
  try {
    const product = await promisify(inventory, 'GetProduct')({ value: req.params.id });
    res.json(product);
  } catch (e) { next(e); }
});

app.get('/shipping/:cep', async (req, res, next) => {
  try {
    const rate = await promisify(shipping, 'GetShippingRate')({ cep: req.params.cep });
    res.json(rate);
  } catch (e) { next(e); }
});

/* ---------- Middleware de erro ---------- */
app.use((err, _req, res, _next) => {
  const status = err.code === grpc.status.NOT_FOUND      ? 404
               : err.code === grpc.status.INVALID_ARGUMENT ? 400
               : 500;
  res.status(status).json({ error: err.details || err.message });
});

/* ---------- Start ---------- */
app.listen(PORT, () => console.log(`Controller API ON :${PORT}`));
