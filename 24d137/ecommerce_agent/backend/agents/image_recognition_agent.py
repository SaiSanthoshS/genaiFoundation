import os
from google import genai
from google.genai import types
from backend.core.config import GEMINI_KEY

client = genai.Client(api_key=GEMINI_KEY) if GEMINI_KEY else None

def run_image_recognition(image_bytes: bytes, mime_type: str) -> str:
    if not client:
        return "UNCLEAR"
    
    print("Running Image Recognition Agent...")
    try:
        prompt = "Identify the product shown in this image. Return only a concise, searchable product name including brand and key visible specs (e.g. 'Nike Air Zoom Pegasus 40 running shoes'). If no clear product is identifiable, return exactly: UNCLEAR"
        
        image_part = types.Part.from_bytes(data=image_bytes, mime_type=mime_type)
        
        response = client.models.generate_content(
            model='gemini-flash-latest',
            contents=[prompt, image_part]
        )
        if response and response.text:
            extracted = response.text.strip().strip("'").strip('"').strip()
            print(f"Identified product from image: '{extracted}'")
            return extracted
        return "UNCLEAR"
    except Exception as e:
        print(f"Image Recognition failed: {e}")
        return "UNCLEAR"
