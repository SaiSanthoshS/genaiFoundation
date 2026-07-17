from sqlalchemy import create_engine, Column, Integer, String, Text, Float
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = "sqlite:///./library.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    pages_read = Column(Integer, default=0)
    reading_streak = Column(Integer, default=0)

class BookProgress(Base):
    __tablename__ = "book_progress"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, default=1)
    book_id = Column(String, index=True)
    title = Column(String)
    pages_read = Column(Integer, default=0)
    total_pages = Column(Integer, default=0)
    status = Column(String, default="reading") # reading, completed
    themes = Column(Text, default="") # comma separated themes

class Bookmark(Base):
    __tablename__ = "bookmarks"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, default=1)
    book_id = Column(String, index=True)
    chapter_index = Column(Integer)
    highlight_text = Column(Text)
    note = Column(Text, nullable=True)

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
