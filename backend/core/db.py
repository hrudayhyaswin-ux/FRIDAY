import sqlite3
import os
import logging

logger = logging.getLogger(__name__)

# Store the database file inside the backend directory
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "friday_memory.db")

def init_db():
    try:
        conn = sqlite3.connect(DB_PATH)
        # Enable foreign keys
        conn.execute("PRAGMA foreign_keys = ON;")
        
        # Import and run schema creation
        from database.schema import create_tables
        create_tables(conn)
        
        cursor = conn.cursor()
        # Seed the database with default memory if it's empty
        cursor.execute('SELECT COUNT(*) FROM user_memory')
        if cursor.fetchone()[0] == 0:
            cursor.execute("INSERT INTO user_memory (key, value) VALUES ('user_name', 'Administrator')")
            cursor.execute("INSERT INTO user_memory (key, value) VALUES ('preferred_style', 'Futuristic & High-Tech')")
            cursor.execute("INSERT INTO user_memory (key, value) VALUES ('offline_model_preference', 'Local GGUF (CPU)')")
            
        conn.commit()
        conn.close()
        logger.info(f"SQLite database initialized successfully at {DB_PATH}")
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")

def get_db_connection():
    """Returns a connection to the SQLite database."""
    conn = sqlite3.connect(DB_PATH)
    # This allows us to access columns by name (e.g. row['key'])
    conn.row_factory = sqlite3.Row
    return conn
