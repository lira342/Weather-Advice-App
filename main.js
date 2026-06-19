const searchInput = document.querySelector(".search-input");
const leftpanel = document.querySelector(".left-panel");
const locationText = document.querySelector(".location-text");
const defaultLocationHTML = locationText ? locationText.innerHTML : "";
const apiKey = "a0a2dbc137c9a309bf51c40ac5c49cd3";

let debounceTimer = null;
let lastQuery = "";

function showLoading() {
  leftpanel.classList.add("loading");
}

function hideLoading() {
  leftpanel.classList.remove("loading");
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

  loadLocationWeather();
}

async function loadLocationWeather() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        await getWeather(null, {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      async () => {
        await getWeather("Auckland Park");
      },
    );
  } else {
    await getWeather("Johannesburg");
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

async function getWeather(city, coords) {
  showLoading();

  try {
    let url;
    if (coords && coords.latitude != null && coords.longitude != null) {
      url = `https://api.openweathermap.org/data/2.5/weather?lat=${coords.latitude}&lon=${coords.longitude}&appid=${apiKey}&units=metric`;
    } else if (city) {
      const location = await geocodeLocation(city);
      if (!location) {
        displayerror("Location not found. Please try another search.");
        return;
      }
      url = `https://api.openweathermap.org/data/2.5/weather?lat=${location.lat}&lon=${location.lon}&appid=${apiKey}&units=metric`;
    } else {
      displayerror("Please enter a city name.");
      return;
    }

    const res = await fetch(url);

    const data = await res.json();
    displayWeatherinfo(data);
  } catch (err) {
    console.error(err);
    displayerror("Network error. Please try again.");
  } finally {
    hideLoading();
  }
}

async function geocodeLocation(city) {
  const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(
    city,
  )}&limit=1&appid=${apiKey}`;

  const res = await fetch(url);
  const data = await res.json();

  if (!Array.isArray(data) || data.length === 0) {
    return null;
  }

  return data[0];
}

function displayWeatherinfo(data) {
  const locationName = `${data.name}, ${data.sys && data.sys.country ? data.sys.country : ""}`;

  if (locationText) {
    locationText.textContent = locationName;
  }

  const iconImg = document.querySelector(".weather-icon");
  if (iconImg) {
    iconImg.src = getWeatherIcon(data.weather[0].main);
    iconImg.alt = data.weather[0].description || "weather icon";
  }

  const tempElem = document.querySelector(".left-panel .temperature");
  if (tempElem) {
    tempElem.textContent = `${Math.round(data.main.temp)}°C`;
  }

  // Update temperature on today.html
  const weatherTempLarge = document.querySelector(".weather-temp-large");
  if (weatherTempLarge) {
    weatherTempLarge.textContent = `${Math.round(data.main.temp)}°C`;
  }

  const weatherIconLarge = document.querySelector(".weather-icon-large");
  if (weatherIconLarge) {
    weatherIconLarge.textContent = getWeatherEmoji(data.weather[0].main);
  }

  const feelsLike = document.querySelector(".feels-like");
  if (feelsLike) {
    feelsLike.textContent = `Feels like ${Math.round(data.main.feels_like)}°C`;
  }

  updateAdvice(data.main.temp);

  if (data.coord && data.coord.lat != null && data.coord.lon != null) {
    fetchAndDisplayForecast(data.coord.lat, data.coord.lon);
  }

  const summaryElem = document.querySelector(".weather-summary");
  if (summaryElem) {
    summaryElem.textContent = data.weather[0].description || "";
  }

  const metaSpans = document.querySelectorAll(".weather-meta span");
  const now = new Date();
  if (metaSpans.length >= 2) {
    metaSpans[0].textContent = now.toLocaleDateString(undefined, {
      weekday: "long",
    });
    metaSpans[1].textContent = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const summaryValues = document.querySelectorAll(
    ".summary-item .summary-value",
  );

  if (summaryValues.length >= 3) {
    const rainAmount = data.rain ? data.rain["1h"] || data.rain["3h"] || 0 : 0;
    const windSpeed = Math.round(data.wind.speed);
    const humidity = Math.round(data.main.humidity);

    summaryValues[0].textContent = `${Math.round(rainAmount)}%`;
    summaryValues[1].textContent = `${windSpeed} km/h`;
    summaryValues[2].textContent = `${humidity}%`;
  }

  const humidityValue = document.getElementById("humidity-value");
  const humiditySubtitle = document.getElementById("humidity-subtitle");
  const windValue = document.getElementById("wind-value");
  const windSubtitle = document.getElementById("wind-subtitle");
  const uvValue = document.getElementById("uv-value");
  const uvSubtitle = document.getElementById("uv-subtitle");
  const visibilityValue = document.getElementById("visibility-value");
  const visibilitySubtitle = document.getElementById("visibility-subtitle");
  const pressureValue = document.getElementById("pressure-value");
  const pressureSubtitle = document.getElementById("pressure-subtitle");

  if (humidityValue)
    humidityValue.textContent = `${Math.round(data.main.humidity)}%`;
  if (humiditySubtitle) {
    humiditySubtitle.textContent =
      data.main.humidity >= 80
        ? "Very high"
        : data.main.humidity >= 60
          ? "High"
          : data.main.humidity >= 40
            ? "Moderate"
            : "Low";
  }

  if (windValue) windValue.textContent = `${Math.round(data.wind.speed)} km/h`;
  if (windSubtitle) {
    windSubtitle.textContent =
      data.wind.speed >= 20
        ? "Strong"
        : data.wind.speed >= 10
          ? "Moderate"
          : "Light";
  }

  if (uvValue)
    uvValue.textContent = data.uvi != null ? `${Math.round(data.uvi)}` : "--";
  if (uvSubtitle) {
    const uvIndex = data.uvi != null ? data.uvi : null;
    uvSubtitle.textContent =
      uvIndex == null
        ? "Unknown"
        : uvIndex >= 8
          ? "Very high"
          : uvIndex >= 6
            ? "High"
            : uvIndex >= 3
              ? "Moderate"
              : "Low";
  }

  if (visibilityValue)
    visibilityValue.textContent =
      data.visibility != null
        ? `${Math.round(data.visibility / 1000)} km`
        : "--";
  if (visibilitySubtitle) {
    const distanceKm = data.visibility != null ? data.visibility / 1000 : null;
    visibilitySubtitle.textContent =
      distanceKm == null
        ? "Unknown"
        : distanceKm >= 10
          ? "Good"
          : distanceKm >= 5
            ? "Fair"
            : "Poor";
  }

  if (pressureValue)
    pressureValue.textContent =
      data.main.pressure != null
        ? `${Math.round(data.main.pressure)} hPa`
        : "--";
  if (pressureSubtitle) {
    const pressure = data.main.pressure != null ? data.main.pressure : null;
    pressureSubtitle.textContent =
      pressure == null
        ? "Unknown"
        : pressure >= 1020
          ? "High"
          : pressure >= 1000
            ? "Normal"
            : "Low";
  }

  const sunriseElem = document.getElementById("sunrise-value");
  const sunsetElem = document.getElementById("sunset-value");
  if (sunriseElem || sunsetElem) {
    const timezoneOffset = (data.timezone || 0) * 1000;
    const formatLocalTime = (timestamp) => {
      if (!timestamp) return "--:--";
      return new Intl.DateTimeFormat("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "UTC",
      }).format(new Date(timestamp * 1000 + timezoneOffset));
    };

    if (sunriseElem && data.sys && data.sys.sunrise) {
      sunriseElem.textContent = formatLocalTime(data.sys.sunrise);
    }
    if (sunsetElem && data.sys && data.sys.sunset) {
      sunsetElem.textContent = formatLocalTime(data.sys.sunset);
    }
  }
}

function getWeatherIcon(weatherMain) {
  const iconMap = {
    Clear: "icons/sun.png",
    Sunny: "icons/sun.png",
    Clouds: "icons/cloud.png",
    Cloudy: "icons/partly cloudy.png",
    Overcast: "icons/cloud.png",
    Rain: "icons/heavy-rain.png",
    Drizzle: "icons/heavy-rain.png",
    Thunderstorm: "icons/storm.png",
    Thunder: "icons/thunder.png",
    Snow: "icons/snowflake.png",
    Mist: "icons/partly cloudy.png",
    Smoke: "icons/cloud.png",
    Haze: "icons/cloud.png",
    Dust: "icons/cloud.png",
    Fog: "icons/cloud.png",
    Sand: "icons/cloud.png",
    Ash: "icons/cloud.png",
    Squall: "icons/storm.png",
    Tornado: "icons/storm.png",
  };
  return iconMap[weatherMain] || "icons/sun.png";
}

function getWeatherEmoji(weatherMain) {
  const emojiMap = {
    Clear: "☀️",
    Sunny: "☀️",
    Clouds: "☁️",
    Cloudy: "⛅",
    Overcast: "☁️",
    Rain: "🌧️",
    Drizzle: "🌧️",
    Thunderstorm: "⛈️",
    Thunder: "⛈️",
    Snow: "❄️",
    Mist: "🌫️",
    Smoke: "🌫️",
    Haze: "🌫️",
    Dust: "🌫️",
    Fog: "🌫️",
    Sand: "🌫️",
    Ash: "🌫️",
    Squall: "⛈️",
    Tornado: "⛈️",
  };
  return emojiMap[weatherMain] || "☀️";
}

async function fetchAndDisplayForecast(lat, lon) {
  try {
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    const res = await fetch(url);
    const forecastData = await res.json();

    if (!forecastData || !forecastData.list || !forecastData.city) return;

    const timezoneOffset = (forecastData.city.timezone || 0) * 1000;

    const daysMap = new Map();
    forecastData.list.forEach((entry) => {
      const localDate = new Date(entry.dt * 1000 + timezoneOffset);
      const dateKey = localDate.toISOString().slice(0, 10);

      const existing = daysMap.get(dateKey) || {
        temps: [],
        icons: [],
        times: [],
      };
      existing.temps.push(entry.main.temp);
      existing.times.push({ hour: localDate.getUTCHours(), entry });
      existing.icons.push(entry.weather[0]);
      daysMap.set(dateKey, existing);
    });

    // Build an array of days in chronological order
    const days = Array.from(daysMap.keys())
      .sort()
      .map((dateKey) => {
        const info = daysMap.get(dateKey);
        const tempMax = Math.round(Math.max(...info.temps));
        const tempMin = Math.round(Math.min(...info.temps));

        // pick an icon near midday if possible
        let chosen =
          info.times.find(
            (t) => t.entry.dt_txt && t.entry.dt_txt.includes("12:00:00"),
          ) || info.times[0];
        const weatherMain = chosen.entry.weather[0].main;

        return {
          date: dateKey,
          dayName: new Date(dateKey + "T00:00:00").toLocaleDateString(
            undefined,
            {
              weekday: "short",
            },
          ),
          max: tempMax,
          min: tempMin,
          main: weatherMain,
        };
      });

    const forecastRows = document.querySelectorAll("#weekly-focust");
    if (!forecastRows.length) return;

    const emojiMap = {
      Clear: "☀️",
      Sunny: "☀️",
      Clouds: "☁️",
      Cloudy: "⛅",
      Rain: "🌧️",
      Drizzle: "🌧️",
      Thunderstorm: "⛈️",
      Snow: "❄️",
      Mist: "🌫️",
    };

    forecastRows.forEach((forecastRow) => {
      const cards = forecastRow.querySelectorAll(".forecast-card");

      for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        const day = days[i];
        if (!day) break;

        const dayLabel = card.querySelector("div:first-child");
        const tempEl = card.querySelector(".forecast-temp");
        const lowEl = card.querySelector(".forecast-low");
        const iconEl = card.querySelector(".forecast-icon, .forecast-icon4");

        if (dayLabel) dayLabel.textContent = day.dayName;
        if (tempEl) tempEl.textContent = `${day.max}°C`;
        if (lowEl) lowEl.textContent = `${day.min}°C`;
        if (iconEl) iconEl.textContent = emojiMap[day.main] || "☀️";
      }
    });

    // Update hourly forecast with the next 7 future forecast points
    const nowLocal = new Date(Date.now() + timezoneOffset);
    const hourlyEntries = forecastData.list
      .map((entry) => ({
        entry,
        localDate: new Date(entry.dt * 1000 + timezoneOffset),
      }))
      .filter(({ localDate }) => localDate >= nowLocal)
      .sort((a, b) => a.entry.dt - b.entry.dt)
      .slice(0, 7);

    const hourlyForecastRow = document.querySelector("#hourly-forecast");
    if (hourlyForecastRow) {
      const hourlyCards = hourlyForecastRow.querySelectorAll(".forecast-card");

      for (let i = 0; i < hourlyCards.length; i++) {
        const card = hourlyCards[i];
        const item = hourlyEntries[i];
        if (!item) break;

        const entry = item.entry;
        const timeLabel = card.querySelector("div:first-child");
        const tempEl = card.querySelector(".forecast-temp");
        const lowEl = card.querySelector(".forecast-low");

        const entryTime = item.localDate;
        const hourString = entryTime.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });

        if (timeLabel) timeLabel.textContent = hourString;
        if (tempEl) tempEl.textContent = `${Math.round(entry.main.temp)}°C`;
        if (lowEl) lowEl.textContent = `${Math.round(entry.main.feels_like)}°C`;
      }
    }
  } catch (err) {
    console.error("Forecast fetch error", err);
  }
}

function updateAdvice(temp) {
  const wear = document.getElementById("adv-wear-txt");
  const safety = document.getElementById("adv-safety-txt");
  const activity = document.getElementById("adv-activity-txt");

  if (temp < 15) {
    wear.textContent = "Wear a warm jacket and long pants.";

    safety.textContent = "Cold weather. Keep warm and stay dry.";

    activity.textContent = "Good day for indoor activities.";
  } else if (temp < 25) {
    wear.textContent = "Wear a light jacket or comfortable clothing.";

    safety.textContent = "Stay hydrated throughout the day.";

    activity.textContent = "Perfect weather for a walk outdoors.";
  } else {
    wear.textContent = "Wear light clothing and a hat.";

    safety.textContent = "Use sunscreen and drink water.";

    activity.textContent = "Great weather for outdoor activities.";
  }
}

function displayerror(message) {
  const errormessage = document.createElement("div");
  errormessage.textContent = message;
  errormessage.classList.add("error-message");

  leftpanel.textContent = "";
  leftpanel.style.display = "block";
  leftpanel.appendChild(errormessage);
}
