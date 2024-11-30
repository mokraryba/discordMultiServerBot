import DiscordUser from '../database/models/DiscordUser'

export async function ensureUserExists(guildId: string, userId: string, discordName: string) {
	const existingUser = await DiscordUser.findOne({ guildId, discordId: userId })
	if (!existingUser) {
		return await DiscordUser.create({
			guildId,
			discordId: userId,
			discordName,
			balance: 0
		})
	}
	return existingUser
}
