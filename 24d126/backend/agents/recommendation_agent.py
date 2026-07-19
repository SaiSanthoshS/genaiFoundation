import os
import json
from google import genai
from google.genai import types

class RecommendationAgent:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        if self.api_key:
            self.client = genai.Client(api_key=self.api_key)
        else:
            self.client = None

    def get_recommendations(self, completed_themes: list) -> list:
        if not self.client:
            # Fallback
            return [
                {"title": "The Great Gatsby", "reason": "Classic literature similar to your completed themes."},
                {"title": "1984", "reason": "A must-read dystopian novel."}
            ]
        
        prompt = f"""
        You are a library recommendation agent. The user has completed books with the following themes:
        {', '.join(completed_themes)}
        
        Based on these themes, recommend 3 specific books they should read next.
        Return a JSON list of objects, each with a "title" and a "reason".
        """

        try:
            response = self.client.models.generate_content(
                model='gemini-2.0-flash',
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema={
                        "type": "ARRAY",
                        "items": {
                            "type": "OBJECT",
                            "properties": {
                                "title": {"type": "STRING"},
                                "reason": {"type": "STRING"}
                            }
                        }
                    }
                ),
            )
            return json.loads(response.text)
        except Exception as e:
            # Fallback when API key has quota/permission issues
            return [
                {"title": "The Great Gatsby", "reason": "Classic literature similar to your completed themes."},
                {"title": "1984", "reason": "A must-read dystopian novel."}
            ]
