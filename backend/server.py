from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'graandprix-secret-key-2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Create the main app
app = FastAPI(title="Graand Prix - Pool Service Management")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

security = HTTPBearer()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class UserRole:
    COMPANY_ADMIN = "company_admin"
    ENGINEER = "engineer"
    CUSTOMER = "customer"

# Auth Models
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str = UserRole.COMPANY_ADMIN
    company_name: Optional[str] = None
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    company_id: Optional[str] = None
    company_name: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Company Models
class CompanyCreate(BaseModel):
    name: str
    address: Optional[str] = None
    phone: Optional[str] = None
    logo_url: Optional[str] = None
    primary_color: Optional[str] = "#007AFF"

class CompanyResponse(BaseModel):
    id: str
    name: str
    address: Optional[str] = None
    phone: Optional[str] = None
    logo_url: Optional[str] = None
    primary_color: str = "#007AFF"
    created_at: str

# Customer Models
class CustomerCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str
    address: str
    city: Optional[str] = None
    notes: Optional[str] = None

class CustomerResponse(BaseModel):
    id: str
    company_id: str
    name: str
    email: str
    phone: str
    address: str
    city: Optional[str] = None
    notes: Optional[str] = None
    created_at: str
    pools_count: int = 0
    active_amcs: int = 0

# Pool Models
class PoolCreate(BaseModel):
    customer_id: str
    name: str
    pool_type: str  # residential, commercial, olympic
    size: Optional[str] = None
    volume_liters: Optional[int] = None
    location_notes: Optional[str] = None

class PoolResponse(BaseModel):
    id: str
    customer_id: str
    company_id: str
    name: str
    pool_type: str
    size: Optional[str] = None
    volume_liters: Optional[int] = None
    location_notes: Optional[str] = None
    created_at: str

# AMC Plan Models
class AMCPlanCreate(BaseModel):
    name: str
    description: Optional[str] = None
    frequency: str  # weekly, biweekly, monthly
    visits_per_month: int
    price: float
    checklist_items: List[str] = []

class AMCPlanResponse(BaseModel):
    id: str
    company_id: str
    name: str
    description: Optional[str] = None
    frequency: str
    visits_per_month: int
    price: float
    checklist_items: List[str] = []
    created_at: str

# AMC Assignment Models
class AMCAssignmentCreate(BaseModel):
    pool_id: str
    amc_plan_id: str
    start_date: str
    end_date: str
    assigned_engineer_id: Optional[str] = None

class AMCAssignmentResponse(BaseModel):
    id: str
    company_id: str
    customer_id: str
    pool_id: str
    amc_plan_id: str
    start_date: str
    end_date: str
    assigned_engineer_id: Optional[str] = None
    status: str = "active"
    created_at: str
    customer_name: Optional[str] = None
    pool_name: Optional[str] = None
    plan_name: Optional[str] = None
    engineer_name: Optional[str] = None

# Engineer Models
class EngineerCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str
    password: str

class EngineerResponse(BaseModel):
    id: str
    user_id: str
    company_id: str
    name: str
    email: str
    phone: str
    status: str = "active"
    created_at: str

# Service Models
class ServiceCreate(BaseModel):
    amc_assignment_id: str
    scheduled_date: str
    engineer_id: Optional[str] = None

class ServiceResponse(BaseModel):
    id: str
    company_id: str
    amc_assignment_id: str
    customer_id: str
    pool_id: str
    scheduled_date: str
    engineer_id: Optional[str] = None
    status: str = "scheduled"
    created_at: str
    customer_name: Optional[str] = None
    pool_name: Optional[str] = None
    engineer_name: Optional[str] = None
    address: Optional[str] = None
    amc_plan_name: Optional[str] = None
    checklist_items: List[str] = []

# Service Log Models (When engineer completes work)
class ServiceStartRequest(BaseModel):
    service_id: str
    latitude: float
    longitude: float

