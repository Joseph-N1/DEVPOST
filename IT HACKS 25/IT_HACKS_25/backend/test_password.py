#!/usr/bin/env python3
import asyncio
import sys
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select

# Use the same context as the app
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def test_password():
    """Test password verification directly"""
    # Import the User model
    from models.auth import User
    from database import DATABASE_URL, get_db
    
    # Create async engine
    engine = create_async_engine(DATABASE_URL, echo=False)
    
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with async_session() as session:
        result = await session.execute(
            select(User).filter(User.email == "joseph123nimyel@gmail.com")
        )
        user = result.scalar_one_or_none()
        
        if user:
            print(f"User found: {user.email}")
            print(f"Password hash length: {len(user.password_hash)}")
            print(f"Password hash (first 20 chars): {user.password_hash[:20]}")
            
            try:
                test_result = pwd_context.verify("password", user.password_hash)
                print(f"✓ Password verification result: {test_result}")
                if test_result:
                    print("✓✓✓ PASSWORD MATCHES! Login should work!")
            except Exception as e:
                print(f"✗ Verification failed: {type(e).__name__}: {e}")
        else:
            print("User not found")

if __name__ == "__main__":
    asyncio.run(test_password())
