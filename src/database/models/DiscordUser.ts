import mongoose from 'mongoose';

export interface IDiscordUser extends mongoose.Document {
	guildId: string;
	discordId: string;
	discordName: string;
	created: Date;
	balance: number;
}

const DiscordUserSchema = new mongoose.Schema({
	guildId: { type: String, required: true },
	discordId: { type: String, required: false },
	discordName: { type: String, required: true },
	created: { type: Date, default: Date.now },
	balance: { type: Number, default: 0, required: true },
});

export default mongoose.model<IDiscordUser>('DiscordUser', DiscordUserSchema);
