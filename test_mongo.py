from pymongo import MongoClient

# Replace with your Atlas connection string
uri = "mongodb+srv://mongodb_user:wTd6x44Tz8Dc9oBD@cluster0.mv49m.mongodb.net/?retryWrites=true&w=majority"

try:
    # Connect to Atlas
    print("Connecting to MongoDB Atlas...")
    client = MongoClient(uri, serverSelectionTimeoutMS=5000)
    
    # Test connection
    client.admin.command('ping')
    print("✓ Successfully connected to MongoDB Atlas!")
    
    # Access database
    db = client["sample_db"]
    collection = db["users"]
    
    # Insert a document
    user = {"name": "Arnab", "age": 25, "city": "Barrackpore"}
    result = collection.insert_one(user)
    print(f"✓ Inserted ID: {result.inserted_id}")
    
    # Query documents
    found = collection.find_one({"name": "Arnab"})
    print(f"✓ Find one: {found}")
    
    print("\nAll users:")
    for doc in collection.find():
        print(f"  {doc}")
    
    # Update a document
    collection.update_one({"name": "Arnab"}, {"$set": {"age": 26}})
    print("✓ Updated document")
    
    # Delete a document
    collection.delete_one({"name": "Arnab"})
    print("✓ Deleted document")
    
    print("\n✅ All operations completed successfully!")
    
except Exception as e:
    print(f"❌ Error: {type(e).__name__}")
    print(f"   {str(e)}")
