import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!

export default mongoose.connect(MONGODB_URI, {})
	.then(() => console.log('MongoDB connected successfully'))
	.catch((error) => {
		console.error('MongoDB connection error:', error);
		process.exit(1);
	});
