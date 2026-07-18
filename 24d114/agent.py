import os
import json
from dotenv import load_dotenv
from groq import Groq

# Load environment variables from workspace root
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))
groq_key = os.getenv("Grog_key") or os.getenv("GROQ_API_KEY")

# Initialize Groq client
client = None
if groq_key:
    try:
        client = Groq(api_key=groq_key)
    except Exception as e:
        print(f"Error initializing Groq client: {e}")

# Regional Grid mix, transport & meal emission factors (kg CO2e)
REGIONAL_DATA = {
    "US": {
        "name": "North America",
        "national_avg_daily": 45.0, # kg CO2e per capita daily (~16.4 tonnes/year)
        "electricity": 0.38,        # kg CO2e per kWh
        "gas": 0.20,                # kg CO2e per kWh
        "heating": 0.22,            # kg CO2e per kWh
        "transport": {
            "car": {
                "gasoline": 0.18,
                "diesel": 0.17,
                "hybrid": 0.10,
                "electric": 0.05
            },
            "bus": 0.08,
            "train": 0.04,
            "flight": 0.25,
            "bike": 0.0,
            "walk": 0.0
        },
        "meal": {
            "meat-heavy": 3.0,
            "mixed": 1.5,
            "vegetarian": 0.8,
            "vegan": 0.5
        }
    },
    "EU": {
        "name": "Europe",
        "national_avg_daily": 20.0, # kg CO2e per capita daily (~7.3 tonnes/year)
        "electricity": 0.23,        # kg CO2e per kWh
        "gas": 0.20,
        "heating": 0.22,
        "transport": {
            "car": {
                "gasoline": 0.16,
                "diesel": 0.15,
                "hybrid": 0.09,
                "electric": 0.03
            },
            "bus": 0.06,
            "train": 0.02,
            "flight": 0.24,
            "bike": 0.0,
            "walk": 0.0
        },
        "meal": {
            "meat-heavy": 2.8,
            "mixed": 1.3,
            "vegetarian": 0.7,
            "vegan": 0.4
        }
    },
    "AP": {
        "name": "Asia-Pacific",
        "national_avg_daily": 6.0,  # kg CO2e per capita daily (~2.2 tonnes/year)
        "electricity": 0.75,        # kg CO2e per kWh (coal heavy)
        "gas": 0.20,
        "heating": 0.22,
        "transport": {
            "car": {
                "gasoline": 0.15,
                "diesel": 0.14,
                "hybrid": 0.08,
                "electric": 0.10 # High electric due to coal grid mix
            },
            "bus": 0.04,
            "train": 0.03,
            "flight": 0.25,
            "bike": 0.0,
            "walk": 0.0
        },
        "meal": {
            "meat-heavy": 2.5,
            "mixed": 1.0,
            "vegetarian": 0.5,
            "vegan": 0.3
        }
    }
}

