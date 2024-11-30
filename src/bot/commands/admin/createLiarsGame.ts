import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, AutocompleteInteraction, ChannelType } from 'discord.js';
import moment from 'moment';
import fs from 'fs';
import GameChannel from '../../../database/models/GameChannel';
import { games } from '../../../services/gameStore';

export default {
	data: new SlashCommandBuilder()
		//.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers) // uncomment for this to be admin only
		.setName('createliarsgame')
		.addChannelOption(opt =>
			opt.setName("channel")
				.setDescription("Select a channel")
				.setRequired(true)
				.addChannelTypes(ChannelType.GuildText)
		)
		.setDescription('Create liar\'s bar game'),

	async execute(interaction: ChatInputCommandInteraction) {
		let channel = interaction.options.getChannel("channel")
		if (!channel) {
			return await interaction.reply({ content: "No channel selected", ephemeral: true })
		}
		let foundChannel = await GameChannel.findOne({ channelId: channel.id, guildId: interaction.guildId })
		if (foundChannel) {
			return await interaction.reply({ content: "This channel is already assigned to a game", ephemeral: true })
		}
		if (channel.type != 0) {
			return await interaction.reply({ content: "This channel is not a text channel", ephemeral: true })
		}

		let newGame = await GameChannel.create({
			channelId: channel.id,
			gameName: "Liar's Bar",
			guildId: interaction.guildId,
			occupied: false,
			occupiedId: "",
			wager: 0,
			time: 0
		})

		const liarsGame = games.find(game => game.gameName === "Liar's Bar")
		console.log(liarsGame)
		if (liarsGame) {
			await liarsGame.generateEmbed({
				channelId: channel.id,
				guildId: interaction.guildId!
			})
		}




		await interaction.reply({ content: `Game created at <#${channel.id}>`, ephemeral: true });
	},
};