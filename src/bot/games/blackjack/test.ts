import {
	ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle,
	CacheType,
	Client, Embed, EmbedBuilder, Interaction, Message, ModalBuilder, ModalSubmitInteraction,
	SelectMenuInteraction, StringSelectMenuInteraction, TextChannel, TextInputBuilder, TextInputStyle
} from "discord.js";
import { getChannelMessages, logDate, shuffle } from "../../../utils/utils";
import GameChannel, { IGameChannel } from "../../../database/models/GameChannel";
import DiscordUser from "../../../database/models/DiscordUser";

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
	channelId: string;
	guildId: string;
	user: string;
	dealerHand: BlackjackCard[];
	playerHand: BlackjackCard[];
	playerValue: number;
	dealerValue: number;
}

let games: BlackjackGame[] = []

let DECK: BlackjackCard[] = []

let emojis: BlackjackEmoji[] = []

const createEmojis = () => {
	emojis.push({ name: "RA", emoji: `<:rA:1003016156766027897>` })
	emojis.push({ name: "BA", emoji: `<:bA:1003005321763115099>` })

	emojis.push({ name: "R2", emoji: `<:r2:1003016166324838460>` })
	emojis.push({ name: "B2", emoji: `<:b2:1003008677567012916>` })

	emojis.push({ name: "R3", emoji: `<:r3:1003016167297912883>` })
	emojis.push({ name: "B3", emoji: `<:b3:1003008678934356038>` })

	emojis.push({ name: "R4", emoji: `<:r4:1003016163174924358>` })
	emojis.push({ name: "B4", emoji: `<:b4:1003008297143631964>` })

	emojis.push({ name: "R5", emoji: `<:r5:1003016164185739364>` })
	emojis.push({ name: "B5", emoji: `<:b5:1003008296376074250>` })

	emojis.push({ name: "R6", emoji: `<:r6:1003016165293052026>` })
	emojis.push({ name: "B6", emoji: `<:b6:1003008290344669186>` })

	emojis.push({ name: "R7", emoji: `<:r7:1003016162126348368>` })
	emojis.push({ name: "B7", emoji: `<:b7:1003008680150695986>` })

	emojis.push({ name: "R8", emoji: `<:r8:1003016160779976764>` })
	emojis.push({ name: "B8", emoji: `<:b8:1003008298787807263>` })

	emojis.push({ name: "R9", emoji: `<:r9:1003016159647514705>` })
	emojis.push({ name: "B9", emoji: `<:b9:1003008291556835423>` })

	emojis.push({ name: "R10", emoji: `<:r10:1003016158208864266>` })
	emojis.push({ name: "B10", emoji: `<:b10:1003008288893448294>` })

	emojis.push({ name: "RJ", emoji: `<:rJ:1003016614477832243>` })
	emojis.push({ name: "BJ", emoji: `<:bJ:1003008294106963999>` })

	emojis.push({ name: "RQ", emoji: `<:rQ:1003016859022524417>` })
	emojis.push({ name: "BQ", emoji: `<:bQ:1003008292714446859>` })

	emojis.push({ name: "RK", emoji: `<:rK:1003016788327530566>` })
	emojis.push({ name: "BK", emoji: `<:bK:1003008295377850568>` })

	emojis.push({ color: "B", name: "C", emoji: `<:eclubs:1003013046395998228>` })
	emojis.push({ color: "R", name: "D", emoji: `<:diamonds:1003013047452971049>` })
	emojis.push({ color: "R", name: "H", emoji: `<:hearths:1003013048514121758>` })
	emojis.push({ color: "B", name: "S", emoji: `<:spades:1003007388628033536>` })
}

createEmojis()

