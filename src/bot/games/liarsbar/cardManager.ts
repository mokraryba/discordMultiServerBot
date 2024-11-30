import { random } from "../../../utils/utils";
import { DECK } from "./constants";
import { LiarsBarGame } from "./types";

export class CardManager {
	static pickCard(playerIndex: number, amount: number, game: LiarsBarGame) {
		if (game.players) {
			for (var i = 0; i < amount; i++) {
				let card = game.gameData?.deck.shift()!
				game.players[playerIndex].cards.push(card)
			}
		}
	}

	static selectGameCard(game: LiarsBarGame): string {
		let gd = game.gameData!
		let filteredDeck = DECK.filter(c => c.label != "Jack")
		let randomCard = filteredDeck[random(0, filteredDeck.length! - 1)]
		if (!randomCard) console.log({ deck: DECK })
		gd.card = randomCard.label!
		return gd.card;
	}

}