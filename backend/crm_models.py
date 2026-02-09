"""
CRM & Sales Module for Graand Prix Pool Service Management
This module handles: Leads, Quotations, Work Orders, BOQ, Deliveries, Installations
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import uuid

# Create CRM router
crm_router = APIRouter(prefix="/api/crm", tags=["CRM"])

# ==================== CRM MODELS ====================

class LeadStatus:
    NEW = "new"
    CONTACTED = "contacted"
    QUALIFIED = "qualified"
    PROPOSAL_SENT = "proposal_sent"
    NEGOTIATION = "negotiation"
    WON = "won"
    LOST = "lost"

class QuotationStatus:
    DRAFT = "draft"
    SENT = "sent"
    REVISED = "revised"
    APPROVED = "approved"
    REJECTED = "rejected"

class WorkOrderStatus:
    PENDING = "pending"
    BOQ = "boq"
    PROCUREMENT = "procurement"
    MATERIAL_DELIVERED = "material_delivered"
    INSTALLATION = "installation"
    TESTING = "testing"
    COMMISSIONING = "commissioning"
    READY = "ready"
    CONVERTED_TO_AMC = "converted_to_amc"

class DeliveryStatus:
    ORDERED = "ordered"
    IN_TRANSIT = "in_transit"
    DELIVERED = "delivered"
    PARTIAL = "partial"

class InstallationStatus:
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"

# Lead Models
class LeadCreate(BaseModel):
    customer_name: str
    email: Optional[EmailStr] = None
    phone: str
    address: Optional[str] = None
    city: Optional[str] = None
    pool_type: Optional[str] = None  # residential, commercial, olympic
    pool_size: Optional[str] = None
    requirement: Optional[str] = None
    source: Optional[str] = None  # website, referral, cold_call, etc.
    notes: Optional[str] = None
    existing_customer_id: Optional[str] = None  # If cross-sell to existing customer

class LeadUpdate(BaseModel):
    customer_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    pool_type: Optional[str] = None
    pool_size: Optional[str] = None
    requirement: Optional[str] = None
    source: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None
    assigned_to: Optional[str] = None

class LeadResponse(BaseModel):
    id: str
    company_id: str
    customer_name: str
    email: Optional[str] = None
    phone: str
    address: Optional[str] = None
    city: Optional[str] = None
    pool_type: Optional[str] = None
    pool_size: Optional[str] = None
    requirement: Optional[str] = None
    source: Optional[str] = None
    notes: Optional[str] = None
    status: str = LeadStatus.NEW
    assigned_to: Optional[str] = None
    assigned_to_name: Optional[str] = None
    existing_customer_id: Optional[str] = None
    created_at: str
    updated_at: str

# Quotation Models
class QuotationLineItem(BaseModel):
    description: str
    quantity: int = 1
    unit: str = "nos"
    unit_price: float
    amount: float

class QuotationCreate(BaseModel):
    lead_id: str
    title: str
    items: List[QuotationLineItem]
    tax_percent: float = 18.0
    validity_days: int = 30
    terms: Optional[str] = None
    notes: Optional[str] = None

class QuotationResponse(BaseModel):
    id: str
    company_id: str
    lead_id: str
    quotation_number: str
    title: str
    items: List[Dict[str, Any]]
    subtotal: float
    tax_percent: float
    tax_amount: float
    total: float
    validity_days: int
    valid_until: str
    terms: Optional[str] = None
    notes: Optional[str] = None
    status: str = QuotationStatus.DRAFT
    revision: int = 1
    created_at: str
    updated_at: str
    lead_name: Optional[str] = None

# Work Order Models
class WorkOrderCreate(BaseModel):
    quotation_id: str
    scope_of_work: str
    expected_start_date: Optional[str] = None
    expected_end_date: Optional[str] = None
    notes: Optional[str] = None

class WorkOrderResponse(BaseModel):
    id: str
    company_id: str
    lead_id: str
    quotation_id: str
    work_order_number: str
    scope_of_work: str
    expected_start_date: Optional[str] = None
    expected_end_date: Optional[str] = None
    actual_start_date: Optional[str] = None
    actual_end_date: Optional[str] = None
    status: str = WorkOrderStatus.PENDING
    notes: Optional[str] = None
    created_at: str
    updated_at: str
    lead_name: Optional[str] = None
    quotation_total: Optional[float] = None

# BOQ Models
class BOQItemCreate(BaseModel):
    work_order_id: str
    item_name: str
    description: Optional[str] = None
    quantity: int
    unit: str = "nos"
    estimated_cost: Optional[float] = None
    vendor: Optional[str] = None
    supply_type: str = "internal"  # internal, vendor

class BOQItemResponse(BaseModel):
    id: str
    company_id: str
    work_order_id: str
    item_name: str
    description: Optional[str] = None
    quantity: int
    unit: str
    estimated_cost: Optional[float] = None
    vendor: Optional[str] = None
    supply_type: str
    ordered_quantity: int = 0
    delivered_quantity: int = 0
    status: str = "pending"  # pending, ordered, partial, delivered
    created_at: str

# Delivery Models
class DeliveryCreate(BaseModel):
    work_order_id: str
    boq_item_id: str
    quantity: int
    expected_date: Optional[str] = None
    vendor: Optional[str] = None
    notes: Optional[str] = None

class DeliveryResponse(BaseModel):
    id: str
    company_id: str
    work_order_id: str
    boq_item_id: str
    quantity: int
    expected_date: Optional[str] = None
    actual_date: Optional[str] = None
    vendor: Optional[str] = None
    status: str = DeliveryStatus.ORDERED
    notes: Optional[str] = None
    created_at: str
    item_name: Optional[str] = None

# Installation Models
class InstallationCreate(BaseModel):
    work_order_id: str
    assigned_engineer_id: str
    scheduled_date: str
    notes: Optional[str] = None

class InstallationUpdate(BaseModel):
    status: Optional[str] = None
    actual_start_date: Optional[str] = None
    actual_end_date: Optional[str] = None
    completion_notes: Optional[str] = None
    photos: Optional[List[str]] = None

class InstallationResponse(BaseModel):
    id: str
    company_id: str
    work_order_id: str
    assigned_engineer_id: str
    scheduled_date: str
    actual_start_date: Optional[str] = None
    actual_end_date: Optional[str] = None
    status: str = InstallationStatus.SCHEDULED
    notes: Optional[str] = None
    completion_notes: Optional[str] = None
    photos: List[str] = []
    created_at: str
    engineer_name: Optional[str] = None
    work_order_number: Optional[str] = None

# AMC Conversion Model
class AMCConversionCreate(BaseModel):
    work_order_id: str
    amc_plan_id: str
    start_date: str
    end_date: str
    assigned_engineer_id: Optional[str] = None
