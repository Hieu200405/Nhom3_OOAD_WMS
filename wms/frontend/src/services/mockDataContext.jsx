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

  const createRecord = useCallback(
    (resource, payload) => {
      setWithClone((draft) => {
        const record = {
          id: payload.id ?? generateId(resource),
          ...payload,
        };
        draft[resource] = [...(draft[resource] ?? []), record];
      });
    },
    [setWithClone],
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
        receipt.status = nextStatus;

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
    [setWithClone],
  );

  const transitionDeliveryStatus = useCallback(
    (id, nextStatus) => {
      setWithClone((draft) => {
        const delivery = draft.deliveries.find((item) => item.id === id);
        if (!delivery) return;
        delivery.status = nextStatus;

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
    [setWithClone],
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
