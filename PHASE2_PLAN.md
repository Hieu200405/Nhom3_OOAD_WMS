# 🚀 PHASE 2 - BUSINESS LOGIC ENHANCEMENT

**Date:** 2026-01-08 18:26  
**Status:** IN PROGRESS  
**Estimated Duration:** 2-3 weeks

---

## 🎯 Phase 2 Objectives

### Priority 4: Financial Automation ⏳
**Goal:** Auto-create transactions, aging calculation, payment reminders

**Current State:**
- ✅ Manual transaction creation
- ❌ No auto-transaction on Receipt/Delivery
- ❌ No aging calculation
- ❌ No payment reminders
- ❌ No credit limit check

**Target State:**
- ✅ Auto-create transaction on approval
- ✅ Aging calculation (overdue tracking)
- ✅ Payment reminder notifications
- ✅ Credit limit validation

---

### Priority 5: Returns Enhancement ⏳
**Goal:** QC workflow, auto-adjustments, refund integration

**Current State:**
- ✅ Basic return CRUD
- ❌ No QC workflow
- ❌ No auto-adjustment on restock
- ❌ No refund integration

**Target State:**
- ✅ QC inspection workflow
- ✅ Auto-create adjustment on restock
- ✅ Refund transaction integration
- ✅ Return reason analytics

---

### Priority 6: Notification System ⏳
**Goal:** Real-time triggers, email support, preferences

**Current State:**
- ✅ Notification model exists
- ⚠️ Some manual triggers (Phase 1)
- ❌ No comprehensive triggers
- ❌ No email notifications
- ❌ No user preferences

**Target State:**
- ✅ Comprehensive notification triggers
- ✅ Email notification support
- ✅ User notification preferences
- ✅ Real-time updates

---

## 📋 Implementation Plan

### Week 1: Financial Automation

#### Day 1-2: Auto-Transaction Creation
**Tasks:**
1. ✅ Update Receipt service - auto-create expense (DONE in Phase 1)
2. ⏳ Update Delivery service - auto-create income
3. ⏳ Add transaction validation
4. ⏳ Test integration

**Files to modify:**
- `wms/server/src/services/delivery.service.ts`
- `wms/server/src/services/transaction.service.ts`

---

#### Day 3-4: Aging Calculation
**Tasks:**
1. ⏳ Add aging calculation function
2. ⏳ Add overdue detection
3. ⏳ Create aging report
4. ⏳ Add dashboard widget

**New files:**
- `wms/server/src/services/aging.service.ts`
- `wms/frontend/src/features/financials/AgingReport.jsx`

---

#### Day 5: Payment Reminders
**Tasks:**
1. ⏳ Create reminder scheduler
2. ⏳ Add notification triggers
3. ⏳ Add email support (optional)

**Files to modify:**
- `wms/server/src/services/notification.service.ts`

---

### Week 2: Returns Enhancement

#### Day 6-7: QC Workflow
**Tasks:**
1. ⏳ Add QC status to Return model
2. ⏳ Create QC inspection service
3. ⏳ Add approval workflow
4. ⏳ Frontend QC UI

**Files to modify:**
- `wms/server/src/models/return.model.ts`
- `wms/server/src/services/return.service.ts`
- `wms/frontend/src/features/returns/ReturnsPage.jsx`

---

#### Day 8-9: Auto-Adjustments
**Tasks:**
1. ⏳ Auto-create adjustment on restock
2. ⏳ Link adjustment to return
3. ⏳ Update inventory automatically

**Files to modify:**
- `wms/server/src/services/return.service.ts`
- `wms/server/src/services/adjustment.service.ts`

---

#### Day 10: Refund Integration
**Tasks:**
1. ⏳ Create refund transaction on return
2. ⏳ Link to customer
3. ⏳ Add refund tracking

**Files to modify:**
- `wms/server/src/services/return.service.ts`
- `wms/server/src/services/transaction.service.ts`

---

### Week 3: Notification System

#### Day 11-12: Comprehensive Triggers
**Tasks:**
1. ⏳ Low stock notifications
2. ⏳ Approval needed notifications
3. ⏳ Overdue payment notifications
4. ⏳ Status change notifications

**Files to modify:**
- `wms/server/src/services/notification.service.ts`
- All relevant service files

---

#### Day 13-14: Email Support
**Tasks:**
1. ⏳ Setup email service (NodeMailer)
2. ⏳ Create email templates
3. ⏳ Add email sending logic
4. ⏳ Test email delivery

**New files:**
- `wms/server/src/services/email.service.ts`
- `wms/server/src/templates/email/*.html`

---

#### Day 15: User Preferences
**Tasks:**
1. ⏳ Add notification preferences to User model
2. ⏳ Create preferences UI
3. ⏳ Respect preferences in triggers

**Files to modify:**
- `wms/server/src/models/user.model.ts`
- `wms/frontend/src/features/users/UserPreferences.jsx`

---

## 🎯 Quick Wins (Can Do Now)

### Quick Win 1: Auto-Transaction on Delivery (30 min)

**File:** `wms/server/src/services/delivery.service.ts`

**Add to `transitionDelivery` when status = 'completed':**
```typescript
if (target === 'completed') {
  // ... existing inventory logic
  
  // Auto-create Income Transaction
  const totalAmount = delivery.lines.reduce((sum, line) => 
    sum + (line.qty * line.priceOut), 0
  );
  
  const { createTransaction } = await import('./transaction.service.js');
  await createTransaction({
    partnerId: delivery.customerId.toString(),
    type: 'income',
    amount: totalAmount,
    status: 'pending', // or 'completed' if paid immediately
    referenceId: delivery._id.toString(),
    referenceType: 'Delivery',
    note: `Auto-generated income for Delivery ${delivery.code}`
  }, actorId);
}
```

