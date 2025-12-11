"""
Locust Load Testing Script for IT HACKS 25 - EcoFarm Platform
Simulates realistic user behavior and API usage patterns
"""

from locust import HttpUser, task, between, events
import random
import json
from datetime import datetime

# Global variables for tracking
test_stats = {
    'successful_logins': 0,
    'failed_logins': 0,
    'api_calls': 0,
    'start_time': None
}

# Sample test credentials
TEST_USERS = [
    {"username": "testuser1", "password": "Test@1234"},
    {"username": "testuser2", "password": "Test@1234"},
    {"username": "testuser3", "password": "Test@1234"},
    {"username": "testadmin", "password": "Admin@1234"},
]

# Sample room IDs for API calls
ROOM_IDS = [1, 2, 3, 4, 5]

class EcoFarmUser(HttpUser):
    """Simulates an EcoFarm user with realistic behavior patterns"""
    
    # Time between requests: 1-3 seconds (realistic user)
    wait_time = between(1, 3)
    
    def on_start(self):
        """Called when a user starts - login"""
        self.token = None
        self.user_id = None
        self.username = random.choice(TEST_USERS)
        self.login()
    
    def login(self):
        """Login and obtain JWT token"""
        login_data = {
            "username": self.username.get("username"),
            "password": self.username.get("password")
        }
        
        try:
            response = self.client.post(
                "/auth/login",
                json=login_data,
                name="/auth/login"
            )
            
            if response.status_code == 200:
                data = response.json()
                self.token = data.get("access_token")
                self.user_id = data.get("user_id")
                test_stats['successful_logins'] += 1
                print(f"✓ {self.username.get('username')} logged in successfully")
            else:
                test_stats['failed_logins'] += 1
                print(f"✗ Login failed for {self.username.get('username')}: {response.status_code}")
        except Exception as e:
            test_stats['failed_logins'] += 1
            print(f"✗ Login exception: {str(e)}")
    
    def get_headers(self):
        """Get authorization headers"""
        if self.token:
            return {"Authorization": f"Bearer {self.token}"}
        return {}
    
    # ==================== MONITORING TASKS ====================
    
    @task(3)
    def get_current_metrics(self):
        """Get current metrics (high frequency - 3x)"""
        headers = self.get_headers()
        self.client.get(
            "/monitor/current",
            headers=headers,
            name="/monitor/current"
        )
        test_stats['api_calls'] += 1
    
    @task(2)
    def get_monitoring_history(self):
        """Get historical monitoring data"""
        headers = self.get_headers()
        params = {"days": random.choice([1, 7, 30])}
        self.client.get(
            "/monitor/history",
            params=params,
            headers=headers,
            name="/monitor/history"
        )
        test_stats['api_calls'] += 1
    
    @task(1)
    def get_monitoring_alerts(self):
        """Get active alerts"""
        headers = self.get_headers()
        self.client.get(
            "/monitor/alerts",
            headers=headers,
            name="/monitor/alerts"
        )
        test_stats['api_calls'] += 1
    
    @task(2)
    def get_kpis(self):
        """Get key performance indicators"""
        headers = self.get_headers()
        self.client.get(
            "/monitor/kpis",
            headers=headers,
            name="/monitor/kpis"
        )
        test_stats['api_calls'] += 1
    
    # ==================== ANOMALY DETECTION TASKS ====================
    
    @task(2)
    def get_anomalies(self):
        """Get current anomalies"""
        headers = self.get_headers()
        self.client.get(
            "/monitor/anomalies",
            headers=headers,
            name="/monitor/anomalies"
        )
        test_stats['api_calls'] += 1
    
    @task(1)
    def get_anomaly_history(self):
        """Get anomaly detection history"""
        headers = self.get_headers()
        params = {"days": random.choice([7, 30, 90])}
        self.client.get(
            "/monitor/anomalies/history",
            params=params,
            headers=headers,
            name="/monitor/anomalies/history"
        )
        test_stats['api_calls'] += 1
    
    @task(1)
    def explain_anomaly(self):
        """Get explanation for an anomaly"""
        headers = self.get_headers()
        room_id = random.choice(ROOM_IDS)
        data = {
            "room_id": room_id,
            "anomaly_type": "isolation_forest"
        }
        self.client.post(
            "/monitor/anomalies/explain",
            json=data,
            headers=headers,
            name="/monitor/anomalies/explain"
        )
        test_stats['api_calls'] += 1
    
    # ==================== ANALYTICS TASKS ====================
    
    @task(2)
    def get_trends(self):
        """Get trend analysis"""
        headers = self.get_headers()
        room_id = random.choice(ROOM_IDS)
        params = {"room_id": room_id, "days": random.choice([7, 30, 90])}
        self.client.get(
            "/monitor/trends",
            params=params,
            headers=headers,
            name="/monitor/trends"
        )
        test_stats['api_calls'] += 1
    
    @task(1)
    def get_patterns(self):
        """Get pattern detection results"""
        headers = self.get_headers()
        room_id = random.choice(ROOM_IDS)
        params = {"room_id": room_id}
        self.client.get(
            "/monitor/patterns",
            params=params,
            headers=headers,
            name="/monitor/patterns"
        )
        test_stats['api_calls'] += 1
    
    @task(1)
    def get_forecast(self):
        """Get predictive forecast"""
        headers = self.get_headers()
        room_id = random.choice(ROOM_IDS)
        params = {"room_id": room_id, "days": random.choice([7, 14, 30])}
        self.client.get(
            "/monitor/forecast",
            params=params,
            headers=headers,
            name="/monitor/forecast"
        )
        test_stats['api_calls'] += 1
    
    @task(1)
    def get_reports_list(self):
        """Get available reports"""
        headers = self.get_headers()
        self.client.get(
            "/monitor/reports",
            headers=headers,
            name="/monitor/reports"
        )
        test_stats['api_calls'] += 1
    
    # ==================== FEATURE IMPORTANCE TASKS ====================
    
    @task(2)
    def get_feature_importance(self):
        """Get top features by importance"""
        headers = self.get_headers()
        params = {
            "n_features": random.choice([10, 20, 50]),
            "days": random.choice([7, 30, 90])
        }
        self.client.get(
            "/monitor/feature-importance",
            params=params,
            headers=headers,
            name="/monitor/feature-importance"
        )
        test_stats['api_calls'] += 1
    
    @task(1)
    def get_feature_history(self):
        """Get feature importance history"""
        headers = self.get_headers()
        features = ["temperature_c", "humidity_percent", "light_lux", "co2_ppm", "soil_moisture_percent"]
        feature = random.choice(features)
        params = {
            "feature_name": feature,
            "days": random.choice([7, 30, 90]),
            "frequency": random.choice(["daily", "weekly"])
        }
        self.client.get(
            "/monitor/feature-importance/history",
            params=params,
            headers=headers,
            name="/monitor/feature-importance/history"
        )
        test_stats['api_calls'] += 1
    
    @task(1)
    def compare_features(self):
        """Compare feature importance across rooms"""
        headers = self.get_headers()
        room_ids = random.sample(ROOM_IDS, k=2)
        params = {
            "room_id_1": room_ids[0],
            "room_id_2": room_ids[1],
            "n_features": random.choice([10, 20])
        }
        self.client.get(
            "/monitor/feature-importance/comparison",
            params=params,
            headers=headers,
            name="/monitor/feature-importance/comparison"
        )
        test_stats['api_calls'] += 1
    
    @task(1)
    def get_seasonal_importance(self):
        """Get seasonal importance analysis"""
        headers = self.get_headers()
        params = {"n_features": random.choice([5, 10, 15])}
        self.client.get(
            "/monitor/feature-importance/seasonal",
            params=params,
            headers=headers,
            name="/monitor/feature-importance/seasonal"
        )
        test_stats['api_calls'] += 1
    
    # ==================== HEAVY TASKS (Low Frequency) ====================
    
    @task(0.5)
    def generate_report(self):
        """Generate a comprehensive report (heavy operation)"""
        headers = self.get_headers()
        room_id = random.choice(ROOM_IDS)
        data = {
            "room_id": room_id,
            "report_type": random.choice(["summary", "detailed", "anomaly"]),
            "days": random.choice([7, 30, 90])
        }
        
        with self.client.post(
            "/monitor/reports/generate",
            json=data,
            headers=headers,
            name="/monitor/reports/generate",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                response.success()
            elif response.status_code in [202, 203]:
                # Async operation accepted
                response.success()
            else:
                response.failure(f"Failed with status {response.status_code}")
        
        test_stats['api_calls'] += 1
    
    @task(0.3)
    def health_check(self):
        """Periodic health check"""
        self.client.get(
            "/health",
            name="/health"
        )
        test_stats['api_calls'] += 1


@events.test_start.add_listener
def on_test_start(environment, **kwargs):
    """Called when test starts"""
    test_stats['start_time'] = datetime.now()
    print("\n" + "="*60)
    print("LOAD TEST STARTING")
    print("="*60)
    print(f"Start Time: {test_stats['start_time']}")
    print(f"API Base URL: {environment.host}")
    print("="*60 + "\n")


@events.test_stop.add_listener
def on_test_stop(environment, **kwargs):
    """Called when test stops"""
    end_time = datetime.now()
    duration = (end_time - test_stats['start_time']).total_seconds()
    
    print("\n" + "="*60)
    print("LOAD TEST COMPLETED")
    print("="*60)
    print(f"End Time: {end_time}")
    print(f"Duration: {duration:.2f} seconds")
    print(f"Successful Logins: {test_stats['successful_logins']}")
    print(f"Failed Logins: {test_stats['failed_logins']}")
    print(f"Total API Calls: {test_stats['api_calls']}")
    if duration > 0:
        print(f"Average Requests/Second: {test_stats['api_calls']/duration:.2f}")
    print("="*60 + "\n")


@events.quitting.add_listener
def on_quitting(environment, **kwargs):
    """Called when quitting"""
    print("\nTest Results Summary:")
    print("-" * 60)
    
    # Print response time stats
    if environment.stats.total.response_times:
        print("\nResponse Times (ms):")
        print(f"  Min:   {min(environment.stats.total.response_times.keys())}")
        print(f"  Max:   {max(environment.stats.total.response_times.keys())}")
        print(f"  Mean:  {environment.stats.total.avg_response_time:.2f}")
    
    # Print failure stats
    if environment.stats.total.num_failures > 0:
        print(f"\nFailures: {environment.stats.total.num_failures}")
        print(f"Failure Rate: {(environment.stats.total.num_failures / max(environment.stats.total.num_requests, 1) * 100):.2f}%")
    
    print("\n" + "="*60)
