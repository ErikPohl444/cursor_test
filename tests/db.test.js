const db = require('../src/db');
const path = require('path');
const fs = require('fs');

describe('Database Operations', () => {
    const testDbPath = path.join(__dirname, '../data/test-database.sqlite');

    beforeEach(() => {
        // Ensure test database is removed before each test
        if (fs.existsSync(testDbPath)) {
            fs.unlinkSync(testDbPath);
        }
    });

    afterEach(() => {
        // Clean up test database after each test
        if (fs.existsSync(testDbPath)) {
            fs.unlinkSync(testDbPath);
        }
    });

    describe('User Operations', () => {
        test('should add a new user', () => {
            const result = db.addUser('Test User', 'test@example.com');
            expect(result.changes).toBe(1);
            expect(result.lastInsertRowid).toBeDefined();
        });

        test('should not add user with duplicate email', () => {
            // Add first user
            db.addUser('Test User 1', 'test@example.com');

            // Try to add second user with same email
            expect(() => {
                db.addUser('Test User 2', 'test@example.com');
            }).toThrow();
        });

        test('should get all users', () => {
            // Add test users
            db.addUser('User 1', 'user1@example.com');
            db.addUser('User 2', 'user2@example.com');

            const users = db.getAllUsers();
            expect(Array.isArray(users)).toBe(true);
            expect(users.length).toBe(2);
            expect(users[0]).toHaveProperty('name', 'User 1');
            expect(users[1]).toHaveProperty('name', 'User 2');
        });

        test('should get user by email', () => {
            // Add test user
            db.addUser('Test User', 'test@example.com');

            const user = db.getUserByEmail('test@example.com');
            expect(user).toBeDefined();
            expect(user.name).toBe('Test User');
            expect(user.email).toBe('test@example.com');
        });

        test('should return undefined for non-existent email', () => {
            const user = db.getUserByEmail('nonexistent@example.com');
            expect(user).toBeUndefined();
        });
    });

    describe('Database Schema', () => {
        test('should create users table with correct schema', () => {
            // The table should be created when we first use the database
            db.addUser('Test User', 'test@example.com');

            const users = db.getAllUsers();
            expect(users[0]).toHaveProperty('id');
            expect(users[0]).toHaveProperty('name');
            expect(users[0]).toHaveProperty('email');
            expect(users[0]).toHaveProperty('created_at');
        });
    });
}); 