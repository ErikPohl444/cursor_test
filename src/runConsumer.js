const UserConsumer = require('./consumers/userConsumer');

async function main() {
    const consumer = new UserConsumer();

    // Handle graceful shutdown
    const shutdown = async () => {
        console.log('\nShutting down consumer...');
        await consumer.stop();
        process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

    try {
        await consumer.start();
        console.log('Consumer is running. Press Ctrl+C to stop.');
    } catch (error) {
        console.error('Failed to start consumer:', error);
        process.exit(1);
    }
}

main(); 