const map = L.map("mapid");
const search_city = document.querySelector(".control__search");
const API_KEY = "APPID=9c8eb3371091b748edb50cc9d42feed3";
const BASE_URL = "https://api.openweathermap.org/data/2.5";

L.tileLayer(
  "https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}",
  {
    maxZoom: 18,
    id: "mapbox.streets",
    accessToken:
      "pk.eyJ1IjoibWlzaGFza29wZW5rbyIsImEiOiJjanptcGhocm0wZjAyM25wN3NmZndlYnNrIn0.iRrbRZu8d_zkoLH5VXezAA"
  }
).addTo(map.setView([55.75, 37.62], 3));

/* Fetch data */

function SEARCH(city) {
  fetch(`${BASE_URL}/weather?q=${city},ru&units=metric&${API_KEY}`).then(
    async response => {
      if (response.status !== 200) {
        return;
      }
      const data = await response.json();
      store.weather.set(data);
    }
  );
}

fetch(
  `https://gist.githubusercontent.com/gorborukov/0722a93c35dfba96337b/raw/435b297ac6d90d13a68935e1ec7a69a225969e58/russia`
).then(async response => {
  if (response.status !== 200) {
    return;
  }
  const data = await response.json();
  store.listCity.set(data);
});

/* Utilities */

class Observable {
  constructor() {
    this.value = undefined;
    this.callbacks = [];
  }
  onChange(callback) {
    this.callbacks.push(callback);
  }
  set(value) {
    this.value = value;
    this.callbacks.forEach(cb => cb(value));
  }
}

function numberT(n, text) {
  n = Math.abs(n) % 100;
  var n1 = n % 10;

  if (n > 10 && n < 20) {
    return text[2];
  }

  if (n1 > 1 && n1 < 5) {
    return text[1];
  }

  if (n1 === 1) {
    return text[0];
  }

  return text[2];
}

document.querySelector(".control__button").addEventListener("click", () => {
  SEARCH(search_city.value);
  showTemperature();
});

document.addEventListener("keydown", e => {
  if (e.keyCode === 13) {
    SEARCH(search_city.value);
    showTemperature();
  }
});

const store = {
  weather: new Observable(),
  listCity: new Observable()
};

function showTemperature() {
  store.weather.onChange(weather => {
    console.log(weather)
    map.setView([weather.coord.lat, weather.coord.lon], 10);
    const MARKER = L.marker([weather.coord.lat, weather.coord.lon]).addTo(map);
    MARKER.bindPopup(
      `
    <div class='popup__name'>${weather.name} </div>
  
   <div class='popup__temp'> температура: <span>${Math.round(
     weather.main.temp
   )}&#8451;</span> ${numberT(Math.round(weather.main.temp), [
        "градус",
        "градуса",
        "градуcов"
      ])}
     </div>
    <img src='http://openweathermap.org/img/wn/${
      weather.weather[0].icon
    }@2x.png' title='${weather.weather[0].main}'></img>
    <div>Местное время ${getDate(weather.timezone)}</div>`
    ).openPopup();
  });
}

function createList(city, parentList, citypast) {
  const ListItem = document.createElement("li");
  ListItem.classList.add("list__item");
  ListItem.innerHTML = city;
  ListItem.addEventListener("click", () => {
    SEARCH(citypast);
    showTemperature();
  });
  parentList.append(ListItem);
}

function getDate(timezone) {
  const date = new Date().getUTCHours();

  let hours = date + timezone / 60 / 60;
  if (date + timezone / 60 / 60 >= 24) {
    hours = "0" + (hours - 24);
  }

  let minutes = new Date().getMinutes();
  if (minutes < 10) {
    minutes = "0" + minutes;
  }

  return `${hours}:${minutes}`;
}

function insertMark(string, pos, len) {
  return `${string.slice(0, pos)}<mark>${string.slice(
    pos,
    pos + len
  )}</mark>${string.slice(pos + len)}`;
}

function getCityList() {
  store.listCity.onChange(listCities => {
    const List = document.querySelector(".listCity");
    const names = listCities.map(c => c.city.trim());
    const unique = Array.from(new Set(names));
    const sorted = unique.sort();
    sorted.forEach(cityName => {
      const ar = cityName;
      createList(cityName, List, ar);
    });
    search_city.addEventListener("input", () => {
      while (List.firstChild) {
        List.removeChild(List.firstChild);
      }
      sorted
        .filter(city =>
          city.toLowerCase().startsWith(search_city.value.toLowerCase())
        )
        .forEach(cityName => {
          const city = insertMark(
            cityName,
            cityName.toLowerCase().startsWith(search_city.value.length),
            search_city.value.length
          );
          createList(city, List, cityName);
        });
    });
  });
}

getCityList();
SEARCH();
