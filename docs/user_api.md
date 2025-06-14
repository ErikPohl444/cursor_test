# User API Documentation

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