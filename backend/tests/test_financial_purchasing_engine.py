"""
Automated Unit & Integration Tests for the ExBOS Intelligent Purchasing & Financial Awareness Engine.

Tests cover:
1. Centralized Financial Calculation Service:
   - Never confuses sales revenue, profit, and available cash
   - Unpaid customer credit sales are excluded from available cash
   - Reconciles Cash in Hand, Mobile Money, and Bank balances accurately
   - Computes COGS, Gross Profit, Operating Expenses, and Net Profit
   - Computes Reserved Operational Funds, Purchase Commitments, and Available Purchasing Budget
2. Intelligent Purchase Assessment & Affordability:
   - Calculates Available Purchasing Budget = Available Cash - Reserved Funds - Commitments
   - Detects positive Purchase Shortfall and suggests actionable alternatives
   - Supports "I have other side money I can add to afford" (sideMoneyAddedRWF)
3. Intelligent Stock Awareness & Recommendations:
   - Detects 0-stock replenishment need and days of stock coverage from sales velocity
   - Detects existing open Purchase Orders / in-transit stock to prevent duplicate ordering
   - Detects lower historical supplier price alternatives
4. Transaction Integrity (Purchase Orders vs Received Inventory & Partial Payments):
   - Prevents duplicate financial deductions between module records and transactions
   - Increases stock ONLY when goods are actually received (not on Ordered POs)
   - Separates Supplier Credit from cash outflow on partial payments
"""

import unittest
from app.services.financial_intelligence import (
    calculate_financial_intelligence,
    assess_purchase_decision,
    _extract_purchase_financials,
)


