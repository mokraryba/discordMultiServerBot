import { Client } from "discord.js"
import { GameInstance, Command } from "../types"
import { logDate } from "../utils/utils"
import { ensureUserExists } from "../services/userService"
import { games } from "../services/gameStore"

export async function handleReady(bot: Client, commands: Command[]) {
	// Initialize users for all guilds
	for (const guild of bot.guilds.cache.values()) {
		const members = await guild.members.fetch()
		for (const member of members.values()) {
			await ensureUserExists(guild.id, member.id, member.nickname || member.displayName)
		}
	}

	// Initialize games
	console.log("\n[----==== Games ====----]")
	for (var game of games) {
		try {
			if (!game.enabled) continue
			game.build()
			console.log(`[${game.gameName}] started`)
		} catch (err) {
			console.log(`[${game.gameName}] error during startup`)
			console.error(err)
		}
	}

	// Log available commands
	console.log(`\nAdmin commands: /${commands.filter(d => d.command.commandType == "admin").map(d => d.command.data.name).join(", /")}`)
	console.log(`User commands: /${commands.filter(d => d.command.commandType == "user").map(d => d.command.data.name).join(", /")}\n`)

	if (bot?.user) {
		bot.user.setStatus('dnd')
		console.log(logDate(), `${bot.user.username} is online!`)
	}
}
