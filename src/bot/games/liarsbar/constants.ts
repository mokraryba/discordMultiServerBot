import { shuffle } from "../../../utils/utils";
import { LiarsBarCard } from "./types";

export const emojis: LiarsBarCard[] = [
	{ name: "RA", emoji: `<:rA:1003016156766027897>`, label: "Ace" },
	{ name: "RJ", emoji: `<:rJ:1003016614477832243>`, label: "Jack" },
	{ name: "RQ", emoji: `<:rQ:1003016859022524417>`, label: "Queen" },
	{ name: "RK", emoji: `<:rK:1003016788327530566>`, label: "King" },
]

export const createDeck = (): LiarsBarCard[] => {
	const deck: LiarsBarCard[] = []
	emojis.forEach(card => {
		let num = 6;
		if (card.name == "RJ") num = 2;
		for (var i = 0; i < num; i++) {
			deck.push({
				name: card.name,
				emoji: card.emoji,
				label: card.label
			})
		}

	})
	return shuffle(deck)
}

export const DECK = createDeck()