# Master List of Reduction Actions
REDUCTION_ACTIONS = [
    {
        "id": "solar_panels",
        "title": "Install Rooftop Solar Panels",
        "description": "Transition to residential solar power to offset grid-based electricity consumption.",
        "estimatedCo2SavedTonnesPerYear": 2.4,
        "difficulty": "High",
        "cost": "$$$",
        "category": "energy",
        "icon": "⚡"
    },
    {
        "id": "electric_vehicle",
        "title": "Switch to an Electric Vehicle",
        "description": "Replace a gasoline-powered car with an EV, especially effective in low-carbon grid regions.",
        "estimatedCo2SavedTonnesPerYear": 3.1,
        "difficulty": "High",
        "cost": "$$$",
        "category": "transport",
        "icon": "🚗"
    },
    {
        "id": "plant_based_diet",
        "title": "Adopt a Plant-Based Diet",
        "description": "Eliminate meat and dairy products, switching entirely to vegetarian/vegan meals.",
        "estimatedCo2SavedTonnesPerYear": 1.2,
        "difficulty": "Medium",
        "cost": "$",
        "category": "meal",
        "icon": "🥗"
    },
    {
        "id": "heat_pump",
        "title": "Install a Heat Pump System",
        "description": "Switch from oil/gas-based furnace heating to an energy-efficient electric heat pump.",
        "estimatedCo2SavedTonnesPerYear": 1.8,
        "difficulty": "High",
        "cost": "$$$",
        "category": "energy",
        "icon": "🔥"
    },
    {
        "id": "public_transit",
        "title": "Commute via Public Transit",
        "description": "Take buses or trains instead of driving a personal vehicle for your daily commute.",
        "estimatedCo2SavedTonnesPerYear": 1.5,
        "difficulty": "Medium",
        "cost": "$",
        "category": "transport",
        "icon": "🚌"
    },
    {
        "id": "meatless_mondays",
        "title": "Implement Meatless Mondays",
        "description": "Swap meat for plant-based meals just one day a week to build sustainable eating habits.",
        "estimatedCo2SavedTonnesPerYear": 0.2,
        "difficulty": "Low",
        "cost": "$",
        "category": "meal",
        "icon": "🥦"
    },
    {
        "id": "smart_thermostat",
        "title": "Use a Smart Thermostat",
        "description": "Optimize heating and cooling schedules to save electricity and gas while away.",
        "estimatedCo2SavedTonnesPerYear": 0.4,
        "difficulty": "Low",
        "cost": "$$",
        "category": "energy",
        "icon": "🌡️"
    },
    {
        "id": "fly_less",
        "title": "Reduce Flights / Choose Rail",
        "description": "Avoid medium-distance flights and choose high-speed rail, or combine virtual business meetings.",
        "estimatedCo2SavedTonnesPerYear": 1.6,
        "difficulty": "Medium",
        "cost": "$",
        "category": "transport",
        "icon": "✈️"
    },
    {
        "id": "led_lighting",
        "title": "Upgrade to LED Bulbs",
        "description": "Replace incandescent lights with high-efficiency LEDs to reduce lighting energy footprint.",
        "estimatedCo2SavedTonnesPerYear": 0.15,
        "difficulty": "Low",
        "cost": "$",
        "category": "energy",
        "icon": "💡"
    }
]

# Carbon Offset Projects
OFFSET_PROJECTS = [
    {
        "id": "amazon_reforest",
        "name": "Amazon Basin Reforestation",
        "description": "Protects endangered old-growth rain forests in Acre, Brazil, and funds native tree planting to restore biodiversity corridors.",
        "costPerTonne": 15.00,
        "category": "Reforestation",
        "region": "Brazil",
        "verificationStandard": "Gold Standard",
        "image": "reforestation"
    },
    {
        "id": "india_wind",
        "name": "Karnal Wind Farm Project",
        "description": "Installs wind turbine generators in Haryana, India, supplying clean energy to the national grid and displacing coal dependency.",
        "costPerTonne": 8.00,
        "category": "Renewable Energy",
        "region": "India",
        "verificationStandard": "Verra (VCS)",
        "image": "wind"
    },
    {
        "id": "usa_methane",
        "name": "Landfill Gas Methane Capture",
        "description": "Captures heat-trapping methane emissions from active municipal solid waste landfills in Ohio, converting it into clean pipeline electricity.",
        "costPerTonne": 12.00,
        "category": "Methane Capture",
        "region": "USA",
        "verificationStandard": "Climate Action Reserve",
        "image": "methane"
    },
    {
        "id": "kenya_cookstoves",
        "name": "Efficient Cookstoves for Families",
        "description": "Provides cleaner biomass cookstoves to communities in rural Kenya, reducing firewood consumption by 50% and protecting lungs.",
        "costPerTonne": 10.00,
        "category": "Community Energy",
        "region": "Kenya",
        "verificationStandard": "Gold Standard",
        "image": "cookstoves"
    },
    {
        "id": "madagascar_blue",
        "name": "Coastal Mangrove Restoration",
        "description": "Restores decimated mangrove estuaries along the coast of Madagascar, creating critical marine nurseries and sequestering blue carbon.",
        "costPerTonne": 25.00,
        "category": "Blue Carbon",
        "region": "Madagascar",
        "verificationStandard": "Verra (VCS)",
        "image": "mangroves"
    },
    {
        "id": "indonesia_peatland",
        "name": "Rimbar Peatland Protection",
        "description": "Rewets and safeguards critical tropical peat swamp forests in Central Kalimantan, preventing fire outbreaks and massive soil emissions.",
        "costPerTonne": 18.00,
        "category": "Ecosystem Conservation",
        "region": "Indonesia",
        "verificationStandard": "Gold Standard",
        "image": "peatland"
    }
]

