import {
	ButtonInteraction,
	Client,
	ModalSubmitInteraction,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
	ActionRowBuilder,
} from "discord.js"
import { GameState } from "./gameState"
import { GameEmbedBuilder } from "./embedBuilder"
import { CardManager } from "./cardManager"
import { getChannelMessages, sendChannelMessage } from "../../../utils/utils"
import GameChannel, { IGameChannel } from "../../../database/models/GameChannel"
import DiscordUser, { IDiscordUser } from "../../../database/models/DiscordUser"
import { BlackjackGame } from "./types"

export class Game {
	enabled: boolean
	gameName: string
	gameState: GameState
	bot: Client
	challenges: { name: string, reward: number, type: { name: string, amount: number } }[]

	constructor(bot: Client) {
		this.enabled = true
		this.gameName = "Blackjack"
		this.gameState = new GameState(bot)
		this.bot = bot
		this.challenges = [
			{ name: `Win 5 games`, reward: 100, type: { name: "win", amount: 5 } },
			{ name: `Win 10 games`, reward: 200, type: { name: "win", amount: 10 } },
			{ name: `Win 15 games`, reward: 300, type: { name: "win", amount: 15 } },
			{ name: `Play 15 rounds`, reward: 100, type: { name: "play", amount: 15 } },
			{ name: `Play 25 rounds`, reward: 200, type: { name: "play", amount: 25 } },
			{ name: `Play 35 rounds`, reward: 300, type: { name: "play", amount: 35 } }
		]
	}

	async build() {
		const channels = await GameChannel.find({ gameName: this.gameName })
		for (const channel of channels) {
			await this.gameState.restart(channel.channelId, channel.guildId)
			await this.generateEmbed({ channelId: channel.channelId, guildId: channel.guildId })
		}

		setInterval(async () => {
			const gameChannels = await GameChannel.find({ gameName: this.gameName })
			for (const channelData of gameChannels) {
				const now = Date.now()
				if (channelData.time >= now) {
					// await this.gameState.restart(channel.channelId, channel.guildId)
					// await this.generateEmbed({ channelId: channel.channelId, guildId: channel.guildId })
				}
			}
		}, 1000 * 60)
	}

	async generateEmbed({ gameState, user, channelId, guildId }: {
		gameState?: BlackjackGame,
		user?: IDiscordUser,
		channelId: string,
		guildId: string
	}) {
		const { embed, row } = GameEmbedBuilder.generateEmbed({ gameState, user, channelId, guildId })

		const messages = await getChannelMessages(this.bot, guildId, channelId)
		if (messages) {
			const foundMessage = messages.find(d => d.author.id == this.bot.user?.id)
			if (foundMessage) {
				await foundMessage.edit({ embeds: [embed], components: [row] })
			} else {
				await sendChannelMessage(this.bot, channelId, { embeds: [embed], components: [row] })
			}
		}
	}

	async handleStop(interaction: ButtonInteraction, currentGame: BlackjackGame, foundChannel: IGameChannel, user: IDiscordUser) {
		if (currentGame.playerValue > 21) {
			currentGame.state = "Finished"
			await this.generateEmbed({
				gameState: currentGame,
				channelId: interaction.channelId!,
				guildId: interaction.guildId!,
				user
			})
			return
		}

		for (let i = 0; i < 20; i++) {
			const updatedGame = this.gameState.getGame(interaction.channelId!, interaction.guildId!)
			if (!updatedGame || updatedGame.dealerValue > 16 || updatedGame.dealerValue > updatedGame.playerValue) continue
			CardManager.pickCard(1, 1, interaction.channelId!, [updatedGame])
		}

		let won = 0
		if (currentGame.dealerValue === currentGame.playerValue) {
			won = 1
			user.balance += foundChannel.wager
		} else if (currentGame.dealerValue < currentGame.playerValue || currentGame.dealerValue > 21) {
			won = 2
			user.balance += (foundChannel.wager * 2)
		}

		await user.updateOne({ balance: user.balance })
		currentGame.state = "Finished"

		await this.generateEmbed({
			gameState: currentGame,
			channelId: interaction.channelId!,
			guildId: interaction.guildId!,
			user
		})
	}

