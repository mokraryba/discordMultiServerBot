import { BlackjackEmoji, BlackjackCard } from './types'
import { shuffle } from '../../../utils/utils'

export const emojis: BlackjackEmoji[] = [
	{ name: "RA", emoji: `<:rA:1003016156766027897>` },
	{ name: "BA", emoji: `<:bA:1003005321763115099>` },

	{ name: "R2", emoji: `<:r2:1003016166324838460>` },
	{ name: "B2", emoji: `<:b2:1003008677567012916>` },

	{ name: "R3", emoji: `<:r3:1003016167297912883>` },
	{ name: "B3", emoji: `<:b3:1003008678934356038>` },

	{ name: "R4", emoji: `<:r4:1003016163174924358>` },
	{ name: "B4", emoji: `<:b4:1003008297143631964>` },

	{ name: "R5", emoji: `<:r5:1003016164185739364>` },
	{ name: "B5", emoji: `<:b5:1003008296376074250>` },

	{ name: "R6", emoji: `<:r6:1003016165293052026>` },
	{ name: "B6", emoji: `<:b6:1003008290344669186>` },

	{ name: "R7", emoji: `<:r7:1003016162126348368>` },
	{ name: "B7", emoji: `<:b7:1003008680150695986>` },

	{ name: "R8", emoji: `<:r8:1003016160779976764>` },
	{ name: "B8", emoji: `<:b8:1003008298787807263>` },

	{ name: "R9", emoji: `<:r9:1003016159647514705>` },
	{ name: "B9", emoji: `<:b9:1003008291556835423>` },

	{ name: "R10", emoji: `<:r10:1003016158208864266>` },
	{ name: "B10", emoji: `<:b10:1003008288893448294>` },

	{ name: "RJ", emoji: `<:rJ:1003016614477832243>` },
	{ name: "BJ", emoji: `<:bJ:1003008294106963999>` },

	{ name: "RQ", emoji: `<:rQ:1003016859022524417>` },
	{ name: "BQ", emoji: `<:bQ:1003008292714446859>` },

	{ name: "RK", emoji: `<:rK:1003016788327530566>` },
	{ name: "BK", emoji: `<:bK:1003008295377850568>` },

	{ color: "B", name: "C", emoji: `<:eclubs:1003013046395998228>` },
	{ color: "R", name: "D", emoji: `<:diamonds:1003013047452971049>` },
	{ color: "R", name: "H", emoji: `<:hearths:1003013048514121758>` },
	{ color: "B", name: "S", emoji: `<:spades:1003007388628033536>` }
]

const createDeck = (): BlackjackCard[] => {
	const deck: BlackjackCard[] = []
	for (let i = 1; i < 14; i++) {
		let val: string | number = i
		if (i == 1) val = "A"
		if (i == 11) val = "J"
		if (i == 12) val = "Q"
		if (i == 13) val = "K"

		const faces = ['BC', 'BS', 'RD', 'RH']
		faces.forEach(face => {
			const foundEmoji = emojis.find(c => c.name == face[0] + val)
			const emojiFace = emojis.find(c => c.color == face[0] && c.name == face[1])
			deck.push({
				value: i,
				name: `${face}${val}`,
				emoji: foundEmoji?.emoji,
				face: emojiFace?.emoji
			})
		})
	}
	// return shuffle(deck)
	return deck;
}

export const DECK = createDeck();
