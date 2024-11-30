import { Client, ButtonInteraction, SelectMenuInteraction, ModalSubmitInteraction } from "discord.js"

export interface BlackjackEmoji {
	name: string;
	emoji: string;
	color?: string;
}

export interface BlackjackCard {
	name: string;
	emoji?: string;
	value: number;
	face?: string;
}

export interface BlackjackGame {
	deck: BlackjackCard[];
	guildId: string;
	channelId: string;
	messageId: string;
	user: string;
	wager: number;
	dealerHand: BlackjackCard[];
	playerHand: BlackjackCard[];
	playerValue: number;
	dealerValue: number;
	state: "Idle" | "Occupied" | "Playing" | "Finished";
	occupiedUntil: number;
}

export interface GameChallenge {
	name: string;
	reward: number;
	type: {
		name: string;
		amount: number;
	};
}

export interface GameHandlers {
	interactionCreate(interaction: ButtonInteraction | SelectMenuInteraction | ModalSubmitInteraction): Promise<void>;
	build(): Promise<void>;
}
