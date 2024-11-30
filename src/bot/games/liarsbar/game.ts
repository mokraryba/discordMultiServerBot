import { ButtonInteraction, Client, EmbedBuilder, ModalSubmitInteraction, SelectMenuInteraction, StringSelectMenuInteraction } from "discord.js";
import { BlackjackEmoji } from "../blackjack/test";
import DiscordUser, { IDiscordUser } from "../../../database/models/DiscordUser";
import { LiarsBarCard, LiarsBarGame } from "./types";
import GameChannel from "../../../database/models/GameChannel";
import { GameEmbedBuilder } from "./embedBuilder";
import { getChannelMessages, random, sendChannelMessage, sleep } from "../../../utils/utils";
import { GameState } from "./gameState";

export class Game {
	enabled: boolean;
	gameName: string;
	bot: Client;
	gameState: GameState

	constructor(bot: Client) {
		this.enabled = true;
		this.gameName = "Liar's Bar";
		this.bot = bot;
		this.gameState = new GameState(bot)
	}

	async generateEmbed({ gameState, channelId, guildId }: {
		gameState?: LiarsBarGame,
		channelId: string,
		guildId: string
	}) {
		const { embed, row } = await GameEmbedBuilder.generateEmbed({
			gameState, channelId, guildId
		})
		const messages = await getChannelMessages(this.bot, guildId, channelId)
		if (messages) {
			const foundMessage = messages.find(message => message.author.id == this.bot.user?.id)
			if (foundMessage)
				await foundMessage.edit({ embeds: [embed], components: [row] })
			else
				await sendChannelMessage(this.bot, channelId, { embeds: [embed], components: [row] })

		}
	}

	async build() {
		const channels = await GameChannel.find({ gameName: this.gameName })
		for (var channel of channels) {
			await this.generateEmbed({ channelId: channel.channelId, guildId: channel.guildId })
		}
	}

