const request = require('supertest');
const express = require('express');
const db = require('../src/db');
const kafka = require('../src/kafka');
const { generateToken } = require('../src/middleware/auth');

// Mock Kafka module
jest.mock('../src/kafka', () => ({
    checkConnection: jest.fn().mockResolvedValue(true),
    sendMessage: jest.fn()
}));

// Create a test Express app
const app = express();
app.use(express.json());

// API versioning middleware
app.use((req, res, next) => {
    req.apiVersion = req.headers['x-api-version'] || '1.0';
    next();
});

// Create v1.0 router
const v1Router = express.Router();

// Add the routes to the test app
v1Router.get('/health', async (req, res) => {
    try {
        const dbStatus = db.checkConnection();
        const kafkaStatus = await kafka.checkConnection();
        
        res.json({
            status: 'healthy',
            version: '1.0',
            timestamp: expect.any(String),
            services: {
                database: dbStatus ? 'connected' : 'disconnected',
                kafka: kafkaStatus ? 'connected' : 'disconnected'
            }
        });
    } catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            version: '1.0',
            timestamp: expect.any(String),
            error: error.message
        });
    }
});

// Authentication endpoints
v1Router.post('/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email, and password are required' });
        }
        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters long' });
        }
        const result = await db.addUser(name, email, password);
        res.status(201).json({
            message: 'User registered successfully',
            userId: result.lastInsertRowid
        });
    } catch (error) {
        if (error.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ error: 'Email already exists' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});

v1Router.post('/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        const user = await db.authenticateUser(email, password);
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        const token = generateToken(user);
        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Protected endpoints
v1Router.post('/users', async (req, res) => {
    try {
        const { name, email } = req.body;
        if (!name || !email) {
            return res.status(400).json({ error: 'Name and email are required' });
        }
        const result = await db.addUser(name, email, 'default-password');
        res.status(201).json({
            message: 'User created successfully',
            userId: result.lastInsertRowid
        });
    } catch (error) {
        if (error.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ error: 'Email already exists' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});

v1Router.get('/users', (req, res) => {
    try {
        const users = db.getAllUsers();
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Mount v1.0 routes
app.use('/api/v1.0', v1Router);

// Version not found handler
app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({
            error: `API version ${req.apiVersion} not found`
        });
    }
    next();
});

describe('Server Endpoints', () => {
    describe('Health Check', () => {
        test('GET /api/v1.0/health should return healthy status when all services are up', async () => {
            const response = await request(app)
                .get('/api/v1.0/health');

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                status: 'healthy',
                version: '1.0',
                timestamp: expect.any(String),
                services: {
                    database: 'connected',
                    kafka: 'connected'
                }
            });
        });

        test('GET /api/v1.0/health should return unhealthy status when Kafka is down', async () => {
            kafka.checkConnection.mockRejectedValueOnce(new Error('Kafka connection failed'));

            const response = await request(app)
                .get('/api/v1.0/health');

            expect(response.status).toBe(503);
            expect(response.body).toEqual({
                status: 'unhealthy',
                version: '1.0',
                timestamp: expect.any(String),
                error: 'Kafka connection failed'
            });
        });
    });

    describe('Authentication', () => {
        test('POST /api/v1.0/auth/register should register a new user', async () => {
            const response = await request(app)
                .post('/api/v1.0/auth/register')
                .send({
                    name: 'Test User',
                    email: 'test@example.com',
                    password: 'password123'
                });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('message', 'User registered successfully');
            expect(response.body).toHaveProperty('userId');
        });

        test('POST /api/v1.0/auth/register should validate password length', async () => {
            const response = await request(app)
                .post('/api/v1.0/auth/register')
                .send({
                    name: 'Test User',
                    email: 'test@example.com',
                    password: 'short'
                });

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error', 'Password must be at least 8 characters long');
        });

        test('POST /api/v1.0/auth/login should authenticate user and return token', async () => {
            // First register a user
            await request(app)
                .post('/api/v1.0/auth/register')
                .send({
                    name: 'Test User',
                    email: 'test@example.com',
                    password: 'password123'
                });

            // Then try to login
            const response = await request(app)
                .post('/api/v1.0/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123'
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('token');
            expect(response.body).toHaveProperty('user');
            expect(response.body.user).toHaveProperty('email', 'test@example.com');
        });

        test('POST /api/v1.0/auth/login should reject invalid credentials', async () => {
            const response = await request(app)
                .post('/api/v1.0/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'wrongpassword'
                });

            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('error', 'Invalid email or password');
        });
    });

    describe('Protected Endpoints', () => {
        let authToken;

        beforeEach(async () => {
            // Register and login to get token
            await request(app)
                .post('/api/v1.0/auth/register')
                .send({
                    name: 'Test User',
                    email: 'test@example.com',
                    password: 'password123'
                });

            const loginResponse = await request(app)
                .post('/api/v1.0/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123'
                });

            authToken = loginResponse.body.token;
        });

        test('GET /api/v1.0/users should require authentication', async () => {
            const response = await request(app)
                .get('/api/v1.0/users');

            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('error', 'Authentication token required');
        });

        test('GET /api/v1.0/users should return users with valid token', async () => {
            const response = await request(app)
                .get('/api/v1.0/users')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });

        test('POST /api/v1.0/users should require authentication', async () => {
            const response = await request(app)
                .post('/api/v1.0/users')
                .send({
                    name: 'New User',
                    email: 'new@example.com'
                });

            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('error', 'Authentication token required');
        });

        test('POST /api/v1.0/users should create user with valid token', async () => {
            const response = await request(app)
                .post('/api/v1.0/users')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'New User',
                    email: 'new@example.com'
                });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('message', 'User created successfully');
            expect(response.body).toHaveProperty('userId');
        });
    });

    test('should return 404 for non-existent API version', async () => {
        const response = await request(app)
            .get('/api/v2.0/users')
            .set('x-api-version', '2.0');

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error', 'API version 2.0 not found');
    });
}); 