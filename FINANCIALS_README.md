# 💰 Financials Feature - Complete Documentation

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Architecture](#architecture)
4. [Installation](#installation)
5. [Usage](#usage)
6. [API Reference](#api-reference)
7. [Configuration](#configuration)
8. [Development](#development)
9. [Production Deployment](#production-deployment)
10. [Troubleshooting](#troubleshooting)

---

## Overview

The **Financials Feature** is a comprehensive financial management system for the freelancer-hub-project, inspired by Hubstaff's Financials feature. It provides complete payroll processing, payment tracking, invoice management, and financial analytics.

### Key Capabilities

- 💼 **Payroll Management**: Automated payroll calculation and batch processing
- 💳 **Payment Tracking**: Comprehensive payment history and manual payment creation
- 📄 **Invoice Management**: Full invoice lifecycle with email and PDF support
- 📊 **Financial Dashboard**: Real-time analytics and reporting
- 🌍 **International Payments**: Wise API integration for global transfers
- 📧 **Email Notifications**: Automated invoice and payment emails
- 📑 **PDF Generation**: Professional invoices and receipts

---

## Features

### 1. Financial Dashboard

**Route**: `/tenants/:slug/financials`

**Features**:
- Key metrics (Total Invoiced, Paid, Outstanding, Overdue)
- Revenue trend chart (6 months)
- Invoice status distribution chart
- Quick action cards
- Recent activity tables

### 2. Payroll Management

**Route**: `/tenants/:slug/financials/payroll`

**Features**:
- Create payroll batches
- Calculate payroll from time entries
- Select team members and date range
- Real-time calculation preview
- Process and track batch status
- Individual payment breakdown

### 3. Payment Management

**Routes**:
- List: `/tenants/:slug/financials/payments/history`
- Create: `/tenants/:slug/financials/payments/create`

**Features**:
- Payment history with advanced filtering
- Manual payment creation
- Amount calculator from hours
- Multi-currency support (USD, EUR, GBP, CAD, AUD)
- Fee tracking and net amount calculation
- Invoice linking
- Payment method selection (7 options)
- Payment details modal

### 4. Invoice Management

**Route**: `/tenants/:slug/financials/invoices`

**Features**:
- Invoice list with filtering
- Create invoices from time entries
- Send invoices via email
- Generate PDF invoices
- Track payment progress
- Manage invoice status
- Client information management
- Tax and discount support

---

## Architecture

### Frontend Stack

- **React 19.1.0**: UI framework
- **TypeScript**: Type safety
- **Refine 5.0.0**: Admin framework
- **Ant Design 5.27.4**: UI components
- **Recharts**: Data visualization
- **Vite**: Build tool

### Backend Stack

- **AdonisJS 6.x**: Backend framework
- **Lucid ORM**: Database ORM
- **PostgreSQL**: Database
- **TypeScript**: Type safety

### External Services

- **Wise API**: International payments
- **Email Provider**: SendGrid/SMTP
- **PDF Engine**: Puppeteer
- **File Storage**: S3/Local

---

## Installation

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Backend Setup

```bash
cd freelancer-hub-backend

# Install dependencies
npm install

# Run migrations
node ace migration:run

# Start server
npm run dev
```

### Frontend Setup

```bash
cd freelancer-hub-dashboard

# Install dependencies
npm install

# Start development server
npm run dev
```

---

## Usage

### Creating a Payroll Batch

1. Navigate to **Financials → Payroll**
2. Click **Create Batch**
3. Select date range (pay period)
4. Select team members (or leave empty for all)
5. Click **Calculate Payroll** to preview
6. Review individual payments
7. Click **Create Batch** to save
8. Click **Process** to execute payments

### Creating a Payment

1. Navigate to **Financials → Payments → Create**
2. Select recipient (team member)
3. Choose amount source:
   - **Manual Entry**: Enter amount directly
   - **Calculate from Hours**: Select date range and calculate
4. Enter payment details (method, currency, fee)
5. Optionally link to invoice
6. Add notes if needed
7. Click **Create Payment**

### Managing Invoices

1. Navigate to **Financials → Invoices**
2. View invoice list with filters
3. Click **View** to see details
4. Actions available:
   - **Edit**: Modify draft invoices
   - **Send**: Email invoice to client
   - **PDF**: Generate and download PDF
   - **Delete**: Remove draft invoices

### Viewing Financial Dashboard

1. Navigate to **Financials** (home)
2. View key metrics at top
3. Analyze revenue trends
4. Check invoice status distribution
5. Review recent activity
6. Use quick actions to navigate

---

## API Reference

### Payroll Endpoints

```
GET    /api/v1/tenants/:slug/payroll/batches
GET    /api/v1/tenants/:slug/payroll/batches/:id
POST   /api/v1/tenants/:slug/payroll/calculate
POST   /api/v1/tenants/:slug/payroll/batches
POST   /api/v1/tenants/:slug/payroll/batches/:id/process
DELETE /api/v1/tenants/:slug/payroll/batches/:id
```

### Payment Endpoints

```
GET    /api/v1/tenants/:slug/payments
GET    /api/v1/tenants/:slug/payments/:id
POST   /api/v1/tenants/:slug/payments
DELETE /api/v1/tenants/:slug/payments/:id
```

### Invoice Endpoints

```
GET    /api/v1/tenants/:slug/invoices
GET    /api/v1/tenants/:slug/invoices/:id
POST   /api/v1/tenants/:slug/invoices/generate
PATCH  /api/v1/tenants/:slug/invoices/:id/status
POST   /api/v1/tenants/:slug/invoices/:id/send
POST   /api/v1/tenants/:slug/invoices/:id/pdf
DELETE /api/v1/tenants/:slug/invoices/:id
```

---

## Configuration

### Environment Variables

#### Backend (.env)

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
DB_DATABASE=freelancer_hub

# Wise API
WISE_API_KEY=your_api_key
WISE_PROFILE_ID=your_profile_id
WISE_ENVIRONMENT=sandbox

# Email
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=Your Company

# SendGrid (optional)
SENDGRID_API_KEY=your_key

# SMTP (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASS=your_password
```

#### Frontend (.env)

```env
VITE_API_URL=http://localhost:3333/api/v1
```

---

## Development

### Running Tests

```bash
# Backend tests
cd freelancer-hub-backend
npm test

# Frontend tests
cd freelancer-hub-dashboard
npm test
```

### Building for Production

```bash
# Backend
cd freelancer-hub-backend
npm run build

# Frontend
cd freelancer-hub-dashboard
npm run build
```

### Code Quality

```bash
# Linting
npm run lint

# Type checking
npm run type-check

# Formatting
npm run format
```

---

## Production Deployment

### 1. Database Migration

```bash
node ace migration:run --force
```

### 2. Environment Setup

- Set all environment variables
- Configure Wise API credentials
- Set up email service (SendGrid/SMTP)
- Configure file storage (S3/local)

### 3. PDF Generation

Install Puppeteer:
```bash
npm install puppeteer
```

### 4. Email Service

Install SendGrid:
```bash
npm install @sendgrid/mail
```

Or Nodemailer:
```bash
npm install nodemailer
```

### 5. Security

- Enable HTTPS
- Set up CORS properly
- Implement rate limiting
- Enable audit logging
- Regular security audits

---

## Troubleshooting

### Common Issues

#### 1. Payroll Calculation Returns 0

**Cause**: No billable time entries found
**Solution**: Ensure time entries are marked as billable

#### 2. Email Not Sending

**Cause**: Email service not configured
**Solution**: Check environment variables and email service setup

#### 3. PDF Generation Fails

**Cause**: Puppeteer not installed or configured
**Solution**: Install puppeteer and ensure proper permissions

#### 4. Wise Transfer Fails

**Cause**: Invalid API credentials or insufficient balance
**Solution**: Verify API key, profile ID, and account balance

### Debug Mode

Enable debug logging:

```env
LOG_LEVEL=debug
```

### Support

For issues and questions:
- Check documentation
- Review error logs
- Contact support team

---

## License

MIT License - See LICENSE file for details

---

## Credits

Developed for the freelancer-hub-project
Inspired by Hubstaff's Financials feature

---

## Version History

### v1.0.0 (Current)
- ✅ Complete payroll management
- ✅ Payment tracking and creation
- ✅ Invoice management with email/PDF
- ✅ Financial dashboard
- ✅ Wise API integration
- ✅ Multi-currency support
- ✅ Responsive design

---

**For detailed implementation documentation, see:**
- `FINANCIALS_COMPLETE_SUMMARY.md` - Complete feature summary
- `FINANCIALS_PHASE_3_4_COMPLETE.md` - Phase 3 & 4 details
- `FINANCIALS_NEXT_STEPS.md` - Production deployment guide


