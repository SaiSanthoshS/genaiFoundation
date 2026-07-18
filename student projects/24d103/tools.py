# tools.py

def get_drug_info(name):
    return {
        "name": name,
        "description": f"{name} is a commonly used medication. Follow your doctor's prescription."
    }


def check_interactions(drug_names):
    if len(drug_names) > 1:
        return f"Check interactions between: {', '.join(drug_names)}."
    return "No known interactions detected for a single medication."


def generate_reminders(frequency):
    return f"Take your medication {frequency}."


def calculate_refill(stock, doses_per_day):
    try:
        stock = int(stock)
        doses_per_day = int(doses_per_day)

        if doses_per_day <= 0:
            return "Invalid doses per day."

        days_left = stock // doses_per_day

        if days_left <= 5:
            return f"⚠ Refill soon! Approximately {days_left} day(s) of stock left."

        return f"Approximately {days_left} day(s) of stock remaining."

    except ValueError:
        return "Invalid stock or dosage values."