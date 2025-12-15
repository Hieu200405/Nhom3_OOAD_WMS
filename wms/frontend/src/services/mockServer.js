import { authService } from './auth';
import { registerMockHandler } from './apiClient';

function parsePath(path) {
  const segments = path.split('/').filter(Boolean);
  const [resource, id, action] = segments;
  return { resource, id, action };
}

export function setupMockServer(getState, actions) {
  registerMockHandler(async (path, { method, body }) => {
    const { resource, id, action } = parsePath(path);
    const state = getState();

    switch (path) {
      case '/auth/login':
        if (method !== 'POST') throw new Error('Method not allowed');
        return authService.login(body);
      default:
        break;
    }

    switch (resource) {
      case 'products':
      case 'categories':
      case 'suppliers':
      case 'customers':
      case 'warehouse':
      case 'inventory':
      case 'incidents':
      case 'stocktaking':
      case 'returns':
      case 'disposals':
        return handleCollection(resource, id, action, { method, body, state, actions });
      case 'receipts':
        return handleReceipts({ id, action, method, body, state, actions });
      case 'deliveries':
        return handleDeliveries({ id, action, method, body, state, actions });
      case 'reports':
        return handleReports({ method, body, state });
      default:
        throw new Error(`Unknown endpoint: ${path}`);
    }
  });
}

function resolveResourceName(resource) {
  if (resource === 'warehouse') return 'warehouseLocations';
  return resource;
}

function handleCollection(resource, id, action, ctx) {
  const resourceName = resolveResourceName(resource);
  const collection = ctx.state[resourceName] ?? [];

  if (ctx.method === 'GET') {
    if (!id) return collection;
    return collection.find((item) => item.id === id);
  }

  if (ctx.method === 'POST' && !id) {
    ctx.actions.createRecord(resourceName, ctx.body);
    return { success: true };
  }

  if (ctx.method === 'PUT' && id) {
    ctx.actions.updateRecord(resourceName, id, ctx.body);
    return { success: true };
  }

  if (ctx.method === 'DELETE' && id) {
    ctx.actions.removeRecord(resourceName, id);
    return { success: true };
  }

  if (action === 'status' && ctx.method === 'POST') {
    ctx.actions.updateRecord(resourceName, id, { status: ctx.body.status });
    return { success: true };
  }

  throw new Error('Unsupported operation');
}

function handleReceipts({ id, action, method, body, state, actions }) {
  if (method === 'GET') {
    if (!id) return state.receipts;
    return state.receipts.find((item) => item.id === id);
  }

  if (method === 'POST' && !id) {
    actions.createRecord('receipts', body);
    return { success: true };
  }

  if (method === 'PUT' && id) {
    actions.updateRecord('receipts', id, body);
    return { success: true };
  }

  if (method === 'POST' && action === 'transition') {
    actions.transitionReceiptStatus(id, body.status);
    return { success: true };
  }

  throw new Error('Unsupported receipt operation');
}

function handleDeliveries({ id, action, method, body, state, actions }) {
  if (method === 'GET') {
    if (!id) return state.deliveries;
    return state.deliveries.find((item) => item.id === id);
  }

  if (method === 'POST' && !id) {
    actions.createRecord('deliveries', body);
    return { success: true };
  }

  if (method === 'PUT' && id) {
    actions.updateRecord('deliveries', id, body);
    return { success: true };
  }

  if (method === 'POST' && action === 'transition') {
    actions.transitionDeliveryStatus(id, body.status);
    return { success: true };
  }

  throw new Error('Unsupported delivery operation');
}

function handleReports({ method, body, state }) {
  if (method !== 'POST' && method !== 'GET') {
    throw new Error('Reports support GET/POST only');
  }

  const payload = body ?? {};
  const { type = 'inventory' } = payload;

  switch (type) {
    case 'inventory':
      return state.inventory.map((item) => {
        const product = state.products.find((prod) => prod.id === item.productId);
        return {
          ...item,
          productName: product?.name,
          sku: product?.sku,
          categoryId: product?.categoryId,
        };
      });
    case 'receipts-by-supplier':
      return state.receipts;
    case 'deliveries-by-customer':
      return state.deliveries;
    case 'stocktaking':
      return state.stocktaking;
    default:
      return {
        message: 'Unknown report type',
        data: [],
      };
  }
}
