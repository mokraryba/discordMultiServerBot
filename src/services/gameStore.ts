import { Client } from "discord.js"
import { loadGames } from "../handlers/gameHandler"

export let games: any[] = []

export function initializeGames(bot: Client, gamesPath: string) {
	games = loadGames(bot, gamesPath)
}
