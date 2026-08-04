# GuideMyTank Banking Workflow

**Project:** GuideMyTank  
**Milestone:** M8 — Monetization / Full Launch  
**Issue:** M8: Issue 1 — Business Foundation  
**Document Type:** Operational Workflow  
**Status:** Complete  
**Last Updated:** July 27, 2026

---

# Overview

This document defines the standard banking and bookkeeping workflow for GuideMyTank.

Its purpose is to ensure that all business funds are handled consistently, business and personal finances remain completely separate, and accurate financial records are maintained throughout the life of the business.

GuideMyTank currently uses a hybrid bookkeeping workflow consisting of:

- Bluevine Business Checking
- Wave Accounting Starter
- Google Sheets Financial Dashboard

Wave Accounting serves as the official accounting system of record while Google Sheets manages day-to-day bookkeeping operations and transaction preparation.

---

# Objectives

The banking workflow is designed to:

- Maintain complete separation between business and personal finances.
- Route all business income through the business checking account.
- Record all business expenses accurately.
- Support consistent bookkeeping.
- Prepare accurate financial reports.
- Maintain audit-ready financial records.
- Support future business growth.

---

# Banking Platform

| Category | Selection |
|----------|-----------|
| Business Structure | Sole Proprietorship |
| Business Bank | Bluevine Business Checking |
| Federal Tax ID | Employer Identification Number (EIN) |
| Business Name | GuideMyTank (California FBN/DBA Pending) |
| Accounting Platform | Wave Accounting Starter |
| Bookkeeping Dashboard | Google Sheets |

---

# Banking Principles

GuideMyTank follows these banking principles:

- Never mix personal and business finances.
- Deposit all business income into the business checking account.
- Pay all ongoing business expenses from the Bluevine Business Checking account whenever practical. Startup expenses incurred before the account was established should be documented separately.
- Startup expenses paid personally must be documented and categorized appropriately.
- Maintain complete transaction records.
- Retain receipts for deductible expenses.
- Reconcile financial records monthly.
- Protect all banking credentials and financial information.

---

# Overall Financial Workflow

```text
Business Activity
        │
        ▼
Google Sheets Transactions Ledger
        │
        ▼
Business Categorization
        │
        ▼
Wave Connect Import
        │
        ▼
Wave Accounting
        │
        ▼
Monthly Reconciliation
        │
        ▼
Financial Reporting
```

Google Sheets serves as the operational bookkeeping dashboard.

Wave Accounting remains the official accounting ledger.

---

# Business Income Workflow

```text
Revenue Received
        │
        ▼
Bluevine Business Checking
        │
        ▼
Record Transaction in Google Sheets
        │
        ▼
Wave Connect Import
        │
        ▼
Categorize as Income
        │
        ▼
Monthly Reconciliation
```

Examples include:

- Google AdSense
- Amazon Associates
- Affiliate commissions
- Sponsorships
- Digital product sales
- Subscription revenue
- Interest income

---

# Business Expense Workflow

```text
Business Purchase
        │
        ▼
Bluevine Business Checking
(or Personal Bank Account for documented startup expenses)
        │
        ▼
Save Receipt
        │
        ▼
Record Transaction in Google Sheets
        │
        ▼
Assign Category
        │
        ▼
Assign Payment Account
        │
        ▼
Apply Business-Use Percentage (if applicable)
        │
        ▼
Wave Connect Import
        │
        ▼
Wave Expense Categorization
        │
        ▼
Monthly Reconciliation
```

Examples include:

- Website hosting
- Domain registration
- Software subscriptions
- AI services
- Professional services
- Marketing
- Development tools
- Banking fees

---

# Startup Expenses

Some GuideMyTank startup expenses were paid before the Bluevine Business Checking account was established.

These transactions are:

- Recorded in Google Sheets
- Assigned to the Personal Bank Account asset account
- Imported into Wave
- Categorized normally

This preserves an accurate historical financial record while maintaining separation between personal and business finances.

---

# Owner Contributions

Owner contributions occur when personal funds are added to the business.

```text
Personal Funds
        │
        ▼
Transfer to Bluevine Business Checking
        │
        ▼
Record in Google Sheets
        │
        ▼
Import into Wave
        │
        ▼
Categorize as Owner Investment
```

Owner contributions are not business income.

---

# Owner Draws

Owner draws occur when money is withdrawn from the business.

```text
Bluevine Business Checking
        │
        ▼
Transfer to Personal Account
        │
        ▼
Record in Google Sheets
        │
        ▼
Import into Wave
        │
        ▼
Categorize as Owner Draw
```

Owner draws are not business expenses.

---

# Monthly Banking Review

At least once each month:

- Review Bluevine account activity.
- Review Google Sheets transactions.
- Verify payment accounts.
- Verify business-use percentages.
- Confirm receipts are retained.
- Import outstanding transactions into Wave.
- Categorize imported transactions.
- Verify financial reports.
- Resolve discrepancies before closing the month.

---

# Security Standards

GuideMyTank protects financial information by:

- Enabling Multi-Factor Authentication (MFA)
- Using strong unique passwords
- Protecting recovery information
- Reviewing banking alerts regularly
- Investigating unauthorized activity immediately

Bank credentials, API keys, and financial information must never be committed to source control or stored in public documentation.

---

# Exception Handling

If an incorrect transaction occurs:

1. Identify the transaction.
2. Determine whether it is business or personal.
3. Correct the Google Sheets ledger if necessary.
4. Update Wave Accounting.
5. Retain documentation explaining the correction.

If unauthorized activity is detected:

1. Freeze affected payment methods if possible.
2. Contact Bluevine immediately.
3. Document the incident.
4. Update credentials.
5. Verify recent transactions.

---

# Related Documentation

- business-foundation.md
- accounting-foundation.md
- bookkeeping-standards.md
- monthly-reconciliation.md
- tax-documentation.md

---

# Revision History

| Date       | Version | Description |
|------------|---------|-------------|
| 2026-07-26 | 1.0     | Initial banking workflow created. |
| 2026-07-27 | 2.0     | Updated to reflect the production Wave Accounting Starter + Google Sheets bookkeeping workflow. |
| 2026-07-27 | 2.1     | Updated banking platform from Novo Business Checking to Bluevine Business Checking after production account approval. |

---

**End of Document**