def calculate_emissions(entry_type, subtype, quantity, fuel_type=None, region='US'):
    """
    Modular calculation engine based on regional emission factors.
    Returns: (co2e_kg, calculation_method, emission_factor_used, region_source)
    """
    region = region if region in REGIONAL_DATA else 'US'
    rdata = REGIONAL_DATA[region]
    
    co2e_kg = 0.0
    factor = 0.0
    method = ""
    source = f"{rdata['name']} Factor Library"
    
    if entry_type == 'transport':
        if subtype == 'car':
            f_type = fuel_type if fuel_type in ['gasoline', 'diesel', 'hybrid', 'electric'] else 'gasoline'
            factor = rdata['transport']['car'][f_type]
            co2e_kg = quantity * factor
            method = f"Distance ({quantity} km) * Car Fuel factor ({f_type}: {factor} kg/km)"
        else:
            factor = rdata['transport'].get(subtype, 0.0)
            co2e_kg = quantity * factor
            method = f"Distance ({quantity} km) * Transport factor ({subtype}: {factor} kg/km)"
            
    elif entry_type == 'meal':
        factor = rdata['meal'].get(subtype, 1.5)
        co2e_kg = quantity * factor
        method = f"Portions ({quantity}) * Meal factor ({subtype}: {factor} kg/portion)"
        
    elif entry_type == 'energy':
        if subtype == 'electricity':
            factor = rdata['electricity']
            co2e_kg = quantity * factor
            method = f"Electricity ({quantity} kWh) * Regional grid mix factor ({factor} kg/kWh)"
        elif subtype == 'gas':
            factor = rdata['gas']
            co2e_kg = quantity * factor
            method = f"Gas ({quantity} kWh-equiv) * Gas combustion factor ({factor} kg/kWh)"
        elif subtype == 'heating':
            factor = rdata['heating']
            co2e_kg = quantity * factor
            method = f"Heating ({quantity} kWh-equiv) * Heating system factor ({factor} kg/kWh)"
            
    return round(co2e_kg, 2), method, factor, source

def generate_dashboard_insight(user_profile, summary_stats):
    """
    Uses LLM (or a smart template fallback) to write a personalized footprint audit.
    """
    region = user_profile.get("region", "US")
    rdata = REGIONAL_DATA.get(region, REGIONAL_DATA["US"])
    
    # Extract stats
    daily_avg = round(summary_stats.get("daily_avg", 0.0), 2)
    nat_avg = rdata["national_avg_daily"]
    percentage_diff = round(((daily_avg - nat_avg) / nat_avg) * 100, 1) if nat_avg > 0 else 0
    
    # Check if we have LLM capabilities
    if client:
        try:
            prompt = f"""
            You are "Carbon Advisor", an intelligent and encouraging sustainability AI agent.
            Analyze the following user data:
            - User Region: {rdata['name']}
            - User Preferences: Diet={user_profile.get('diet_preference')}, Travel={user_profile.get('travel_preference')}
            - User's Calculated Daily Average Footprint: {daily_avg} kg CO2e
            - Regional National Average: {nat_avg} kg CO2e
            - Comparison: User is {percentage_diff}% {'above' if percentage_diff > 0 else 'below'} the national average.
            - Category Breakdowns: Transport={summary_stats.get('transport_pct', 0)}%, Meal={summary_stats.get('meal_pct', 0)}%, Energy={summary_stats.get('energy_pct', 0)}%
            
            Write a 2-3 sentence personalized footprint audit. 
            Highlight the user's primary emission driver, give a brief encouraging remark, and suggest a simple direction (e.g., if Transport is high, mention rail or commuting; if Food is high, mention plant-based days).
            Keep it professional, concise, and highly action-oriented. Do not include markdown headers or greetings.
            """
            
            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": "You are a professional carbon sustainability advisor. Be concise and motivational."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=150,
                temperature=0.7
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            print(f"Groq API call failed: {e}. Falling back to rule-based insight.")

    # Rule-based fallback
    compare_text = f"which is {abs(percentage_diff)}% higher than" if percentage_diff > 0 else f"which is {abs(percentage_diff)}% lower than"
    if percentage_diff == 0:
        compare_text = "which exactly equals"
        
    dominant_cat = "Transport"
    max_val = summary_stats.get("transport_kg", 0)
    if summary_stats.get("meal_kg", 0) > max_val:
        dominant_cat = "Meals"
        max_val = summary_stats.get("meal_kg", 0)
    if summary_stats.get("energy_kg", 0) > max_val:
        dominant_cat = "Home Energy"
        
    return (
        f"Your current daily footprint is {daily_avg} kg CO2e, {compare_text} the {rdata['name']} average of {nat_avg} kg. "
        f"Your primary source of emissions is {dominant_cat}. "
        f"Focusing on reducing {dominant_cat.lower()} activities this week will have the highest immediate impact on lowering your overall footprint."
    )

