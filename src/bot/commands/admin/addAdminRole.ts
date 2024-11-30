import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, AutocompleteInteraction } from 'discord.js';
import moment from 'moment';
import fs from 'fs';
import GuildSettings from '../../../database/models/GuildSettings';

export default {
	data: new SlashCommandBuilder()
		//.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers) // uncomment for this to be admin only
		.setName('addadminrole')
		.addRoleOption(opt =>
			opt.setName("role")
				.setDescription("Select an admin role")
				.setRequired(true)
		)
		.setDescription('Add new admin role'),

	async execute(interaction: ChatInputCommandInteraction) {
		let foundServer = await GuildSettings.findOne({ guildId: interaction.guildId });
		if (!foundServer) {
			return await interaction.reply({ content: "This server is not registered in the database", ephemeral: true });
		}
		if (foundServer.validUntil! <= new Date()) return await interaction.reply({ content: "This server is not registered in the database", ephemeral: true });


		if (!foundServer.adminRoles.includes(interaction.options.getRole("role")!.id)) {
			foundServer.adminRoles.push(interaction.options.getRole("role")!.id);
			await foundServer.save();
			return await interaction.reply({ content: 'Role added', ephemeral: true });
		}
		await interaction.reply({ content: "This role already exists", ephemeral: true })

	},

	// autocomplete: async (interaction: AutocompleteInteraction) => {
	//	const focusedOption = interaction.options.getFocused(true);
	//	let { name, value } = focusedOption; // name - command name, value - command value

	//	let arr: string[] = [];

	//	return await interaction.respond(
	//		arr.map(choice => ({ name: choice, value: choice })),
	//	);
	// }
};