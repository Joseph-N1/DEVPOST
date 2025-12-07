#!/usr/bin/env python3
from passlib.context import CryptContext
import psycopg2

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

try:
    # Connect to postgres
    conn = psycopg2.connect("dbname=eco_farm user=farm password=changeme host=localhost")
    cur = conn.cursor()
    
    # Get user's password hash
    cur.execute("SELECT email, password_hash FROM users WHERE email = %s", ("joseph123nimyel@gmail.com",))
    result = cur.fetchone()
    
    if result:
        email, hash_from_db = result
        print(f"✓ User found: {email}")
        print(f"✓ Hash length: {len(hash_from_db)}")
        print(f"✓ Hash (first 30 chars): {hash_from_db[:30]}...")
        
        try:
            test_result = pwd_context.verify("password", hash_from_db)
            print(f"\n✓✓✓ PASSWORD VERIFICATION SUCCESS: {test_result}")
            if test_result:
                print("✓✓✓ PASSWORD 'password' MATCHES THE HASH!")
                print("✓✓✓ Login should now work!")
        except Exception as e:
            print(f"\n✗ Verification error: {type(e).__name__}")
            print(f"✗ Error message: {e}")
    else:
        print("✗ User not found")
    
    cur.close()
    conn.close()
    
except Exception as e:
    print(f"✗ Connection error: {e}")
