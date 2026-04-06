/** A single emote entry. */
export type Emote = {
	/** Display label shown in the dropdown. */
	label: string;
	/** The FiveM console command to execute (e.g. "e wave"). */
	command: string;
	/** Optional category for grouping. */
	category?: string;
};

/** A city/server entry containing its emote list. */
export type City = {
	/** Display label for the city dropdown. */
	label: string;
	/** Ordered list of emotes available on this server. */
	emotes: Emote[];
};
