import streamDeck, {
	action,
	DidReceiveSettingsEvent,
	KeyDownEvent,
	KeyUpEvent,
	SingletonAction,
	WillAppearEvent,
	WillDisappearEvent
} from "@elgato/streamdeck";

import { ConnectionManager } from "../connection-manager";

const logger = streamDeck.logger.createScope("EmoteCommandAction");

const DELAY_MS = 500;

/** Delay helper. */
function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Settings persisted per button instance.
 *
 * - cityKey:          which city is selected in the dropdown (e.g. "infinity-rp")
 * - emoteCommand:     the full on-press command built from the selected emote (e.g. "e wave")
 * - commandReleased:  custom on-release command typed by the user (e.g. "e c")
 * - buttonLabel:      optional custom label shown on the Stream Deck key
 */
export type EmoteSettings = {
	cityKey: string;
	emoteCommand: string;
	commandReleased: string;
	buttonLabel: string;
};

function defaultSettings(): EmoteSettings {
	return {
		cityKey: "infinity-rp",
		emoteCommand: "",
		commandReleased: "",
		buttonLabel: ""
	};
}

@action({ UUID: "com.turnpoint.fxemotes.emote" })
export class EmoteCommandAction extends SingletonAction<EmoteSettings> {
	private connectionManager = new ConnectionManager();

	override async onWillAppear(ev: WillAppearEvent<EmoteSettings>): Promise<void> {
		const settings = { ...defaultSettings(), ...ev.payload.settings };
		await ev.action.setSettings(settings);

		if (settings.buttonLabel && ev.action.isKey()) {
			await ev.action.setTitle(settings.buttonLabel);
		}

		// Pre-connect so the first key press sends immediately.
		await this.connectionManager.connect();
	}

	override async onWillDisappear(ev: WillDisappearEvent<EmoteSettings>): Promise<void> {
		// Nothing per-instance to clean up; ConnectionManager is shared.
		void ev;
	}

	override async onDidReceiveSettings(ev: DidReceiveSettingsEvent<EmoteSettings>): Promise<void> {
		const settings = { ...defaultSettings(), ...ev.payload.settings };

		if (ev.action.isKey()) {
			const label = settings.buttonLabel || settings.emoteCommand || "";
			await ev.action.setTitle(label);
		}
	}

	override async onKeyDown(ev: KeyDownEvent<EmoteSettings>): Promise<void> {
		const settings = { ...defaultSettings(), ...ev.payload.settings };

		if (!settings.emoteCommand) {
			logger.warn("Key pressed but no emote is selected");
			await ev.action.showAlert();
			return;
		}

		logger.debug(`KeyDown: ${settings.emoteCommand}`);
		const ok = await this.sendCommand(settings.emoteCommand);
		if (!ok) await ev.action.showAlert();
	}

	override async onKeyUp(ev: KeyUpEvent<EmoteSettings>): Promise<void> {
		const settings = { ...defaultSettings(), ...ev.payload.settings };

		if (!settings.commandReleased) return;

		logger.debug(`KeyUp: ${settings.commandReleased}`);
		const ok = await this.sendCommand(settings.commandReleased);
		if (!ok) await ev.action.showAlert();
	}

	/**
	 * Send a command string, supporting delayed sequences.
	 *
	 * Syntax:
	 *   "e sit;;me relaxes"              — 500 ms gap between commands
	 *   "e sit;{1500ms};me looks"        — explicit ms gap
	 *   "e sit;me relaxes on the ground" — chained with no delay (single ;)
	 */
	private async sendCommand(command: string): Promise<boolean> {
		const tokens: Array<{ type: "cmd"; value: string } | { type: "delay"; ms: number }> = [];
		let remaining = command;

		while (remaining.length > 0) {
			const match = remaining.match(/;?;;|;?\{(\d+)ms\};?/i);
			if (!match) {
				tokens.push({ type: "cmd", value: remaining.trim() });
				break;
			}

			const before = remaining.slice(0, match.index).trim();
			if (before) tokens.push({ type: "cmd", value: before });

			const ms = match[1] ? parseInt(match[1], 10) : DELAY_MS;
			tokens.push({ type: "delay", ms });

			remaining = remaining.slice(match.index! + match[0].length);
		}

		let success = true;
		for (const token of tokens) {
			if (token.type === "delay") {
				await sleep(token.ms);
			} else if (token.value) {
				const sent = await this.connectionManager.send(token.value);
				if (!sent) success = false;
			}
		}

		return success;
	}
}
