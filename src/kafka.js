const { Kafka } = require('kafkajs');

// Create Kafka instance
const kafka = new Kafka({
    clientId: 'user-service',
    brokers: ['localhost:9092']
});

// Create producer
const producer = kafka.producer();

// Create consumer
const consumer = kafka.consumer({ groupId: 'user-service-group' });

// Function to start the producer
async function startProducer() {
    try {
        await producer.connect();
        console.log('Kafka producer connected');
    } catch (error) {
        console.error('Error connecting Kafka producer:', error);
    }
}

// Function to start the consumer
async function startConsumer() {
    try {
        await consumer.connect();
        await consumer.subscribe({ topic: 'user-events', fromBeginning: true });
        console.log('Kafka consumer connected');

        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                console.log({
                    topic,
                    partition,
                    value: message.value.toString(),
                });
            },
        });
    } catch (error) {
        console.error('Error connecting Kafka consumer:', error);
    }
}

// Function to check Kafka connection
async function checkConnection() {
    try {
        // Try to connect the producer
        await producer.connect();
        // Disconnect after successful connection check
        await producer.disconnect();
        return true;
    } catch (error) {
        console.error('Kafka connection check failed:', error);
        return false;
    }
}

// Function to send a message
async function sendMessage(topic, message) {
    try {
        await producer.connect();
        await producer.send({
            topic,
            messages: [
                { value: JSON.stringify(message) }
            ]
        });
        await producer.disconnect();
    } catch (error) {
        console.error('Error sending message to Kafka:', error);
        throw error;
    }
}

module.exports = {
    startProducer,
    startConsumer,
    sendMessage,
    checkConnection
}; 