class ServiceEndRequest(BaseModel):
    service_id: str
    latitude: float
    longitude: float
    checklist_completed: List[str] = []
    readings: Optional[dict] = None  # {ph: 7.2, chlorine: 2.5}
    remarks: Optional[str] = None
    photos: List[str] = []  # URLs for now

class ServiceLogResponse(BaseModel):
    id: str
    service_id: str
    engineer_id: str
    start_time: Optional[str] = None
    start_latitude: Optional[float] = None
    start_longitude: Optional[float] = None
    end_time: Optional[str] = None
    end_latitude: Optional[float] = None
    end_longitude: Optional[float] = None
    duration_minutes: Optional[int] = None
    checklist_completed: List[str] = []
    readings: Optional[dict] = None
    remarks: Optional[str] = None
    photos: List[str] = []
    status: str = "in_progress"

# ==================== HELPER FUNCTIONS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, email: str, role: str, company_id: str = None) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "company_id": company_id,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def require_company_admin(user: dict = Depends(get_current_user)):
    if user["role"] != UserRole.COMPANY_ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

async def require_engineer(user: dict = Depends(get_current_user)):
    if user["role"] != UserRole.ENGINEER:
        raise HTTPException(status_code=403, detail="Engineer access required")
    return user

# ==================== AUTH ENDPOINTS ====================

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(data: UserRegister):
    # Check if email exists
    existing = await db.users.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    company_id = None
    company_name = None
    
    # If company admin, create company
    if data.role == UserRole.COMPANY_ADMIN and data.company_name:
        company_id = str(uuid.uuid4())
        company_doc = {
            "id": company_id,
            "name": data.company_name,
            "primary_color": "#007AFF",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.companies.insert_one(company_doc)
        company_name = data.company_name
    
    # Create user
    user_doc = {
        "id": user_id,
        "email": data.email,
        "password": hash_password(data.password),
        "name": data.name,
        "role": data.role,
        "company_id": company_id,
        "phone": data.phone,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    
    token = create_token(user_id, data.email, data.role, company_id)
    
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user_id,
            email=data.email,
            name=data.name,
            role=data.role,
            company_id=company_id,
            company_name=company_name
        )
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(data: UserLogin):
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    if not user or not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    company_name = None
    if user.get("company_id"):
        company = await db.companies.find_one({"id": user["company_id"]}, {"_id": 0})
        if company:
            company_name = company.get("name")
    
    token = create_token(user["id"], user["email"], user["role"], user.get("company_id"))
    
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            name=user["name"],
            role=user["role"],
            company_id=user.get("company_id"),
            company_name=company_name
        )
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(user: dict = Depends(get_current_user)):
    company_name = None
    if user.get("company_id"):
        company = await db.companies.find_one({"id": user["company_id"]}, {"_id": 0})
        if company:
            company_name = company.get("name")
    
    return UserResponse(
        id=user["id"],
        email=user["email"],
        name=user["name"],
        role=user["role"],
        company_id=user.get("company_id"),
        company_name=company_name
    )

# ==================== COMPANY ENDPOINTS ====================

@api_router.get("/company", response_model=CompanyResponse)
async def get_company(user: dict = Depends(require_company_admin)):
    company = await db.companies.find_one({"id": user["company_id"]}, {"_id": 0})
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return CompanyResponse(**company)

@api_router.put("/company", response_model=CompanyResponse)
async def update_company(data: CompanyCreate, user: dict = Depends(require_company_admin)):
    update_data = data.model_dump(exclude_unset=True)
    await db.companies.update_one(
        {"id": user["company_id"]},
        {"$set": update_data}
    )
    company = await db.companies.find_one({"id": user["company_id"]}, {"_id": 0})
    return CompanyResponse(**company)

# ==================== CUSTOMER ENDPOINTS ====================

