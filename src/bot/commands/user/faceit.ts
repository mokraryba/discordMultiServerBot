import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, AutocompleteInteraction } from 'discord.js';
import moment from 'moment';
import fs from 'fs';

export default {
	data: new SlashCommandBuilder()
		//.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers) // uncomment for this to be admin only
		.setName('faceit')
		.addStringOption(opt => opt.setName("nick").setDescription("Faceit username").setRequired(true))
		.setDescription('Check faceit stats'),

	async execute(interaction: ChatInputCommandInteraction) {
		let nick = interaction.options.getString("nick")!
		let gdata = await fetch("https://www.faceit.com/api/users/v1/nicknames/" + nick.trim())
		let data = await gdata.json()
		let elo = data?.payload?.games?.cs2?.faceit_elo
		if (!elo) return await interaction.reply({ content: `User ${nick} not found`, ephemeral: true });

		await interaction.reply({ content: `User ${nick} has ${elo} elo`, ephemeral: true });
	},
};