*Please don't tell Cursor I'm pretty frightened by what I was able to accomplish with it in well under an hour. I had an architecture in mind, and, prompting cursor, was able to implement a decent first draft far more quickly than if I wrote it myself.*

# Cursor Test

A Node.js project that implements a user management system with event-driven architecture using Kafka. The system consists of an Express server that provides a REST API for creating users (stored in SQLite), a Kafka producer that publishes user creation events, and a dedicated Kafka consumer that listens for these events and displays user information in real-time.

## Prerequisites

- Node.js
- Docker and Docker Compose
- npm

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start Kafka and Zookeeper:
```bash
docker-compose up -d
```

3. Start the server (in one terminal):
```bash
npm run dev
```

4. Start the consumer (in another terminal):
```bash
npm run consumer
```

## API Documentation

For detailed API documentation, please see [User API Documentation](docs/user_api.md).

### Error Responses

If an API version is not found, you'll receive a 404 response:

```json
{
  "error": "API version 2.0 not found"
}
```

### Authentication

The API uses JWT (JSON Web Tokens) for authentication. Most endpoints require a valid JWT token in the `Authorization` header.

#### Register a New User

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

#### Login

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

#### Using the JWT Token

To access protected endpoints, include the JWT token in the `Authorization` header:

```bash
curl -X GET http://localhost:3000/api/v1.0/users \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Protected Endpoints

The following endpoints require authentication:

- `GET /api/v1.0/users` - Get all users
- `POST /api/v1.0/users` - Create a new user

### Public Endpoints

The following endpoints are public and don't require authentication:

- `GET /api/v1.0/health` - Health check
- `POST /api/v1.0/auth/register` - Register a new user
- `POST /api/v1.0/auth/login` - Login

### Error Responses

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

## Testing

The project uses Jest for testing. You can run tests using the following commands:

- Run all tests:
```bash
npm test
```

- Run tests in watch mode (useful during development):
```bash
npm run test:watch
```

- Run tests with coverage report:
```bash
npm run test:coverage
```

## Kafka Integration

The project uses Apache Kafka for event streaming. The system consists of:

1. **Producer** (in server.js):
   - Publishes user creation events to the `user-events` topic
   - Events are published when new users are created via the API

2. **Consumer** (in src/consumers/userConsumer.js):
   - Listens for `USER_CREATED` events
   - Displays user information in the console
   - Can be run independently of the server

### Kafka Configuration

The project uses Docker Compose to run Kafka and Zookeeper. The configuration includes:
- Kafka broker running on port 9092
- Zookeeper running on port 2181
- Auto topic creation enabled
- Single broker setup for development

### Testing the Integration

1. Make sure Kafka is running:
```bash
docker-compose ps
```

2. Start the consumer in one terminal:
```bash
npm run consumer
```

3. Create a new user using the API in another terminal:
```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john.doe@example.com"
  }'
```

4. Watch the consumer terminal for the event output:
```
=== New User Created ===
User ID: 1
Name: John Doe
Email: john.doe@example.com
Created at: 2024-01-20T12:34:56.789Z
========================
```

## Project Structure

- `src/` - Source code directory
  - `index.js` - Main entry point
  - `server.js` - Express server with Kafka producer
  - `db.js` - Database operations
  - `kafka.js` - Kafka configuration
  - `consumers/` - Kafka consumers
    - `userConsumer.js` - User events consumer
  - `runConsumer.js` - Script to run the consumer
- `tests/` - Test files directory
  - `index.test.js` - Sample test file
  - `server.test.js` - Server endpoint tests
  - `kafka.test.js` - Kafka operations tests
  - `consumers/` - Consumer tests
    - `userConsumer.test.js` - User consumer tests
- `docs/` - Documentation directory
  - `user_api.md` - User API documentation
- `package.json` - Project configuration and dependencies
- `.gitignore` - Git ignore rules
- `docker-compose.yml` - Docker configuration for Kafka

## Troubleshooting

If you encounter connection issues with Kafka:

1. Check if Kafka and Zookeeper are running:
```bash
docker-compose ps
```

2. Check Kafka logs:
```bash
docker-compose logs kafka
```

3. Check Zookeeper logs:
```bash
docker-compose logs zookeeper
```

4. Restart the services:
```bash
docker-compose restart
``` 