for (var i = 1; i < 14; i++) {
	let val: number | string = i
	if (i == 1) val = "A"
	if (i == 11) val = "J"
	if (i == 12) val = "Q"
	if (i == 13) val = "K"
	let faces = ['BC', 'BS', 'RD', 'RH']
	faces.forEach(d => {
		let foundEmoji = emojis.find(c => c.name == d[0] + val)
		let emojiFace = emojis.find(c => c.color == d[0] && c.name == d[1])
		DECK.push({ value: i, name: `${d}${val}`, emoji: foundEmoji?.emoji, face: emojiFace?.emoji })
	})

}
DECK = shuffle(DECK)

let parseDate = (date: Date, relative = false) => {
	return `<t:${date.toString().slice(0, 10)}${relative ? "R" : ""}>`
}

export class Game {

	enabled: boolean;
	gameName: string;
	deck: BlackjackCard[];
	bot: Client;
	challenges: { name: string, reward: number, type: { name: string, amount: number } }[];
	embed: EmbedBuilder;

	constructor(bot: Client) {
		this.enabled = true;
		this.gameName = "Blackjack"
		this.deck = shuffle(DECK)
		this.bot = bot;
		this.challenges = [
			{ name: `Win 5 games`, reward: 100, type: { name: "win", amount: 5 } },
			{ name: `Win 10 games`, reward: 200, type: { name: "win", amount: 10 } },
			{ name: `Win 15 games`, reward: 300, type: { name: "win", amount: 15 } },
			{ name: `Play 15 rounds`, reward: 100, type: { name: "play", amount: 15 } },
			{ name: `Play 25 rounds`, reward: 200, type: { name: "play", amount: 25 } },
			{ name: `Play 35 rounds`, reward: 300, type: { name: "play", amount: 35 } },
		]
		this.embed = new EmbedBuilder()
		this.resetEmbed()
	}


	updateEmbed = async (interaction: ButtonInteraction, gameData: BlackjackGame | null, channelData: IGameChannel) => {
		let embed = new EmbedBuilder()
		let user = await DiscordUser.findOne({ discordId: interaction.user.id, guildId: interaction.guildId })
		let row = new ActionRowBuilder<ButtonBuilder>()

		if (!gameData) {
			// Initial/Empty table state
			embed.setAuthor({ name: "Blackjack (not occupied)" })
			embed.setColor(0x993399)
			embed.setDescription("<:rA:1003016156766027897><:rK:1003016788327530566>\n<:hearths:1003013048514121758><:hearths:1003013048514121758>\nDealer stops at 17.\nReserve your spot at this table by pressing a button below")

			row.addComponents(
				new ButtonBuilder()
					.setCustomId("bj_btn_occupy")
					.setLabel("Reserve")
					.setStyle(ButtonStyle.Primary)
			)
		} else if (channelData.occupied) {
			embed.setAuthor({ name: `Blackjack (occupied by ${interaction.user.displayName})` })

			if (channelData.wager === 0) {
				embed.setDescription("Use below buttons to set your wager")
				embed.setFields([
					{ name: "Balance", value: `${user?.balance}` },
					{ name: "Reserved until", value: parseDate(new Date(channelData.time)) }
				])

				row.addComponents(
					new ButtonBuilder()
						.setCustomId('bj_btn_changewager')
						.setLabel('Change wager')
						.setStyle(ButtonStyle.Success),
					new ButtonBuilder()
						.setCustomId('bj_btn_leave')
						.setLabel('Leave')
						.setStyle(ButtonStyle.Danger)
				)
			} else {
				let [dealer, player] = this.getCardEmojis(interaction.channelId!, interaction.guildId!)

				embed.setTitle("Blackjack")
				embed.setFields([
					{ name: " ", value: dealer },
					{ name: "Cards", value: player },
					{ name: "Value", value: " " + gameData.playerValue },
					{ name: "Reserved until", value: parseDate(new Date(channelData.time)) }
				])

				if (gameData.playerValue >= 21 || gameData.dealerValue > 16) {
					// Game ended buttons
					row.addComponents(
						new ButtonBuilder()
							.setCustomId("bj_btn_play")
							.setLabel("Play again")
							.setStyle(ButtonStyle.Primary),
						new ButtonBuilder()
							.setCustomId('bj_btn_changewager')
							.setLabel('Change wager')
							.setStyle(ButtonStyle.Success),
						new ButtonBuilder()
							.setCustomId('bj_btn_leave')
							.setLabel('Leave')
							.setStyle(ButtonStyle.Danger)
					)
				} else {
					// Active game buttons
					row.addComponents(
						new ButtonBuilder()
							.setCustomId("bj_btn_hit")
							.setLabel("Hit")
							.setStyle(ButtonStyle.Success),
						new ButtonBuilder()
							.setCustomId('bj_btn_stop')
							.setLabel('Stop')
							.setStyle(ButtonStyle.Primary)
					)
				}

				if (gameData.playerValue === 21) {
					embed.setDescription("Lucky you! You got 21 in your first draw, hence you win instantly!")
				} else if (gameData.playerValue > 21) {
					embed.setDescription("Oh no, you hit too hard, unlucky")
				}

				if (gameData.dealerValue > 16 || gameData.playerValue >= 21) {
					let wonAmt = this.calculateWinAmount(gameData, channelData.wager)
					embed.addFields({ name: "Balance", value: `${user?.balance} ${wonAmt}` })
				}
			}
		}

		let messages = await getChannelMessages(interaction.client, interaction.guildId!, interaction.channelId!)
		if (messages) {
			let foundMessage = messages.find(d => d.id == interaction.message.id)
			if (foundMessage) {
				await foundMessage.edit({ embeds: [embed], components: [row] })
			}
		}
	}

