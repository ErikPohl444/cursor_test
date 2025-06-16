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

If an API version is not found, you'll receive a 404 response:

```json
{
  "error": "API version 2.0 not found"
}
```

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Most endpoints require a valid JWT token in the `Authorization` header.

### Register a New User

```bash
curl -X POST http://localhost:3000/api/v1.0/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john.doe@example.com",
    "password": "securepassword123"
  }'
```

Expected response:
```json
{
  "message": "User registered successfully",
  "userId": 1
}
```

### Login

```bash
curl -X POST http://localhost:3000/api/v1.0/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "securepassword123"
  }'
```

Expected response:
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john.doe@example.com"
  }
}
```

### Using the JWT Token

To access protected endpoints, include the JWT token in the `Authorization` header:

```bash
curl -X GET http://localhost:3000/api/v1.0/users \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## Protected Endpoints

The following endpoints require authentication:

- `GET /api/v1.0/users` - Get all users
- `POST /api/v1.0/users` - Create a new user

## Public Endpoints

The following endpoints are public and don't require authentication:

- `GET /api/v1.0/health` - Health check
- `POST /api/v1.0/auth/register` - Register a new user
- `POST /api/v1.0/auth/login` - Login

## Error Responses

Authentication errors:

```json
{
  "error": "Authentication token required"
}
```

```json
{
  "error": "Invalid or expired token"
}
```

```json
{
  "error": "Invalid email or password"
}
``` 