	async interactionCreate(interaction: ButtonInteraction | ModalSubmitInteraction | StringSelectMenuInteraction) {
		if (!interaction.customId?.startsWith("lb_")) return
		if (!interaction.guildId || !interaction.channelId) return await interaction.deferUpdate()

		const foundChannel = await GameChannel.findOne({ channelId: interaction.channelId, guildId: interaction.guildId, gameName: this.gameName })
		if (!foundChannel) return;

		if (interaction.customId != "lb_card_selection")
			await interaction.deferReply({ ephemeral: true })

		const user = await DiscordUser.findOne({ discordId: interaction.user.id, guildId: interaction.guildId })
		if (!user) return await interaction.deleteReply()

		let foundGame = this.gameState.getGame(foundChannel.channelId, foundChannel.guildId)

		console.log(interaction.customId)

		const handleJoin = async (id: string, type: "user" | "bot") => {
			const game = this.gameState.getGame(foundChannel.channelId, foundChannel.guildId)
			if (!game) {
				let _game = this.gameState.joinGame(foundChannel.channelId, foundChannel.guildId, { id, type })
				await this.generateEmbed({ gameState: _game, channelId: foundChannel.channelId, guildId: foundChannel.guildId })
				return await interaction.editReply({ content: "Joined game!" })
			} else {
				if (game.state == "Ended") {
					this.gameState.restart(foundChannel.channelId, foundChannel.guildId)
					let _game = this.gameState.joinGame(foundChannel.channelId, foundChannel.guildId, { id, type })
					await this.generateEmbed({ gameState: _game, channelId: foundChannel.channelId, guildId: foundChannel.guildId })
					return await interaction.editReply({ content: "Joined game!" })
				}
				if (game.joined.find(x => x.id == id)) return await interaction.editReply({ content: "You are already in the game!" })
				if (game.state == "Playing") return await interaction.editReply({ content: "The game is already in progress!" })
				game.joined.push({ id, type })
				if (game.joined.length >= 3) {
					await this.gameState.startGame(foundChannel.channelId, foundChannel.guildId)
				}
				await this.generateEmbed({ gameState: game, channelId: foundChannel.channelId, guildId: foundChannel.guildId })
				return await interaction.editReply({ content: "Joined game!" })
			}
		}

		if (interaction.customId == "lb_btn_join") {
			return handleJoin(interaction.user.id, "user")
		}

		if (interaction.customId == "lb_btn_leave") {
			let game = this.gameState.getGame(foundChannel.channelId, foundChannel.guildId)
			if (!game) return await interaction.deleteReply()
			if (!game.joined.find(x => x.id == interaction.user.id)) return await interaction.deleteReply()
			game = this.gameState.leaveGame(foundChannel.channelId, foundChannel.guildId, { id: interaction.user.id, type: "user" })
			await this.generateEmbed({ gameState: game, channelId: foundChannel.channelId, guildId: foundChannel.guildId })
			await interaction.editReply({ content: "Left game!" })
		}

		if (interaction.customId == "lb_btn_joinbot") {
			let randomId = Array.from({ length: 3 }, (v, i) => random(0, 9)).join('')
			return handleJoin(randomId, "bot")
		}

		if (interaction.customId == "lb_btn_cards") {
			if (!foundGame) return await interaction.deleteReply()
			if (foundGame.state != "Playing") return await interaction.deleteReply()
			let player = foundGame.players!.find(p => p.discordId == interaction.user.id)
			if (!player) return await interaction.deleteReply()
			if (player.cards.length == 0) return await interaction.deleteReply()
			let _data = GameEmbedBuilder.generatePlayerActionEmbed(player.cards, player.cards.length > 3 ? 3 : player.cards.length)
			await interaction.editReply(_data)

		}

		if (interaction.customId == "lb_card_selection") {
			if (!interaction.isStringSelectMenu()) return await interaction.deferUpdate();
			if (!foundGame) return await interaction.deferUpdate()
			if (foundGame.state != "Playing") return await interaction.deferUpdate()
			let player = foundGame.players!.find(p => p.discordId == interaction.user.id)
			if (!player) return await interaction.deferUpdate()
			if (foundGame!.gameData!.turn != interaction.user.id) return await interaction.deferUpdate()
			if (player.cards.length == 0) return await interaction.deferUpdate()

			let cardIndexes = interaction.values.map(v => Number(v.split("_")[1]))
			let playerCards = player.cards.filter((_, i) => cardIndexes.includes(i))

			let playerIndex = foundGame.players!.findIndex(p => p.discordId == interaction.user.id)

			await this.gameState.playCard(playerIndex, cardIndexes, foundGame)

			await sleep(200)

			let embed = new EmbedBuilder()
			embed.setTitle("Selected cards")
			let desc = ""
			desc += playerCards.map(c => c.emoji).join(" ")
			embed.setDescription(desc)
			await interaction.update({ embeds: [embed], components: [] })
			return await this.generateEmbed({ gameState: foundGame, channelId: foundChannel.channelId, guildId: foundChannel.guildId })


			// await interaction.reply({ content: "Selected cards: " + selectedCards.join(", "), ephemeral: true })
		}

		if (interaction.customId == "lb_btn_next") {
			this.gameState.nextTurn(foundGame!)
			return await this.generateEmbed({ gameState: foundGame, channelId: foundChannel.channelId, guildId: foundChannel.guildId })
		}

		if (interaction.customId == "lb_btn_check") {
			if (foundGame?.gameData?.turn != interaction.user.id) return await interaction.deleteReply()
			let playerIndex = foundGame!.players!.findIndex(p => p.discordId == interaction.user.id)!
			let didCheck = await this.gameState.check(playerIndex, foundGame!)
			console.log({ didCheck })
			if (!didCheck) return await interaction.deleteReply()
			await interaction.deleteReply()
			return await this.generateEmbed({ gameState: foundGame, channelId: foundChannel.channelId, guildId: foundChannel.guildId })
		}

		if (interaction.customId == "lb_btn_rules") {
			let desc = ""
			desc += `1. At the beginning of each round, the system designates the "liar's card" type for this round (e.g., "Ace").\n`
			desc += `2. Players take turns playing cards, 1-3 cards each time. For example, throw out 2 cards means the player claims to have played 2 "Aces".\n`
			desc += `3. The next player can choose to:\n`
			desc += `  - Believe the previous player's statement and play their own cards.\n`
			desc += `  - Challenge the previous player's play (Call Liar!), indicating "I don't believe you just played 2 'Aces'". Then the system reveals the pile to verify.\n`
			desc += `    - If the previous player didn't play 2 cards (e.g., 0 "Aces"), the challenge is successful, and the previous player undergoes a death roulette judgment;\n`
			desc += `    - If the previous player indeed played 2 "Aces" (including Jokers), the challenge fails, and the challenging player undergoes a death roulette judgment;\n`
			desc += `4. Death roulette judgment means firing the gun at oneself. If it's an empty chamber, the game proceeds to the next round; if successful, the player is eliminated, and the game continues to the next round\n`
			desc += `5. The game continues until only one player remains, who becomes the winner.\n`
			let embed = new EmbedBuilder()
			embed.setTitle("Rules")
			embed.setDescription(desc)
			await interaction.editReply({ embeds: [embed] })
		}

	}
}