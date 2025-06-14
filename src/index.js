const db = require('./db');

// Example usage of database operations
async function main() {
    try {
        // Add a new user
        const newUser = db.addUser('John Doe', 'john@example.com');
        console.log('Added new user:', newUser);

        // Get all users
        const allUsers = db.getAllUsers();
        console.log('All users:', allUsers);

        // Get user by email
        const user = db.getUserByEmail('john@example.com');
        console.log('Found user:', user);
    } catch (error) {
        console.error('Error:', error.message);
    }
}

main(); 