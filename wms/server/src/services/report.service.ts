import type { PipelineStage } from 'mongoose';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { InventoryModel } from '../models/inventory.model.js';
import { ProductModel } from '../models/product.model.js';
import { ReceiptModel } from '../models/receipt.model.js';
import { DeliveryModel } from '../models/delivery.model.js';
import { StocktakeModel } from '../models/stocktake.model.js';
import { AdjustmentModel } from '../models/adjustment.model.js';
import { ReturnModel } from '../models/return.model.js';
import { IncidentModel } from '../models/incident.model.js';
import { FinancialTransactionModel } from '../models/transaction.model.js';

const toObject = (doc: unknown) => JSON.parse(JSON.stringify(doc));

export const getDashboardStats = async () => {
  // 1. Basic Counts
  const [
    productsCount,
    pendingReceipts,
    pendingDeliveries,
    openIncidents,
    totalInventoryValueResult
  ] = await Promise.all([
    ProductModel.countDocuments(),
    ReceiptModel.countDocuments({ status: { $ne: 'completed' } }),
    DeliveryModel.countDocuments({ status: { $ne: 'completed' } }),
    IncidentModel.countDocuments({ status: { $ne: 'resolved' } }),
    InventoryModel.aggregate([
      {
        $lookup: {
          from: 'products',
          localField: 'productId',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $group: {
          _id: null,
          totalValue: { $sum: { $multiply: ['$quantity', '$product.priceIn'] } }
        }
      }
    ])
  ]);

  const totalInventoryValue = totalInventoryValueResult[0]?.totalValue || 0;

  // 2. Revenue/Expense Chart (Last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  // Use FinancialTransactionModel for accurate financial data
  const ftData = await FinancialTransactionModel.aggregate([
    { $match: { date: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id: {
          month: { $dateToString: { format: '%Y-%m', date: '$date' } },
          type: '$type'
        },
        total: { $sum: '$amount' }
      }
    }
  ]);

  const chartDataMap = new Map<string, { name: string; income: number; expense: number }>();

  // Initialize map with last 6 months to ensure continuity
  for (let i = 0; i < 6; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = d.toISOString().slice(0, 7); // YYYY-MM
    chartDataMap.set(key, { name: key, income: 0, expense: 0 });
  }

  // Fill data
  ftData.forEach((item: any) => {
    const key = item._id.month;
    if (chartDataMap.has(key)) {
      const entry = chartDataMap.get(key)!;
      if (item._id.type === 'revenue' || item._id.type === 'income') entry.income += item.total;
      if (item._id.type === 'expense' || item._id.type === 'payment') entry.expense += item.total;
    }
  });

  const revenueChart = Array.from(chartDataMap.values()).sort((a, b) => a.name.localeCompare(b.name));

  // 3. Inventory Status for Pie Chart
  const inventoryStatus = await InventoryModel.aggregate([
    {
      $lookup: {
        from: 'products',
        localField: 'productId',
        foreignField: '_id',
        as: 'product'
      }
    },
    { $unwind: '$product' },
    {
      $project: {
        status: {
          $switch: {
            branches: [
              { case: { $eq: ['$quantity', 0] }, then: 'Out of Stock' },
              { case: { $lt: ['$quantity', '$product.minStock'] }, then: 'Low Stock' }
            ],
            default: 'Available'
          }
        }
      }
    },
    {
      $group: {
        _id: '$status',
        value: { $sum: 1 }
      }
    }
  ]);

  return {
    counts: {
      products: productsCount,
      pendingReceipts,
      pendingDeliveries,
      openIncidents
    },
    totalInventoryValue,
    revenueChart,
    inventoryStatus: inventoryStatus.map((item: any) => ({ name: item._id, value: item.value }))
  };
};

export const getInventoryReport = async () => {
  const rows = await InventoryModel.aggregate([
    {
      $lookup: {
        from: 'products',
        localField: 'productId',
        foreignField: '_id',
        as: 'product'
      }
    },
    { $unwind: '$product' },
    {
      $group: {
        _id: '$productId',
        sku: { $first: '$product.sku' },
        name: { $first: '$product.name' },
        totalQty: { $sum: '$quantity' },
        minStock: { $first: '$product.minStock' }
      }
    },
    {
      $project: {
        _id: 0,
        productId: '$_id',
        sku: 1,
        name: 1,
        totalQty: 1,
        minStock: 1,
        status: {
          $cond: [{ $lt: ['$totalQty', '$minStock'] }, 'belowMin', 'ok']
        }
      }
    }
  ]);
  return rows.map(toObject);
};

const groupByDate = (field: string): PipelineStage[] => [
  {
    $addFields: {
      totalQty: { $sum: '$lines.qty' }
    }
  },
  {
    $group: {
      _id: {
        $dateToString: { format: '%Y-%m-%d', date: `$${field}` }
      },
      totalQty: { $sum: '$totalQty' },
      documents: { $sum: 1 }
    }
  },
  { $sort: { _id: 1 as const } }
];

export const getInboundReport = async () => {
  const rows = await ReceiptModel.aggregate(groupByDate('date'));
  return rows.map((row) => ({
    date: row._id,
    totalQty: row.totalQty,
    documents: row.documents
  }));
};

export const getOutboundReport = async () => {
  const rows = await DeliveryModel.aggregate(groupByDate('date'));
  return rows.map((row) => ({
    date: row._id,
    totalQty: row.totalQty,
    documents: row.documents
  }));
};

export const getStocktakeReport = async () => {
  const rows = await StocktakeModel.aggregate([
    {
      $project: {
        code: 1,
        status: 1,
        date: 1,
        discrepancies: {
          $sum: {
            $map: {
              input: '$items',
              as: 'item',
              in: { $abs: { $subtract: ['$$item.countedQty', '$$item.systemQty'] } }
            }
          }
        }
      }
    },
    { $sort: { date: -1 as const } }
  ]);
  return rows.map(toObject);
};

const currentDirname = typeof __dirname !== 'undefined'
  ? __dirname
  : path.dirname(fileURLToPath(import.meta.url));

const fontRegularPath = path.resolve(currentDirname, '../assets/fonts/NotoSans-Regular.ttf');
const fontBoldPath = path.resolve(currentDirname, '../assets/fonts/NotoSans-Bold.ttf');

export const createPdfBuffer = async (title: string, data: any) => {
  const doc = new PDFDocument({ margin: 40 });
  const chunks: Buffer[] = [];
  return await new Promise<Buffer>((resolve, reject) => {
    doc.on('data', (chunk) => chunks.push(chunk as Buffer));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Prefer Vietnamese-capable font if available
    try {
      if (fs.existsSync(fontRegularPath)) {
        doc.font(fontBoldPath).fontSize(18).text(title, { underline: true });
      } else {
        doc.fontSize(18).text(title, { underline: true });
      }
    } catch {
      doc.fontSize(18).text(title, { underline: true });
    }
    doc.moveDown();

    const entries = Array.isArray(data) ? data : Object.entries(data);
    entries.forEach((entry: any) => {
      try {
        if (fs.existsSync(fontRegularPath)) {
          doc.font(fontRegularPath).fontSize(12);
        } else {
          doc.fontSize(12);
        }
      } catch {
        doc.fontSize(12);
      }
      if (Array.isArray(data)) {
        doc.text(JSON.stringify(entry));
      } else {
        const [key, value] = entry;
        doc.text(`${key}: ${JSON.stringify(value)}`);
      }
      doc.moveDown(0.5);
    });

    doc.end();
  });
};
