export interface LiarsBarGame {
	id: string
	channelId: string;
	guildId: string;
	joined: { id: string, type: "user" | "bot" }[];
	players?: LiarsBarPlayer[];
	state: "Waiting" | "Playing" | "Ended";
	gameData?: LiarsBarGameData
}

export interface LiarsBarCard {
	name: string;
	emoji: string;
	label: string
}

export interface LiarsBarPlayer {
	discordId: string;
	type: "user" | "bot"
	cards: LiarsBarCard[];
	lives: number
	hits: number
	alive: boolean
}

export interface LiarsBarCardAction {
	card: LiarsBarCard[]
	discordId: string
	type: "card"
	round: number
}

export interface LiarsBarShotAction {
	hits: number
	success: boolean
	discordId: string
	type: "shot"
	round: number
}

export interface LiarsBarCustomAction {
	text: string
	type: "custom"
	round: number
}

export interface LiarsBarGameData {
	deck: LiarsBarCard[]
	/** label of the card that is currently being played */
	card: string
	round: number
	actions: (LiarsBarCardAction | LiarsBarShotAction | LiarsBarCustomAction)[]
	/** discordID of a player who is currently playing */
	turn: string
	winner?: string
}