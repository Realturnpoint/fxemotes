/**
 * FX Emotes — Property Inspector Script
 *
 * Handles two-level dropdowns: City → Emote.
 * Sends settings back to the plugin via the Stream Deck WebSocket.
 */

// City data is loaded from plugin/ui/data/cities/*.js
const CITIES = window.CITIES || {};

// ─── State ─────────────────────────────────────────────────────────────────────
var uuid;
var websocket;
var currentSettings = {};

// ─── Stream Deck handshake ─────────────────────────────────────────────────────
function connectElgatoStreamDeckSocket(inPort, inPropertyInspectorUUID, inRegisterEvent, _inInfo, _inActionInfo) {
	uuid = inPropertyInspectorUUID;
	websocket = new WebSocket("ws://127.0.0.1:" + inPort);

	websocket.onopen = function () {
		websocket.send(JSON.stringify({ event: inRegisterEvent, uuid: uuid }));
		websocket.send(JSON.stringify({ event: "getSettings", context: uuid }));
	};

	websocket.onmessage = function (evt) {
		var data = JSON.parse(evt.data);
		if (data.event === "didReceiveSettings") {
			loadSettings(data.payload.settings);
		}
	};
}

// ─── Build city dropdown ───────────────────────────────────────────────────────
function buildCityDropdown() {
	var sel = document.getElementById("cityKey");
	sel.innerHTML = "";
	Object.keys(CITIES).forEach(function (key) {
		var opt = document.createElement("option");
		opt.value = key;
		opt.textContent = CITIES[key].label;
		sel.appendChild(opt);
	});
}

// ─── Build emote dropdown for a given city ─────────────────────────────────────
function buildEmoteDropdown(cityKey) {
	var sel = document.getElementById("emoteCommand");
	sel.innerHTML = "";

	var city = CITIES[cityKey];
	if (!city) return;

	// Group emotes by category using <optgroup>
	var groups = {};
	city.emotes.forEach(function (emote) {
		var cat = emote.category || "General";
		if (!groups[cat]) groups[cat] = [];
		groups[cat].push(emote);
	});

	// Blank/placeholder first option
	var blank = document.createElement("option");
	blank.value = "";
	blank.textContent = "— Select an emote —";
	sel.appendChild(blank);

	Object.keys(groups).forEach(function (cat) {
		var group = document.createElement("optgroup");
		group.label = cat;
		groups[cat].forEach(function (emote) {
			var opt = document.createElement("option");
			opt.value = emote.command;
			opt.textContent = emote.label + "  (" + emote.command + ")";
			group.appendChild(opt);
		});
		sel.appendChild(group);
	});
}

// ─── Load settings into the UI ──────────────────────────────────────────────────
function loadSettings(settings) {
	if (!settings) return;
	currentSettings = Object.assign({}, settings);

	var cityKey = settings.cityKey || Object.keys(CITIES)[0];
	document.getElementById("cityKey").value = cityKey;

	buildEmoteDropdown(cityKey);
	document.getElementById("emoteCommand").value = settings.emoteCommand || "";
	updatePressPreview(settings.emoteCommand || "");

	document.getElementById("commandReleased").value = settings.commandReleased || "";
	document.getElementById("buttonLabel").value = settings.buttonLabel || "";
}

// ─── Update the "On Press" preview label ──────────────────────────────────────
function updatePressPreview(command) {
	var el = document.getElementById("pressPreview");
	el.textContent = command ? command : "—";
}

// ─── Save settings back to the plugin ────────────────────────────────────────
function saveSettings() {
	if (!websocket || websocket.readyState !== WebSocket.OPEN) return;

	var settings = Object.assign({}, currentSettings);
	settings.cityKey         = document.getElementById("cityKey").value;
	settings.emoteCommand    = document.getElementById("emoteCommand").value;
	settings.commandReleased = document.getElementById("commandReleased").value;
	settings.buttonLabel     = document.getElementById("buttonLabel").value;

	currentSettings = settings;

	websocket.send(JSON.stringify({
		event:   "setSettings",
		context: uuid,
		payload: settings
	}));
}

// ─── City dropdown changed ────────────────────────────────────────────────────
function onCityChange() {
	var cityKey = document.getElementById("cityKey").value;
	buildEmoteDropdown(cityKey);
	document.getElementById("emoteCommand").value = "";
	updatePressPreview("");
	saveSettings();
}

// ─── Emote dropdown changed ───────────────────────────────────────────────────
function onEmoteChange() {
	var command = document.getElementById("emoteCommand").value;
	updatePressPreview(command);
	saveSettings();
}

// ─── Init ─────────────────────────────────────────────────────────────────────
(function init() {
	buildCityDropdown();
	buildEmoteDropdown(Object.keys(CITIES)[0]);
})();

