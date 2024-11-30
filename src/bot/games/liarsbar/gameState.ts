import { Client } from "discord.js";
import { LiarsBarCardAction, LiarsBarCustomAction, LiarsBarGame, LiarsBarShotAction } from "./types";
import GameChannel from "../../../database/models/GameChannel";
import { randomUUID } from "crypto";
import { random, sleep } from "../../../utils/utils";
import { CardManager } from "./cardManager";
import { DECK, createDeck } from "./constants";

export class GameState {
	private games: LiarsBarGame[] = []
	private bot: Client

	constructor(bot: Client) {
		this.bot = bot;
	}

	restart(channelId: string, guildId: string) {
		this.games = this.games.filter(g => g.channelId != channelId && g.guildId != guildId)
	}

	getGame(channelId: string, guildId: string): LiarsBarGame | undefined {
		return this.games.find(g => g.channelId === channelId && g.guildId === guildId)
	}

	joinGame(channelId: string, guildId: string, user: { id: string, type: "user" | "bot" }): LiarsBarGame {
		const game = this.getGame(channelId, guildId)
		if (game) {
			game.joined.push(user)
			return game;
		} else {
			let newGame: LiarsBarGame = {
				channelId,
				guildId,
				joined: [user],
				id: randomUUID(),
				state: "Waiting",
			}
			this.games.push(newGame)
			return newGame;
		}
	}

	leaveGame(channelId: string, guildId: string, user: { id: string, type: "user" | "bot" }): LiarsBarGame | undefined {
		const game = this.getGame(channelId, guildId)
		if (!game) return;
		game.joined = game.joined.filter(j => j.id != user.id)
		if (game.joined.length == 0) {
			this.games = this.games.filter(g => g.id != game.id)
			return undefined;
		}
		return game;
	}


	startGame(channelId: string, guildId: string) {
		const game = this.getGame(channelId, guildId)
		if (!game) return;
		game.state = "Playing"
		game.players = game.joined.map(j => {
			return {
				discordId: j.id,
				cards: [],
				lives: random(1, 6),
				hits: 0,
				alive: true,
				type: j.type
			}
		})
		game.joined = []
		let randomPlayer = game.players[random(0, game.players.length - 1)]
		game.gameData = {
			round: 1,
			actions: [],
			deck: createDeck(),
			card: "",
			turn: randomPlayer.discordId,
		}
		CardManager.selectGameCard(game)
		for (var player in game.players) {
			CardManager.pickCard(Number(player), 5, game)
		}
		if (randomPlayer.type == "bot") {
			this.playBotCard(game.players.findIndex(x => x.discordId == randomPlayer.discordId), game)
		}
		console.log(game.players)
	}

	endGame(game: LiarsBarGame, winner: string) {
		game.state = "Ended"
		game.gameData!.winner = winner;
	}

	async nextRound(game: LiarsBarGame) {
		let players = game.players!
		let isWin = players.filter(p => p.alive).length == 1
		if (isWin) {
			let winner = players.find(p => p.alive)
			await this.endGame(game, winner!.discordId)
			return;
		}
		let lastAction = game.gameData!.actions.slice(-2)
		game.gameData = {
			round: game.gameData!.round + 1,
			actions: lastAction,
			deck: createDeck(),
			card: "",
			turn: players[random(0, players.length - 1)].discordId,
		}
		CardManager.selectGameCard(game)
		players.forEach((p, pi) => {
			p.cards = []
		})
		for (var player in game.players) {
			if (game.players[Number(player)].alive)
				CardManager.pickCard(Number(player), 5, game)
		}
		await this.nextTurn(game)
	}

