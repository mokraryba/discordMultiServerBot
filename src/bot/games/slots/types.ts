import { Interaction } from "discord.js";
import { IDiscordUser } from "../../../database/models/DiscordUser";

export interface SlotsGame {
	slots: string[];
	guildId: string
	messageId: string
	channelId: string
	user: string
	bet: number
	state: "Idle" | "Occupied" | "Playing" | "Finished";
	occupiedUntil: number;
}

export interface GameInstance {
	enabled: boolean
	gameName: string
	build(): void
	interactionCreate(interaction: Interaction): Promise<void>
}

export interface SlotsGameInstance extends GameInstance {
	generateEmbed(options: {
		channelId: string,
		guildId: string,
		gameState?: SlotsGame,
		user?: IDiscordUser
	}): Promise<void>
}