import fs from "fs"
import path from 'path'
import { Client } from "discord.js"
import { GameInstance } from "../types"

export function loadGames(bot: Client, gamesPath: string): GameInstance[] {
	const games: GameInstance[] = []
	const gamesFolders = fs.readdirSync(gamesPath)

	for (const folder of gamesFolders) {
		const commandsPath = path.join(gamesPath, folder)
		const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.ts'))

		for (const file of commandFiles) {
			if (file.includes("test") || file.includes("types.ts")) continue
			const filePath = path.join(commandsPath, file)
			const item = require(filePath)

			if (item.Game) {
				let nGame = new item.Game(bot)
				games.push(nGame)
			} else {
				// console.log(logDate(), "[Main]", "Couldn't load game function from", file)
			}
		}
	}
	return games
}
