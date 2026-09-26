const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const uri = process.env.MONGODB_URI || process.env.MONGO_DB;
        if (!uri) {
            throw new Error("MongoDB connection URI is missing in .env");
        }
        await mongoose.connect(uri);
        console.log("Connected to MongoDB successfully");
    } catch (error) {
        console.error('Error in MongoDB connection:', error.message);
    }
};

module.exports = connectDB;