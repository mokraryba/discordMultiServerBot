import fs from "fs"
import path from 'path'
import { Command } from "../types"

export function loadCommands(foldersPath: string): Command[] {
	const commands: Command[] = []
	const commandFolders = fs.readdirSync(foldersPath)

	for (const folder of commandFolders) {
		const commandsPath = path.join(foldersPath, folder)
		const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.ts'))

		for (const file of commandFiles) {
			const filePath = path.join(commandsPath, file)
			const commandModule = require(filePath)
			// Handle Getter case
			const command = commandModule?.default?.__esModule ? commandModule.default.get() : commandModule.default

			if (command && 'data' in command && 'execute' in command) {
				const normalizedPath = filePath.replaceAll("\\", "/")
				const splitted = normalizedPath.split("/")
				const commandType = splitted[splitted.length - 2] == "admin" ? "admin" : splitted[splitted.length - 2] == "user" ? "user" : "unknown"
				command.commandType = commandType
				commands.push({ name: command.data.name, command })
			}
		}
	}
	return commands
}
