import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";
import { SlotsGame } from "./types";
import { IDiscordUser } from "../../../database/models/DiscordUser";
import { random } from "../../../utils/utils";


export class GameEmbedBuilder {
	static generateEmbed({ gameState, slots, channelId, guildId, user }: {
		gameState: SlotsGame,
		slots: string[],
		user?: IDiscordUser,
		channelId: string,
		guildId: string
	}) {
		const embed = new EmbedBuilder()
			.setColor(0x993399)
		const row = new ActionRowBuilder<ButtonBuilder>()

		const reserveBtn = new ButtonBuilder()
			.setCustomId("slots_btn_reserve")
			.setLabel("Reserve")
			.setStyle(ButtonStyle.Primary)

		const changeWagerBtn = new ButtonBuilder()
			.setCustomId('slots_btn_changewager')
			.setLabel('Change wager')
			.setStyle(ButtonStyle.Success)

		const leaveBtn = new ButtonBuilder()
			.setCustomId('slots_btn_leave')
			.setLabel('Leave')
			.setStyle(ButtonStyle.Danger)

		const playBtn = new ButtonBuilder()
			.setCustomId('slots_btn_play')
			.setLabel('Play')
			.setStyle(ButtonStyle.Primary)

		const genField = (name: string, slot: string) => ({ name, value: slot, inline: true })

		if (!gameState || gameState.state == "Idle" || !user) {
			let ran = slots[random(0, slots.length - 1)]
			embed.setTitle("Slots (not occupied)")
				.addFields(
					{ name: "Slot 1", value: ran, inline: true },
					{ name: "Slot 2", value: ran, inline: true },
					{ name: "Slot 3", value: ran, inline: true },
					{ name: "Take me for a spin 🥵", value: " " },
				)
			row.addComponents(reserveBtn)
			return { embed, row }
		}

		switch (gameState.state) {
			case "Occupied":
				embed.setTitle("Slots (occupied)")

		}


		return { embed, row }

	}
}