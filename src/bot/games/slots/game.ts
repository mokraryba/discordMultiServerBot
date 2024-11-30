import { ButtonInteraction, Client } from "discord.js";
import GameChannel from "../../../database/models/GameChannel";
import { IDiscordUser } from "../../../database/models/DiscordUser";


export class Game {
	enabled: boolean
	gameName: string
	bot: Client
	SLOTS: string[]

	constructor(bot: Client) {
		this.enabled = true
		this.gameName = "Slots"
		this.bot = bot
		this.SLOTS = ['👨🏿‍🦱', '😈', '🥵', '👀', '😲', '🤔']
	}


	async build() {
		const channels = await GameChannel.find({ gameName: this.gameName })
		for (const channel of channels) {
			await this.generateEmbed({ channelId: channel.channelId, guildId: channel.guildId })
		}
	}

	async generateEmbed({ channelId, guildId, user }: { channelId: string, guildId: string, user?: IDiscordUser }) {


	}

	async interactionCreate(interaction: ButtonInteraction) {
		if (!interaction.customId?.startsWith("slots_")) return;
		if (!interaction.guildId || !interaction.channelId) return await interaction.deferUpdate()
	}
}