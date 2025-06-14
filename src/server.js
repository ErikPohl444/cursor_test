const express = require('express');
const db = require('./db');
const kafka = require('./kafka');

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Initialize Kafka
async function initializeKafka() {
    await kafka.startProducer();
    await kafka.startConsumer();
}

// POST endpoint to add a new user
app.post('/users', async (req, res) => {
    try {
        const { name, email } = req.body;

        // Validate required fields
        if (!name || !email) {
            return res.status(400).json({
                error: 'Name and email are required'
            });
        }

        // Validate email format (basic validation)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                error: 'Invalid email format'
            });
        }

        // Add user to database
        const result = db.addUser(name, email);

        // Send user creation event to Kafka
        await kafka.sendMessage('user-events', {
            type: 'USER_CREATED',
            userId: result.lastInsertRowid,
            name,
            email,
            timestamp: new Date().toISOString()
        });

        // Return success response
        res.status(201).json({
            message: 'User created successfully',
            userId: result.lastInsertRowid
        });
    } catch (error) {
        // Handle duplicate email error
        if (error.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({
                error: 'Email already exists'
            });
        }

        // Handle other errors
        console.error('Error creating user:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
});

// GET endpoint to retrieve all users
app.get('/users', (req, res) => {
    try {
        const users = db.getAllUsers();
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
});

// Start the server
app.listen(port, async () => {
    console.log(`Server is running on http://localhost:${port}`);
    await initializeKafka();
}); 