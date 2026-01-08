import { Types } from 'mongoose';
import { ProductModel } from '../models/product.model.js';
import { InventoryModel } from '../models/inventory.model.js';

export interface ABCProduct {
    productId: string;
    sku: string;
    name: string;
    quantity: number;
    unitPrice: number;
    totalValue: number;
    classification: 'A' | 'B' | 'C';
    valuePercent: number;
    cumulativePercent: number;
}

export interface ABCSummary {
    A: number;
    B: number;
    C: number;
    total: number;
}

/**
 * Calculate ABC Analysis for all products
 * A = Top 20% of value (usually ~80% of total value)
 * B = Next 30% of value (usually ~15% of total value)
 * C = Remaining 50% of value (usually ~5% of total value)
 */
export const calculateABCAnalysis = async (): Promise<{
    products: ABCProduct[];
    summary: ABCSummary;
}> => {
    // Get all products
    const products = await ProductModel.find().lean();

    // Calculate value for each product
    const productValues = await Promise.all(
        products.map(async (product) => {
            // Get total quantity across all locations
            const inventory = await InventoryModel.aggregate([
                { $match: { productId: new Types.ObjectId(product._id as string) } },
                { $group: { _id: null, totalQty: { $sum: '$quantity' } } }
            ]);

            const qty = inventory[0]?.totalQty || 0;
            const value = qty * product.priceOut;

            return {
                productId: product._id.toString(),
                sku: product.sku,
                name: product.name,
                quantity: qty,
                unitPrice: product.priceOut,
                totalValue: value
            };
        })
    );

    // Sort by value descending
    productValues.sort((a, b) => b.totalValue - a.totalValue);

    // Calculate cumulative percentage and classify
    const totalValue = productValues.reduce((sum, p) => sum + p.totalValue, 0);

    if (totalValue === 0) {
        return {
            products: [],
            summary: { A: 0, B: 0, C: 0, total: 0 }
        };
    }

    let cumulative = 0;

    const classified: ABCProduct[] = productValues.map((product) => {
        cumulative += product.totalValue;
        const cumulativePercent = (cumulative / totalValue) * 100;

        // Classification based on cumulative value
        let classification: 'A' | 'B' | 'C' = 'C';
        if (cumulativePercent <= 80) {
            classification = 'A';
        } else if (cumulativePercent <= 95) {
            classification = 'B';
        }

        return {
            ...product,
            classification,
            valuePercent: (product.totalValue / totalValue) * 100,
            cumulativePercent
        };
    });

    // Calculate summary
    const summary: ABCSummary = {
        A: classified.filter((p) => p.classification === 'A').length,
        B: classified.filter((p) => p.classification === 'B').length,
        C: classified.filter((p) => p.classification === 'C').length,
        total: classified.length
    };

    return {
        products: classified,
        summary
    };
};

/**
 * Get products by classification
 */
export const getProductsByClassification = async (
    classification: 'A' | 'B' | 'C'
): Promise<ABCProduct[]> => {
    const analysis = await calculateABCAnalysis();
    return analysis.products.filter((p) => p.classification === classification);
};

/**
 * Get ABC summary only
 */
export const getABCSummary = async (): Promise<ABCSummary> => {
    const analysis = await calculateABCAnalysis();
    return analysis.summary;
};
