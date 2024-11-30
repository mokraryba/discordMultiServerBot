import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction } from 'discord.js'
import { ensureUserExists } from '../../../services/userService';

export default {
	data: new SlashCommandBuilder()
		.setName('addbalance')
		.addUserOption(opt =>
			opt.setName("user")
				.setDescription("Select a user")
				.setRequired(true)
		)
		.addNumberOption(opt =>
			opt.setName("amount")
				.setDescription("Amount of money u want to add")
				.setRequired(true)
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
		.setDescription('Add balance to someone'),


	async execute(interaction: ChatInputCommandInteraction) {
		console.log("adding blanace")
		let selectedUser = interaction.options.getUser("user")
		let amount = interaction.options.getNumber("amount") || 0

		let user = await ensureUserExists(interaction.guildId!, selectedUser!.id, selectedUser!.username)
		user.balance += amount
		await user.save()

		await interaction.reply({ content: `Added ${amount} balance to <@${selectedUser?.id}>. Their current balance is now: ${user.balance}`, ephemeral: true })
	}
};