	private calculateWinAmount = (gameData: BlackjackGame, wager: number): string => {
		if (gameData.dealerValue === gameData.playerValue) return '(0)'
		if (gameData.playerValue > 21) return `(-${wager})`
		if (gameData.dealerValue > 21 || gameData.playerValue > gameData.dealerValue) return `(+${wager})`
		return `(-${wager})`
	}


	resetEmbed = () => {
		this.embed = new EmbedBuilder()
			.setAuthor({ name: "Blackjack (not occupied)" })
			.setColor(0x993399)
			// .setTitle(``)
			.setDescription("<:rA:1003016156766027897><:rK:1003016788327530566>\n<:hearths:1003013048514121758><:hearths:1003013048514121758>\nDealer stops at 17.\nReserve your spot at this table by pressing a button below")
			.setFields({ name: " ", value: " " })

	}

	restart = async (channelId: string, guildId: string) => {
		this.resetEmbed()

		await GameChannel.findOneAndUpdate({ channelId, guildId }, {
			$set: {
				occupied: false, occupiedId: "", wager: 0, time: 0
			}
		})

		let guild = await this.bot.guilds.fetch(guildId)
		let channel = await guild.channels.fetch(channelId) as TextChannel
		let messages = await channel.messages.fetch({ limit: 100 })
		if (messages.size > 0) {
			for (var m of messages) {
				await m[1].delete()
			}
		}

		let occupyBtn = new ButtonBuilder()
			.setCustomId("bj_btn_occupy")
			.setLabel("Reserve")
			.setStyle(ButtonStyle.Primary)

		let row = new ActionRowBuilder<ButtonBuilder>().addComponents(occupyBtn)

		await channel.send({ embeds: [this.embed], components: [row] })
	}

	build = async () => {
		let gameChannels = await GameChannel.find({ gameName: "blackjack" })
		for (var channel of gameChannels) {
			await this.restart(channel.channelId, channel.guildId)
		}

		setInterval(async () => {
			let gameChannels = await GameChannel.find({ gameName: "blackjack" })
			for (var channelData of gameChannels) {
				let now = Date.now()
				let time = channelData.time
				if (time >= now) {
					await this.restart(channelData.channelId, channelData.guildId)
				}
			}
		}, 1000 * 1);

	}

