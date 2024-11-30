import { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } from 'discord.js'
import { BlackjackGame } from './types'
import { IDiscordUser } from '../../../database/models/DiscordUser'
import { CardManager } from './cardManager'

export class GameEmbedBuilder {
	static generateEmbed({ gameState, user, channelId, guildId }: {
		gameState?: BlackjackGame,
		user?: IDiscordUser,
		channelId: string,
		guildId: string
	}): { embed: EmbedBuilder, row: ActionRowBuilder<ButtonBuilder> } {
		const embed = new EmbedBuilder()
		const row = new ActionRowBuilder<ButtonBuilder>()

		// Reusable buttons
		const reserveBtn = new ButtonBuilder()
			.setCustomId("bj_btn_reserve")
			.setLabel("Reserve")
			.setStyle(ButtonStyle.Primary)

		const changeWagerBtn = new ButtonBuilder()
			.setCustomId('bj_btn_changewager')
			.setLabel('Change wager')
			.setStyle(ButtonStyle.Success)

		const leaveBtn = new ButtonBuilder()
			.setCustomId('bj_btn_leave')
			.setLabel('Leave')
			.setStyle(ButtonStyle.Danger)

		const playBtn = new ButtonBuilder()
			.setCustomId('bj_btn_play')
			.setLabel('Play')
			.setStyle(ButtonStyle.Primary)

		const hitBtn = new ButtonBuilder()
			.setCustomId("bj_btn_hit")
			.setLabel("Hit")
			.setStyle(ButtonStyle.Success)

		const stopBtn = new ButtonBuilder()
			.setCustomId('bj_btn_stop')
			.setLabel('Stop')
			.setStyle(ButtonStyle.Primary)

		if (!gameState || gameState.state == "Idle" || !user) {
			embed.setTitle("Blackjack (not occupied)")
				.setColor(0x993399)
				.setDescription("<:rA:1003016156766027897><:rK:1003016788327530566>\n<:hearths:1003013048514121758><:hearths:1003013048514121758>\nDealer stops at 17.\nReserve your spot at this table by pressing a button below")
			row.addComponents(reserveBtn)
			return { embed, row }
		}

		const [dealerEmojis, playerEmojis] = CardManager.getCardEmojis(gameState)

		switch (gameState.state) {
			case "Occupied":
				embed.setTitle(`Blackjack (occupied)`)
					.setDescription(`Use below button to set your wager`)
					.setFields(
						{ name: "Reserved until", value: parseDate(gameState.occupiedUntil) },
						{ name: "Balance", value: `${user.balance}`, inline: true },
						{ name: "Wager", value: `${gameState.wager}`, inline: true }
					)

				if (gameState.wager > 0) {
					row.addComponents(playBtn, changeWagerBtn, leaveBtn)
				} else {
					row.addComponents(changeWagerBtn, leaveBtn)
				}
				break;

			case "Playing":
				embed.setDescription("Dealer stops at 17")
					.setFields(
						{ name: " ", value: dealerEmojis },
						{ name: "Cards", value: playerEmojis },
						{ name: "Value", value: `${gameState.playerValue}` },
						{ name: "Reserved until", value: parseDate(gameState.occupiedUntil) },
						{ name: "Balance", value: `${user.balance}`, inline: true },
						{ name: "Wager", value: `${gameState.wager}`, inline: true }
					)
				row.addComponents(hitBtn, stopBtn)
				break;

			case "Finished":
				let resultText = ""
				if (gameState.playerValue > 21) {
					resultText = "Oh no, you hit too hard. You lost!"
				} else if (gameState.dealerValue == gameState.playerValue) {
					resultText = "It's a draw!"
				} else if (gameState.dealerValue < gameState.playerValue || gameState.dealerValue > 21) {
					resultText = `You won! ${gameState.dealerValue} vs ${gameState.playerValue}`
				} else if (gameState.dealerValue > gameState.playerValue) {
					resultText = `Oh no, you lost! ${gameState.dealerValue} vs ${gameState.playerValue}`
				}
				embed.setTitle(`Blackjack (finished)`)
					.setDescription(resultText)
					.setFields(
						{ name: " ", value: dealerEmojis },
						{ name: "Cards", value: playerEmojis },
						{ name: "Value", value: `${gameState.playerValue}` },
						{ name: "Reserved until", value: parseDate(gameState.occupiedUntil) },
						{ name: "Balance", value: `${user.balance}`, inline: true },
						{ name: "Wager", value: `${gameState.wager}`, inline: true }
					)
				row.addComponents(playBtn, changeWagerBtn, leaveBtn)
				break;
		}

		return { embed, row }
	}
}

function parseDate(date: number, relative = false): string {
	return `<t:${date.toString().slice(0, 10)}${relative ? "R" : ""}>`
}
