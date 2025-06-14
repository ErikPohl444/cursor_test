const { Kafka } = require('kafkajs');
const kafka = require('../src/kafka');

// Mock Kafka
jest.mock('kafkajs');

describe('Kafka Operations', () => {
    let mockProducer;
    let mockConsumer;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();

        // Setup mock producer
        mockProducer = {
            connect: jest.fn().mockResolvedValue(undefined),
            send: jest.fn().mockResolvedValue(undefined)
        };

        // Setup mock consumer
        mockConsumer = {
            connect: jest.fn().mockResolvedValue(undefined),
            subscribe: jest.fn().mockResolvedValue(undefined),
            run: jest.fn().mockResolvedValue(undefined)
        };

        // Mock Kafka constructor
        Kafka.mockImplementation(() => ({
            producer: () => mockProducer,
            consumer: () => mockConsumer
        }));
    });

    describe('Producer', () => {
        test('should connect producer successfully', async () => {
            await kafka.startProducer();
            expect(mockProducer.connect).toHaveBeenCalled();
        });

        test('should handle producer connection error', async () => {
            const error = new Error('Connection failed');
            mockProducer.connect.mockRejectedValueOnce(error);

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            await kafka.startProducer();

            expect(consoleSpy).toHaveBeenCalledWith(
                'Error connecting Kafka producer:',
                error
            );
            consoleSpy.mockRestore();
        });

        test('should send message successfully', async () => {
            const topic = 'test-topic';
            const message = { test: 'data' };

            await kafka.sendMessage(topic, message);

            expect(mockProducer.send).toHaveBeenCalledWith({
                topic,
                messages: [{ value: JSON.stringify(message) }]
            });
        });

        test('should handle message sending error', async () => {
            const error = new Error('Send failed');
            mockProducer.send.mockRejectedValueOnce(error);

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            await expect(kafka.sendMessage('test-topic', {})).rejects.toThrow(error);
            expect(consoleSpy).toHaveBeenCalledWith('Error sending message:', error);
            consoleSpy.mockRestore();
        });
    });

    describe('Consumer', () => {
        test('should connect consumer successfully', async () => {
            await kafka.startConsumer();
            expect(mockConsumer.connect).toHaveBeenCalled();
            expect(mockConsumer.subscribe).toHaveBeenCalledWith({
                topic: 'user-events',
                fromBeginning: true
            });
            expect(mockConsumer.run).toHaveBeenCalled();
        });

        test('should handle consumer connection error', async () => {
            const error = new Error('Connection failed');
            mockConsumer.connect.mockRejectedValueOnce(error);

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            await kafka.startConsumer();

            expect(consoleSpy).toHaveBeenCalledWith(
                'Error connecting Kafka consumer:',
                error
            );
            consoleSpy.mockRestore();
        });

        test('should process messages correctly', async () => {
            const messageHandler = jest.fn();
            mockConsumer.run.mockImplementation(({ eachMessage }) => {
                return eachMessage({
                    topic: 'test-topic',
                    partition: 0,
                    message: { value: Buffer.from(JSON.stringify({ test: 'data' })) }
                });
            });

            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            await kafka.startConsumer();

            expect(consoleSpy).toHaveBeenCalledWith({
                topic: 'test-topic',
                partition: 0,
                value: '{"test":"data"}'
            });
            consoleSpy.mockRestore();
        });
    });
}); 