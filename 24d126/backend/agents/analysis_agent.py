import os
from google import genai
from google.genai import types

class AnalysisAgent:
    def __init__(self):
        # We will use Gemini to score readability based on title and themes if text is not available
        self.api_key = os.getenv("GEMINI_API_KEY")
        if self.api_key:
            self.client = genai.Client(api_key=self.api_key)
        else:
            self.client = None

    def analyze_readability(self, title: str, description: str, themes: list) -> dict:
        if not self.client:
            # Fallback heuristic
            return {
                "score": "Medium",
                "reason": "API Key missing, using default heuristic.",
                "is_free": True # Mocked
            }
        
        prompt = f"""
        You are a reading level analysis agent. 
        Analyze the following book and return a JSON object with a "score" (Easy, Medium, Hard, or Advanced) and a brief "reason".
        
        Title: {title}
        Description: {description}
        Themes: {', '.join(themes)}
        """

        try:
            response = self.client.models.generate_content(
                model='gemini-2.0-flash',
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema={
                        "type": "OBJECT",
                        "properties": {
                            "score": {"type": "STRING"},
                            "reason": {"type": "STRING"}
                        }
                    }
                ),
            )
            return response.text
        except Exception as e:
            # Fallback when API key has quota/permission issues
            return {
                "score": "Medium",
                "reason": "Default heuristic applied (API unavailable). This book is generally accessible to most readers."
            }
