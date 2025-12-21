/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { initialData } from './mockData.js';
import { generateId } from '../utils/id.js';
import { DeliveryStatus, ReceiptStatus } from '../utils/constants.js';
import { setupMockServer } from './mockServer.js';

const STORAGE_KEY = 'wms-mock-data';

function cloneData(data) {
  if (typeof structuredClone === 'function') {
    return structuredClone(data);
  }
  return JSON.parse(JSON.stringify(data));
}

function ensureCollections(data) {
  return {
    categories: [],
    products: [],
    suppliers: [],
    customers: [],
    warehouses: [],
    warehouseLocations: [],
    inventory: [],
    receipts: [],
    deliveries: [],
    incidents: [],
    stocktaking: [],
    returns: [],
    disposals: [],
    auditLogs: [],
    ...data,
  };
}

function loadInitialState() {
  if (typeof window === 'undefined') {
    return ensureCollections(initialData);
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return ensureCollections(initialData);
  }

  try {
    const parsed = JSON.parse(stored);
    return ensureCollections(parsed);
  } catch (error) {
    console.warn('Invalid local storage data, fallback to seed', error);
    return ensureCollections(initialData);
  }
}

function persistState(nextState) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
}

function adjustInventory(nextState, productId, deltaQuantity, note) {
  const inventoryItem = nextState.inventory.find((item) => item.productId === productId);
  if (!inventoryItem) {
    nextState.inventory.push({
      id: generateId('inv'),
      productId,
      quantity: Math.max(deltaQuantity, 0),
      status: deltaQuantity >= 0 ? 'Available' : 'Pending',
      note,
    });
    return;
  }

  const updatedQuantity = inventoryItem.quantity + deltaQuantity;
  inventoryItem.quantity = Math.max(updatedQuantity, 0);
  if (inventoryItem.quantity === 0) {
    inventoryItem.status = 'Out of Stock';
  } else if (inventoryItem.quantity < 5) {
    inventoryItem.status = 'Low';
  } else {
    inventoryItem.status = 'Available';
  }
  if (note) {
    inventoryItem.note = note;
  }
}

function checkStock(state, lines) {
  for (const line of lines) {
    const inventoryItem = state.inventory.find((item) => item.productId === line.productId);
    const available = inventoryItem ? inventoryItem.quantity : 0;
    const requested = line.qty !== undefined ? line.qty : line.quantity;

    if (requested !== undefined && available < requested) {
      throw new Error(`Sản phẩm (ID: ${line.productId}) không đủ tồn kho. Yêu cầu: ${requested}, Hiện có: ${available}`);
    }
  }
}

const CUSTOMER_CONSTRAINTS = {
  Corporate: { maxQty: 1000, slaDays: 7 },
  Individual: { maxQty: 50, slaDays: 2 }
};

function validateDeliveryRules(state, delivery) {
  const customer = state.customers.find(c => c.id === delivery.customerId);
  const type = customer?.type || 'Individual';
  const tier = CUSTOMER_CONSTRAINTS[type] || CUSTOMER_CONSTRAINTS.Individual;

  // 1. Total quantity validation
  const totalQty = (delivery.lines || []).reduce((sum, line) => {
    const qty = line.qty !== undefined ? line.qty : line.quantity;
    return sum + (qty || 0);
  }, 0);

  if (totalQty > tier.maxQty) {
    throw new Error(`Tổng số lượng xuất (${totalQty}) vượt quá hạn mức cho phép của khách hàng ${type} (${tier.maxQty})`);
  }

  // 2. SLA validation
  const creationDate = delivery.createdAt ? new Date(delivery.createdAt) : new Date();
  const deliveryDate = new Date(delivery.date);
  const diffDays = (deliveryDate.getTime() - creationDate.getTime()) / (1000 * 3600 * 24);

  if (diffDays > tier.slaDays && !delivery.note?.includes('[EXCEPTION]')) {
    throw new Error(`Ngày giao dự kiến vượt quá SLA cho phép của khách hàng ${type} (Tối đa ${tier.slaDays} ngày). Cần thêm "[EXCEPTION]" vào ghi chú để bỏ qua.`);
  }
}

const MockDataContext = createContext(null);

