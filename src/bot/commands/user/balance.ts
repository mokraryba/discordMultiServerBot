import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, AutocompleteInteraction } from 'discord.js';
import moment from 'moment';
import fs from 'fs';
import DiscordUser from '../../../database/models/DiscordUser';
import { ensureUserExists } from '../../../services/userService';

export default {
	data: new SlashCommandBuilder()
		//.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers) // uncomment for this to be admin only
		.setName('balance')
		.setDescription('Check your balance'),

	async execute(interaction: ChatInputCommandInteraction) {
		const user = interaction.user;
		let userData = await ensureUserExists(interaction.guildId!, user.id, user.username);

		console.log(userData)

		await interaction.reply({ content: `Your balance: ${userData.balance}`, ephemeral: true });
	},

};