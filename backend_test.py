import requests
import sys
import json
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

class PoolMaintenanceAPITester:
    def __init__(self, base_url="https://graand-swim.preview.emergentagent.com"):
        self.base_url = base_url
        self.admin_token = None
        self.engineer_token = None
        self.customer_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.created_entities = {
            'company_id': None,
            'customer_id': None,
            'pool_id': None,
            'amc_plan_id': None,
            'engineer_id': None,
            'amc_assignment_id': None,
            'service_id': None
        }

    def run_test(self, name: str, method: str, endpoint: str, expected_status: int, 
                 data: Optional[Dict] = None, token: Optional[str] = None) -> tuple[bool, Dict]:
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if token:
            headers['Authorization'] = f'Bearer {token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json()
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Response: {response.text[:200]}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test health endpoint"""
        return self.run_test("Health Check", "GET", "health", 200)

    def test_admin_registration(self):
        """Test company admin registration"""
        admin_data = {
            "email": "test@graandprix.com",
            "password": "test123",
            "name": "Test Admin",
            "role": "company_admin",
            "company_name": "Graand Prix Pool Services",
            "phone": "+91-9876543210"
        }
        success, response = self.run_test("Admin Registration", "POST", "auth/register", 200, admin_data)
        if success and 'access_token' in response:
            self.admin_token = response['access_token']
            self.created_entities['company_id'] = response['user']['company_id']
            print(f"   Admin token obtained, Company ID: {self.created_entities['company_id']}")
        return success

    def test_admin_login(self):
        """Test admin login"""
        login_data = {
            "email": "test@graandprix.com",
            "password": "test123"
        }
        success, response = self.run_test("Admin Login", "POST", "auth/login", 200, login_data)
        if success and 'access_token' in response:
            self.admin_token = response['access_token']
            self.created_entities['company_id'] = response['user']['company_id']
            print(f"   Login successful, Company ID: {self.created_entities['company_id']}")
        return success

    def test_dashboard_stats(self):
        """Test dashboard stats endpoint"""
        return self.run_test("Dashboard Stats", "GET", "dashboard/stats", 200, token=self.admin_token)

    def test_create_customer(self):
        """Test customer creation"""
        customer_data = {
            "name": "John Smith",
            "email": "john.smith@example.com",
            "phone": "+91-9876543211",
            "address": "123 Pool Street, Swimming City, SC 12345",
            "city": "Swimming City",
            "notes": "VIP customer with large residential pool"
        }
        success, response = self.run_test("Create Customer", "POST", "customers", 200, customer_data, self.admin_token)
        if success and 'id' in response:
            self.created_entities['customer_id'] = response['id']
            print(f"   Customer created with ID: {self.created_entities['customer_id']}")
        return success

    def test_get_customers(self):
        """Test get all customers"""
        return self.run_test("Get Customers", "GET", "customers", 200, token=self.admin_token)

    def test_create_pool(self):
        """Test pool creation"""
        if not self.created_entities['customer_id']:
            print("❌ Cannot create pool - no customer ID available")
            return False
            
        pool_data = {
            "customer_id": self.created_entities['customer_id'],
            "name": "Main Pool",
            "pool_type": "residential",
            "size": "20x40 ft",
            "volume_liters": 75000,
            "location_notes": "Backyard, near the garden area"
        }
        success, response = self.run_test("Create Pool", "POST", "pools", 200, pool_data, self.admin_token)
        if success and 'id' in response:
            self.created_entities['pool_id'] = response['id']
            print(f"   Pool created with ID: {self.created_entities['pool_id']}")
        return success

    def test_get_pools(self):
        """Test get pools"""
        return self.run_test("Get Pools", "GET", "pools", 200, token=self.admin_token)

    def test_create_amc_plan(self):
        """Test AMC plan creation"""
        amc_plan_data = {
            "name": "Premium Weekly Service",
            "description": "Comprehensive weekly pool maintenance including cleaning, chemical balancing, and equipment check",
            "frequency": "weekly",
            "visits_per_month": 4,
            "price": 2500.0,
            "checklist_items": [
                "Clean pool surface and walls",
                "Empty skimmer baskets",
                "Check and balance pH levels",
                "Test chlorine levels",
                "Inspect pool equipment",
                "Clean pool filter",
                "Check water circulation"
            ]
        }
        success, response = self.run_test("Create AMC Plan", "POST", "amc-plans", 200, amc_plan_data, self.admin_token)
        if success and 'id' in response:
            self.created_entities['amc_plan_id'] = response['id']
            print(f"   AMC Plan created with ID: {self.created_entities['amc_plan_id']}")
        return success

    def test_get_amc_plans(self):
        """Test get AMC plans"""
        return self.run_test("Get AMC Plans", "GET", "amc-plans", 200, token=self.admin_token)

    def test_create_engineer(self):
        """Test engineer creation"""
        engineer_data = {
            "name": "Mike Johnson",
            "email": "engineer@graandprix.com",
            "phone": "+91-9876543212",
            "password": "eng123"
        }
        success, response = self.run_test("Create Engineer", "POST", "engineers", 200, engineer_data, self.admin_token)
        if success and 'id' in response:
            self.created_entities['engineer_id'] = response['id']
            print(f"   Engineer created with ID: {self.created_entities['engineer_id']}")
        return success

    def test_get_engineers(self):
        """Test get engineers"""
        return self.run_test("Get Engineers", "GET", "engineers", 200, token=self.admin_token)

    def test_engineer_login(self):
        """Test engineer login"""
        login_data = {
            "email": "engineer@graandprix.com",
            "password": "eng123"
        }
        success, response = self.run_test("Engineer Login", "POST", "auth/login", 200, login_data)
        if success and 'access_token' in response:
            self.engineer_token = response['access_token']
            print(f"   Engineer login successful")
        return success

    def test_assign_amc_to_pool(self):
        """Test AMC assignment to pool"""
        if not all([self.created_entities['pool_id'], self.created_entities['amc_plan_id'], self.created_entities['engineer_id']]):
            print("❌ Cannot assign AMC - missing pool, plan, or engineer ID")
            return False
            
        start_date = datetime.now().strftime("%Y-%m-%d")
        end_date = (datetime.now() + timedelta(days=365)).strftime("%Y-%m-%d")
        
        amc_assignment_data = {
            "pool_id": self.created_entities['pool_id'],
            "amc_plan_id": self.created_entities['amc_plan_id'],
            "start_date": start_date,
            "end_date": end_date,
            "assigned_engineer_id": self.created_entities['engineer_id']
        }
        success, response = self.run_test("Assign AMC to Pool", "POST", "amc-assignments", 200, amc_assignment_data, self.admin_token)
        if success and 'id' in response:
            self.created_entities['amc_assignment_id'] = response['id']
            print(f"   AMC Assignment created with ID: {self.created_entities['amc_assignment_id']}")
            print(f"   Services should be auto-generated!")
        return success

    def test_get_amc_assignments(self):
        """Test get AMC assignments"""
        return self.run_test("Get AMC Assignments", "GET", "amc-assignments", 200, token=self.admin_token)

    def test_get_services(self):
        """Test get services (should be auto-generated after AMC assignment)"""
        success, response = self.run_test("Get Services", "GET", "services", 200, token=self.admin_token)
        if success and response and len(response) > 0:
            self.created_entities['service_id'] = response[0]['id']
            print(f"   Found {len(response)} auto-generated services")
            print(f"   First service ID: {self.created_entities['service_id']}")
        return success

    def test_engineer_get_services(self):
        """Test engineer getting their assigned services"""
        today = datetime.now().strftime("%Y-%m-%d")
        return self.run_test("Engineer Get Services", "GET", f"engineer/services?date={today}", 200, token=self.engineer_token)

    def test_engineer_start_service(self):
        """Test engineer starting a service"""
        if not self.created_entities['service_id']:
            print("❌ Cannot start service - no service ID available")
            return False
            
        start_data = {
            "service_id": self.created_entities['service_id'],
            "latitude": 12.9716,  # Bangalore coordinates
            "longitude": 77.5946
        }
        return self.run_test("Engineer Start Service", "POST", "engineer/services/start", 200, start_data, self.engineer_token)

    def test_engineer_end_service(self):
        """Test engineer ending a service"""
        if not self.created_entities['service_id']:
            print("❌ Cannot end service - no service ID available")
            return False
            
        end_data = {
            "service_id": self.created_entities['service_id'],
            "latitude": 12.9716,
            "longitude": 77.5946,
            "checklist_completed": [
                "Clean pool surface and walls",
                "Check and balance pH levels",
                "Test chlorine levels"
            ],
            "readings": {
                "ph": 7.2,
                "chlorine": 2.5
            },
            "remarks": "Pool maintenance completed successfully. All parameters within normal range.",
            "photos": []
        }
        return self.run_test("Engineer End Service", "POST", "engineer/services/end", 200, end_data, self.engineer_token)

    def test_customer_login(self):
        """Test customer login (auto-created during customer creation)"""
        # Customer password is last 6 digits of phone number
        login_data = {
            "email": "john.smith@example.com",
            "password": "543211"  # Last 6 digits of +91-9876543211
        }
        success, response = self.run_test("Customer Login", "POST", "auth/login", 200, login_data)
        if success and 'access_token' in response:
            self.customer_token = response['access_token']
            print(f"   Customer login successful")
        return success

    def test_customer_get_profile(self):
        """Test customer getting their profile"""
        return self.run_test("Customer Get Profile", "GET", "customer/profile", 200, token=self.customer_token)

    def test_customer_get_pools(self):
        """Test customer getting their pools"""
        return self.run_test("Customer Get Pools", "GET", "customer/pools", 200, token=self.customer_token)

    def test_customer_get_services(self):
        """Test customer getting their service history"""
        return self.run_test("Customer Get Services", "GET", "customer/services", 200, token=self.customer_token)

    def test_customer_get_amcs(self):
        """Test customer getting their AMC contracts"""
        return self.run_test("Customer Get AMCs", "GET", "customer/amcs", 200, token=self.customer_token)

    # ==================== CRM MODULE TESTS ====================
    
    def test_enable_crm_module(self):
        """Test enabling CRM module in company settings"""
        company_data = {
            "name": "Graand Prix Pool Services",
            "crm_enabled": True
        }
        return self.run_test("Enable CRM Module", "PUT", "company", 200, company_data, self.admin_token)

    def test_create_lead(self):
        """Test creating a new lead"""
        lead_data = {
            "customer_name": "Sarah Wilson",
            "email": "sarah.wilson@example.com",
            "phone": "+91-9876543213",
            "address": "456 Pool Avenue, Swimming Town",
            "city": "Swimming Town",
            "pool_type": "residential",
            "pool_size": "25x50 ft",
            "requirement": "New pool installation with heating system",
            "source": "website",
            "notes": "Interested in premium package with automation"
        }
        success, response = self.run_test("Create Lead", "POST", "crm/leads", 200, lead_data, self.admin_token)
        if success and 'id' in response:
            self.created_entities['lead_id'] = response['id']
            print(f"   Lead created with ID: {self.created_entities['lead_id']}")
        return success

    def test_get_leads(self):
        """Test getting all leads"""
        return self.run_test("Get Leads", "GET", "crm/leads", 200, token=self.admin_token)

    def test_update_lead_status(self):
        """Test updating lead status"""
        if not self.created_entities.get('lead_id'):
            print("❌ Cannot update lead - no lead ID available")
            return False
            
        update_data = {
            "status": "qualified",
            "notes": "Customer confirmed budget and timeline"
        }
        return self.run_test("Update Lead Status", "PUT", f"crm/leads/{self.created_entities['lead_id']}", 200, update_data, self.admin_token)

    def test_create_quotation(self):
        """Test creating quotation from lead"""
        if not self.created_entities.get('lead_id'):
            print("❌ Cannot create quotation - no lead ID available")
            return False
            
        quotation_data = {
            "lead_id": self.created_entities['lead_id'],
            "title": "Premium Pool Installation Package",
            "items": [
                {
                    "description": "Pool excavation and construction",
                    "quantity": 1,
                    "unit": "nos",
                    "unit_price": 150000,
                    "amount": 150000
                },
                {
                    "description": "Pool heating system installation",
                    "quantity": 1,
                    "unit": "nos", 
                    "unit_price": 75000,
                    "amount": 75000
                },
                {
                    "description": "Pool automation system",
                    "quantity": 1,
                    "unit": "nos",
                    "unit_price": 50000,
                    "amount": 50000
                }
            ],
            "tax_percent": 18.0,
            "validity_days": 30,
            "terms": "50% advance, 30% on completion, 20% after 30 days",
            "notes": "Includes 1 year warranty on all equipment"
        }
        success, response = self.run_test("Create Quotation", "POST", "crm/quotations", 200, quotation_data, self.admin_token)
        if success and 'id' in response:
            self.created_entities['quotation_id'] = response['id']
            print(f"   Quotation created with ID: {self.created_entities['quotation_id']}")
            print(f"   Quotation Number: {response.get('quotation_number')}")
            print(f"   Total Amount: ₹{response.get('total', 0):,.2f}")
        return success

    def test_get_quotations(self):
        """Test getting all quotations"""
        return self.run_test("Get Quotations", "GET", "crm/quotations", 200, token=self.admin_token)

    def test_send_quotation(self):
        """Test sending quotation (update status to sent)"""
        if not self.created_entities.get('quotation_id'):
            print("❌ Cannot send quotation - no quotation ID available")
            return False
            
        return self.run_test("Send Quotation", "PUT", f"crm/quotations/{self.created_entities['quotation_id']}/status?status=sent", 200, token=self.admin_token)

    def test_approve_quotation(self):
        """Test approving quotation"""
        if not self.created_entities.get('quotation_id'):
            print("❌ Cannot approve quotation - no quotation ID available")
            return False
            
        return self.run_test("Approve Quotation", "PUT", f"crm/quotations/{self.created_entities['quotation_id']}/status?status=approved", 200, token=self.admin_token)

    def test_create_work_order(self):
        """Test creating work order from approved quotation"""
        if not self.created_entities.get('quotation_id'):
            print("❌ Cannot create work order - no quotation ID available")
            return False
            
        work_order_data = {
            "quotation_id": self.created_entities['quotation_id'],
            "scope_of_work": "Complete pool installation including excavation, construction, heating system, and automation setup",
            "expected_start_date": (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d"),
            "expected_end_date": (datetime.now() + timedelta(days=45)).strftime("%Y-%m-%d"),
            "notes": "Coordinate with customer for site access and utility connections"
        }
        success, response = self.run_test("Create Work Order", "POST", "crm/work-orders", 200, work_order_data, self.admin_token)
        if success and 'id' in response:
            self.created_entities['work_order_id'] = response['id']
            print(f"   Work Order created with ID: {self.created_entities['work_order_id']}")
            print(f"   Work Order Number: {response.get('work_order_number')}")
        return success

    def test_get_work_orders(self):
        """Test getting all work orders"""
        return self.run_test("Get Work Orders", "GET", "crm/work-orders", 200, token=self.admin_token)

    def test_start_work_order(self):
        """Test starting work order"""
        if not self.created_entities.get('work_order_id'):
            print("❌ Cannot start work order - no work order ID available")
            return False
            
        return self.run_test("Start Work Order", "PUT", f"crm/work-orders/{self.created_entities['work_order_id']}/status?status=in_progress", 200, token=self.admin_token)

    def test_complete_work_order(self):
        """Test completing work order"""
        if not self.created_entities.get('work_order_id'):
            print("❌ Cannot complete work order - no work order ID available")
            return False
            
        return self.run_test("Complete Work Order", "PUT", f"crm/work-orders/{self.created_entities['work_order_id']}/status?status=completed", 200, token=self.admin_token)

    def test_convert_work_order_to_amc(self):
        """Test converting completed work order to AMC"""
        if not all([self.created_entities.get('work_order_id'), self.created_entities.get('amc_plan_id')]):
            print("❌ Cannot convert to AMC - missing work order or AMC plan ID")
            return False
            
        conversion_data = {
            "work_order_id": self.created_entities['work_order_id'],
            "amc_plan_id": self.created_entities['amc_plan_id'],
            "start_date": (datetime.now() + timedelta(days=50)).strftime("%Y-%m-%d"),
            "end_date": (datetime.now() + timedelta(days=415)).strftime("%Y-%m-%d"),
            "assigned_engineer_id": self.created_entities.get('engineer_id')
        }
        success, response = self.run_test("Convert Work Order to AMC", "POST", "crm/convert-to-amc", 200, conversion_data, self.admin_token)
        if success:
            print(f"   Work Order converted to AMC successfully!")
            if 'services_created' in response:
                print(f"   Services created: {response['services_created']}")
        return success

    def test_crm_dashboard_stats(self):
        """Test CRM dashboard statistics"""
        return self.run_test("CRM Dashboard Stats", "GET", "crm/dashboard", 200, token=self.admin_token)

def main():
    print("🏊‍♂️ Starting Swimming Pool Maintenance SaaS API Tests")
    print("=" * 60)
    
    tester = PoolMaintenanceAPITester()
    
    # Test sequence following the complete workflow
    test_sequence = [
        # Health and basic connectivity
        ("Health Check", tester.test_health_check),
        
        # Admin registration and authentication
        ("Admin Registration", tester.test_admin_registration),
        ("Admin Login", tester.test_admin_login),
        ("Dashboard Stats", tester.test_dashboard_stats),
        
        # Customer management
        ("Create Customer", tester.test_create_customer),
        ("Get Customers", tester.test_get_customers),
        
        # Pool management
        ("Create Pool", tester.test_create_pool),
        ("Get Pools", tester.test_get_pools),
        
        # AMC Plan management
        ("Create AMC Plan", tester.test_create_amc_plan),
        ("Get AMC Plans", tester.test_get_amc_plans),
        
        # Engineer management
        ("Create Engineer", tester.test_create_engineer),
        ("Get Engineers", tester.test_get_engineers),
        ("Engineer Login", tester.test_engineer_login),
        
        # AMC Assignment (triggers service generation)
        ("Assign AMC to Pool", tester.test_assign_amc_to_pool),
        ("Get AMC Assignments", tester.test_get_amc_assignments),
        ("Get Services", tester.test_get_services),
        
        # Engineer workflow
        ("Engineer Get Services", tester.test_engineer_get_services),
        ("Engineer Start Service", tester.test_engineer_start_service),
        ("Engineer End Service", tester.test_engineer_end_service),
        
        # Customer portal
        ("Customer Login", tester.test_customer_login),
        ("Customer Get Profile", tester.test_customer_get_profile),
        ("Customer Get Pools", tester.test_customer_get_pools),
        ("Customer Get Services", tester.test_customer_get_services),
        ("Customer Get AMCs", tester.test_customer_get_amcs),
    ]
    
    failed_tests = []
    
    for test_name, test_func in test_sequence:
        try:
            success = test_func()
            if not success:
                failed_tests.append(test_name)
        except Exception as e:
            print(f"❌ {test_name} - Exception: {str(e)}")
            failed_tests.append(test_name)
    
    # Print results
    print("\n" + "=" * 60)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if failed_tests:
        print(f"\n❌ Failed Tests ({len(failed_tests)}):")
        for test in failed_tests:
            print(f"   - {test}")
    else:
        print("\n🎉 All tests passed!")
    
    print(f"\n📋 Created Entities:")
    for entity, entity_id in tester.created_entities.items():
        if entity_id:
            print(f"   {entity}: {entity_id}")
    
    return 0 if len(failed_tests) == 0 else 1

if __name__ == "__main__":
    sys.exit(main())