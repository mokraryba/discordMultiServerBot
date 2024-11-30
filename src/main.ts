// Discord.js imports
import Discord, { ChannelType, GuildMember, PermissionFlagsBits, TextChannel } from "discord.js"
const { Client, Events, GatewayIntentBits } = Discord

// Local imports 
import { logDate, Log } from "./utils/utils"
import db from './database/database'
import { loadCommands } from "./handlers/commandHandler"
import { handleInteraction } from "./events/interactionCreate"
import { handleReady } from "./events/ready"
import { ensureUserExists } from "./services/userService"

// Node imports
import path from 'path'
import * as dotenv from 'dotenv'
import { deployCommands } from "./deployCommands"
import { initializeGames } from "./services/gameStore"

// Initialize
dotenv.config()
Log.initialize()

// Bot setup
const bot = new Discord.Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildMessageReactions,
		GatewayIntentBits.GuildMembers,
	]
})

// Path setup
const foldersPath = path.join(__dirname, 'bot/commands')
const gamesPath = path.join(__dirname, 'bot/games')

// Load commands and games
const commands = loadCommands(foldersPath)
initializeGames(bot, gamesPath)

// Database connection
db.then(() => console.log("Database connected")).catch(e => console.log(e))

// Event handlers
bot.on(Events.InteractionCreate, async interaction => {
	try {
		await handleInteraction(interaction, commands)
	} catch (err) {
		console.log("ERROR INTERACTION")
		console.error(err)
	}
})

bot.on("ready", async () => {
	await handleReady(bot, commands)
	// let guilds = await bot.guilds.cache
	// for (var guild of guilds.values()) {
	// 	deployCommands(guild.id)
	// }
})

bot.on('guildCreate', (guild) => {
	const channel = guild.channels.cache.find(channel =>
		channel.type === ChannelType.GuildText &&
		channel.permissionsFor(guild.members.me as GuildMember).has(PermissionFlagsBits.SendMessages)
	) as TextChannel

	if (channel) {
		channel.send("```ansi\nThank you for inviting me! You need to setup a few things before you can use me.\n\n```")
	}
	deployCommands(guild.id)
})

bot.on('guildMemberAdd', async (member) => {
	await ensureUserExists(member.guild.id, member.id, member.nickname || member.displayName)
})


// Start bot
try {
	console.log(logDate(), "logging in")
	bot.login(process.env.TOKEN)
	console.log(logDate(), "logged in")
} catch (err) {
	console.error(err)
}
