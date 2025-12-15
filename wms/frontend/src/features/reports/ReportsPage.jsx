import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DataTable } from '../../components/DataTable.jsx';
import { PDFButton } from '../../components/PDFButton.jsx';
import { useMockData } from '../../services/mockDataContext.jsx';
import { formatCurrency, formatDate } from '../../utils/formatters.js';

const REPORT_TYPES = ['inventory', 'receipts', 'deliveries', 'stocktaking'];

export function ReportsPage() {
  const { t } = useTranslation();
  const { data } = useMockData();
  const [type, setType] = useState('inventory');

  const report = useMemo(() => buildReport(type, data, t), [type, data, t]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            {t('reports.title')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            T?ng h?p d? li?u kho theo nhi?u góc nhìn và xu?t PDF.
          </p>
        </div>
        <PDFButton
          title={report.title}
          fileName={`${report.key}.pdf`}
          columns={report.columns}
          rows={report.rows}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {REPORT_TYPES.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setType(key)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              key === type
                ? 'bg-indigo-600 text-white shadow'
                : 'border border-slate-300 text-slate-600 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300'
            }`}
          >
            {t(`reports.${key}`)}
          </button>
        ))}
      </div>

      <DataTable
        data={report.rows}
        columns={report.columns}
        searchable={true}
        searchableFields={report.searchableFields}
      />
    </div>
  );
}

function buildReport(type, data, t) {
  switch (type) {
    case 'inventory': {
      const rows = data.inventory.map((item) => {
        const product = data.products.find((prod) => prod.id === item.productId);
        return {
          id: item.id,
          product: product ? `${product.sku} - ${product.name}` : item.productId,
          category: data.categories.find((cat) => cat.id === product?.categoryId)?.name ?? 'N/A',
          quantity: item.quantity,
          status: item.status,
        };
      });
      return {
        key: 'inventory',
        title: t('reports.inventory'),
        rows,
        searchableFields: ['product', 'category', 'status'],
        columns: [
          { key: 'product', header: t('products.name') },
          { key: 'category', header: t('products.category') },
          { key: 'quantity', header: 'Quantity' },
          { key: 'status', header: t('app.status') },
        ],
      };
    }
    case 'receipts': {
      const rows = data.receipts.map((receipt) => ({
        id: receipt.id,
        supplier: data.suppliers.find((supplier) => supplier.id === receipt.supplierId)?.name ?? receipt.supplierId,
        date: formatDate(receipt.date),
        status: receipt.status,
        total: formatCurrency(receipt.total),
      }));
      return {
        key: 'receipts',
        title: t('reports.receipts'),
        rows,
        searchableFields: ['supplier', 'status'],
        columns: [
          { key: 'id', header: 'Receipt' },
          { key: 'supplier', header: t('receipts.supplier') },
          { key: 'date', header: t('receipts.date') },
          { key: 'status', header: t('app.status') },
          { key: 'total', header: t('app.total') },
        ],
      };
    }
    case 'deliveries': {
      const rows = data.deliveries.map((delivery) => ({
        id: delivery.id,
        customer: data.customers.find((customer) => customer.id === delivery.customerId)?.name ?? delivery.customerId,
        date: formatDate(delivery.date),
        status: delivery.status,
        total: formatCurrency(delivery.total),
      }));
      return {
        key: 'deliveries',
        title: t('reports.deliveries'),
        rows,
        searchableFields: ['customer', 'status'],
        columns: [
          { key: 'id', header: 'Delivery' },
          { key: 'customer', header: t('deliveries.customer') },
          { key: 'date', header: t('deliveries.date') },
          { key: 'status', header: t('app.status') },
          { key: 'total', header: t('app.total') },
        ],
      };
    }
    case 'stocktaking': {
      const rows = data.stocktaking.flatMap((record) =>
        record.adjustments.map((adjustment) => ({
          id: `${record.id}-${adjustment.id}`,
          stocktake: record.name,
          date: formatDate(record.date),
          product: data.products.find((product) => product.id === adjustment.productId)?.name ?? adjustment.productId,
          difference: adjustment.difference,
          status: record.status,
        })),
      );
      return {
        key: 'stocktaking',
        title: t('reports.stocktaking'),
        rows,
        searchableFields: ['stocktake', 'product', 'status'],
        columns: [
          { key: 'stocktake', header: 'Stocktake' },
          { key: 'date', header: t('deliveries.date') },
          { key: 'product', header: t('products.name') },
          { key: 'difference', header: t('stocktaking.difference') },
          { key: 'status', header: t('app.status') },
        ],
      };
    }
    default:
      return { key: 'inventory', title: 'Inventory', rows: [], columns: [], searchableFields: [] };
  }
}