---

### Quick Win 2: Aging Calculation Service (1 hour)

**New file:** `wms/server/src/services/aging.service.ts`

```typescript
import { FinancialTransactionModel } from '../models/transaction.model.js';

export const calculateAging = async () => {
  const now = new Date();
  const transactions = await FinancialTransactionModel.find({
    status: { $in: ['pending', 'partial'] }
  }).populate('partnerId', 'name');
  
  return transactions.map(txn => {
    const dueDate = txn.paymentDueDate || txn.date;
    const daysOverdue = Math.floor(
      (now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    return {
      id: txn._id.toString(),
      partner: txn.partnerId,
      amount: txn.amount,
      dueDate,
      daysOverdue: daysOverdue > 0 ? daysOverdue : 0,
      isOverdue: daysOverdue > 0,
      agingBucket: getAgingBucket(daysOverdue)
    };
  });
};

function getAgingBucket(days: number): string {
  if (days <= 0) return 'Current';
  if (days <= 30) return '1-30 days';
  if (days <= 60) return '31-60 days';
  if (days <= 90) return '61-90 days';
  return '90+ days';
}

export const getOverdueTransactions = async () => {
  const aging = await calculateAging();
  return aging.filter(item => item.isOverdue);
};
```

---

### Quick Win 3: Low Stock Notifications (30 min)

**File:** `wms/server/src/services/inventory.service.ts`

**Add after inventory adjustment:**
```typescript
export const checkLowStock = async (productId: string) => {
  const product = await ProductModel.findById(productId);
  if (!product) return;
  
  const totalQty = await InventoryModel.aggregate([
    { $match: { productId: new Types.ObjectId(productId) } },
    { $group: { _id: null, total: { $sum: '$quantity' } } }
  ]);
  
  const currentStock = totalQty[0]?.total || 0;
  
  if (currentStock < product.minStock) {
    // Send notification to all managers
    const managers = await UserModel.find({ 
      role: { $in: ['Admin', 'Manager'] } 
    });
    
    for (const manager of managers) {
      await createNotification({
        userId: manager._id.toString(),
        type: 'warning',
        title: 'Cảnh báo tồn kho thấp',
        message: `Sản phẩm ${product.name} (${product.sku}) còn ${currentStock}/${product.minStock}. Cần nhập thêm hàng.`
      });
    }
  }
};

// Call this in adjustInventory function
export const adjustInventory = async (
  productId: string,
  locationId: string,
  delta: number
) => {
  // ... existing logic
  
  // Check low stock after adjustment
  await checkLowStock(productId);
  
  return inventory;
};
```

---

## 📊 Progress Tracking

| Priority | Feature | Status | Progress |
|----------|---------|--------|----------|
| 4 | Auto-Transaction (Receipt) | ✅ DONE | 100% |
| 4 | Auto-Transaction (Delivery) | ⏳ TODO | 0% |
| 4 | Aging Calculation | ⏳ TODO | 0% |
| 4 | Payment Reminders | ⏳ TODO | 0% |
| 5 | QC Workflow | ⏳ TODO | 0% |
| 5 | Auto-Adjustments | ⏳ TODO | 0% |
| 5 | Refund Integration | ⏳ TODO | 0% |
| 6 | Low Stock Notifications | ⏳ TODO | 0% |
| 6 | Comprehensive Triggers | ⏳ TODO | 0% |
| 6 | Email Support | ⏳ TODO | 0% |
| **TOTAL PHASE 2** | | **IN PROGRESS** | **10%** |

---

## 🎯 Recommended Approach

### Option 1: Full Phase 2 (2-3 weeks)
**Do everything** in the plan above

**Pros:**
- Complete business logic
- Production-grade features
- Competitive advantage

**Cons:**
- Takes 2-3 weeks
- Requires significant effort

---

### Option 2: Quick Wins Only (2-3 hours)
**Do only the 3 quick wins:**
1. Auto-transaction on Delivery
2. Aging calculation service
3. Low stock notifications

**Pros:**
- Fast (2-3 hours)
- Immediate value
- Core features working

**Cons:**
- Not complete
- Missing advanced features

---

### Option 3: Hybrid (1 week)
**Do quick wins + priority features:**
1. ✅ Auto-transactions (both)
2. ✅ Aging calculation
3. ✅ Low stock notifications
4. ✅ Basic QC workflow
5. ⏳ Skip email, preferences

**Pros:**
- Balanced approach
- Most important features
- Reasonable timeline

**Cons:**
- Not 100% complete
- Some features deferred

---

## 💡 My Recommendation

**Do Option 2 (Quick Wins) NOW:**
- Takes only 2-3 hours
- Delivers immediate value
- Gets Phase 2 to 40% completion

**Then decide:**
- Continue to full Phase 2?
- Move to Phase 3?
- Stop and deploy?

---

## 🚀 Next Actions

**If you want Quick Wins (2-3 hours):**
1. ✅ Auto-transaction on Delivery
2. ✅ Aging calculation service
3. ✅ Low stock notifications

**If you want Full Phase 2 (2-3 weeks):**
1. Follow the week-by-week plan above
2. Implement all features
3. Test thoroughly

**Your choice?**

---

*Phase 2 Plan created: 2026-01-08 18:26*  
*Ready to implement Quick Wins or Full Phase*