	async interactionCreate(interaction: ButtonInteraction | ModalSubmitInteraction) {
		if (!interaction.customId?.startsWith("bj_")) return
		if (!interaction.guildId || !interaction.channelId) return await interaction.deferUpdate()

		if (interaction.isButton() && interaction.customId !== "bj_btn_changewager") {
			await interaction.deferUpdate()
		}

		const foundChannel = await GameChannel.findOne({ channelId: interaction.channelId, guildId: interaction.guildId })
		if (!foundChannel) return

		const user = await DiscordUser.findOne({ discordId: interaction.user.id, guildId: interaction.guildId })
		if (!user) return

		const currentGame = this.gameState.getGame(interaction.channelId, interaction.guildId)
		const isOG = foundChannel.occupiedId === interaction.user.id

		if (interaction.customId === "bj_btn_hit" && isOG) {
			CardManager.pickCard(0, 1, interaction.channelId, [currentGame!])
			if (currentGame!.playerValue >= 21) {
				await this.handleStop(interaction as ButtonInteraction, currentGame!, foundChannel, user)
			} else {
				await this.generateEmbed({
					gameState: currentGame,
					channelId: interaction.channelId,
					guildId: interaction.guildId,
					user
				})
			}
		}

		if (interaction.customId === "bj_btn_stop" && isOG) {
			await this.handleStop(interaction as ButtonInteraction, currentGame!, foundChannel, user)
		}

		if (interaction.customId === "bj_btn_reserve") {
			if (foundChannel.occupiedId) return
			if (user.balance < 5) return await interaction.followUp({ content: "You don't have enough money to reserve this channel.", ephemeral: true })
			const reservedUntil = Date.now() + (1000 * 60 * 5)
			await foundChannel.updateOne({ occupiedId: interaction.user.id, occupied: true, time: reservedUntil, wager: 0 })

			const newGame = this.gameState.createGame(interaction.channelId, interaction.guildId, interaction.user.id)
			await this.generateEmbed({ gameState: newGame, channelId: interaction.channelId, guildId: interaction.guildId, user })
		}

		if (interaction.customId === "bj_btn_changewager" && isOG) {
			const modal = new ModalBuilder()
				.setCustomId("bj_wager_modal")
				.setTitle(`Change wager (balance: ${user.balance})`)

			const wagerInput = new TextInputBuilder()
				.setCustomId('bj_modal_wager')
				.setLabel("Specify your wager")
				.setMaxLength(10)
				.setStyle(TextInputStyle.Paragraph)

			const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(wagerInput)
			modal.addComponents(firstActionRow)
			return await (interaction as ButtonInteraction).showModal(modal)
		}

		if (interaction.customId === "bj_wager_modal" && isOG) {
			const wager = parseInt((interaction as ModalSubmitInteraction).fields.getTextInputValue('bj_modal_wager'))
			if (isNaN(wager) || wager > user.balance || wager < 5) return await interaction.followUp({ content: "Invalid wager. Minimum is 5", ephemeral: true })

			await foundChannel.updateOne({ wager })
			currentGame!.wager = wager
			await interaction.deferUpdate()
			await this.generateEmbed({ gameState: currentGame, channelId: interaction.channelId, guildId: interaction.guildId, user })
		}

		if (interaction.customId === "bj_btn_play" && isOG) {
			if (user.balance < foundChannel.wager) return await interaction.followUp({ content: "You don't have enough money to play this game.", ephemeral: true })


			const newReserved = Date.now() + (1000 * 60 * 5)
			await foundChannel.updateOne({ time: newReserved })

			currentGame!.state = "Playing"
			currentGame!.occupiedUntil = newReserved
			currentGame!.dealerValue = 0
			currentGame!.playerValue = 0
			currentGame!.dealerHand = []
			currentGame!.playerHand = []

			user.balance -= foundChannel.wager
			await user.save()

			CardManager.pickCard(0, 2, interaction.channelId, [currentGame!])
			CardManager.pickCard(1, 1, interaction.channelId, [currentGame!])

			await this.generateEmbed({ gameState: currentGame, channelId: interaction.channelId, guildId: interaction.guildId, user })
		}

		if (interaction.customId === "bj_btn_leave" && isOG) {
			// if (currentGame) {
			// 	currentGame.occupiedUntil = 0
			// 	currentGame.state = "Idle"
			// 	currentGame.wager = 0
			// 	currentGame.user = ""
			// 	currentGame.dealerValue = 0
			// 	currentGame.playerValue = 0
			// }
			// this.gameState.removeGame(interaction.channelId, interaction.guildId)
			await foundChannel.updateOne({ occupied: false, occupiedId: "", wager: 0, time: 0 })
			await this.gameState.restart(interaction.channelId, interaction.guildId)
			await this.generateEmbed({ channelId: interaction.channelId, guildId: interaction.guildId })
		}

		// Handle instant win condition after dealing initial cards
		if (currentGame?.state === "Playing" && currentGame.playerValue === 21) {
			user.balance += (foundChannel.wager * 2)
			await user.save()

			currentGame.state = "Finished"
			await this.generateEmbed({
				gameState: currentGame,
				channelId: interaction.channelId,
				guildId: interaction.guildId,
				user
			})
		}

	}
}
