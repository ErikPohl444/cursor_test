const { Kafka } = require('kafkajs');

// Event type constants
const EVENT_TYPES = {
    USER_CREATED: 'USER_CREATED'
};

class UserConsumer {
    constructor(config = {}) {
        this.config = {
            clientId: 'user-consumer',
            brokers: ['localhost:9092'],
            groupId: 'user-consumer-group',
            topic: 'user-events',
            ...config
        };
        
        this.kafka = new Kafka({
            clientId: this.config.clientId,
            brokers: this.config.brokers
        });
        this.consumer = this.kafka.consumer({ groupId: this.config.groupId });
        this.isRunning = false;
    }

    async start() {
        if (this.isRunning) {
            console.log('User consumer is already running');
            return;
        }

        try {
            await this.consumer.connect();
            await this.consumer.subscribe({ 
                topic: this.config.topic, 
                fromBeginning: true 
            });

            console.log(`User consumer connected and subscribed to ${this.config.topic} topic`);

            await this.consumer.run({
                eachMessage: this.handleMessage.bind(this),
            });

            this.isRunning = true;
        } catch (error) {
            console.error('Error starting user consumer:', error);
            throw error;
        }
    }

    async handleMessage({ topic, partition, message }) {
        try {
            const event = this.parseMessage(message);
            if (!event) return;

            await this.processEvent(event);
        } catch (error) {
            console.error('Error processing message:', error);
            // In a production environment, you might want to send to a dead letter queue
        }
    }

    parseMessage(message) {
        try {
            return JSON.parse(message.value.toString());
        } catch (error) {
            console.error('Error parsing message:', error);
            return null;
        }
    }

    async processEvent(event) {
        switch (event.type) {
            case EVENT_TYPES.USER_CREATED:
                await this.handleUserCreated(event);
                break;
            default:
                console.log(`Unhandled event type: ${event.type}`);
        }
    }

    async handleUserCreated(event) {
        console.log('\n=== New User Created ===');
        console.log('User ID:', event.userId);
        console.log('Name:', event.name);
        console.log('Email:', event.email);
        console.log('Created at:', event.timestamp);
        console.log('========================\n');
    }

    async stop() {
        if (!this.isRunning) {
            console.log('User consumer is not running');
            return;
        }

        try {
            await this.consumer.disconnect();
            this.isRunning = false;
            console.log('User consumer disconnected');
        } catch (error) {
            console.error('Error stopping user consumer:', error);
            throw error;
        }
    }

    getStatus() {
        return {
            isRunning: this.isRunning,
            config: this.config
        };
    }
}

module.exports = UserConsumer; 