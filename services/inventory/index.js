/* ---------- Dependências ---------- */
const path   = require('path');
const grpc   = require('@grpc/grpc-js');
const loader = require('@grpc/proto-loader');
const data   = require('./products.json');

/* ---------- Configurações ---------- */
const PORT = process.env.INVENTORY_PORT || 3002;
const PROTO_PATH = path.join(__dirname, '../../proto/inventory.proto');

/* ---------- Helpers ---------- */
const packageDef = loader.loadSync(PROTO_PATH, {
  keepCase: true, longs: String, enums: String, defaults: true, oneofs: true,
});

const { inventory } = grpc.loadPackageDefinition(packageDef);

/** Busca produto por ID em memória */
function findProduct(id) {
  return data.find((p) => p.id === id);
}

/* ---------- Handlers RPC ---------- */
const handlers = {
  ListProducts: (_, cb) => cb(null, { products: data }),

  GetProduct: ({ request }, cb) => {
    const id = Number(request.value);
    if (!Number.isInteger(id)) {
      return cb({ code: grpc.status.INVALID_ARGUMENT, details: 'ID inválido' });
    }

    const product = findProduct(id);
    if (!product) {
      return cb({ code: grpc.status.NOT_FOUND, details: 'Produto não encontrado' });
    }
    cb(null, product);
  },
};

/* ---------- Bootstrap ---------- */
function main() {
  const server = new grpc.Server();
  server.addService(inventory.InventoryService.service, handlers);

  server.bindAsync(
    `0.0.0.0:${PORT}`,
    grpc.ServerCredentials.createInsecure(),
    () => {
      console.log(`Inventory Service ON :${PORT}`);
      server.start();
    }
  );
}

main();