	async nextTurn(game: LiarsBarGame) {
		if (!game.players) return;
		let gd = game.gameData!
		console.log({ currentTurn: gd.turn })
		let currentTurnIndex = game.players.findIndex(p => p.discordId == gd.turn)
		let nextTurnIndex = currentTurnIndex
		let foundValidPlayer = false

		let playersWith0Cards = game.players.filter(p =>
			p.cards.length == 0
		)
		console.log({ playersWith0Cards: playersWith0Cards.length, players: game.players!.length })
		let isLast = playersWith0Cards.length == game.players.length - 1

		for (let i = 0; i < game.players.length; i++) {
			nextTurnIndex = (nextTurnIndex + 1) % game.players.length
			let nextPlayer = game.players[nextTurnIndex]

			if (nextPlayer.alive && nextPlayer.cards.length > 0 && nextTurnIndex != currentTurnIndex) {
				foundValidPlayer = true
				break
			}
		}

		console.log("next turn", game.players[nextTurnIndex].discordId)

		if (foundValidPlayer) {
			if (isLast) {
				return this.check(nextTurnIndex, game)
			}
			let foundPlayer = game.players[nextTurnIndex]
			gd.turn = foundPlayer.discordId
			if (foundPlayer.type == "bot") {
				await this.playBotCard(nextTurnIndex, game)
			}
		} else {
			console.log("No valid players found for next turn")
			await this.check(currentTurnIndex, game)
		}
	}

	async playBotCard(playerIndex: number, game: LiarsBarGame) {
		if (!game.players) return;
		let gd = game.gameData!
		let player = game.players[playerIndex]
		let playerCards = player.cards
		let randomCardAmount = random(1, playerCards.length > 3 ? 3 : playerCards.length)
		let threwCards = player.cards.splice(0, randomCardAmount)
		gd.actions.push({
			card: threwCards,
			discordId: player.discordId,
			type: "card",
			round: gd.round
		})
		await this.nextTurn(game)
	}

	async playCard(playerIndex: number, indexes: number[], game: LiarsBarGame) {
		if (!game.players) return;
		let gd = game.gameData!
		let player = game.players[playerIndex]
		let playerCards = player.cards.filter((_, i) => indexes.includes(i))
		player.cards = player.cards.filter((_, i) => !indexes.includes(i))
		gd.actions.push({
			card: playerCards,
			discordId: player.discordId,
			type: "card",
			round: gd.round
		})
		return await this.nextTurn(game)
	}

	async check(playerIndex: number, game: LiarsBarGame): Promise<boolean> {
		if (!game.players) return false
		let gd = game.gameData!
		if (!gd) return false;
		let actions = gd.actions
		if (!actions || actions.length == 0) return false;
		let lastAction = [...actions.filter(c => c.type == "card" && c.round == gd.round)].pop() as LiarsBarCardAction
		if (!lastAction) return false;
		if (lastAction.type != "card") return false

		let isInvalidCard = lastAction.card.filter(c => c.label == gd.card || c.label == "Jack").length != lastAction.card.length

		let lastActionUser = game.players.find(p => p.discordId == lastAction.discordId)!
		let currentUser = game.players[playerIndex]

		console.log({ currentPlayer: game.players[playerIndex].discordId, lastActionUser: lastActionUser.discordId })

		let player = isInvalidCard ? lastActionUser : currentUser
		player.hits++
		let newAction: LiarsBarShotAction = {
			discordId: player.discordId,
			hits: player.hits,
			success: false,
			type: "shot",
			round: gd.round
		}
		if (player.hits >= player.lives) {
			player.alive = false
			newAction.success = true;
		}

		console.log(actions)

		let nDesc = `<@${currentUser.discordId}> is checking <@${lastActionUser.discordId}>'s cards.\nPrevious table card was: ${DECK.find(c => c.label == gd.card)?.emoji}\nThey threw: `
		nDesc += `${lastAction.card.map(c => `${c.emoji}`).join(" | ")}`

		let newActionCustom: LiarsBarCustomAction = {
			text: nDesc,
			type: "custom",
			round: gd.round
		}

		gd.actions.push(newActionCustom)
		gd.actions.push(newAction)
		await this.nextRound(game)

		return true;
	}

}