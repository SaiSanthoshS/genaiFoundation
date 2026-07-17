import os
from dotenv import load_dotenv

# Load .env file from the project root directory
env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../.env'))
load_dotenv(env_path)

SERPAPI_KEY = os.getenv("SERPAPI_KEY")
GEMINI_KEY = os.getenv("GEMINI_KEY")

if not SERPAPI_KEY:
    print("Warning: SERPAPI_KEY not found in .env")
if not GEMINI_KEY:
    print("Warning: GEMINI_KEY not found in .env")