@api_router.post("/customers", response_model=CustomerResponse)
async def create_customer(data: CustomerCreate, user: dict = Depends(require_company_admin)):
    customer_id = str(uuid.uuid4())
    customer_doc = {
        "id": customer_id,
        "company_id": user["company_id"],
        **data.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.customers.insert_one(customer_doc)
    
    # Create customer user account
    customer_user_id = str(uuid.uuid4())
    customer_user = {
        "id": customer_user_id,
        "email": data.email,
        "password": hash_password(data.phone[-6:]),  # Default password: last 6 digits of phone
        "name": data.name,
        "role": UserRole.CUSTOMER,
        "company_id": user["company_id"],
        "customer_id": customer_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    try:
        await db.users.insert_one(customer_user)
    except:
        pass  # User might already exist
    
    return CustomerResponse(**customer_doc, pools_count=0, active_amcs=0)

@api_router.get("/customers", response_model=List[CustomerResponse])
async def get_customers(user: dict = Depends(require_company_admin)):
    customers = await db.customers.find({"company_id": user["company_id"]}, {"_id": 0}).to_list(1000)
    
    result = []
    for c in customers:
        pools_count = await db.pools.count_documents({"customer_id": c["id"]})
        active_amcs = await db.amc_assignments.count_documents({"customer_id": c["id"], "status": "active"})
        result.append(CustomerResponse(**c, pools_count=pools_count, active_amcs=active_amcs))
    
    return result

@api_router.get("/customers/{customer_id}", response_model=CustomerResponse)
async def get_customer(customer_id: str, user: dict = Depends(require_company_admin)):
    customer = await db.customers.find_one({"id": customer_id, "company_id": user["company_id"]}, {"_id": 0})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    pools_count = await db.pools.count_documents({"customer_id": customer_id})
    active_amcs = await db.amc_assignments.count_documents({"customer_id": customer_id, "status": "active"})
    
    return CustomerResponse(**customer, pools_count=pools_count, active_amcs=active_amcs)

@api_router.put("/customers/{customer_id}", response_model=CustomerResponse)
async def update_customer(customer_id: str, data: CustomerCreate, user: dict = Depends(require_company_admin)):
    await db.customers.update_one(
        {"id": customer_id, "company_id": user["company_id"]},
        {"$set": data.model_dump()}
    )
    return await get_customer(customer_id, user)

@api_router.delete("/customers/{customer_id}")
async def delete_customer(customer_id: str, user: dict = Depends(require_company_admin)):
    result = await db.customers.delete_one({"id": customer_id, "company_id": user["company_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Customer not found")
    return {"message": "Customer deleted"}

# ==================== POOL ENDPOINTS ====================

@api_router.post("/pools", response_model=PoolResponse)
async def create_pool(data: PoolCreate, user: dict = Depends(require_company_admin)):
    # Verify customer belongs to company
    customer = await db.customers.find_one({"id": data.customer_id, "company_id": user["company_id"]})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    pool_id = str(uuid.uuid4())
    pool_doc = {
        "id": pool_id,
        "company_id": user["company_id"],
        **data.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.pools.insert_one(pool_doc)
    return PoolResponse(**pool_doc)

@api_router.get("/pools", response_model=List[PoolResponse])
async def get_pools(customer_id: Optional[str] = None, user: dict = Depends(require_company_admin)):
    query = {"company_id": user["company_id"]}
    if customer_id:
        query["customer_id"] = customer_id
    pools = await db.pools.find(query, {"_id": 0}).to_list(1000)
    return [PoolResponse(**p) for p in pools]

@api_router.get("/pools/{pool_id}", response_model=PoolResponse)
async def get_pool(pool_id: str, user: dict = Depends(require_company_admin)):
    pool = await db.pools.find_one({"id": pool_id, "company_id": user["company_id"]}, {"_id": 0})
    if not pool:
        raise HTTPException(status_code=404, detail="Pool not found")
    return PoolResponse(**pool)

# ==================== AMC PLAN ENDPOINTS ====================

@api_router.post("/amc-plans", response_model=AMCPlanResponse)
async def create_amc_plan(data: AMCPlanCreate, user: dict = Depends(require_company_admin)):
    plan_id = str(uuid.uuid4())
    plan_doc = {
        "id": plan_id,
        "company_id": user["company_id"],
        **data.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.amc_plans.insert_one(plan_doc)
    return AMCPlanResponse(**plan_doc)

@api_router.get("/amc-plans", response_model=List[AMCPlanResponse])
async def get_amc_plans(user: dict = Depends(require_company_admin)):
    plans = await db.amc_plans.find({"company_id": user["company_id"]}, {"_id": 0}).to_list(1000)
    return [AMCPlanResponse(**p) for p in plans]

@api_router.put("/amc-plans/{plan_id}", response_model=AMCPlanResponse)
async def update_amc_plan(plan_id: str, data: AMCPlanCreate, user: dict = Depends(require_company_admin)):
    await db.amc_plans.update_one(
        {"id": plan_id, "company_id": user["company_id"]},
        {"$set": data.model_dump()}
    )
    plan = await db.amc_plans.find_one({"id": plan_id}, {"_id": 0})
    return AMCPlanResponse(**plan)

@api_router.delete("/amc-plans/{plan_id}")
async def delete_amc_plan(plan_id: str, user: dict = Depends(require_company_admin)):
    result = await db.amc_plans.delete_one({"id": plan_id, "company_id": user["company_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="AMC Plan not found")
    return {"message": "AMC Plan deleted"}

# ==================== ENGINEER ENDPOINTS ====================

@api_router.post("/engineers", response_model=EngineerResponse)
async def create_engineer(data: EngineerCreate, user: dict = Depends(require_company_admin)):
    # Check if email exists
    existing = await db.users.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    engineer_id = str(uuid.uuid4())
    
    # Create user account for engineer
    user_doc = {
        "id": user_id,
        "email": data.email,
        "password": hash_password(data.password),
        "name": data.name,
        "role": UserRole.ENGINEER,
        "company_id": user["company_id"],
        "engineer_id": engineer_id,
        "phone": data.phone,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    
    # Create engineer record
    engineer_doc = {
        "id": engineer_id,
        "user_id": user_id,
        "company_id": user["company_id"],
        "name": data.name,
        "email": data.email,
        "phone": data.phone,
        "status": "active",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.engineers.insert_one(engineer_doc)
    
    return EngineerResponse(**engineer_doc)

@api_router.get("/engineers", response_model=List[EngineerResponse])
async def get_engineers(user: dict = Depends(require_company_admin)):
    engineers = await db.engineers.find({"company_id": user["company_id"]}, {"_id": 0}).to_list(1000)
    return [EngineerResponse(**e) for e in engineers]

@api_router.delete("/engineers/{engineer_id}")
async def delete_engineer(engineer_id: str, user: dict = Depends(require_company_admin)):
    engineer = await db.engineers.find_one({"id": engineer_id, "company_id": user["company_id"]})
    if not engineer:
        raise HTTPException(status_code=404, detail="Engineer not found")
    
    await db.engineers.delete_one({"id": engineer_id})
    await db.users.delete_one({"id": engineer["user_id"]})
    return {"message": "Engineer deleted"}

# ==================== AMC ASSIGNMENT ENDPOINTS ====================

@api_router.post("/amc-assignments", response_model=AMCAssignmentResponse)
async def create_amc_assignment(data: AMCAssignmentCreate, user: dict = Depends(require_company_admin)):
    # Get pool and customer info
    pool = await db.pools.find_one({"id": data.pool_id, "company_id": user["company_id"]}, {"_id": 0})
    if not pool:
        raise HTTPException(status_code=404, detail="Pool not found")
    
    plan = await db.amc_plans.find_one({"id": data.amc_plan_id, "company_id": user["company_id"]}, {"_id": 0})
    if not plan:
        raise HTTPException(status_code=404, detail="AMC Plan not found")
    
    customer = await db.customers.find_one({"id": pool["customer_id"]}, {"_id": 0})
    
    assignment_id = str(uuid.uuid4())
    assignment_doc = {
        "id": assignment_id,
        "company_id": user["company_id"],
        "customer_id": pool["customer_id"],
        "pool_id": data.pool_id,
        "amc_plan_id": data.amc_plan_id,
        "start_date": data.start_date,
        "end_date": data.end_date,
        "assigned_engineer_id": data.assigned_engineer_id,
        "status": "active",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.amc_assignments.insert_one(assignment_doc)
    
    # Auto-generate services based on frequency
    await generate_services_for_amc(assignment_id, user["company_id"], data, plan)
    
    engineer_name = None
    if data.assigned_engineer_id:
        engineer = await db.engineers.find_one({"id": data.assigned_engineer_id}, {"_id": 0})
        if engineer:
            engineer_name = engineer["name"]
    
    return AMCAssignmentResponse(
        **assignment_doc,
        customer_name=customer["name"] if customer else None,
        pool_name=pool["name"],
        plan_name=plan["name"],
        engineer_name=engineer_name
    )

async def generate_services_for_amc(assignment_id: str, company_id: str, data: AMCAssignmentCreate, plan: dict):
    """Generate scheduled services based on AMC plan frequency"""
    from dateutil.relativedelta import relativedelta
    from dateutil.rrule import rrule, WEEKLY, MONTHLY
    
    start = datetime.fromisoformat(data.start_date)
    end = datetime.fromisoformat(data.end_date)
    
    # Get pool and customer for service records
    pool = await db.pools.find_one({"id": data.pool_id}, {"_id": 0})
    
    # Determine frequency
    if plan["frequency"] == "weekly":
        dates = list(rrule(WEEKLY, dtstart=start, until=end))
    elif plan["frequency"] == "biweekly":
        dates = list(rrule(WEEKLY, interval=2, dtstart=start, until=end))
    else:  # monthly
        dates = list(rrule(MONTHLY, dtstart=start, until=end))
    
    services = []
    for date in dates:
        service_id = str(uuid.uuid4())
        service_doc = {
            "id": service_id,
            "company_id": company_id,
            "amc_assignment_id": assignment_id,
            "customer_id": pool["customer_id"],
            "pool_id": data.pool_id,
            "scheduled_date": date.strftime("%Y-%m-%d"),
            "engineer_id": data.assigned_engineer_id,
            "status": "scheduled",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        services.append(service_doc)
    
    if services:
        await db.services.insert_many(services)

@api_router.get("/amc-assignments", response_model=List[AMCAssignmentResponse])
async def get_amc_assignments(customer_id: Optional[str] = None, user: dict = Depends(require_company_admin)):
    query = {"company_id": user["company_id"]}
    if customer_id:
        query["customer_id"] = customer_id
    
    assignments = await db.amc_assignments.find(query, {"_id": 0}).to_list(1000)
    
    result = []
    for a in assignments:
        customer = await db.customers.find_one({"id": a["customer_id"]}, {"_id": 0})
        pool = await db.pools.find_one({"id": a["pool_id"]}, {"_id": 0})
        plan = await db.amc_plans.find_one({"id": a["amc_plan_id"]}, {"_id": 0})
        engineer_name = None
        if a.get("assigned_engineer_id"):
            engineer = await db.engineers.find_one({"id": a["assigned_engineer_id"]}, {"_id": 0})
            if engineer:
                engineer_name = engineer["name"]
        
        result.append(AMCAssignmentResponse(
            **a,
            customer_name=customer["name"] if customer else None,
            pool_name=pool["name"] if pool else None,
            plan_name=plan["name"] if plan else None,
            engineer_name=engineer_name
        ))
    
    return result

@api_router.put("/amc-assignments/{assignment_id}/engineer")
async def assign_engineer_to_amc(assignment_id: str, engineer_id: str, user: dict = Depends(require_company_admin)):
    """Assign or reassign engineer to AMC and all its pending services"""
    await db.amc_assignments.update_one(
        {"id": assignment_id, "company_id": user["company_id"]},
        {"$set": {"assigned_engineer_id": engineer_id}}
    )
    
    # Update all pending services
    await db.services.update_many(
        {"amc_assignment_id": assignment_id, "status": "scheduled"},
        {"$set": {"engineer_id": engineer_id}}
    )
    
    return {"message": "Engineer assigned successfully"}

# ==================== SERVICE ENDPOINTS (Admin) ====================

@api_router.get("/services", response_model=List[ServiceResponse])
async def get_services(
    status: Optional[str] = None,
    date: Optional[str] = None,
    engineer_id: Optional[str] = None,
    user: dict = Depends(require_company_admin)
):
    query = {"company_id": user["company_id"]}
    if status:
        query["status"] = status
    if date:
        query["scheduled_date"] = date
    if engineer_id:
        query["engineer_id"] = engineer_id
    
    services = await db.services.find(query, {"_id": 0}).sort("scheduled_date", 1).to_list(1000)
    
    result = []
    for s in services:
        customer = await db.customers.find_one({"id": s["customer_id"]}, {"_id": 0})
        pool = await db.pools.find_one({"id": s["pool_id"]}, {"_id": 0})
        engineer_name = None
        if s.get("engineer_id"):
            engineer = await db.engineers.find_one({"id": s["engineer_id"]}, {"_id": 0})
            if engineer:
                engineer_name = engineer["name"]
        
        # Get AMC plan for checklist
        assignment = await db.amc_assignments.find_one({"id": s["amc_assignment_id"]}, {"_id": 0})
        checklist_items = []
        amc_plan_name = None
        if assignment:
            plan = await db.amc_plans.find_one({"id": assignment["amc_plan_id"]}, {"_id": 0})
            if plan:
                checklist_items = plan.get("checklist_items", [])
                amc_plan_name = plan["name"]
        
        result.append(ServiceResponse(
            **s,
            customer_name=customer["name"] if customer else None,
            pool_name=pool["name"] if pool else None,
            engineer_name=engineer_name,
            address=customer["address"] if customer else None,
            amc_plan_name=amc_plan_name,
            checklist_items=checklist_items
        ))
    
    return result

@api_router.put("/services/{service_id}/assign")
async def assign_service_to_engineer(service_id: str, engineer_id: str, user: dict = Depends(require_company_admin)):
    await db.services.update_one(
        {"id": service_id, "company_id": user["company_id"]},
        {"$set": {"engineer_id": engineer_id}}
    )
    return {"message": "Service assigned"}

# ==================== ENGINEER SERVICE ENDPOINTS ====================

@api_router.get("/engineer/services", response_model=List[ServiceResponse])
async def get_engineer_services(date: Optional[str] = None, user: dict = Depends(require_engineer)):
    engineer = await db.engineers.find_one({"user_id": user["id"]}, {"_id": 0})
    if not engineer:
        raise HTTPException(status_code=404, detail="Engineer profile not found")
    
    query = {"engineer_id": engineer["id"], "company_id": user["company_id"]}
    if date:
        query["scheduled_date"] = date
    else:
        # Default to today
        query["scheduled_date"] = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    services = await db.services.find(query, {"_id": 0}).to_list(100)
    
    result = []
    for s in services:
        customer = await db.customers.find_one({"id": s["customer_id"]}, {"_id": 0})
        pool = await db.pools.find_one({"id": s["pool_id"]}, {"_id": 0})
        
        # Get AMC plan for checklist
        assignment = await db.amc_assignments.find_one({"id": s["amc_assignment_id"]}, {"_id": 0})
        checklist_items = []
        amc_plan_name = None
        if assignment:
            plan = await db.amc_plans.find_one({"id": assignment["amc_plan_id"]}, {"_id": 0})
            if plan:
                checklist_items = plan.get("checklist_items", [])
                amc_plan_name = plan["name"]
        
        result.append(ServiceResponse(
            **s,
            customer_name=customer["name"] if customer else None,
            pool_name=pool["name"] if pool else None,
            engineer_name=user["name"],
            address=customer["address"] if customer else None,
            amc_plan_name=amc_plan_name,
            checklist_items=checklist_items
        ))
    
    return result

@api_router.post("/engineer/services/start", response_model=ServiceLogResponse)
async def start_service(data: ServiceStartRequest, user: dict = Depends(require_engineer)):
    engineer = await db.engineers.find_one({"user_id": user["id"]}, {"_id": 0})
    if not engineer:
        raise HTTPException(status_code=404, detail="Engineer profile not found")
    
    # Verify service belongs to engineer
    service = await db.services.find_one({"id": data.service_id, "engineer_id": engineer["id"]}, {"_id": 0})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found or not assigned to you")
    
    if service["status"] != "scheduled":
        raise HTTPException(status_code=400, detail="Service already started or completed")
    
    # Create service log
    log_id = str(uuid.uuid4())
    log_doc = {
        "id": log_id,
        "service_id": data.service_id,
        "engineer_id": engineer["id"],
        "start_time": datetime.now(timezone.utc).isoformat(),
        "start_latitude": data.latitude,
        "start_longitude": data.longitude,
        "status": "in_progress",
        "checklist_completed": [],
        "photos": [],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.service_logs.insert_one(log_doc)
    
    # Update service status
    await db.services.update_one(
        {"id": data.service_id},
        {"$set": {"status": "in_progress"}}
    )
    
    return ServiceLogResponse(**log_doc)

@api_router.post("/engineer/services/end", response_model=ServiceLogResponse)
async def end_service(data: ServiceEndRequest, user: dict = Depends(require_engineer)):
    engineer = await db.engineers.find_one({"user_id": user["id"]}, {"_id": 0})
    if not engineer:
        raise HTTPException(status_code=404, detail="Engineer profile not found")
    
    # Get service log
    log = await db.service_logs.find_one({"service_id": data.service_id, "engineer_id": engineer["id"]}, {"_id": 0})
    if not log:
        raise HTTPException(status_code=404, detail="Service not started")
    
    if log["status"] != "in_progress":
        raise HTTPException(status_code=400, detail="Service not in progress")
    
    end_time = datetime.now(timezone.utc)
    start_time = datetime.fromisoformat(log["start_time"])
    duration_minutes = int((end_time - start_time).total_seconds() / 60)
    
    # Update service log
    update_data = {
        "end_time": end_time.isoformat(),
        "end_latitude": data.latitude,
        "end_longitude": data.longitude,
        "duration_minutes": duration_minutes,
        "checklist_completed": data.checklist_completed,
        "readings": data.readings,
        "remarks": data.remarks,
        "photos": data.photos,
        "status": "completed"
    }
    
    await db.service_logs.update_one(
        {"id": log["id"]},
        {"$set": update_data}
    )
    
    # Update service status
    await db.services.update_one(
        {"id": data.service_id},
        {"$set": {"status": "completed"}}
    )
    
    return ServiceLogResponse(**{**log, **update_data})

@api_router.get("/engineer/services/{service_id}/log", response_model=ServiceLogResponse)
async def get_service_log(service_id: str, user: dict = Depends(require_engineer)):
    engineer = await db.engineers.find_one({"user_id": user["id"]}, {"_id": 0})
    log = await db.service_logs.find_one({"service_id": service_id, "engineer_id": engineer["id"]}, {"_id": 0})
    if not log:
        raise HTTPException(status_code=404, detail="Service log not found")
    return ServiceLogResponse(**log)

# ==================== CUSTOMER PORTAL ENDPOINTS ====================

@api_router.get("/customer/profile")
async def get_customer_profile(user: dict = Depends(get_current_user)):
    if user["role"] != UserRole.CUSTOMER:
        raise HTTPException(status_code=403, detail="Customer access required")
    
    customer = await db.customers.find_one({"id": user.get("customer_id")}, {"_id": 0})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer profile not found")
    
    return customer

@api_router.get("/customer/pools", response_model=List[PoolResponse])
async def get_customer_pools(user: dict = Depends(get_current_user)):
    if user["role"] != UserRole.CUSTOMER:
        raise HTTPException(status_code=403, detail="Customer access required")
    
    pools = await db.pools.find({"customer_id": user.get("customer_id")}, {"_id": 0}).to_list(100)
    return [PoolResponse(**p) for p in pools]

@api_router.get("/customer/services")
async def get_customer_services(user: dict = Depends(get_current_user)):
    if user["role"] != UserRole.CUSTOMER:
        raise HTTPException(status_code=403, detail="Customer access required")
    
    services = await db.services.find(
        {"customer_id": user.get("customer_id")},
        {"_id": 0}
    ).sort("scheduled_date", -1).to_list(100)
    
    result = []
    for s in services:
        pool = await db.pools.find_one({"id": s["pool_id"]}, {"_id": 0})
        engineer_name = None
        if s.get("engineer_id"):
            engineer = await db.engineers.find_one({"id": s["engineer_id"]}, {"_id": 0})
            if engineer:
                engineer_name = engineer["name"]
        
        # Get service log for completed services
        service_log = None
        if s["status"] == "completed":
            log = await db.service_logs.find_one({"service_id": s["id"]}, {"_id": 0})
            if log:
                service_log = log
        
        result.append({
            **s,
            "pool_name": pool["name"] if pool else None,
            "engineer_name": engineer_name,
            "service_log": service_log
        })
    
    return result

@api_router.get("/customer/amcs")
async def get_customer_amcs(user: dict = Depends(get_current_user)):
    if user["role"] != UserRole.CUSTOMER:
        raise HTTPException(status_code=403, detail="Customer access required")
    
    assignments = await db.amc_assignments.find(
        {"customer_id": user.get("customer_id")},
        {"_id": 0}
    ).to_list(100)
    
    result = []
    for a in assignments:
        pool = await db.pools.find_one({"id": a["pool_id"]}, {"_id": 0})
        plan = await db.amc_plans.find_one({"id": a["amc_plan_id"]}, {"_id": 0})
        
        # Count services
        total_services = await db.services.count_documents({"amc_assignment_id": a["id"]})
        completed_services = await db.services.count_documents({"amc_assignment_id": a["id"], "status": "completed"})
        
        result.append({
            **a,
            "pool_name": pool["name"] if pool else None,
            "plan_name": plan["name"] if plan else None,
            "plan_frequency": plan["frequency"] if plan else None,
            "total_services": total_services,
            "completed_services": completed_services
        })
    
    return result

# ==================== DASHBOARD STATS ====================

@api_router.get("/dashboard/stats")
async def get_dashboard_stats(user: dict = Depends(require_company_admin)):
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    total_customers = await db.customers.count_documents({"company_id": user["company_id"]})
    total_pools = await db.pools.count_documents({"company_id": user["company_id"]})
    active_amcs = await db.amc_assignments.count_documents({"company_id": user["company_id"], "status": "active"})
    total_engineers = await db.engineers.count_documents({"company_id": user["company_id"]})
    
    today_services = await db.services.count_documents({
        "company_id": user["company_id"],
        "scheduled_date": today
    })
    today_completed = await db.services.count_documents({
        "company_id": user["company_id"],
        "scheduled_date": today,
        "status": "completed"
    })
    today_in_progress = await db.services.count_documents({
        "company_id": user["company_id"],
        "scheduled_date": today,
        "status": "in_progress"
    })
    
    pending_services = await db.services.count_documents({
        "company_id": user["company_id"],
        "status": "scheduled",
        "scheduled_date": {"$lt": today}
    })
    
    return {
        "total_customers": total_customers,
        "total_pools": total_pools,
        "active_amcs": active_amcs,
        "total_engineers": total_engineers,
        "today_services": today_services,
        "today_completed": today_completed,
        "today_in_progress": today_in_progress,
        "pending_services": pending_services
    }

# ==================== HEALTH CHECK ====================

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