	getCardEmojis = (channelId: string, guildId: string) => {
		let dealer = ""
		let player = ""
		let currentGame = games.find(d => d.channelId == channelId && d.guildId == guildId)
		if (!currentGame) return ["", ""]
		currentGame.dealerHand.forEach(d => {
			dealer += d.emoji + " "
		})
		dealer += "\n"
		currentGame.dealerHand.forEach(d => {
			dealer += d.face + " "
		})
		currentGame.playerHand.forEach(d => {
			player += d.emoji + " "
		})
		player += "\n"
		currentGame.playerHand.forEach(d => {
			player += d.face + " "
		})
		return [dealer, player]
	}



	interactionCreate = async (interaction: ButtonInteraction | SelectMenuInteraction | ModalSubmitInteraction) => {
		//#region basic 
		if (!interaction.customId?.startsWith("bj_")) return;
		if (interaction.guildId || interaction.channelId) return;
		if (typeof interaction.guildId != "string") return;
		if (typeof interaction.channelId != "string") return;

		let foundChannel = await GameChannel.findOne({ channelId: interaction.channelId, guildId: interaction.guildId })
		if (!foundChannel) return await interaction.deferUpdate();
		let ogUser = await DiscordUser.findOne({ discordId: foundChannel.occupiedId, guildId: interaction.guildId }) || false
		let isOG = ogUser != false && ogUser?.discordId == interaction.user.id

		let user = await DiscordUser.findOne({ discordId: interaction.user.id, guildId: interaction.guildId })

		let messages = await getChannelMessages(interaction.client, interaction.guildId, interaction.channelId)
		let embed: Embed;
		let message: Message<true>;

		if (!messages) {
			console.log(logDate(), "Could not load messages for interactionCreate at blackjack")
		} else {
			let foundMsg = messages.find(d => d.id == interaction?.message?.id)
			if (!foundMsg) {
				console.log("no message")
				return await interaction.deferUpdate()
			} else {
				message = foundMsg
				embed = message.embeds[0]
			}
		}


		let currentGame = games.find(d => d.channelId == interaction.channelId && d.guildId == interaction.guildId)
		let isGame = currentGame ? true : false;

		//#endregion

		let handleStop = async () => {
			// await incrementGame("blackjack", interaction.user.id, "play")
			if (!currentGame || !message || !foundChannel || !user) return console.log("Could not find game")

			let [dealer, player] = this.getCardEmojis(interaction.channelId!, interaction.guildId!)
			const playBtn = new ButtonBuilder()
				.setCustomId("bj_btn_play")
				.setLabel("Play again")
				.setStyle(ButtonStyle.Primary)

			const changeWagerBtn = new ButtonBuilder()
				.setCustomId('bj_btn_changewager')
				.setLabel('Change wager')
				.setStyle(ButtonStyle.Success);

			const leaveBtn = new ButtonBuilder()
				.setCustomId('bj_btn_leave')
				.setLabel('Leave')
				.setStyle(ButtonStyle.Danger);

			const row = new ActionRowBuilder<ButtonBuilder>()
				.addComponents(playBtn, changeWagerBtn, leaveBtn);

			let nEmbed = new EmbedBuilder()
			if (currentGame?.playerValue > 21) {
				// lost
				// await this.postSlotLog(`${interaction.user.displayName} lost ${foundChannel.wager}. Player hand: ${currentGame.playerValue}. Dealer hand: ${currentGame.dealerValue}`)
				nEmbed = new EmbedBuilder()
					.setTitle("Blackjack")
					.setDescription("Oh no, you hit too hard, unlucky")
					.setFields(
						{ name: " ", value: dealer },
						{ name: "Cards", value: player },
						{ name: "Value", value: " " + currentGame.playerValue },
						{ name: "Reserved until", value: parseDate(new Date(foundChannel.time)) }
					)
				await message.edit({ embeds: [nEmbed], components: [row] })
				await interaction.deferUpdate()
				return;
			} else {
				// win or draw

				for (var i = 0; i < 20; i++) {
					let updatedGame = games.find(d => d.channelId == interaction.channelId && d.guildId == interaction.guildId)
					if (updatedGame)
						if (updatedGame.dealerValue > 16 || updatedGame.dealerValue > updatedGame.playerValue) continue;

					await this.pickCard(1, 1, interaction.channelId!)
				}

				let [newDealer, newPlayer] = this.getCardEmojis(interaction.channelId!, interaction.guildId!)
				let descText = ""
				let prevBalance = user.balance + 0
				let won = 0;
				if (currentGame.dealerValue == currentGame.playerValue) {
					descText = `So close! It's a draw!`
					won = 1;
					user.balance += foundChannel.wager
				} else if (currentGame.dealerValue < currentGame.playerValue || currentGame.dealerValue > 21) {
					descText = `You won against the dealer (${currentGame.dealerValue})`
					won = 2;
					user.balance += (foundChannel.wager * 2)
				} else if (currentGame.dealerValue > currentGame.playerValue) {
					descText = `You lost against the dealer (${currentGame.dealerValue})`
				}

				// await this.postSlotLog(`${interaction.user.displayName} ${won == 0 ? "lost" : won == 1 ? "tied" : "won"}${won == 1 ? "" : " " + foundChannel.wager}. Player hand: ${currentGame.playerValue}. Dealer hand: ${currentGame.dealerValue}`)

				await user.updateOne({ balance: user.balance })
				let wonAmt = ""
				if (won == 0) wonAmt = `(-${foundChannel.wager})`
				if (won == 1) wonAmt = `(0)`
				if (won == 2) wonAmt = `(+${foundChannel.wager})`

				nEmbed = new EmbedBuilder()
					.setTitle("Blackjack")
					.setDescription(descText)
					.setFields(
						{ name: " ", value: newDealer },
						{ name: "Cards", value: newPlayer },
						{ name: "Value", value: " " + currentGame.playerValue },
						{ name: "Reserved until", value: parseDate(new Date(foundChannel.time)) },
						{ name: "Balance", value: `${user.balance} ${wonAmt}` },
					)
				await message.edit({ embeds: [nEmbed], components: [row] })

				// if (won == 2)
				// 	await incrementGame("blackjack", interaction.user.id, "win")

				await interaction.deferUpdate()
				return;
			}

		}


		if (interaction.customId == `bj_btn_occupy`) {
			if (ogUser) return await interaction.reply({ content: "Its already taken dude gtfo", ephemeral: true })
			let reservedUntil = Date.now() + (1000 * 60 * 5)
			await foundChannel.updateOne({ occupiedId: interaction.user.id, occupied: true, time: reservedUntil, wager: 0 })

			await this.updateEmbed(interaction as ButtonInteraction, currentGame!, foundChannel)
			await interaction.deferUpdate()
		}

		if (interaction.customId == "bj_btn_leave") {
			if (!isOG) return interaction.deferUpdate()

			await foundChannel.updateOne({ occupied: false, occupiedId: "", wager: 0, time: 0 })
			await this.build()
		}

		if (interaction.customId == 'bj_btn_changewager') {
			if (!isOG) return interaction.deferUpdate()

			const modal = new ModalBuilder()
				.setCustomId('bj_wager_modal')
				.setTitle(`Change wager (balance: ${user?.balance})`);

			// Add components to modal

			const wagerInput = new TextInputBuilder()
				.setCustomId('bj_modal_wager')
				.setLabel("Specify your wager")
				.setMaxLength(10)
				.setStyle(TextInputStyle.Paragraph);

			// An action row only holds one text input,
			// so you need one action row per text input.
			const firstActionRow = new ActionRowBuilder().addComponents(wagerInput);
			modal.addComponents(firstActionRow);
			await interaction.showModal(modal);

		}

		if (interaction.customId == 'bj_wager_modal') {
			if (!isOG || !user) return interaction.deferUpdate()
			if (!('fields' in interaction)) return interaction.deferUpdate()
			let wager: number | string = interaction.fields.getTextInputValue('bj_modal_wager');
			wager = parseInt(wager)
			if (isNaN(wager)) return await interaction.reply({ content: "You need to provide a number", ephemeral: true })
			if (wager > user.balance) return await interaction.reply({ content: "You don't have enough balance", ephemeral: true })
			if (wager < 5) return await interaction.reply({ content: "Minimum wager is 5", ephemeral: true })
			if (interaction.replied) await interaction.deleteReply()

			await foundChannel.updateOne({ wager })
			foundChannel.wager = wager;

			await this.updateEmbed(interaction as ButtonInteraction, currentGame!, foundChannel)
		}

		if (interaction.customId == "bj_btn_play") {
			if (!isOG || !user) return await interaction.deferUpdate()
			if (user.balance < foundChannel.wager) return await interaction.reply({ content: "You don't have enough balance", ephemeral: true })

			if (isGame) games.splice(games.findIndex(d => d.channelId == interaction.channelId && d.guildId == interaction.guildId), 1)
			games.push({
				deck: [...shuffle(DECK)],
				channelId: interaction.channelId,
				user: interaction.user.id,
				playerHand: [],
				dealerHand: [],
				dealerValue: 0,
				playerValue: 0,
				guildId: interaction.guildId,
			})

			let newReserved = Date.now() + (1000 * 60 * 5)
			await foundChannel.updateOne({ time: newReserved })

			currentGame = games.find(d => d.channelId == interaction.channelId && d.guildId == interaction.guildId)
			user.balance -= foundChannel.wager

			await this.pickCard(0, 2, interaction.channelId)
			await this.pickCard(1, 1, interaction.channelId)

			await user.updateOne({ balance: user.balance })
			await this.updateEmbed(interaction as ButtonInteraction, currentGame!, foundChannel)
			await interaction.deferUpdate()



			await interaction.deferUpdate()
		}

		if (interaction.customId == 'bj_btn_hit') {
			if (!isOG) return await interaction.deferUpdate()
			await this.pickCard(0, 1, interaction.channelId)

			let [dealer, player] = this.getCardEmojis(interaction.channelId)

			let nEmbed = new EmbedBuilder()
				.setTitle("Blackjack")
				.setFields(
					{ name: " ", value: dealer },
					{ name: "Cards", value: player },
					{ name: "Value", value: " " + currentGame.playerValue },
					{ name: "Reserved until", value: parseDate(foundChannel.time) }

					// currentGame.dealerHand.map(d => { return { name: d.emoji, value: d.face } }),
					// currentGame.playerHand.map(d => { return { name: d.emoji, value: d.face } }),
				)

			if (currentGame.playerValue >= 21) {
				return await handleStop();
			}


			await message.edit({ embeds: [nEmbed] })
			await interaction.deferUpdate()
		}

		if (interaction.customId == 'bj_btn_stop') {
			await handleStop();
		}
	}

	pickCard = async (who = 0, amount: number, channelId: string) => {
		for (var i = 0; i < amount; i++) {
			let foundGame = games.find(d => d.channelId == channelId)
			if (!foundGame) continue;
			let card = foundGame.deck.splice(0, 1)[0]
			if (who == 0) {
				foundGame.playerHand.push(card)
				foundGame.playerValue = this.calcValue(foundGame.playerHand)
			} else {
				foundGame.dealerHand.push(card)
				foundGame.dealerValue = this.calcValue(foundGame.dealerHand)
			}
		}
	}

	calcValue = (hand) => {
		let val = 0
		let tmpHand = [...hand]
		tmpHand.sort((a, b) => b.value - a.value).forEach(d => {
			if (d.value == 1) {
				if (val + 11 > 21) val += 1
				else val += 11
			} else if (d.value > 10) {
				val += 10;
			} else
				val += d.value
		})
		return val;
	}

}