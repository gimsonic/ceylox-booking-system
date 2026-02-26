import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()
URL = os.getenv("DB_URL")

engine = create_engine(URL)

def test_connection():
    try:
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            print("✅ Success! Ceylox Backend is connected to Supabase Cloud.")
    except Exception as e:
        print("❌ Connection Failed.")
        print(f"Error details: {e}")

if __name__ == "__main__":
    test_connection()