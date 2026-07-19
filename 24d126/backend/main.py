from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
import json
import os
from dotenv import load_dotenv

load_dotenv()

from database import init_db, get_db, User, BookProgress, Bookmark
from agents.search_agent import SearchAgent
from agents.analysis_agent import AnalysisAgent
from agents.recommendation_agent import RecommendationAgent

app = FastAPI(title="Smart Library Agent API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize DB on startup
@app.on_event("startup")
def on_startup():
    init_db()

search_agent = SearchAgent()
analysis_agent = AnalysisAgent()
recommendation_agent = RecommendationAgent()

# ----------------- Models -----------------
class BookmarkCreate(BaseModel):
    book_id: str
    chapter_index: int
    highlight_text: str
    note: Optional[str] = None

class ProgressUpdate(BaseModel):
    book_id: str
    title: str
    pages_read: int
    total_pages: int
    themes: List[str]

# ----------------- Routes -----------------

@app.get("/api/search")
def search_books(q: str):
    results = search_agent.search_books(q)
    return {"books": results}

@app.get("/api/books/{book_id:path}")
def get_book_details(book_id: str):
    # book_id from openlibrary might look like "works/OL123W" or just "OL123W"
    # To handle potential slashes we use :path but we ensure it works
    if not book_id.startswith("works/"):
        book_id = f"works/{book_id}"
    
    details = search_agent.get_book_details(book_id)
    if not details:
        raise HTTPException(status_code=404, detail="Book not found")
    
    # Use agent to analyze readability
    themes = details.get("subjects", [])
    analysis = analysis_agent.analyze_readability(
        title=details.get("title"),
        description=details.get("description"),
        themes=themes
    )
    
    # parse the JSON analysis if it's a string
    try:
        if isinstance(analysis, str):
            analysis = json.loads(analysis)
    except:
        analysis = {"score": "Medium", "reason": "Error parsing analysis"}

    details["readability"] = analysis
    # has_full_text is now handled in the frontend by merging the search result's ia_id 
    # but we can set a default False here just in case.
    if "has_full_text" not in details:
        details["has_full_text"] = False
    return details

@app.post("/api/bookmarks")
def save_bookmark(bookmark: BookmarkCreate, db: Session = Depends(get_db)):
    db_bookmark = Bookmark(
        user_id=1,
        book_id=bookmark.book_id,
        chapter_index=bookmark.chapter_index,
        highlight_text=bookmark.highlight_text,
        note=bookmark.note
    )
    db.add(db_bookmark)
    db.commit()
    return {"status": "success", "bookmark_id": db_bookmark.id}

@app.get("/api/bookmarks/{book_id:path}")
def get_bookmarks(book_id: str, db: Session = Depends(get_db)):
    if not book_id.startswith("works/"):
        book_id = f"works/{book_id}"
    bookmarks = db.query(Bookmark).filter(Bookmark.book_id == book_id, Bookmark.user_id == 1).all()
    return {"bookmarks": bookmarks}

@app.post("/api/progress")
def update_progress(progress: ProgressUpdate, db: Session = Depends(get_db)):
    db_progress = db.query(BookProgress).filter(
        BookProgress.book_id == progress.book_id,
        BookProgress.user_id == 1
    ).first()
    
    status = "completed" if progress.pages_read >= progress.total_pages else "reading"
    themes_str = ",".join(progress.themes)
    
    if db_progress:
        db_progress.pages_read = progress.pages_read
        db_progress.status = status
        db_progress.themes = themes_str
    else:
        db_progress = BookProgress(
            user_id=1,
            book_id=progress.book_id,
            title=progress.title,
            pages_read=progress.pages_read,
            total_pages=progress.total_pages,
            status=status,
            themes=themes_str
        )
        db.add(db_progress)
        
    db.commit()
    
    # Update global user stats
    user = db.query(User).filter(User.id == 1).first()
    if not user:
        user = User(id=1, pages_read=0, reading_streak=1)
        db.add(user)
    
    user.pages_read += progress.pages_read
    # Simple streak logic: just increment if they are reading
    user.reading_streak = 5 # Mock dynamic calculation
    db.commit()
    
    return {"status": "success"}

@app.get("/api/dashboard")
def get_dashboard(db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == 1).first()
    if not user:
        user = User(id=1, pages_read=0, reading_streak=0)
        
    progress = db.query(BookProgress).filter(BookProgress.user_id == 1).all()
    return {
        "pages_read": user.pages_read,
        "reading_streak": user.reading_streak,
        "reading_speed": "250 WPM", # Simulated
        "books_progress": progress
    }

@app.get("/api/recommendations")
def get_recommendations(db: Session = Depends(get_db)):
    completed_books = db.query(BookProgress).filter(
        BookProgress.user_id == 1,
        BookProgress.status == "completed"
    ).all()
    
    themes = []
    for book in completed_books:
        if book.themes:
            themes.extend([t.strip() for t in book.themes.split(",")])
            
    # Distinct themes
    themes = list(set(themes))
    if not themes:
        themes = ["Fiction", "Mystery"] # Default if no history
        
    recommendations = recommendation_agent.get_recommendations(themes)
    return {"recommendations": recommendations}
