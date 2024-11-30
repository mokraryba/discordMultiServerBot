import { ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js'

export class GameButtons {
	static createReserveButton(): ButtonBuilder {
		return new ButtonBuilder()
			.setCustomId("bj_btn_reserve")
			.setLabel("Reserve")
			.setStyle(ButtonStyle.Primary)
	}

	static createPlayButton(): ButtonBuilder {
		return new ButtonBuilder()
			.setCustomId("bj_btn_play")
			.setLabel("Play")
			.setStyle(ButtonStyle.Primary)
	}

	static createHitButton(): ButtonBuilder {
		return new ButtonBuilder()
			.setCustomId("bj_btn_hit")
			.setLabel("Hit")
			.setStyle(ButtonStyle.Success)
	}

	static createStopButton(): ButtonBuilder {
		return new ButtonBuilder()
			.setCustomId("bj_btn_stop")
			.setLabel("Stop")
			.setStyle(ButtonStyle.Primary)
	}

	static createWagerButton(): ButtonBuilder {
		return new ButtonBuilder()
			.setCustomId("bj_btn_changewager")
			.setLabel("Change Wager")
			.setStyle(ButtonStyle.Success)
	}

	static createLeaveButton(): ButtonBuilder {
		return new ButtonBuilder()
			.setCustomId("bj_btn_leave")
			.setLabel("Leave")
			.setStyle(ButtonStyle.Danger)
	}

	static createGameActionRow(): ActionRowBuilder<ButtonBuilder> {
		return new ActionRowBuilder<ButtonBuilder>()
			.addComponents(
				this.createHitButton(),
				this.createStopButton()
			)
	}

	static createWagerActionRow(): ActionRowBuilder<ButtonBuilder> {
		return new ActionRowBuilder<ButtonBuilder>()
			.addComponents(
				this.createPlayButton(),
				this.createWagerButton(),
				this.createLeaveButton()
			)
	}
}
