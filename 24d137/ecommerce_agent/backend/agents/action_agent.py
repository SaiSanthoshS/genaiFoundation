from pydantic import BaseModel

class ProceedRequest(BaseModel):
    store_name: str
    product_url: str
    product_title: str

def run_action_agent(req: ProceedRequest) -> dict:
    """
    Action Agent: Returns a deep link to the store's checkout page if possible,
    otherwise returns the original product URL. Does NOT automate payment.
    """
    # In a real-world scenario, this might append affiliate tags or build an add-to-cart URL
    deep_link = req.product_url
    if deep_link:
        if "?" in deep_link:
            deep_link += "&ref=ecommerce_agent"
        else:
            deep_link += "?ref=ecommerce_agent"
            
    return {
        "deep_link": deep_link,
        "message": f"Redirecting to {req.store_name} for '{req.product_title}'. Note: Checkout and payment are manual by design."
    }
