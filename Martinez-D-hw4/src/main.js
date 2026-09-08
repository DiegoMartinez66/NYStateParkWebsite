import * as map from "./map.js";
import * as ajax from "./ajax.js";
import * as storage from "./storage.js"
import {increaseParkLikes, decreaseParkLikes} from "./firebase.js";

// I. Variables & constants
// NB - it's easy to get [longitude,latitude] coordinates with this tool: http://geojson.io/
const lnglatNYS = [-75.71615970715911, 43.025810763917775];
const lnglatUSA = [-98.5696, 39.8282];

const btnFavorite = document.querySelector("#btn-favorite");
const btnDelete = document.querySelector("#btn-delete");

let geojson;

let favoriteIds = storage.readFromLocalStorage("ids");

if (!Array.isArray(favoriteIds) || favoriteIds === 0) {
	favoriteIds = [];
};

// II. Functions
const setupUI = () => {
	// NYS Zoom 5.2
	document.querySelector("#btn1").onclick = () => {
		map.setZoomLevel(5.2);
		map.setPitchAndBearing(0, 0);
		map.flyTo(lnglatNYS);
	}

	// NYS isometric view
	document.querySelector("#btn2").onclick = () => {
		map.setZoomLevel(5.5);
		map.setPitchAndBearing(45, 0);
		map.flyTo(lnglatNYS);
	}

	// World zoom 0
	document.querySelector("#btn3").onclick = () => {
		map.setZoomLevel(3);
		map.setPitchAndBearing(0, 0);
		map.flyTo(lnglatUSA);
	}

	refreshFavorites();
}

const showFeatureDetails = (id) => {
	const feature = map.getFeatureById(id);
	document.querySelector("#details-1").innerHTML = `Info for ${feature.properties.title}`;

	const html = `
	<p>${feature.properties.address}</p>
	<a>${feature.properties.url}</a>
	<p><b>Phone:</b> ${feature.properties.phone}</p>`;

	document.querySelector("#details-2").innerHTML = html;
	document.querySelector("#details-3").innerHTML = `${feature.properties.description}`;

	if (isFavorited(id)) {
		btnDelete.disabled = false;
		btnFavorite.disabled = true;
		btnDelete.onclick = () => {
			deleteFavorite(id);
		}
	}

	else {

		btnDelete.disabled = true;
		btnFavorite.disabled = false;

		btnFavorite.onclick = () => {
			addToFavorites(id);
		}
	}
};

const refreshFavorites = () => {
	const favoritesContainer = document.querySelector("#favorites-list");
	favoritesContainer.innerHTML = "";
	for (const id of favoriteIds) {
		favoritesContainer.appendChild(createFavoriteElement(id));
	}
}

const createFavoriteElement = (id) => {
	const feature = map.getFeatureById(id);
	const a = document.createElement("a");
	a.className = "panel-block";
	a.id = feature.id;
	a.onclick = () => {
		showFeatureDetails(a.id);
		map.setZoomLevel(6);
		map.flyTo(feature.geometry.coordinates);
	}

	a.innerHTML = `
	<span class="panel-icon">
		<i class="fas fa-map-pin"></i>
	</span>
	${feature.properties.title}`;

	return a;
}

const addToFavorites = (id) => {
	if (!isFavorited(id)) {
		favoriteIds.push(id);
		storage.writeToLocalStorage("ids", favoriteIds);
		btnDelete.disabled = false;
		btnFavorite.disabled = true;
		btnDelete.onclick = () => {
			deleteFavorite(id);
		}
		refreshFavorites();
		increaseParkLikes(id);
	}
}

const deleteFavorite = (id) => {
	const newIDArray = favoriteIds.filter(item => item !== `${id}`);
	favoriteIds = newIDArray;
	storage.writeToLocalStorage("ids", favoriteIds);
	btnDelete.disabled = true;
	btnFavorite.disabled = false;
	btnFavorite.onclick = () => {
			addToFavorites(id);
		}
	refreshFavorites();
	decreaseParkLikes(id);
}

const isFavorited = (id) => {
	return favoriteIds.includes(id);
}

const init = () => {
	map.initMap(lnglatNYS);

	ajax.downloadFile("data/parks.geojson", (str) => {
		geojson = JSON.parse(str);
		console.log(geojson);
		map.addMarkerToMap(geojson, showFeatureDetails)
		setupUI();
	})
};

init();