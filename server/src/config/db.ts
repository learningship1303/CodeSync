import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI || '');
        console.log(`🚀 CodeSync Database Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ Database Connection Error: ${(error as Error).message}`);
        process.exit(1); // Stop server if DB layer connection crashes
    }
};