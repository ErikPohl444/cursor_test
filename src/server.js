const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const healthRoutes = require('./routes/healthRoutes');
const db = require('./db');
const kafka = require('./kafka');
const { authenticateToken, generateToken } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Swagger documentation route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// API versioning middleware
app.use((req, res, next) => {
    // Default to v1.0 if no version specified
    req.apiVersion = req.headers['x-api-version'] || '1.0';
    next();
});

// API v1.0 routes
const v1Router = express.Router();

// Health check endpoint (public)
v1Router.get('/health', async (req, res) => {
    try {
        // Check database connection
        const dbStatus = db.checkConnection();
        
        // Check Kafka connection
        const kafkaStatus = await kafka.checkConnection();
        
        res.json({
            status: 'healthy',
            version: '1.0',
            timestamp: new Date().toISOString(),
            services: {
                database: dbStatus ? 'connected' : 'disconnected',
                kafka: kafkaStatus ? 'connected' : 'disconnected'
            }
        });
    } catch (error) {
        console.error('Health check failed:', error);
        res.status(503).json({
            status: 'unhealthy',
            version: '1.0',
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});

// Authentication endpoints (public)
v1Router.post('/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validate required fields
        if (!name || !email || !password) {
            return res.status(400).json({
                error: 'Name, email, and password are required'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                error: 'Invalid email format'
            });
        }

        // Validate password strength
        if (password.length < 8) {
            return res.status(400).json({
                error: 'Password must be at least 8 characters long'
            });
        }

        // Add user to database
        const result = await db.addUser(name, email, password);

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
            message: 'User registered successfully',
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
        console.error('Error registering user:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
});

v1Router.post('/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({
                error: 'Email and password are required'
            });
        }

        // Authenticate user
        const user = await db.authenticateUser(email, password);
        if (!user) {
            return res.status(401).json({
                error: 'Invalid email or password'
            });
        }

        // Generate JWT token
        const token = generateToken(user);

        // Return token
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
        console.error('Error logging in:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
});

// Protected endpoints
v1Router.post('/users', authenticateToken, async (req, res) => {
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
        const result = await db.addUser(name, email, 'default-password'); // In a real app, you'd want to handle this differently

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

v1Router.get('/users', authenticateToken, (req, res) => {
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

// Mount v1.0 routes
app.use('/api/v1.0', v1Router);

// Routes
app.use('/api/v1.0/users', userRoutes);
app.use('/api/v1.0/auth', authRoutes);
app.use('/api/v1.0/health', healthRoutes);

// Version not found handler
app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({
            error: `API version ${req.apiVersion} not found`
        });
    }
    next();
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start the server
app.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}`);
    await initializeKafka();
    console.log(`API Documentation available at http://localhost:${PORT}/api-docs`);
});

// Initialize Kafka
async function initializeKafka() {
    await kafka.startProducer();
    await kafka.startConsumer();
} 