import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ColorResolvable, EmbedBuilder, StringSelectMenuBuilder } from "discord.js";
import { LiarsBarCard, LiarsBarGame } from "./types";
import { DECK, emojis } from "./constants";

export class GameEmbedBuilder {
	static generateEmbed({ gameState, channelId, guildId }: {
		gameState?: LiarsBarGame,
		channelId: string,
		guildId: string
	}) {
		let embed = new EmbedBuilder()
		let row = new ActionRowBuilder<ButtonBuilder>()


		// Reusable buttons
		const joinBtn = new ButtonBuilder()
			.setCustomId("lb_btn_join")
			.setLabel("Join")
			.setStyle(ButtonStyle.Success)

		const leaveBtn = new ButtonBuilder()
			.setCustomId("lb_btn_leave")
			.setLabel("Leave")
			.setStyle(ButtonStyle.Danger)

		const joinBot = new ButtonBuilder()
			.setCustomId("lb_btn_joinbot")
			.setLabel("Join bot")
			.setStyle(ButtonStyle.Primary)

		const checkBtn = new ButtonBuilder()
			.setCustomId("lb_btn_check")
			.setLabel("Check")
			.setStyle(ButtonStyle.Secondary)

		const selectCardsBtn = new ButtonBuilder()
			.setCustomId("lb_btn_cards")
			.setLabel("Cards")
			.setStyle(ButtonStyle.Primary)

		const nextBtn = new ButtonBuilder()
			.setCustomId("lb_btn_next")
			.setLabel("Next")
			.setStyle(ButtonStyle.Primary)

		const rulesBtn = new ButtonBuilder()
			.setCustomId("lb_btn_rules")
			.setLabel("Rules")
			.setStyle(ButtonStyle.Secondary)

		let title = "";
		let desc = ""
		let color: ColorResolvable = 0x993399

		if (!gameState) {
			title = "Liar's Bar - click to join"
			desc = "Join the game by pressing the button below\n\nGameplay:\n\n"
			desc += `The deck consists of 20 cards: 6 Aces, 6 Kings, 6 Queens, and 2 Jokers\n`
			desc += `Jokers can substitute for any card\n`
			desc += `2-4 players participate, each starting with 5 cards\n`
			desc += `Each player holds a revolver with 1 bullet randomly loaded in one of the 6 chambers\n`
			color = 0x993399
			row.addComponents(joinBtn, joinBot, rulesBtn)
		}
		else if (gameState.state == "Waiting") {
			title = "Liar's Bar - waiting for players"
			color = "Orange"
			desc = "Waiting for players to join the game\n"
			if (gameState.joined.length > 0) {
				desc += `\nJoined players: ${gameState.joined.length}/4\n`
				desc += gameState.joined.map(c => `<@${c.id}>`).join(", ")
			}
			if (gameState.joined.length > 0)
				row.addComponents(joinBtn, joinBot, leaveBtn, rulesBtn)
			else
				row.addComponents(joinBtn, joinBot, rulesBtn)
		} else if (gameState.state == "Playing") {
			let gameData = gameState.gameData!

			title = "Liar's Bar - playing"
			color = "Green"
			let foundCard = DECK.find(c => c.label == gameData.card)!
			desc = `${foundCard.emoji} -> Current card: ${gameData.card}\n\n`
			if (gameData.actions.length > 0) {
				desc += `Actions:\n`
				let lastActions = gameData.actions.slice(-5)
				desc += lastActions.map((a, ind) =>
					a.type == "card" ?
						`${ind + 1}. <@${a.discordId}> threw ${a.card.length} card${a.card.length > 1 ? "s" : ""}!`
						: a.type == "shot" ?
							`${ind + 1}. <@${a.discordId}> shot himself for the ${a.hits} time. ${a.success ? "They have been killed!" : "They're lucky."}!`
							: `${ind + 1}. ${a.text}`
				).join("\n")
				// desc += `Last action: <@${lastAction.discordId}> threw ${len} card${len > 1 ? "s" : ""}!\n\n`
				desc += `\n\n`
			}
			embed.setFields(
				{ name: "Player", value: gameState.players!.map(p => `<@${p.discordId}>`).join("\n"), inline: true },
				{ name: "Cards", value: gameState.players!.map(p => p.cards.length).join("\n"), inline: true },
				{ name: "Shots", value: gameState.players!.map(p => `${p.hits}/6 ${p.alive ? "" : "Dead!"}`).join("\n"), inline: true },
			)
			desc += `Current turn: <@${gameData.turn}>\n`
			embed.setColor("Green")
			row.addComponents(checkBtn, selectCardsBtn, nextBtn)
		} else if (gameState.state == "Ended") {
			title = "Liar's Bar - finish"
			desc = `Game has ended! The winning player is <@${gameState.gameData!.winner}>\n`
			embed.setFields(
				{ name: "Player", value: gameState.players!.map(p => `<@${p.discordId}>`).join("\n"), inline: true },
				{ name: "Cards", value: gameState.players!.map(p => p.cards.length).join("\n"), inline: true },
				{ name: "Shots", value: gameState.players!.map(p => `${p.hits}/6 ${p.alive ? "" : "Dead!"}`).join("\n"), inline: true },
			)
			row.addComponents(joinBtn)
		}

		embed.setTitle(title)
			.setDescription(desc)
			.setColor(color)

		return { embed, row }

	}

	static generatePlayerActionEmbed(playerCards: LiarsBarCard[], maxSelect: number = 3) {
		if (!playerCards) {
			let emb = new EmbedBuilder()
				.setTitle("Game ended")
				.setDescription("Game has ended, you may dimiss this message")
			return {
				embeds: [emb],
				ephemeral: true
			}
		}
		const embed = new EmbedBuilder()
			.setTitle("Manager")
			.setDescription(`Choose up to ${maxSelect} cards to play`)
			.setColor("Blue");

		const selectMenu = new StringSelectMenuBuilder()
			.setCustomId('lb_card_selection')
			.setMaxValues(maxSelect)
			.setMinValues(1)
			.setPlaceholder('Select your cards');

		playerCards.forEach((card, index) => {
			selectMenu.addOptions({
				label: `${card.label}`,
				value: `card_${index}`,
				emoji: card.emoji
			});
		});

		const selectRow = new ActionRowBuilder<StringSelectMenuBuilder>()
			.addComponents(selectMenu);

		return {
			embeds: [embed],
			components: [selectRow],
			ephemeral: true
		};
	}
}