import { ChatInputCommandInteraction, Interaction, SlashCommandBuilder } from "discord.js"
import { BlackjackGame } from "./bot/games/blackjack/test"
import { IDiscordUser } from "./database/models/DiscordUser"

export interface Command {
	name: string
	command: {
		data: SlashCommandBuilder
		execute(interaction: ChatInputCommandInteraction): Promise<void>
		interactionCreate?(interaction: Interaction): Promise<void>
		commandType?: "admin" | "user"
	}
}

export interface BlackjackGameInstance extends GameInstance {
	generateEmbed(options: {
		channelId: string,
		guildId: string,
		gameState?: BlackjackGame,
		user?: IDiscordUser
	}): Promise<void>
}

export interface GameInstance {
	enabled: boolean
	gameName: string
	build(): void
	interactionCreate(interaction: Interaction): Promise<void>
}
