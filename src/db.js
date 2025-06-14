const Database = require('better-sqlite3');
const path = require('path');

// Create a database connection
const db = new Database(path.join(__dirname, '../data/database.sqlite'), { verbose: console.log });

// Initialize the database with a sample table
function initializeDatabase() {
    // Create a users table
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
}

// Example functions for database operations
const dbOperations = {
    // Add a new user
    addUser: (name, email) => {
        const stmt = db.prepare('INSERT INTO users (name, email) VALUES (?, ?)');
        return stmt.run(name, email);
    },

    // Get all users
    getAllUsers: () => {
        const stmt = db.prepare('SELECT * FROM users');
        return stmt.all();
    },

    // Get user by email
    getUserByEmail: (email) => {
        const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
        return stmt.get(email);
    }
};

// Initialize the database when this module is loaded
initializeDatabase();

module.exports = dbOperations; 