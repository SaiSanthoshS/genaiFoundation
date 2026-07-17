import os
import json
from datetime import datetime, timedelta
from flask import Flask, request, jsonify, render_template

# Import local modules
from database import (
    init_db, get_user, update_user, add_activity, 
    get_activities, delete_activity, add_purchase, get_purchases
)
import agent

app = Flask(__name__, template_folder='templates', static_folder='static')

# Initialize DB on startup
init_db()

@app.route('/')
def home():
    """Serves the main application SPA page."""
    return render_template('index.html')

@app.route('/api/data', methods=['GET'])
def get_static_data():
    """Returns static data library: regions, default lists of tips, and projects."""
    return jsonify({
        "regions": agent.REGIONAL_DATA,
        "actions": agent.REDUCTION_ACTIONS,
        "projects": agent.OFFSET_PROJECTS
    })

@app.route('/api/user', methods=['GET'])
def get_user_profile():
    """Fetches the user's settings profile."""
    user = get_user(1)
    return jsonify(user)

@app.route('/api/user', methods=['POST'])
def update_user_profile():
    """Updates user region and preferences."""
    data = request.json or {}
    region = data.get("region", "US")
    diet = data.get("diet_preference", "mixed")
    travel = data.get("travel_preference", "mixed")
    
    updated = update_user(1, region, diet, travel)
    return jsonify(updated)

@app.route('/api/activity', methods=['POST'])
def log_activity():
    """Logs a new activity, runs the carbon calculator agent, and saves to DB."""
    data = request.json or {}
    
    entry_date = data.get("date")
    if not entry_date:
        entry_date = datetime.now().strftime("%Y-%m-%d")
        
    entry_type = data.get("type") # transport | meal | energy
    subtype = data.get("subtype")
    quantity = float(data.get("quantity", 0.0))
    fuel_type = data.get("fuel_type") # Optional
    
    user = get_user(1)
    region = user.get("region", "US")
    
    # Calculate emissions programmatically using agent factors
    co2e_kg, method, factor, source = agent.calculate_emissions(
        entry_type, subtype, quantity, fuel_type, region
    )
    
    # Save to database
    activity_id = add_activity(
        user_id=1,
        date=entry_date,
        type=entry_type,
        subtype=subtype,
        quantity=quantity,
        fuel_type=fuel_type,
        co2e_kg=co2e_kg,
        calculation_method=method,
        emission_factor_used=factor,
        region_source=source
    )
    
    return jsonify({
        "id": activity_id,
        "date": entry_date,
        "type": entry_type,
        "subtype": subtype,
        "quantity": quantity,
        "fuel_type": fuel_type,
        "co2e_kg": co2e_kg,
        "calculation_method": method,
        "emission_factor_used": factor,
        "region_source": source
    })

@app.route('/api/activity/<int:activity_id>', methods=['DELETE'])
def remove_activity(activity_id):
    """Deletes an activity entry by ID."""
    delete_activity(activity_id)
    return jsonify({"success": True, "message": "Activity deleted successfully!"})

