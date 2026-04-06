import { CITIES } from "./cities";
import type { Emote } from "./types";

export { CITIES };
export type { Emote, City } from "./types";

/** Returns the list of city keys in order. */
export function getCityKeys(): string[] {
	return Object.keys(CITIES);
}

/** Returns a flat array of emotes for the given city key, or empty if not found. */
export function getEmotes(cityKey: string): Emote[] {
	return CITIES[cityKey]?.emotes ?? [];
}
