const db = require('../src/db');

describe('Database Operations', () => {
    const testUser = {
        name: 'Test User',
        email: 'test@example.com'
    };

    test('should add a new user', () => {
        const result = db.addUser(testUser.name, testUser.email);
        expect(result.changes).toBe(1);
    });

    test('should get user by email', () => {
        const user = db.getUserByEmail(testUser.email);
        expect(user).toBeDefined();
        expect(user.name).toBe(testUser.name);
        expect(user.email).toBe(testUser.email);
    });

    test('should get all users', () => {
        const users = db.getAllUsers();
        expect(Array.isArray(users)).toBe(true);
        expect(users.length).toBeGreaterThan(0);
    });
}); 