@app.route('/api/dashboard', methods=['GET'])
def get_dashboard_data():
    """Assembles all data required to render the Footprint Dashboard & Insights."""
    user = get_user(1)
    region = user.get("region", "US")
    rdata = agent.REGIONAL_DATA.get(region, agent.REGIONAL_DATA["US"])
    
    activities = get_activities(1)
    purchases = get_purchases()
    
    # Total Offset Tonnes purchased
    total_offset_tonnes = sum(p.get("tonnes_offset", 0.0) for p in purchases)
    
    # Aggregated category sums
    transport_kg = 0.0
    meal_kg = 0.0
    energy_kg = 0.0
    total_kg = 0.0
    
    # Group by date for trends
    trend_map = {}
    
    # Find active range of days
    dates_logged = set()
    
    for act in activities:
        date_str = act["date"]
        dates_logged.add(date_str)
        kg = act["co2e_kg"]
        total_kg += kg
        
        # Category sums
        if act["type"] == "transport":
            transport_kg += kg
        elif act["type"] == "meal":
            meal_kg += kg
        elif act["type"] == "energy":
            energy_kg += kg
            
        # Daily trend mapping
        if date_str not in trend_map:
            trend_map[date_str] = {"transport": 0.0, "meal": 0.0, "energy": 0.0, "total": 0.0}
        trend_map[date_str][act["type"]] += kg
        trend_map[date_str]["total"] += kg
        
    # Calculate daily averages
    days_count = len(dates_logged)
    if days_count == 0:
        days_count = 1 # Prevent divide by zero, assume 1 day if empty
        
    daily_avg = total_kg / days_count
    
    # If no logs, assume 0
    if not activities:
        daily_avg = 0.0
        
    # Percentages
    grand_total = transport_kg + meal_kg + energy_kg
    transport_pct = round((transport_kg / grand_total * 100), 1) if grand_total > 0 else 0
    meal_pct = round((meal_kg / grand_total * 100), 1) if grand_total > 0 else 0
    energy_pct = round((energy_kg / grand_total * 100), 1) if grand_total > 0 else 0
    
    stats_summary = {
        "total_logged_kg": round(total_kg, 2),
        "daily_avg": round(daily_avg, 2),
        "weekly_avg": round(daily_avg * 7.0, 2),
        "monthly_avg": round(daily_avg * 30.0, 2),
        "national_avg_daily": rdata["national_avg_daily"],
        "transport_kg": round(transport_kg, 2),
        "meal_kg": round(meal_kg, 2),
        "energy_kg": round(energy_kg, 2),
        "transport_pct": transport_pct,
        "meal_pct": meal_pct,
        "energy_pct": energy_pct,
        "total_offset_tonnes": round(total_offset_tonnes, 3)
    }
    
    # Sort trends chronologically
    sorted_trend = []
    # If there are no logs, seed the trend with empty points for visualization
    if not trend_map:
        today = datetime.now()
        for i in range(6, -1, -1):
            d = (today - timedelta(days=i)).strftime("%Y-%m-%d")
            sorted_trend.append({"date": d, "transport": 0.0, "meal": 0.0, "energy": 0.0, "total": 0.0})
    else:
        # Get list of sorted dates
        sorted_dates = sorted(list(trend_map.keys()))
        # Fill in missing dates in the range if desired, or just output logged ones
        for d in sorted_dates:
            item = trend_map[d]
            sorted_trend.append({
                "date": d,
                "transport": round(item["transport"], 2),
                "meal": round(item["meal"], 2),
                "energy": round(item["energy"], 2),
                "total": round(item["total"], 2)
            })
            
    # Generate AI foot-print summary audit
    ai_insight = agent.generate_dashboard_insight(user, stats_summary)
    
    return jsonify({
        "stats": stats_summary,
        "trends": sorted_trend,
        "activities": activities[:30], # Return last 30 activities
        "ai_insight": ai_insight
    })

@app.route('/api/tips', methods=['GET'])
def get_personalized_tips():
    """Returns AI-ranked tips based on user logs."""
    user = get_user(1)
    activities = get_activities(1)
    ranked = agent.rank_reduction_tips(user, activities)
    return jsonify(ranked)

@app.route('/api/chat', methods=['POST'])
def chat_with_advisor():
    """Runs a session conversation with the Carbon Footprint Advisor agent."""
    data = request.json or {}
    message = data.get("message")
    history = data.get("history", [])
    
    if not message:
        return jsonify({"error": "Message is required"}), 400
        
    user = get_user(1)
    activities = get_activities(1)
    
    response_text = agent.get_chat_response(user, activities, history, message)
    return jsonify({"response": response_text})

@app.route('/api/offset/purchase', methods=['POST'])
def purchase_offset():
    """Records an offset checkout transaction."""
    data = request.json or {}
    project_id = data.get("project_id")
    project_name = data.get("project_name")
    amount_usd = float(data.get("amount_usd", 0.0))
    tonnes_offset = float(data.get("tonnes_offset", 0.0))
    
    if not project_id or not project_name or amount_usd <= 0 or tonnes_offset <= 0:
        return jsonify({"error": "Invalid checkout details"}), 400
        
    add_purchase(project_id, project_name, amount_usd, tonnes_offset)
    
    return jsonify({
        "success": True, 
        "message": f"Successfully purchased {tonnes_offset:.2f} tonnes of carbon offsets from {project_name} for ${amount_usd:.2f}!"
    })

if __name__ == '__main__':
    # Listen on port 5000
    app.run(host='0.0.0.0', port=5000, debug=True)
