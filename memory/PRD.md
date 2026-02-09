# AquaFlow CRM - Swimming Pool Maintenance SaaS Platform

## Original Problem Statement
Cloud-based SaaS platform for swimming pool maintenance companies working on AMC (Annual Maintenance Contract) models. Multi-tenant system with Company Portal, Engineer Portal, and Customer Portal. Includes Sales CRM module for complete sales lifecycle management from lead to project execution.

## Architecture
- **Backend**: FastAPI + MongoDB (motor async driver)
- **Frontend**: React 19 + TailwindCSS + Shadcn/UI
- **Authentication**: JWT-based with role-based access control
- **Database**: MongoDB with collections for users, companies, customers, pools, amc_plans, amc_assignments, services, service_logs, engineers, leads, quotations, work_orders, boq_items, deliveries, installations, comments, stage_history, tasks

## User Personas
1. **Company Admin**: Pool service company owner/manager
2. **Engineer/Technician**: Field service technician
3. **Customer**: End customer with pool AMC contract
4. **Sales Team**: (via CRM module) Manages leads, quotations, and project execution

## Core Requirements (Static)
- [x] JWT Authentication with 3 roles
- [x] Company registration and management
- [x] Customer CRUD operations
- [x] Pool management per customer
- [x] AMC Plan creation with checklist
- [x] AMC assignment to pools with engineer
- [x] Auto-generation of scheduled services
- [x] Engineer service execution with GPS proof
- [x] Customer portal for transparency
- [x] Role-based access control
- [x] Data isolation per company

## What's Been Implemented

### Core AMC System
- Auth endpoints: register, login, me
- Company management with branding settings
- Customer CRUD with auto customer user creation
- Pool management
- AMC Plan CRUD with checklist items
- AMC Assignment with auto service generation
- Engineer management with login credentials
- Service scheduling and assignment
- Engineer service execution (start/end with GPS)
- Service logs with time, location, checklist, readings
- Customer portal endpoints
- Dashboard statistics

### Sales CRM Module - Enabled by Default
Backend:
- Leads management (create, update status, delete)
- Quotations with line items, tax, validity
- Quotation revisions and status workflow
- Work Orders from approved quotations
- BOQ (Bill of Quantity) management
- Delivery tracking
- Installation scheduling and tracking
- **Project Execution Flow**: Stage-based project management
- **Comments**: Collaboration on work orders
- **Tasks**: Task assignment to engineers per work order
- **Stage History**: Track all stage transitions
- **AMC Conversion**: Convert completed work orders to AMC customers

Frontend:
- CRM Dashboard with pipeline value and funnel stats
- Leads page with status tracking and filtering
- Quotations page with line item editor
- Work Orders page with status management
- **Work Order Detail Page** (NEW):
  - Visual project timeline with 8 stages
  - Stage update with notes
  - Comments section for team collaboration
  - Task management with assignment
- AMC conversion modal

### Frontend Portals
- Admin Portal: Full dashboard, customers, pools, AMC plans, services, engineers, settings, CRM
- Engineer Portal: Mobile-first, today's jobs, GPS service execution
- Customer Portal: Service history, AMC tracking

### Rebranding (Feb 2026)
- Changed from "Graand Prix" to "AquaFlow CRM"
- Updated all layouts, login page, and backend title

## CRM Workflow
1. **Lead Capture** → Create lead with customer details, pool info, requirements
2. **Quotation** → Create quotation with line items from lead
3. **Approval** → Send → Approve/Reject quotation
4. **Work Order** → Create work order from approved quotation
5. **Project Execution** → Track through stages:
   - Pending → BOQ → Procurement → Material Delivered → Installation → Testing → Commissioning → Ready
6. **AMC Conversion** → Convert completed work order to AMC customer

## Project Stages
1. **Pending**: Work order created, waiting to start
2. **BOQ**: Bill of Quantity prepared
3. **Procurement**: Materials being procured
4. **Material Delivered**: Materials received at site
5. **Installation**: Active installation work
6. **Testing**: Testing pool systems
7. **Commissioning**: Final commissioning
8. **Ready**: Project complete, ready for AMC

## Prioritized Backlog

### P0 (Critical - Done)
- [x] Auth system
- [x] Core CRUD operations
- [x] Service workflow with GPS
- [x] Multi-portal access
- [x] Sales CRM module
- [x] Project Execution Flow (Timeline, Comments, Tasks)

### P1 (High Priority - Next Phase)
- [ ] Cloud storage integration (Google Drive/OneDrive) for photos
- [ ] PDF report generation
- [ ] Email notifications
- [ ] Super Admin portal
- [ ] Subscription/billing management

### P2 (Medium Priority)
- [ ] WhatsApp notifications
- [ ] Advanced analytics dashboard
- [ ] Engineer performance reports
- [ ] AMC compliance reports
- [ ] Bulk service scheduling
- [ ] Calendar view for services

### P3 (Nice to Have)
- [ ] Mobile app (React Native)
- [ ] Offline mode for engineers
- [ ] Customer feedback system
- [ ] Inventory management
- [ ] Invoice generation

## Test Credentials
- Admin: admin@graandprix.com / admin123
- Company: Graand Prix Pool Services (user data, not branding)
- CRM Enabled: Yes

## API Endpoints Summary
- `/api/auth/*`: Authentication (register, login, me)
- `/api/company`: Company management
- `/api/customers/*`: Customer CRUD
- `/api/pools/*`: Pool management
- `/api/amc-plans/*`: AMC Plan CRUD
- `/api/amc-assignments/*`: AMC Assignment
- `/api/engineers/*`: Engineer management
- `/api/services/*`: Service management
- `/api/engineer/services/*`: Engineer service execution
- `/api/customer/*`: Customer portal
- `/api/dashboard/stats`: Dashboard statistics
- `/api/crm/leads/*`: Lead management
- `/api/crm/quotations/*`: Quotation management
- `/api/crm/work-orders/*`: Work order management
- `/api/crm/work-orders/{id}/detail`: Full work order details
- `/api/crm/work-orders/{id}/stage`: Update work order stage
- `/api/crm/work-orders/{id}/comments`: Work order comments
- `/api/crm/tasks/*`: Task management
- `/api/crm/boq/*`: BOQ management
- `/api/crm/deliveries/*`: Delivery tracking
- `/api/crm/installations/*`: Installation management
- `/api/crm/convert-to-amc`: AMC conversion

## Next Tasks
1. End-to-end testing of Engineer Service Workflow
2. Add cloud storage integration for proof photos
3. Implement PDF report generation
4. Build Super Admin portal
5. Add email notifications
