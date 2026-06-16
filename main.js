const searchInput = document.querySelector(".search-input");
const leftpanel = document.querySelector(".left-panel");
const locationText = document.querySelector(".location-text");
const defaultLocationHTML = locationText ? locationText.innerHTML : "";
const apiKey = "a0a2dbc137c9a309bf51c40ac5c49cd3";

let debounceTimer = null;
let lastQuery = "";

function showLoading() {
  leftpanel.textContent = "";
  leftpanel.style.display = "block";
  const loading = document.createElement("div");
  loading.classList.add("loading");
  loading.textContent = "Loading...";
  leftpanel.appendChild(loading);
}

function init() {
  const searchBtn = document.getElementById("searchBtn");
  const cityInput = document.getElementById("cityInput") || searchInput;

  if (searchBtn) {
    searchBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      const city = cityInput.value.trim();
      if (city) await getWeather(city);
      else displayerror("Please enter a city name.");
    });
  }

  if (cityInput) {
    cityInput.addEventListener("keydown", async (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const city = cityInput.value.trim();
        if (city) await getWeather(city);
        else displayerror("Please enter a city name.");
      }
    });
    cityInput.addEventListener("input", (e) => {
      lastQuery = e.target.value.trim();

      if (locationText) {
        if (lastQuery) {
          locationText.innerHTML = escapeHTML(lastQuery);
        } else {
          locationText.innerHTML = defaultLocationHTML;
        }
      }
    });
  }
}

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

async function getWeather(city) {
  leftpanel.textContent = "";
  leftpanel.style.display = "block";

  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
        city,
      )}&appid=${apiKey}&units=metric`,
    );

    if (!res.ok) {
      if (res.status === 404) displayerror("City not found.");
      else displayerror("Unable to fetch weather data.");
      return;
    }

    const data = await res.json();
    displayWeatherinfo(data);
  } catch (err) {
    console.error(err);
    displayerror("Network error. Please try again.");
  }
}

function displayWeatherinfo(data) {
  leftpanel.textContent = "";
  leftpanel.style.display = "block";

  const location = document.createElement("h2");
  location.textContent = `${data.name}, ${data.sys && data.sys.country ? data.sys.country : ""}`;

  const iconImg = document.createElement("img");
  const iconUrl = getweatherIcon(data.weather[0].icon);
  iconImg.src = iconUrl;
  iconImg.alt = data.weather[0].description || "weather icon";

  const temp = document.createElement("p");
  temp.classList.add("temperature");
  temp.textContent = `${Math.round(data.main.temp)}°C`;

  const desc = document.createElement("p");
  desc.classList.add("description");
  desc.textContent = data.weather[0].description || "";

  const details = document.createElement("div");
  details.classList.add("details");
  details.innerHTML = `Humidity: ${data.main.humidity}%<br>Wind: ${data.wind.speed} m/s`;

  leftpanel.append(location, iconImg, temp, desc, details);
}

function getweatherIcon(iconCode) {
  return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
}

function displayerror(message) {
  const errormessage = document.createElement("div");
  errormessage.textContent = message;
  errormessage.classList.add("error-message");

  leftpanel.textContent = "";
  leftpanel.style.display = "block";
  leftpanel.appendChild(errormessage);
}
