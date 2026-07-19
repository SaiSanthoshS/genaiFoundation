import requests
import urllib.parse
import os

class SearchAgent:
    def __init__(self):
        self.base_url = os.getenv("OPEN_LIBRARY_SEARCH_URL", "https://openlibrary.org/search.json")
        self.works_url = os.getenv("OPEN_LIBRARY_WORKS_URL", "https://openlibrary.org")

    def search_books(self, query: str):
        # Tools: The agent queries open library database
        url = f"{self.base_url}?q={urllib.parse.quote(query)}&limit=10"
        response = requests.get(url)
        if response.status_code == 200:
            data = response.json()
            docs = data.get("docs", [])
            books = []
            for doc in docs:
                ia_list = doc.get("ia", [])
                books.append({
                    "id": doc.get("key"),
                    "title": doc.get("title"),
                    "author": doc.get("author_name", ["Unknown"])[0],
                    "cover_i": doc.get("cover_i"),
                    "ebook_access": doc.get("ebook_access", "no_ebook"),
                    "has_fulltext": doc.get("has_fulltext", False),
                    "ia_id": ia_list[0] if ia_list else None,
                    "first_publish_year": doc.get("first_publish_year"),
                })
            return books
        return []

    def get_book_details(self, book_key: str):
        # Fetch detailed info for a specific book key (e.g., /works/OL123W)
        url = f"{self.works_url.rstrip('/')}/{book_key.lstrip('/')}.json"
        response = requests.get(url)
        if response.status_code == 200:
            data = response.json()
            description = data.get("description", "")
            if isinstance(description, dict):
                description = description.get("value", "")
            
            subjects = data.get("subjects", [])
            return {
                "id": book_key,
                "title": data.get("title"),
                "description": description,
                "subjects": subjects[:10] # Top 10 themes
            }
        return None
