from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime

DATABASE_URL = "sqlite:///./ecommerce.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    category = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class PriceSnapshot(Base):
    __tablename__ = "price_snapshots"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(String, index=True)
    store = Column(String, index=True)
    price = Column(Float)
    shipping = Column(Float)
    rating = Column(Float)
    timestamp = Column(DateTime, default=datetime.utcnow)

class Watchlist(Base):
    __tablename__ = "watchlist"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True)
    product_id = Column(String, index=True)
    threshold_price = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)

Base.metadata.create_all(bind=engine)
