import { authService } from './auth';
import { registerMockHandler } from './apiClient';

function parsePath(path) {
  const [pathname, query] = path.split('?');
  const segments = pathname.split('/').filter(Boolean);
  const [resource, id, action] = segments;
  const searchParams = new URLSearchParams(query);
  console.log('[Mock Server] Path:', path, '=> resource:', resource, 'id:', id, 'action:', action, 'query:', Object.fromEntries(searchParams));
  return { resource, id, action, query: Object.fromEntries(searchParams) };
}

export function setupMockServer(getState, actions) {
  registerMockHandler(async (path, { method, body }) => {
    const { resource, id, action, query } = parsePath(path);
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
        return handleCollection(resource, id, action, { method, body, state, actions, query });
      case 'supplier-products':
        return handleSupplierProducts({ resource, id, action, method, body, state, actions, query });
      case 'receipts':
        return handleReceipts({ id, action, method, body, state, actions, query });
      case 'deliveries':
        return handleDeliveries({ id, action, method, body, state, actions, query });
      case 'reports':
        return handleReports({ method, body, state });
      default:
        throw new Error(`Unknown endpoint: ${path}`);
    }
  });
}

function resolveResourceName(resource) {
  if (resource === 'warehouse') return 'warehouseLocations';
  if (resource === 'supplier-products') return 'supplierProducts';
  return resource;
}

function handleCollection(resource, id, action, ctx) {
  const resourceName = resolveResourceName(resource);
  const collection = ctx.state[resourceName] ?? [];

  if (ctx.method === 'GET') {
    if (id) return collection.find((item) => item.id === id);
    if (ctx.query && Object.keys(ctx.query).length > 0) {
      return collection.filter(item => {
        return Object.entries(ctx.query).every(([key, val]) => String(item[key]) === val);
      });
    }
    return collection;
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
    // Handle audit-logs endpoint
    if (action === 'audit-logs') {
      const logs = state.auditLogs.filter(log => log.entityId === id && log.entity === 'Receipt');

      // If no logs found but receipt exists, return a fallback "Created" log
      if (logs.length === 0) {
        const receipt = state.receipts.find(r => r.id === id);
        if (receipt) {
          return {
            data: [{
              _id: `fallback-${id}`,
              actorId: { _id: 'system', name: 'Hệ thống (Mock)' },
              action: 'receipt.created',
              entity: 'Receipt',
              entityId: id,
              payload: { code: receipt.code, status: receipt.status },
              createdAt: new Date(2025, 0, 1).toISOString()
            }]
          };
        }
      }

      return { data: logs };
    }

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

function handleSupplierProducts({ resource, id, action, method, body, state, actions, query }) {
  if (method === 'GET') {
    const collection = state.supplierProducts || [];
    let items = collection;
    if (id) {
      items = [collection.find(i => i.id === id)].filter(Boolean);
    } else if (query && Object.keys(query).length > 0) {
      items = collection.filter(item => {
        return Object.entries(query).every(([key, val]) => String(item[key]) === val);
      });
    }

    // Populate
    const populated = items.map(item => ({
      ...item,
      supplierId: state.suppliers.find(s => s.id === item.supplierId) || item.supplierId,
      productId: state.products.find(p => p.id === item.productId) || item.productId
    }));

    if (id) return populated[0];
    return { data: populated };
  }
  // For writes, delegate to generic
  return handleCollection(resource, id, action, { method, body, state, actions, query });
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
