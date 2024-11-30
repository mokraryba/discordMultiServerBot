import { BlackjackCard, BlackjackGame } from './types'
import { DECK } from './constants'
import { shuffle } from '../../../utils/utils'

export class CardManager {
	static calcValue(hand: BlackjackCard[]): number {
		let val = 0
		let tmpHand = [...hand]
		tmpHand.sort((a, b) => b.value - a.value).forEach(d => {
			if (d.value == 1) {
				if (val + 11 > 21) val += 1
				else val += 11
			} else if (d.value > 10) {
				val += 10
			} else
				val += d.value
		})
		return val
	}

	static pickCard(who = 0, amount: number, channelId: string, games: BlackjackGame[]): void {
		let foundGame = games.find(d => d.channelId == channelId)
		if (!foundGame) return

		// Check if we have enough cards
		const totalCardsNeeded = amount
		const remainingCards = foundGame.deck.length

		// If we don't have enough cards, collect all cards except those in play
		if (remainingCards < totalCardsNeeded) {
			// Create fresh deck
			foundGame.deck = [...DECK]
			// Remove cards that are in player/dealer hands
			foundGame.deck = foundGame.deck.filter(card =>
				!foundGame!.playerHand.some(c => c.name === card.name) &&
				!foundGame!.dealerHand.some(c => c.name === card.name)
			)
			// Shuffle remaining cards
			foundGame.deck = shuffle(foundGame.deck)
		}

		// Deal requested cards
		for (let i = 0; i < amount; i++) {
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

	static getCardEmojis(game: BlackjackGame): [string, string] {
		let dealer = game.dealerHand.map(c => c.emoji).join(" ") + "\n" + game.dealerHand.map(c => c.face).join(" ")
		let player = game.playerHand.map(c => c.emoji).join(" ") + "\n" + game.playerHand.map(c => c.face).join(" ")
		return [dealer, player]
	}

	static getNewDeck(): BlackjackCard[] {
		return shuffle([...DECK])
	}
}
