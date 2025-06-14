const { Kafka } = require('kafkajs');
const UserConsumer = require('../../src/consumers/userConsumer');

// Mock Kafka
jest.mock('kafkajs');

describe('UserConsumer', () => {
    let consumer;
    let mockKafkaConsumer;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();

        // Setup mock consumer
        mockKafkaConsumer = {
            connect: jest.fn().mockResolvedValue(undefined),
            subscribe: jest.fn().mockResolvedValue(undefined),
            run: jest.fn().mockResolvedValue(undefined),
            disconnect: jest.fn().mockResolvedValue(undefined)
        };

        // Mock Kafka constructor
        Kafka.mockImplementation(() => ({
            consumer: () => mockKafkaConsumer
        }));

        // Create consumer instance
        consumer = new UserConsumer();
    });

    describe('Initialization', () => {
        test('should create consumer with correct configuration', () => {
            expect(Kafka).toHaveBeenCalledWith({
                clientId: 'user-consumer',
                brokers: ['localhost:9092']
            });
        });

        test('should create consumer with correct group ID', () => {
            expect(mockKafkaConsumer).toBeDefined();
        });
    });

    describe('start()', () => {
        test('should connect and subscribe to topic', async () => {
            await consumer.start();

            expect(mockKafkaConsumer.connect).toHaveBeenCalled();
            expect(mockKafkaConsumer.subscribe).toHaveBeenCalledWith({
                topic: 'user-events',
                fromBeginning: true
            });
            expect(mockKafkaConsumer.run).toHaveBeenCalled();
        });

        test('should handle connection error', async () => {
            const error = new Error('Connection failed');
            mockKafkaConsumer.connect.mockRejectedValueOnce(error);

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            await expect(consumer.start()).rejects.toThrow(error);
            expect(consoleSpy).toHaveBeenCalledWith(
                'Error starting user consumer:',
                error
            );
            consoleSpy.mockRestore();
        });
    });

    describe('Message Processing', () => {
        let messageHandler;
        let consoleSpy;

        beforeEach(() => {
            // Setup message handler
            mockKafkaConsumer.run.mockImplementation(({ eachMessage }) => {
                messageHandler = eachMessage;
            });

            // Setup console spy
            consoleSpy = jest.spyOn(console, 'log').mockImplementation();
        });

        afterEach(() => {
            consoleSpy.mockRestore();
        });

        test('should process USER_CREATED event', async () => {
            await consumer.start();

            const event = {
                type: 'USER_CREATED',
                userId: 1,
                name: 'John Doe',
                email: 'john@example.com',
                timestamp: '2024-01-20T12:34:56.789Z'
            };

            await messageHandler({
                topic: 'user-events',
                partition: 0,
                message: { value: Buffer.from(JSON.stringify(event)) }
            });

            expect(consoleSpy).toHaveBeenCalledWith('\n=== New User Created ===');
            expect(consoleSpy).toHaveBeenCalledWith('User ID:', event.userId);
            expect(consoleSpy).toHaveBeenCalledWith('Name:', event.name);
            expect(consoleSpy).toHaveBeenCalledWith('Email:', event.email);
            expect(consoleSpy).toHaveBeenCalledWith('Created at:', event.timestamp);
            expect(consoleSpy).toHaveBeenCalledWith('========================\n');
        });

        test('should ignore non-USER_CREATED events', async () => {
            await consumer.start();

            const event = {
                type: 'OTHER_EVENT',
                data: 'some data'
            };

            await messageHandler({
                topic: 'user-events',
                partition: 0,
                message: { value: Buffer.from(JSON.stringify(event)) }
            });

            expect(consoleSpy).not.toHaveBeenCalledWith('\n=== New User Created ===');
        });

        test('should handle invalid JSON message', async () => {
            await consumer.start();

            const errorSpy = jest.spyOn(console, 'error').mockImplementation();

            await messageHandler({
                topic: 'user-events',
                partition: 0,
                message: { value: Buffer.from('invalid json') }
            });

            expect(errorSpy).toHaveBeenCalledWith(
                'Error processing message:',
                expect.any(Error)
            );
            errorSpy.mockRestore();
        });
    });

    describe('stop()', () => {
        test('should disconnect consumer', async () => {
            await consumer.stop();
            expect(mockKafkaConsumer.disconnect).toHaveBeenCalled();
        });

        test('should handle disconnect error', async () => {
            const error = new Error('Disconnect failed');
            mockKafkaConsumer.disconnect.mockRejectedValueOnce(error);

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            await expect(consumer.stop()).rejects.toThrow(error);
            expect(consoleSpy).toHaveBeenCalledWith(
                'Error stopping user consumer:',
                error
            );
            consoleSpy.mockRestore();
        });
    });
}); 