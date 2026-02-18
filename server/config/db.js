const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.DATABASE_URL || 'mongodb://localhost:27017/quickbite', {
            serverSelectionTimeoutMS: 5000
        });

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ MongoDB Connection Error: ${error.message}`);
        if (error.reason) console.error('   Reason:', error.reason);
        process.exit(1);
    }
};

module.exports = connectDB;
