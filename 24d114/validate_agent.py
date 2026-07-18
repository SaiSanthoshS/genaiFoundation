import os
import sys
from database import init_db, get_user, update_user, add_activity, get_activities, delete_activity
import agent

def run_tests():
    print("=== STARTING CARBON CALCULATOR AGENT VALIDATION ===")
    
    # 1. Initialize Database
    print("\n[Test 1] Initializing SQLite database...")
    if os.path.exists("carbon_footprint.db"):
        try:
            os.remove("carbon_footprint.db")
            print("Existing database removed for a clean test run.")
        except Exception as e:
            print(f"Note: Could not remove db file: {e}")
        
    init_db()
    print("Database initialized successfully.")
    
    # 2. Test User retrieval and region updates
    print("\n[Test 2] Testing User Profile Operations...")
    user = get_user(1)
    assert user is not None, "Error: Default user was not seeded."
    assert user["region"] == "US", f"Error: Default region is {user['region']}, expected 'US'."
    print(f"Default user seeded correctly: Region={user['region']}, Diet={user['diet_preference']}, Travel={user['travel_preference']}")
    
    # Update region to Europe
    update_user(1, region="EU", diet_preference="vegan", travel_preference="bike")
    user = get_user(1)
    assert user["region"] == "EU", "Error: Region update failed."
    assert user["diet_preference"] == "vegan", "Error: Diet preference update failed."
    print("User profile updated successfully: Region=EU, Diet=vegan")
    
    # Restore region to US for subsequent calculations
    update_user(1, region="US", diet_preference="mixed", travel_preference="mixed")
    user = get_user(1)
    
    # 3. Test programmatic calculations
    print("\n[Test 3] Testing Carbon Emission Calculations...")
    
    # 3.1 Transport Calculation: gasoline car, 50 km, region US
    # Factor is 0.18 kg CO2e / km
    co2e, method, factor, source = agent.calculate_emissions('transport', 'car', 50.0, 'gasoline', 'US')
    expected_co2e = round(50.0 * 0.18, 2)
    assert co2e == expected_co2e, f"Error Transport Gasoline Car: calculated {co2e}, expected {expected_co2e}"
    print(f"[OK] Car gasoline calculation passed: {co2e} kg CO2e (Method: {method})")
    
    # 3.2 Transport Calculation: EV, 100 km, region AP
    # Factor for electric car in AP is 0.10 kg CO2e / km
    co2e, method, factor, source = agent.calculate_emissions('transport', 'car', 100.0, 'electric', 'AP')
    expected_co2e = round(100.0 * 0.10, 2)
    assert co2e == expected_co2e, f"Error Transport EV AP: calculated {co2e}, expected {expected_co2e}"
    print(f"[OK] EV (AP coal grid) calculation passed: {co2e} kg CO2e (Method: {method})")
    
    # 3.3 Meal Calculation: meat-heavy, 3 portions, region EU
    # Factor is 2.8 kg CO2e / portion
    co2e, method, factor, source = agent.calculate_emissions('meal', 'meat-heavy', 3.0, None, 'EU')
    expected_co2e = round(3.0 * 2.8, 2)
    assert co2e == expected_co2e, f"Error Meal EU: calculated {co2e}, expected {expected_co2e}"
    print(f"[OK] Meal calculation passed: {co2e} kg CO2e (Method: {method})")
    
    # 3.4 Energy Calculation: electricity, 200 kWh, region US
    # Grid factor is 0.38 kg CO2e / kWh
    co2e, method, factor, source = agent.calculate_emissions('energy', 'electricity', 200.0, None, 'US')
    expected_co2e = round(200.0 * 0.38, 2)
    assert co2e == expected_co2e, f"Error Energy US: calculated {co2e}, expected {expected_co2e}"
    print(f"[OK] Electricity calculation passed: {co2e} kg CO2e (Method: {method})")
    
    # 4. Test database activity insertions
    print("\n[Test 4] Testing Database Persistence for Activities...")
    
    # Insert activities
    act_id1 = add_activity(1, '2026-07-17', 'transport', 'car', 35.0, 'gasoline', 6.30, 'Formula', 0.18, 'US Library')
    act_id2 = add_activity(1, '2026-07-17', 'meal', 'mixed', 2.0, None, 3.00, 'Formula', 1.5, 'US Library')
    
    activities = get_activities(1)
    assert len(activities) == 2, f"Error: Expected 2 logged activities, found {len(activities)}"
    print(f"Successfully retrieved logged activities: found {len(activities)}")
    print(f"Activity 1: {activities[0]['type']} - {activities[0]['co2e_kg']} kg CO2e")
    print(f"Activity 2: {activities[1]['type']} - {activities[1]['co2e_kg']} kg CO2e")
    
    # Test deletion
    delete_activity(act_id1)
    activities = get_activities(1)
    assert len(activities) == 1, f"Error: Expected 1 logged activity after deletion, found {len(activities)}"
    print("Activity deletion works successfully.")
    
    print("\n=== ALL UNIT TESTS COMPLETED SUCCESSFULLY ===")

if __name__ == '__main__':
    run_tests()
