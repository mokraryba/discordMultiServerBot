import { Interaction, GuildMember, PermissionFlagsBits } from "discord.js"
import { Command, GameInstance } from "../types"
import GuildSettings from "../database/models/GuildSettings"
import { Log } from "../utils/utils"
import { games } from "../services/gameStore"

export async function handleInteraction(interaction: Interaction, commands: Command[]) {
	for (var game of games) {
		if (!game.enabled) continue
		await game.interactionCreate(interaction)
	}

	for (var com of commands) {
		let cmd = com.command
		if (cmd.interactionCreate) {
			await cmd.interactionCreate(interaction)
		}
	}

	if (!interaction.isChatInputCommand()) return

	const command = commands.find(c => c.name == interaction.commandName)
	if (!command) return

	try {
		let isGuildRegistered = await GuildSettings.findOne({ guildId: interaction.guildId, validUntil: { $gte: new Date() } })
		if (command.name != "registerbot") {
			if (!isGuildRegistered) {
				return await interaction.reply({ content: "This server is not registered in the database. Please contact the server owner to register this server.", ephemeral: true })
			}
			if (command.command.commandType == "admin") {
				let member = interaction.member! as GuildMember
				if (!member.roles.cache.find(c => isGuildRegistered!.adminRoles.includes(c.id)) && !member.permissions.has(PermissionFlagsBits.BanMembers)) {
					return await interaction.reply({ content: "You do not have permission to use this command.", ephemeral: true })
				}
			}
		}
		Log.command(interaction.guildId!, interaction.user, command.name, [...interaction.options.data])
		await command.command.execute(interaction)
	} catch (error) {
		console.error(error)
		const response = { content: 'There was an error while executing this command!', ephemeral: true }
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp(response)
		} else {
			await interaction.reply(response)
		}
	}
}
