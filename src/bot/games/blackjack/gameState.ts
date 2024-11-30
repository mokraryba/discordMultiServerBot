import { BlackjackGame } from './types'
import { DECK } from './constants'
import { shuffle } from '../../../utils/utils'
import GameChannel from '../../../database/models/GameChannel'
import { Client, TextChannel } from 'discord.js'

export class GameState {
	private games: BlackjackGame[] = []
	private bot: Client

	constructor(bot: Client) {
		this.bot = bot
	}

	async restart(channelId: string, guildId: string) {
		await GameChannel.findOneAndUpdate(
			{ channelId, guildId },
			{ $set: { occupied: false, occupiedId: "", wager: 0, time: 0 } }
		)

		this.games = this.games.filter(g => g.channelId != channelId && g.guildId != guildId)

		const guild = await this.bot.guilds.fetch(guildId)
		const channel = await guild.channels.fetch(channelId) as TextChannel
		const messages = await channel.messages.fetch({ limit: 100 })

		// for (const message of messages.values()) {
		// 	if (message.author.id == this.bot.user?.id) {
		// 		await message.delete()
		// 	}
		// }

	}

	getGame(channelId: string, guildId: string): BlackjackGame | undefined {
		return this.games.find(g => g.channelId === channelId && g.guildId === guildId)
	}

	createGame(channelId: string, guildId: string, userId: string): BlackjackGame {
		const game: BlackjackGame = {
			deck: shuffle([...DECK]),
			channelId,
			guildId,
			messageId: "",
			user: userId,
			wager: 0,
			dealerHand: [],
			playerHand: [],
			playerValue: 0,
			dealerValue: 0,
			state: "Occupied",
			occupiedUntil: Date.now() + (1000 * 60 * 5)
		}
		this.games.push(game)
		return game
	}

	updateGame(game: BlackjackGame) {
		const index = this.games.findIndex(g => g.channelId === game.channelId && g.guildId === game.guildId)
		if (index !== -1) {
			this.games[index] = game
		}
	}

	removeGame(channelId: string, guildId: string) {
		this.games = this.games.filter(g =>
			g.channelId !== channelId && g.guildId !== guildId
		)
	}
}