export function MockDataProvider({ children }) {
  const [state, setState] = useState(() => loadInitialState());
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
    persistState(state);
  }, [state]);

  const setWithClone = useCallback((updater) => {
    setState((prev) => {
      const next = cloneData(prev);
      updater(next);
      return ensureCollections(next);
    });
  }, []);

  const recordAudit = useCallback((draft, { action, entity, entityId, payload }) => {
    const log = {
      _id: generateId('audit'),
      actorId: { _id: 'user-000', name: 'User (Mock)', email: 'mock@example.com' },
      action,
      entity,
      entityId,
      payload: payload ?? null,
      createdAt: new Date().toISOString()
    };
    draft.auditLogs = [log, ...(draft.auditLogs ?? [])];
  }, []);

  const createRecord = useCallback(
    (resource, payload) => {
      const id = payload.id ?? generateId(resource);
      const now = new Date().toISOString();
      const record = {
        id,
        createdAt: now,
        ...payload,
      };

      // Validate BEFORE setWithClone to avoid React crash
      if (resource === 'deliveries') {
        checkStock(stateRef.current, record.lines || []);
        validateDeliveryRules(stateRef.current, record);
      }

      setWithClone((draft) => {
        draft[resource] = [...(draft[resource] ?? []), record];

        if (resource === 'receipts') {
          recordAudit(draft, {
            action: 'receipt.created',
            entity: 'Receipt',
            entityId: id,
            payload: { code: record.code, status: record.status || 'draft' }
          });
        }
      });
    },
    [setWithClone, recordAudit],
  );

  const updateRecord = useCallback(
    (resource, id, changes) => {
      setWithClone((draft) => {
        const collection = draft[resource] ?? [];
        const index = collection.findIndex((item) => item.id === id);
        if (index === -1) return;
        collection[index] = { ...collection[index], ...changes };
        draft[resource] = [...collection];
      });
    },
    [setWithClone],
  );

  const removeRecord = useCallback(
    (resource, id) => {
      setWithClone((draft) => {
        const collection = draft[resource] ?? [];
        draft[resource] = collection.filter((item) => item.id !== id);
      });
    },
    [setWithClone],
  );

  const transitionReceiptStatus = useCallback(
    (id, nextStatus) => {
      setWithClone((draft) => {
        const receipt = draft.receipts.find((item) => item.id === id);
        if (!receipt) return;
        const prevStatus = receipt.status;
        receipt.status = nextStatus;

        recordAudit(draft, {
          action: `receipt.${nextStatus}`,
          entity: 'Receipt',
          entityId: id,
          payload: { from: prevStatus, to: nextStatus }
        });

        if (
          nextStatus === ReceiptStatus.COMPLETED &&
          receipt.inventoryApplied !== true
        ) {
          receipt.lines.forEach((line) =>
            adjustInventory(
              draft,
              line.productId,
              line.quantity,
              `Receipt ${receipt.id}`,
            ),
          );
          receipt.inventoryApplied = true;
        }
      });
    },
    [setWithClone, recordAudit],
  );

  const transitionDeliveryStatus = useCallback(
    (id, nextStatus) => {
      // Validate BEFORE setWithClone to avoid React crash
      if ([DeliveryStatus.APPROVED, DeliveryStatus.PREPARED, DeliveryStatus.COMPLETED].includes(nextStatus)) {
        const delivery = stateRef.current.deliveries.find((item) => item.id === id);
        if (delivery) {
          checkStock(stateRef.current, delivery.lines || []);
          if (nextStatus === DeliveryStatus.APPROVED) {
            validateDeliveryRules(stateRef.current, delivery);
          }
        }
      }

      setWithClone((draft) => {
        const delivery = draft.deliveries.find((item) => item.id === id);
        if (!delivery) return;

        const prevStatus = delivery.status;
        delivery.status = nextStatus;

        recordAudit(draft, {
          action: `delivery.${nextStatus}`,
          entity: 'Delivery',
          entityId: id,
          payload: { from: prevStatus, to: nextStatus }
        });

        if (
          nextStatus === DeliveryStatus.COMPLETED &&
          delivery.inventoryApplied !== true
        ) {
          delivery.lines.forEach((line) =>
            adjustInventory(
              draft,
              line.productId,
              -line.quantity,
              `Delivery ${delivery.id}`,
            ),
          );
          delivery.inventoryApplied = true;
        }
      });
    },
    [setWithClone, recordAudit],
  );

  const resetData = useCallback(() => {
    setState(ensureCollections(initialData));
  }, []);

  const actions = useMemo(
    () => ({
      createRecord,
      updateRecord,
      removeRecord,
      transitionReceiptStatus,
      transitionDeliveryStatus,
      resetData,
    }),
    [
      createRecord,
      removeRecord,
      transitionReceiptStatus,
      transitionDeliveryStatus,
      updateRecord,
      resetData,
    ],
  );

  useEffect(() => {
    setupMockServer(
      () => stateRef.current,
      actions,
    );
  }, [actions]);

  const contextValue = useMemo(
    () => ({
      data: state,
      actions,
    }),
    [state, actions],
  );

  return (
    <MockDataContext.Provider value={contextValue}>
      {children}
    </MockDataContext.Provider>
  );
}

export function useMockData() {
  const context = useContext(MockDataContext);
  if (!context) {
    throw new Error('useMockData must be used within MockDataProvider');
  }
  return context;
}

export function useCollection(resource) {
  const { data, actions } = useMockData();
  return {
    items: data[resource] ?? [],
    create: (payload) => actions.createRecord(resource, payload),
    update: (id, changes) => actions.updateRecord(resource, id, changes),
    remove: (id) => actions.removeRecord(resource, id),
  };
}
