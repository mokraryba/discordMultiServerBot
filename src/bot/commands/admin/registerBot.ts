import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, AutocompleteInteraction } from 'discord.js';
import moment from 'moment';
import fs from 'fs';
import GuildSettings from '../../../database/models/GuildSettings';
import { randomUUID } from 'crypto';

export default {
	data: new SlashCommandBuilder()
		.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers) // uncomment for this to be admin only
		.setName('registerbot')
		.addRoleOption(opt =>
			opt.setName("role")
				.setDescription("Specify admin/mod role")
				.setRequired(true)
		)
		.setDescription('Register your bot'),

	async execute(interaction: ChatInputCommandInteraction) {

		const role = interaction.options.getRole("role")!

		let isFound = await GuildSettings.findOne({ guildId: interaction.guildId });
		if (isFound) {
			if (isFound.validUntil! < new Date()) {
				await GuildSettings.updateOne({ guildId: interaction.guildId }, { validUntil: moment().add(1, 'months').toDate() })
			} else {
				return await interaction.reply({ content: `This server is already registered in the database. It is valid until <t:${moment(isFound.validUntil).toDate().getTime().toString().slice(0, 10)}>`, ephemeral: true });
			}
		} else {
			await GuildSettings.create({
				guildId: interaction.guildId,
				discordAdminId: interaction.user.id,
				adminRoles: [role.id],
				created: Date.now(),
				licenseKey: randomUUID(),
				validUntil: moment().add(1, 'months').toDate()
			})
		}

		await interaction.reply({ content: 'Bot successfully registered', ephemeral: true });
	},
};