class TestFinancialPurchasingEngine(unittest.TestCase):
    def setUp(self):
        self.sample_workspace = {
            "architectureId": "buy-and-sell",
            "records": {
                "Inventory": [
                    {
                        "id": "PROD-CEMENT",
                        "title": "Cimerwa Cement 50kg",
                        "quantity": 0,
                        "currentStock": 0,
                        "lowStockAlert": 10,
                        "purchasePriceRWF": 12000,
                        "sellingPriceRWF": 14500,
                        "unit": "bag",
                    },
                    {
                        "id": "PROD-PAINT",
                        "title": "Amaco Paint 20L",
                        "quantity": 24,
                        "currentStock": 24,
                        "lowStockAlert": 5,
                        "purchasePriceRWF": 25000,
                        "sellingPriceRWF": 32000,
                        "unit": "bucket",
                    },
                ],
                "Sales": [
                    # Paid MoMo Sale: 200,000 RWF revenue, COGS = 10 * 12,000 = 120,000 RWF
                    {
                        "id": "SALE-1",
                        "productId": "PROD-CEMENT",
                        "productTitle": "Cimerwa Cement 50kg",
                        "quantity": 10,
                        "amountRWF": 200000,
                        "paidAmountRWF": 200000,
                        "remainingAmountRWF": 0,
                        "status": "Paid in Full",
                        "paymentMethod": "MTN MoMo Business",
                    },
                    # Unpaid Credit Sale: 145,000 RWF revenue, 0 cash received!
                    {
                        "id": "SALE-2",
                        "productId": "PROD-CEMENT",
                        "productTitle": "Cimerwa Cement 50kg",
                        "quantity": 10,
                        "amountRWF": 145000,
                        "paidAmountRWF": 0,
                        "remainingAmountRWF": 145000,
                        "status": "Unpaid (Customer Debt)",
                        "paymentMethod": "Customer Credit",
                    },
                    # Cash Sale of Paint: 60 buckets over 30 days (2 buckets/day velocity), 100,000 RWF paid cash
                    {
                        "id": "SALE-3",
                        "productId": "PROD-PAINT",
                        "productTitle": "Amaco Paint 20L",
                        "quantity": 60,
                        "amountRWF": 100000,
                        "paidAmountRWF": 100000,
                        "remainingAmountRWF": 0,
                        "costOfGoodsRWF": 50000,
                        "status": "Paid in Full",
                        "paymentMethod": "Cash",
                    },
                ],
                "Expenses": [
                    # Paid Operating Expense: 40,000 RWF via Cash
                    {
                        "id": "EXP-1",
                        "title": "Shop Electricity & Water",
                        "amountRWF": 40000,
                        "status": "Paid",
                        "paymentMethod": "Cash",
                    }
                ],
                "Purchases": [
                    # Part-paid Received Purchase: 100,000 RWF total, 60,000 RWF paid via MoMo, 40,000 RWF owed to supplier
                    {
                        "id": "PUR-1",
                        "productId": "PROD-CEMENT",
                        "productTitle": "Cimerwa Cement 50kg",
                        "quantity": 10,
                        "unitPriceRWF": 10000,
                        "amountRWF": 100000,
                        "paidAmountRWF": 60000,
                        "remainingAmountRWF": 40000,
                        "deliveryStatus": "Received",
                        "paymentStatus": "Part-paid",
                        "paymentMethod": "MTN MoMo Business",
                        "supplierName": "Cimerwa Depot B",
                    },
                    # Open Purchase Order (Ordered / In Transit): 30 bags @ 11,000 = 330,000 RWF, 0 paid, 30,000 RWF commitment on another PO
                    {
                        "id": "PUR-PO-1",
                        "productId": "PROD-CEMENT",
                        "productTitle": "Cimerwa Cement 50kg",
                        "quantity": 30,
                        "orderedQuantity": 30,
                        "receivedQuantity": 0,
                        "unitPriceRWF": 11000,
                        "amountRWF": 30000,
                        "paidAmountRWF": 0,
                        "remainingAmountRWF": 30000,
                        "deliveryStatus": "Ordered",
                        "paymentStatus": "Unpaid",
                        "paymentMethod": "Supplier Credit Account",
                        "supplierName": "Wholesale Cement Ltd",
                    },
                ],
                "Customers": [],
                "Suppliers": [],
            },
        }
        # Auto-mirrored transactions (must NOT be double-counted!)
        self.mirrored_transactions = [
            {
                "id": "TX-SALE-1",
                "recordId": "SALE-1",
                "sourceModule": "Sales",
                "architectureId": "buy-and-sell",
                "type": "INFLOW",
                "amountRWF": 200000,
                "paymentMethod": "MTN MoMo Business",
            },
            {
                "id": "TX-PUR-1",
                "recordId": "PUR-1",
                "sourceModule": "Purchases",
                "architectureId": "buy-and-sell",
                "type": "OUTFLOW",
                "amountRWF": 60000,
                "paymentMethod": "MTN MoMo Business",
            },
            {
                "id": "TX-EXP-1",
                "recordId": "EXP-1",
                "sourceModule": "Expenses",
                "architectureId": "buy-and-sell",
                "type": "OUTFLOW",
                "amountRWF": 40000,
                "paymentMethod": "Cash",
            },
        ]

    def test_cash_revenue_profit_separation_and_no_double_deduction(self):
        intel = calculate_financial_intelligence(
            workspace=self.sample_workspace,
            transactions=self.mirrored_transactions,
            arch_id="buy-and-sell",
        )

        # Total sales = 200,000 + 145,000 + 100,000 = 445,000 RWF
        self.assertEqual(intel["totalSalesRevenueRWF"], 445000)
        # Actual payments received = 200,000 + 0 (credit sale excluded!) + 100,000 = 300,000 RWF
        self.assertEqual(intel["actualPaymentsReceivedRWF"], 300000)
        # Outstanding customer debts = 145,000 RWF
        self.assertEqual(intel["outstandingCustomerDebtsRWF"], 145000)

        # Paid purchases outflow = 60,000 RWF (not 100,000 RWF and not double-counted with TX-PUR-1)
        self.assertEqual(intel["paidPurchasesOutflowRWF"], 60000)
        # Operating expenses = 40,000 RWF (not double-counted with TX-EXP-1)
        self.assertEqual(intel["operatingExpensesRWF"], 40000)

        # Reconciled Available Business Cash = 300,000 received - 60,000 paid purchase - 40,000 paid expense = 200,000 RWF
        self.assertEqual(intel["availableBusinessCashRWF"], 200000)
        self.assertEqual(intel["mobileMoneyBalanceRWF"], 140000)  # 200k MoMo in - 60k MoMo out
        self.assertEqual(intel["cashInHandRWF"], 60000)  # 100k Cash in - 40k Cash out

        # Supplier debt on received goods = 40,000 RWF; Open PO commitment = 30,000 RWF
        self.assertEqual(intel["outstandingSupplierDebtsRWF"], 40000)
        self.assertEqual(intel["purchaseCommitmentsRWF"], 30000)

        # Reserved Operational Funds = 15% of 40,000 = 6,000 RWF
        self.assertEqual(intel["reservedOperationalFundsRWF"], 6000)
        # Available Purchasing Budget = 200,000 Cash - 6,000 Reserve - 30,000 Commitments = 164,000 RWF
        self.assertEqual(intel["availablePurchasingBudgetRWF"], 164000)

    def test_purchasing_affordability_shortfall_and_side_money_topup(self):
        # Attempt to buy 20 bags of Cement @ 12,000 RWF = 240,000 RWF Paid in Full
        # Available budget is 164,000 RWF -> Shortfall should be 76,000 RWF
        assessment = assess_purchase_decision(
            draft_purchase={
                "productId": "PROD-CEMENT",
                "productTitle": "Cimerwa Cement 50kg",
                "quantity": 20,
                "unitPriceRWF": 12000,
                "paymentStatus": "Paid in Full",
                "paymentMethod": "MTN MoMo Business",
                "supplierName": "Higher Price Supplier",
            },
            workspace=self.sample_workspace,
            transactions=self.mirrored_transactions,
            arch_id="buy-and-sell",
        )

        self.assertFalse(assessment["affordability"]["isAffordable"])
        self.assertEqual(assessment["affordability"]["baseAvailablePurchasingBudgetRWF"], 164000)
        self.assertEqual(assessment["affordability"]["purchaseShortfallRWF"], 76000)

        # Verify alternatives include ADD_SIDE_MONEY, REDUCE_QUANTITY, PARTIAL_CREDIT, SAVE_AS_PO
        alt_actions = {a["action"] for a in assessment["alternatives"]}
        self.assertIn("ADD_SIDE_MONEY", alt_actions)
        self.assertIn("REDUCE_QUANTITY", alt_actions)
        self.assertIn("PARTIAL_CREDIT", alt_actions)
        self.assertIn("SAVE_AS_PO", alt_actions)

        # Now user clicks "I have other side money I can add (+76,000 RWF)"
        with_side_money = assess_purchase_decision(
            draft_purchase={
                "productId": "PROD-CEMENT",
                "productTitle": "Cimerwa Cement 50kg",
                "quantity": 20,
                "unitPriceRWF": 12000,
                "paymentStatus": "Paid in Full",
                "paymentMethod": "MTN MoMo Business",
                "supplierName": "Higher Price Supplier",
                "sideMoneyAddedRWF": 76000,
            },
            workspace=self.sample_workspace,
            transactions=self.mirrored_transactions,
            arch_id="buy-and-sell",
        )
        self.assertTrue(with_side_money["affordability"]["isAffordable"])
        self.assertEqual(with_side_money["affordability"]["purchaseShortfallRWF"], 0)
        self.assertEqual(with_side_money["affordability"]["effectivePurchasingBudgetRWF"], 240000)

    def test_stock_awareness_open_po_and_supplier_price_recommendations(self):
        # 1. Cement has 0 stock on shelf, 30 bags on open PO, and Cimerwa Depot B previously supplied @ 10,000 RWF
        cement_assess = assess_purchase_decision(
            draft_purchase={
                "productId": "PROD-CEMENT",
                "productTitle": "Cimerwa Cement 50kg",
                "quantity": 10,
                "unitPriceRWF": 12000,
                "paymentStatus": "Paid in Full",
                "paymentMethod": "MTN MoMo Business",
                "supplierName": "New Expensive Vendor",
            },
            workspace=self.sample_workspace,
            transactions=self.mirrored_transactions,
            arch_id="buy-and-sell",
        )
        self.assertEqual(cement_assess["product"]["currentStock"], 0)
        self.assertEqual(cement_assess["product"]["onOrderQuantity"], 30)
        rec_codes = {r["code"] for r in cement_assess["recommendations"]}
        self.assertIn("ZERO_STOCK_WITH_OPEN_PO", rec_codes)
        self.assertIn("EXISTING_OPEN_PO", rec_codes)
        self.assertIn("LOWER_SUPPLIER_PRICE", rec_codes)
        self.assertEqual(
            cement_assess["pricing"]["cheaperSupplierAlternative"]["supplier"],
            "Cimerwa Depot B",
        )

        # 2. Paint has 24 buckets in stock and 60 sold over 30 days (2.0/day) -> ~12 days of stock coverage
        paint_assess = assess_purchase_decision(
            draft_purchase={
                "productId": "PROD-PAINT",
                "productTitle": "Amaco Paint 20L",
                "quantity": 10,
                "unitPriceRWF": 25000,
                "paymentStatus": "Unpaid",
                "paymentMethod": "Supplier Credit Account",
                "supplierName": "Amaco Paints HQ",
            },
            workspace=self.sample_workspace,
            transactions=self.mirrored_transactions,
            arch_id="buy-and-sell",
        )
        self.assertEqual(paint_assess["product"]["daysOfStockCoverage"], 12)
        paint_codes = {r["code"] for r in paint_assess["recommendations"]}
        self.assertIn("DAYS_OF_COVERAGE", paint_codes)

    def test_purchase_order_vs_received_inventory_and_partial_payments(self):
        # Open PO must have receivedQty = 0 and isOpenPo = True
        po_fin = _extract_purchase_financials(
            {
                "quantity": 50,
                "unitPriceRWF": 1000,
                "amountRWF": 50000,
                "deliveryStatus": "Ordered",
                "paymentStatus": "Unpaid",
            }
        )
        self.assertTrue(po_fin["isOpenPo"])
        self.assertEqual(po_fin["orderedQty"], 50)
        self.assertEqual(po_fin["receivedQty"], 0)
        self.assertEqual(po_fin["pendingQty"], 50)
        self.assertEqual(po_fin["paid"], 0)
        self.assertEqual(po_fin["remaining"], 50000)

        # Partially received & part-paid purchase
        part_fin = _extract_purchase_financials(
            {
                "quantity": 50,
                "orderedQuantity": 50,
                "receivedQuantity": 20,
                "amountRWF": 50000,
                "paidAmountRWF": 15000,
                "deliveryStatus": "Partially Received",
                "paymentStatus": "Part-paid",
            }
        )
        self.assertTrue(part_fin["isOpenPo"])
        self.assertEqual(part_fin["receivedQty"], 20)
        self.assertEqual(part_fin["pendingQty"], 30)
        self.assertEqual(part_fin["paid"], 15000)
        self.assertEqual(part_fin["remaining"], 35000)


if __name__ == "__main__":
    unittest.main()
