import streamDeck from "@elgato/streamdeck";
import { EmoteCommandAction } from "./actions/emote-command";

streamDeck.actions.registerAction(new EmoteCommandAction());
streamDeck.connect();
