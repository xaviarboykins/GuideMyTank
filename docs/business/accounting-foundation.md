# GuideMyTank Accounting Foundation Decision Record

**Project:** GuideMyTank  
**Milestone:** M8 — Monetization / Full Launch  
**Issue:** M8: Issue 1 — Business Foundation  
**Subtask:** Accounting Foundation  
**Status:** Complete  
**Last Updated:** July 27, 2026

---

# Overview

This document records the accounting software selection, bookkeeping architecture, and financial recordkeeping strategy for GuideMyTank.

GuideMyTank requires a lightweight, reliable accounting solution capable of supporting a sole proprietorship during the early stages of the business while remaining scalable as revenue grows.

Wave Accounting serves as the official accounting system of record, while a companion Google Sheets financial dashboard provides transaction management, budgeting, reporting, and import preparation.

This document serves as the official accounting decision record for the project.

---

# Accounting Software Selection

## Selected Platform

**Wave Accounting (Starter)**

### Alternatives Considered

Several accounting platforms were evaluated, including:

- Wave Accounting
- QuickBooks Online
- Xero
- FreshBooks

### Decision

GuideMyTank will use **Wave Accounting Starter** during its early stages.

### Reasoning

Wave provides the accounting functionality required by GuideMyTank without introducing unnecessary subscription costs.

Key benefits include:

- Free double-entry accounting
- Income and expense tracking
- Professional financial statements
- Custom Chart of Accounts
- Manual transaction imports through Wave Connect
- Receipt management
- Invoice support (if needed)
- Simple tax reporting support

The free tier provides sufficient functionality until business complexity justifies upgrading to Wave Pro or another accounting platform.

---

# Business Accounting Strategy

GuideMyTank maintains complete separation between business and personal finances.

Wave Accounting serves as the official accounting ledger.

Google Sheets serves as the operational bookkeeping dashboard used to:

- Record transactions
- Track budgets
- Calculate business-use allocations
- Prepare Wave imports
- Monitor cash flow
- Generate management summaries

Examples of business income include:

- Google AdSense
- Amazon Associates
- Affiliate commissions
- Sponsorships
- Digital product sales
- Future subscription revenue

Examples of business expenses include:

- Domain registration
- Website hosting
- Vercel
- Supabase
- AI services
- Software subscriptions
- Professional services
- Marketing expenses

Personal purchases are never recorded as business expenses.

Mixed-use purchases are recorded using documented business-use percentages.

---

# Banking & Transaction Workflow

GuideMyTank maintains a dedicated Bluevine Business Checking account to keep business and personal finances fully separated.

Wave Accounting Starter is the official accounting system of record. Because the Starter plan does not include automatic bank synchronization, business transactions are first maintained in the Google Sheets Transactions ledger before being imported into Wave using Wave Connect.

The bookkeeping workflow consists of:

1. Business income and expenses are deposited into or paid from the Bluevine Business Checking account whenever possible.
2. Record transactions in Google Sheets.
3. Assign the payment account.
4. Assign the appropriate income or expense category.
5. Record business-use percentage when applicable.
6. Maintain receipt status.
7. Import transactions into Wave Connect.
8. Categorize imported transactions in Wave.
9. Perform monthly reconciliation.

Startup expenses incurred before the Bluevine account was established may be recorded using the Personal Bank Account asset account and documented as owner-funded business expenses.

Automatic bank synchronization has been intentionally deferred until business growth justifies upgrading to a paid accounting solution.

---

# Chart of Accounts

GuideMyTank uses a streamlined Chart of Accounts appropriate for a sole proprietorship.

## Income

- Advertising Revenue
- Affiliate Revenue
- Interest Income

---

## Expenses

- Hosting & Infrastructure
- Software & Subscriptions
- Domain Registration
- AI Services
- Advertising & Marketing
- Professional Services
- Education & Training
- Bank & Payment Fees
- Miscellaneous Expenses

---

## Assets

- Bluevine Business Checking
- Personal Bank Account
- Cash on Hand

---

## Equity

- Owner Investment
- Owner Draws

Wave system accounts are retained where required.

---

# Bookkeeping Standards

GuideMyTank follows these bookkeeping standards:

- Maintain complete separation between business and personal finances.
- Record every business transaction.
- Document business-use percentages where applicable.
- Retain receipts for all deductible expenses.
- Categorize transactions consistently.
- Perform monthly reconciliation.
- Maintain complete auditability.
- Keep supporting documentation organized.
- Preserve financial records for tax reporting.

---

# Financial Reporting

Wave Accounting serves as the official reporting system.

Standard reports include:

- Profit & Loss Statement
- Balance Sheet
- Cash Flow Statement

Google Sheets provides additional operational reporting for:

- Budget tracking
- Transaction management
- Annual summaries
- Tax reserve planning
- Cash flow monitoring

---

# Documentation

The following documentation has been completed:

- Accounting platform selection
- Business banking selection
- Wave organization configuration
- Chart of Accounts
- Google Sheets financial dashboard
- Transactions ledger
- Wave Connect import workflow
- Bookkeeping standards
- Monthly reconciliation process
- Financial reporting procedures

---

# Summary

| Category | Decision |
|----------|----------|
| Accounting Platform | Wave Accounting Starter |
| Business Bank | Bluevine Business Checking |
| Accounting Method | Double-Entry Bookkeeping |
| Bookkeeping Dashboard | Google Sheets |
| Import Method | Wave Connect CSV |
| Business Structure | Sole Proprietorship |
| Financial System of Record | Wave Accounting |

---

# Status

- [x] Wave organization created
- [x] Business profile configured
- [x] Chart of Accounts customized
- [x] Google Sheets financial dashboard created
- [x] Transactions ledger implemented
- [x] Wave Connect import workflow documented
- [x] Initial business transactions recorded
- [x] Financial reporting verified
- [x] Bookkeeping standards documented
- [x] Bluevine Business Checking established

---

# Future Migration

Wave Accounting Starter and Bluevine Business Checking are expected to support GuideMyTank throughout its early growth.

Future upgrades may include:

- Automatic bank synchronization
- Wave Pro (if justified)
- Advanced financial reporting
- Payment processor integration
- Automated receipt capture
- Expanded financial automation
- Multi-account banking support if business operations expand

Any future migration will prioritize preserving historical financial records, minimizing operational disruption, and maintaining continuity of financial reporting.

---

**End of Document**