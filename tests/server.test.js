const request = require('supertest');
const express = require('express');
const db = require('../src/db');

// Create a test Express app
const app = express();
app.use(express.json());

// Add the routes to the test app
app.post('/users', (req, res) => {
    try {
        const { name, email } = req.body;
        if (!name || !email) {
            return res.status(400).json({ error: 'Name and email are required' });
        }
        const result = db.addUser(name, email);
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

app.get('/users', (req, res) => {
    try {
        const users = db.getAllUsers();
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

describe('Server Endpoints', () => {
    test('POST /users should create a new user', async () => {
        const response = await request(app)
            .post('/users')
            .send({
                name: 'Test User',
                email: 'test@example.com'
            });

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('message', 'User created successfully');
        expect(response.body).toHaveProperty('userId');
    });

    test('POST /users should validate required fields', async () => {
        const response = await request(app)
            .post('/users')
            .send({
                name: 'Test User'
                // email is missing
            });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'Name and email are required');
    });

    test('GET /users should return all users', async () => {
        const response = await request(app)
            .get('/users');

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
    });
}); 