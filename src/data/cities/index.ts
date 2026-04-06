import type { City } from "../types";
import { infinityRpCity } from "./infinity-rp";
import { eldoradoCity } from "./eldorado";

/** All supported cities keyed by a stable identifier. */
export const CITIES: Record<string, City> = {
	"infinity-rp": infinityRpCity,
	"eldorado": eldoradoCity
};
