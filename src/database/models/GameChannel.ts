import { randomUUID } from 'crypto';
import mongoose from 'mongoose';

export interface IGameChannel extends mongoose.Document {
	customId: string;
	created: string;
	guildId: string;
	channelId: string;
	gameName: string;
	occupied: boolean;
	occupiedId: string;
	wager: number;
	time: number;
	custom?: Record<string, any>;
}

const GameChannelSchema = new mongoose.Schema({
	customId: { type: String, default: randomUUID },
	created: { type: String, default: Date.now },
	guildId: { type: String, required: true },
	channelId: { type: String, required: true },
	gameName: { type: String, required: true },

	occupied: { type: Boolean, default: false },
	occupiedId: { type: String, default: "" },
	wager: { type: Number, default: 0 },
	time: { type: Number, default: 0 },
	custom: { type: Object, required: false }
});

export default mongoose.model<IGameChannel>('GameChannel', GameChannelSchema);
