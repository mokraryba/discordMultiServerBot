import { Client } from "discord.js"
import { SlotsGame } from "./types"
import GameChannel from "../../../database/models/GameChannel"

export class GameState {
	private games: SlotsGame[] = []
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
	}

	getGame(channelId: string, guildId: string): SlotsGame | undefined {
		return this.games.find(g => g.channelId === channelId && g.guildId === guildId)
	}

	createGame(channelId: string, guildId: string, userId: string): SlotsGame {
		const game: SlotsGame = {
			slots: [],
			channelId,
			guildId,
			messageId: "",
			user: userId,
			bet: 0,
			state: "Idle",
			occupiedUntil: 0
		}
		this.games.push(game)
		return game
	}

	updateGame(channelId: string, guildId: string, game: SlotsGame) {
		const index = this.games.findIndex(g => g.channelId === channelId && g.guildId === guildId)
		if (index !== -1) {
			this.games[index] = game
		}
	}

	removeGame(channelId: string, guildId: string) {
		const index = this.games.findIndex(g => g.channelId === channelId && g.guildId === guildId)
		if (index !== -1) {
			this.games.splice(index, 1)
		}
	}
}