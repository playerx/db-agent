# API Examples

This document provides curl examples for all API endpoints in the database agent application.

## Base Configuration

- **Base URL**: `http://localhost:3000`
- **Content-Type**: `application/json`
- **Port**: 3000 (default, configurable via `PORT` environment variable)

---

## Data API (`/data`)

### 1. List All Collections

Get a list of all available MongoDB collections.

```bash
curl -X GET http://localhost:3000/data/collections
```

**Response Example:**
```json
["users", "products", "orders"]
```

---

### 2. Get Documents from Collection

Fetch documents from a specific collection with pagination and optional search filters.

**Basic Request (default pagination):**
```bash
curl -X GET http://localhost:3000/data/users
```

**With Pagination:**
```bash
curl -X GET "http://localhost:3000/data/users?skip=0&limit=20"
```

**With Search Filters:**
```bash
# Search by exact match
curl -X GET "http://localhost:3000/data/users?status=active"

# Search with regex (case-insensitive)
curl -X GET "http://localhost:3000/data/users?name=john"

# Multiple filters
curl -X GET "http://localhost:3000/data/users?status=active&role=admin&skip=10&limit=5"
```

**Response Example:**
```json
{
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "status": "active"
    }
  ],
  "pagination": {
    "skip": 0,
    "limit": 10,
    "total": 42,
    "hasMore": true
  }
}
```

---

### 3. Get Document by ID

Retrieve a specific document by its MongoDB ObjectId.

```bash
curl -X GET http://localhost:3000/data/users/507f1f77bcf86cd799439011
```

**Response Example:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "John Doe",
  "email": "john@example.com",
  "status": "active"
}
```

**Error Response (Invalid ID):**
```json
{
  "error": "Invalid ID format"
}
```

---

### 4. Update Document by ID

Update fields in a specific document.

```bash
curl -X PUT http://localhost:3000/data/users/507f1f77bcf86cd799439011 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "status": "inactive"
  }'
```

**Update Single Field:**
```bash
curl -X PUT http://localhost:3000/data/users/507f1f77bcf86cd799439011 \
  -H "Content-Type: application/json" \
  -d '{
    "lastLogin": "2025-12-19T10:30:00Z"
  }'
```

**Response Example:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "Jane Doe",
  "email": "john@example.com",
  "status": "inactive",
  "lastLogin": "2025-12-19T10:30:00Z"
}
```

**Note:** This operation creates an UPDATE event log entry.

---

### 5. Delete Document by ID

Delete a specific document from a collection.

```bash
curl -X DELETE http://localhost:3000/data/users/507f1f77bcf86cd799439011
```

**Response Example:**
```json
{
  "success": true,
  "deletedCount": 1
}
```

**Note:** This operation creates a DELETE event log entry.

---

### 6. Execute AI Agent Prompt

Execute a natural language query or operation using the AI agent.

```bash
curl -X POST http://localhost:3000/data/prompt \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Find all active users"
  }'
```

**Example Prompts:**

```bash
# Count documents
curl -X POST http://localhost:3000/data/prompt \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "How many users are there?"
  }'

# Complex query
curl -X POST http://localhost:3000/data/prompt \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Show me all orders from the last 30 days"
  }'

# Aggregation
curl -X POST http://localhost:3000/data/prompt \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "What is the average order value by customer?"
  }'
```

**Response Example:**
```json
{
  "result": "Found 42 active users",
  "debug": [
    {
      "index": 0,
      "step": "thinking",
      "content": "I need to query the users collection..."
    },
    {
      "index": 1,
      "step": "action",
      "content": "db.users.find({status: 'active'})"
    }
  ]
}
```

**Note:** This operation creates a PROMPT event log entry with the result and debug trace.

---

## Events API (`/events`)

### 1. List All Events

Get logged events (UPDATE, DELETE, PROMPT operations).

**Basic Request:**
```bash
curl -X GET http://localhost:3000/events
```

**With Pagination:**
```bash
curl -X GET "http://localhost:3000/events?skip=0&limit=20"
```

**With Debug Information:**
```bash
curl -X GET "http://localhost:3000/events?debug"
```

**Response Example (without debug):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439012",
    "type": "UPDATE",
    "collection": "users",
    "documentId": "507f1f77bcf86cd799439011",
    "timestamp": "2025-12-19T10:30:00Z",
    "data": {
      "name": "Jane Doe"
    }
  },
  {
    "_id": "507f1f77bcf86cd799439013",
    "type": "DELETE",
    "collection": "users",
    "documentId": "507f1f77bcf86cd799439014",
    "timestamp": "2025-12-19T10:35:00Z"
  }
]
```

**Response Example (with debug):**
```json
{
  "events": [
    {
      "_id": "507f1f77bcf86cd799439015",
      "type": "PROMPT",
      "timestamp": "2025-12-19T10:40:00Z",
      "prompt": "Find all active users",
      "result": "Found 42 active users",
      "debug": [
        {
          "index": 0,
          "step": "thinking",
          "content": "I need to query..."
        }
      ]
    }
  ],
  "pagination": {
    "skip": 0,
    "limit": 10,
    "total": 1,
    "hasMore": false
  }
}
```

---

### 2. Delete Event by ID

Delete a specific event log entry.

```bash
curl -X DELETE http://localhost:3000/events/507f1f77bcf86cd799439012
```

**Response Example:**
```json
{
  "success": true,
  "message": "Event deleted successfully"
}
```

**Error Response:**
```json
{
  "error": "Event not found"
}
```

---

## Error Responses

### 400 Bad Request

**Invalid ObjectId:**
```json
{
  "error": "Invalid ID format"
}
```

**Document Not Found:**
```json
{
  "error": "Document not found"
}
```

**Invalid Pagination:**
```json
{
  "error": "Skip must be a non-negative integer"
}
```

**Missing Required Field:**
```json
{
  "error": "Prompt is required"
}
```

---

### 500 Internal Server Error

```json
{
  "error": "Internal server error",
  "details": "Error message details"
}
```

---

## Advanced Usage

### Using Variables in curl

```bash
# Set base URL
BASE_URL="http://localhost:3000"

# Set collection name
COLLECTION="users"

# Get documents
curl -X GET "$BASE_URL/data/$COLLECTION"
```

### Piping Output to jq for Pretty Printing

```bash
curl -X GET http://localhost:3000/data/users | jq '.'
```

### Save Response to File

```bash
curl -X GET http://localhost:3000/data/users > users.json
```

### Using curl with Authentication Headers (if implemented)

```bash
curl -X GET http://localhost:3000/data/users \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Testing Tips

1. **Start the server** before running curl commands:
   ```bash
   npm start
   ```

2. **Check MongoDB connection** is established

3. **Use valid MongoDB ObjectIds** when testing ID-based endpoints

4. **URL encode query parameters** with special characters:
   ```bash
   curl -X GET "http://localhost:3000/data/users?email=user%40example.com"
   ```

5. **Test error cases** to ensure proper error handling

---

## Quick Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/data/collections` | List all collections |
| GET | `/data/:collection` | Get documents with pagination |
| GET | `/data/:collection/:id` | Get document by ID |
| PUT | `/data/:collection/:id` | Update document by ID |
| DELETE | `/data/:collection/:id` | Delete document by ID |
| POST | `/data/prompt` | Execute AI agent prompt |
| GET | `/events` | List all events |
| DELETE | `/events/:id` | Delete event by ID |
