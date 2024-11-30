import { CacheType, Client, CommandInteractionOption, InteractionReplyOptions, Message, MessageCreateOptions, MessageEditOptions, MessagePayload, TextChannel, User } from "discord.js";
import moment from "moment"
import path from 'path'
import fs from 'fs'

export function random(min: number, max: number): number { // min and max included 
	return Math.floor(Math.random() * (max - min + 1) + min);
}

export async function sleep(sec: number): Promise<void> {
	await new Promise((r) => setTimeout(r, sec));
}

export function shuffle<T>(array: T[]): T[] {
	let currentIndex = array.length, randomIndex;
	while (currentIndex > 0) {
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex--;

		[array[currentIndex], array[randomIndex]] = [
			array[randomIndex], array[currentIndex]];
	}

	return array;
}

export const logDate = (): string => {
	return `[${moment().format("DD.MM HH:mm:ss")}]`;
}

export async function sendChannelMessage(client: Client, channelId: string, message: string | MessagePayload | MessageCreateOptions): Promise<Message | null> {
	try {
		let channel = await client.channels.fetch(channelId) as TextChannel
		if (channel) {
			let msg = await channel.send(message)
			return msg;
		}
		return null;
	} catch (err) {
		console.error(logDate(), "Error sending message to channel", channelId)
		console.error(err)
		return null;
	}
}

export async function editMessage(client: Client, channelId: string, messageId: string, newMessage: string | MessagePayload | MessageEditOptions) {
	try {
		/** @type {import("discord.js").Channel} */
		let channel = client.channels.resolve(channelId) as TextChannel
		let msg = await channel.messages.fetch(messageId)
		let edited = await msg.edit(newMessage)
		return edited

	} catch (err) {
		console.error(logDate(), `Error editing a message (${messageId}) in a channel ${channelId}`)
		console.error(err)
		return null;
	}
}

export async function getChannelMessages(client: Client, guildId: string, channelId: string) {
	try {
		let guild = await client.guilds.fetch(guildId)
		let channel = await guild.channels.fetch(channelId) as TextChannel
		if (channel) {
			let messages = await channel.messages.fetch({ limit: 100 })
			return messages
		} else {
			console.error(logDate(), "Channel not found", channelId)
			return null;
		}
	} catch (err) {
		console.error(logDate(), "Error fetching messages from channel", channelId)
		console.error(err)
		return null;
	}
}

export async function getChannelMessage(client: Client, guildId: string, channelId: string, messageId: string) {
	try {
		let guild = await client.guilds.fetch(guildId)
		let channel = await guild.channels.fetch(channelId) as TextChannel
		if (channel) {
			let msg = await channel.messages.fetch(messageId)
			return msg;
		}
		return null;
	} catch (err) {
		console.error(logDate(), "Error fetching message", messageId)
		console.error(err)
		return null;
	}
}

export function camelize(str: string): string {
	return str.replace(/(?:^\w|[A-Z]|\b\w|\b-\w)/g, function (word, index) {
		return index === 0 ? word.toLowerCase() : word.toUpperCase();
	}
	).replace(/[\s-]+/g, '');
}


export const colorEmbedText = (text: string, color: "bold" | "underline" | "gray" | "red" | "yellowGreen" | "gold" | "blue" | "pink" | "teal" | "white" | "bgDarkBlue" | "bgBrown" | "bgGrayDark" | "bgGrayMedium" | "bgGrayLight" | "bgGrayLighter" | "bgPurple" | "bgWhite") => {
	let _colors = {
		"bold": "\x1B[1;2m",
		"underline": "\x1B[4;2m",
		"gray": "\x1B[2;30m",
		"red": "\x1B[2;31m",
		"yellowGreen": "\x1B[2;32m",
		"gold": "\x1B[2;33m",
		"blue": "\x1B[2;34m",
		"pink": "\x1B[2;35m",
		"teal": "\x1B[2;36m",
		"white": "\x1B[2;37m",
		"bgDarkBlue": `\x1B[40m`,
		"bgBrown": `\x1B[41m`,
		"bgGrayDark": `\x1B[42m`,
		"bgGrayMedium": `\x1B[43m`,
		"bgGrayLight": `\x1B[44m`,
		"bgPurple": `\x1B[45m`,
		"bgGrayLighter": `\x1B[46m`,
		"bgWhite": `\x1B[47m`,
	}
	let txt = `${_colors[color]}${text}\x1B[0m`
	return txt;
}

export class Log {
	private static logFile: string;
	private static commandLog: fs.WriteStream;
	private static interactionLog: fs.WriteStream;
	static [key: `${string}Log`]: fs.WriteStream;

	static initialize() {
		this.logFile = path.join(__dirname, `../../logs`);
		if (!fs.existsSync(this.logFile)) {
			fs.mkdirSync(this.logFile);
		}
		let logArr = ["interaction", "command"]
		for (let logType of logArr) {
			if (!fs.existsSync(path.join(this.logFile, `${logType}.log`))) {
				fs.writeFileSync(path.join(this.logFile, `${logType}.log`), "");
			}
			this[`${logType}Log`] = fs.createWriteStream(`${this.logFile}/${logType}.log`, { flags: 'a' });
		}
	}

	static command(server: string, user: User, commandName: string, commandArgs: CommandInteractionOption<CacheType>[]) {
		let args = ""
		if (commandArgs.length > 0) args = `[${commandArgs.map(o => `${o.name}:${o.value}`).join("] [")}]`
		let log = `${logDate()} [Command] Server ${server} | @${user.globalName || user.displayName || user.username} used: /${commandName} ${args}`
		this.commandLog.write(log + '\n')
	}

	static interaction(server: string, user: User, customId: string) {
		let log = `${logDate()} [Interaction] Server ${server} |  @${user.globalName || user.displayName || user.username} interacted with: ${customId}`
		this.interactionLog.write(log + '\n')
	}
}
