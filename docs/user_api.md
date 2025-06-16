# User API Documentation

## Interactive API Documentation

The API includes interactive Swagger documentation that can be accessed at `http://localhost:3000/api-docs` when the server is running. This documentation provides:

- Interactive testing interface for all endpoints
- Detailed request/response schemas
- Authentication requirements
- Example requests and responses
- Real-time API testing capabilities

The Swagger UI allows you to:
1. Browse all available endpoints
2. Test API calls directly from the browser
3. View detailed schema definitions
4. Understand authentication flows
5. See example request/response formats

## Get All Users

```bash
curl http://localhost:3000/users
```

Expected response:
```json
[
  {
    "id": 1,
    "name": "John Doe",
    "email": "john.doe@example.com",
    "created_at": "2024-01-20T12:34:56.789Z"
  }
]
```

## Create a User

```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john.doe@example.com"
  }'
```

Expected response:
```json
{
  "message": "User created successfully",
  "userId": 1
}
```

## Error Responses

### Missing Required Fields

```json
{
  "error": "Name and email are required"
}
```

### Invalid Email Format

```json
{
  "error": "Invalid email format"
}
```

### Duplicate Email

```json
{
  "error": "Email already exists"
}
```

### Server Error

```json
{
  "error": "Internal server error"
}
``` 