def rank_reduction_tips(user_profile, logged_activities):
    """
    Ranks possible reduction actions. 
    Personalized based on user's logged activity trends.
    Returns the tips with an AI-generated justification for why it's recommended.
    """
    # Calculate category totals
    transport_kg = 0.0
    meal_kg = 0.0
    energy_kg = 0.0
    
    for act in logged_activities:
        cat = act.get('type')
        kg = act.get('co2e_kg', 0.0)
        if cat == 'transport':
            transport_kg += kg
        elif cat == 'meal':
            meal_kg += kg
        elif cat == 'energy':
            energy_kg += kg
            
    # Sort categories by footprint
    cat_weights = {
        'transport': transport_kg,
        'meal': meal_kg,
        'energy': energy_kg
    }
    sorted_cats = sorted(cat_weights.items(), key=lambda x: x[1], reverse=True)
    highest_cat = sorted_cats[0][0] if sorted_cats[0][1] > 0 else None
    
    # We want to rank actions:
    # 1. Matching highest emissions category first (or descending impact)
    # Let's assign an initial score based on carbon savings
    scored_actions = []
    for action in REDUCTION_ACTIONS:
        score = action['estimatedCo2SavedTonnesPerYear']
        # Apply a multiplier if it matches the user's highest emission category
        if highest_cat and action['category'] == highest_cat:
            score *= 2.0
        # If the user preference matches, boost it
        if action['category'] == 'meal' and user_profile.get('diet_preference') == 'vegan' and action['id'] == 'plant_based_diet':
            # They already do this! Lower priority or keep as a badge? Let's reduce score since they already do it
            score *= 0.2
        scored_actions.append((action, score))
        
    # Sort actions by their score
    scored_actions.sort(key=lambda x: x[1], reverse=True)
    ranked_tips = [item[0] for item in scored_actions]
    
    # Now generate justifications
    justifications = {}
    if client and logged_activities:
        try:
            # Let's batch get justifications or generate standard ones
            activities_summary = f"Transport: {transport_kg:.1f} kg, Meal: {meal_kg:.1f} kg, Energy: {energy_kg:.1f} kg"
            prompt = f"""
            You are "Carbon Advisor". We have ranked a list of reduction tips for a user based on their footprint logs: {activities_summary}.
            For each of the following 3 action IDs, write a very short, personalized 1-sentence justification (max 15 words) explaining why this action is highly recommended for them based on their category weight.
            Action IDs to justify:
            1. {ranked_tips[0]['id']} (Title: {ranked_tips[0]['title']})
            2. {ranked_tips[1]['id']} (Title: {ranked_tips[1]['title']})
            3. {ranked_tips[2]['id']} (Title: {ranked_tips[2]['title']})
            
            Output a JSON object mapping the Action ID to the sentence. Do not include markdown codeblocks or anything other than valid JSON.
            Example:
            {{
              "{ranked_tips[0]['id']}": "Your transport emissions are high; transit will cut your driving footprint dramatically."
            }}
            """
            
            response = client.chat.completions.create(
                model="llama-3.1-8b-instant", # Faster model for structured mapping
                messages=[
                    {"role": "system", "content": "You are a database system returning strict JSON. Return ONLY a JSON object and no surrounding text."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=200,
                temperature=0.3
            )
            content = response.choices[0].message.content.strip()
            # Clean JSON blocks if present
            if content.startswith("```json"):
                content = content[7:-3].strip()
            elif content.startswith("```"):
                content = content[3:-3].strip()
            
            parsed = json.loads(content)
            justifications.update(parsed)
        except Exception as e:
            print(f"Error generating AI justifications: {e}")
            
    # Add justifications to the tip dictionaries
    final_tips = []
    for idx, tip in enumerate(ranked_tips):
        # Fallback justifications
        fallback = f"This action saves up to {tip['estimatedCo2SavedTonnesPerYear']} tonnes of CO2 per year."
        if tip['category'] == highest_cat:
            fallback = f"This is highly recommended because {tip['category'].title()} represents your largest carbon source."
            
        tip_copy = tip.copy()
        tip_copy['justification'] = justifications.get(tip['id'], fallback)
        final_tips.append(tip_copy)
        
    return final_tips

def get_chat_response(user_profile, logged_activities, chat_history, user_message):
    """
    Handles chatbot conversation with the AI Carbon Advisor.
    """
    region = user_profile.get("region", "US")
    rdata = REGIONAL_DATA.get(region, REGIONAL_DATA["US"])
    
    # Calculate footprint summary
    total_kg = 0.0
    transport_kg = 0.0
    meal_kg = 0.0
    energy_kg = 0.0
    for act in logged_activities:
        kg = act.get('co2e_kg', 0.0)
        total_kg += kg
        if act.get('type') == 'transport':
            transport_kg += kg
        elif act.get('type') == 'meal':
            meal_kg += kg
        elif act.get('type') == 'energy':
            energy_kg += kg
            
    summary = f"""
    User footprint profile:
    - Region: {rdata['name']} (Grid mix: {rdata['electricity']} kg CO2e/kWh, Daily Average: {rdata['national_avg_daily']} kg CO2e)
    - User Preferences: Diet={user_profile.get('diet_preference')}, Travel={user_profile.get('travel_preference')}
    - Total emissions logged: {total_kg:.1f} kg CO2e
    - Transport total: {transport_kg:.1f} kg CO2e
    - Meal total: {meal_kg:.1f} kg CO2e
    - Energy total: {energy_kg:.1f} kg CO2e
    - Logged items count: {len(logged_activities)} entries
    """
    
    system_instruction = f"""
    You are "Carbon Advisor", an AI agent that helps users calculate, analyze, and reduce their carbon footprint.
    You have access to the user's profile and logged activities below:
    {summary}
    
    Guidelines:
    1. Always reference their actual logs or region if relevant to their questions (e.g. if they ask "how am I doing", mention their {total_kg:.1f} kg total compared to the {rdata['national_avg_daily']} kg national daily average).
    2. Be practical, friendly, and scientifically accurate. Use metrics (kg CO2e, tonnes) correctly.
    3. Suggest actionable carbon-reduction tips (like swapping beef for chicken/beans, using trains instead of flights, or monitoring home thermostat settings).
    4. Keep answers relatively concise (1-3 paragraphs) to fit well in a chat dashboard interface.
    """
    
    messages = [{"role": "system", "content": system_instruction}]
    for msg in chat_history:
        messages.append({"role": msg["role"], "content": msg["content"]})
    messages.append({"role": "user", "content": user_message})
    
    if client:
        try:
            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=messages,
                max_tokens=400,
                temperature=0.7
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            return f"I'm sorry, I encountered a communication error with my core intelligence engine ({e}). However, based on your logs, you have registered a total of {total_kg:.1f} kg CO2e emissions. Let me know if you would like suggestions on how to cut this down!"
    else:
        # Static mock chatbot fallback
        return f"Carbon Advisor (Local Mode): You have logged {len(logged_activities)} activities totaling {total_kg:.1f} kg of CO2e. Your biggest footprint source is in the {('Transport' if transport_kg >= meal_kg and transport_kg >= energy_kg else 'Energy' if energy_kg >= meal_kg else 'Meal')} category. I recommend focusing on reduction efforts there, or checking out the Offset Marketplace to neutralize your impact."
