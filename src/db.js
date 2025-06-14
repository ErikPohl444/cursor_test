const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

// Create a database connection
const db = new Database(path.join(__dirname, '../data/database.sqlite'), { verbose: console.log });

// Initialize the database with a sample table
function initializeDatabase() {
    // Create a users table with password field
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
}

// Example functions for database operations
const dbOperations = {
    // Add a new user
    addUser: async (name, email, password) => {
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const stmt = db.prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)');
        return stmt.run(name, email, hashedPassword);
    },

    // Get all users
    getAllUsers: () => {
        const stmt = db.prepare('SELECT id, name, email, created_at FROM users');
        return stmt.all();
    },

    // Get user by email
    getUserByEmail: (email) => {
        const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
        return stmt.get(email);
    },

    // Authenticate user
    authenticateUser: async (email, password) => {
        const user = dbOperations.getUserByEmail(email);
        if (!user) {
            return null;
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return null;
        }

        // Return user without password
        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
    },

    // Check database connection
    checkConnection: () => {
        try {
            // Try to execute a simple query
            db.prepare('SELECT 1').get();
            return true;
        } catch (error) {
            console.error('Database connection check failed:', error);
            return false;
        }
    }
};

// Initialize the database when this module is loaded
initializeDatabase();

module.exports = dbOperations; 