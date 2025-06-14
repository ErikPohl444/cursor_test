const { Kafka } = require('kafkajs');

class UserConsumer {
    constructor() {
        this.kafka = new Kafka({
            clientId: 'user-consumer',
            brokers: ['localhost:9092']
        });
        this.consumer = this.kafka.consumer({ groupId: 'user-consumer-group' });
    }

    async start() {
        try {
            await this.consumer.connect();
            await this.consumer.subscribe({ 
                topic: 'user-events', 
                fromBeginning: true 
            });

            console.log('User consumer connected and subscribed to user-events topic');

            await this.consumer.run({
                eachMessage: async ({ topic, partition, message }) => {
                    try {
                        const event = JSON.parse(message.value.toString());
                        
                        // Only process USER_CREATED events
                        if (event.type === 'USER_CREATED') {
                            this.handleUserCreated(event);
                        }
                    } catch (error) {
                        console.error('Error processing message:', error);
                    }
                },
            });
        } catch (error) {
            console.error('Error starting user consumer:', error);
            throw error;
        }
    }

    handleUserCreated(event) {
        console.log('\n=== New User Created ===');
        console.log('User ID:', event.userId);
        console.log('Name:', event.name);
        console.log('Email:', event.email);
        console.log('Created at:', event.timestamp);
        console.log('========================\n');
    }

    async stop() {
        try {
            await this.consumer.disconnect();
            console.log('User consumer disconnected');
        } catch (error) {
            console.error('Error stopping user consumer:', error);
            throw error;
        }
    }
}

module.exports = UserConsumer; 