import { REST, Routes } from 'discord.js'
import fs from 'node:fs'
import path from 'node:path'
import * as dotenv from 'dotenv'
dotenv.config()

const commands: any[] = [];
// Grab all the command files from the commands directory you created earlier
const foldersPath = path.join(__dirname, 'bot/commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	// Grab all the command files from the commands directory you created earlier
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.ts'));
	// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		let command = require(filePath);
		command = command.default

		if (command.data && command.execute) {
			// if ('data' in command && 'execute' in command) {
			commands.push(command.data.toJSON());
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(process.env.TOKEN as string);

// and deploy your commands!
export const deployCommands = async (guildId: string | null) => {
	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`);

		// The put method is used to fully refresh all commands in the guild with the current set
		const data = await rest.put(
			Routes.applicationGuildCommands(process.env.CLIENT_ID as string, guildId ? guildId : process.env.GUILD_ID as string),
			{ body: commands },
		) as unknown[]

		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	} catch (error) {
		// And of course, make sure you catch and log any errors!
		console.error(error);
	}
}
deployCommands(null)