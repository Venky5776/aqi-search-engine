// script.js — updated to call your Spring Boot backend and update the DOM

const pollutantNames = {
    CO: "Carbon Monoxide",
    NO2: "Nitrogen Dioxide",
    SO2: "Sulfur Dioxide",
    O3: "Ozone",
    PM10: "Particulate Matter 10",
    PM25: "Particulate Matter 2.5",
    DEW: "Dew Point",
    P: "Air Pressure",
    H: "Humidity",
    T: "Temperature",
    W: "Wind Speed"
};

function getAQICategory(aqi) {
    if (aqi <= 50) return { level: "Good", className: "good", msg: "Air quality is excellent. Safe to breathe." };
    if (aqi <= 100) return { level: "Moderate", className: "moderate", msg: "Air quality is acceptable with minor risks for sensitive groups." };
    if (aqi <= 150) return { level: "Unhealthy for Sensitive Groups", className: "unhealthy-sensitive", msg: "May cause irritation for asthma or heart patients." };
    if (aqi <= 200) return { level: "Unhealthy", className: "unhealthy", msg: "Everyone may feel discomfort. Reduce outdoor activities." };
    if (aqi <= 300) return { level: "Very Unhealthy", className: "very-unhealthy", msg: "Serious health risks. Stay indoors as much as possible." };
    return { level: "Hazardous", className: "hazardous", msg: "Emergency warning. Avoid going outside." };
}

// Hook form submit
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("search-form");
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        await doSearch();
    });
});

async function doSearch() {
    const cityInput = document.getElementById("city-input");
    const city = cityInput.value.trim();
    const messageEl = document.getElementById("message");
    const resultsContainer = document.getElementById("results-container");

    // hide previous
    messageEl.classList.add("hidden");
    resultsContainer.classList.add("hidden");

    if (!city) {
        messageEl.innerText = "Please enter a city name.";
        messageEl.classList.remove("hidden");
        return;
    }

    try {
        // call your backend endpoint (path variable URL)
        const backendUrl = `http://localhost:8080/aqi/${encodeURIComponent(city)}`;
        const res = await fetch(backendUrl);

        if (!res.ok) {
            messageEl.innerText = `Server returned ${res.status} ${res.statusText}`;
            messageEl.classList.remove("hidden");
            return;
        }

        const json = await res.json();

        // The service returns the WAQI response structure (status + data)
        // Example: { status: "ok", data: { aqi: 99, iaqi: { pm25: {v: 12}, co: {v: 0.4}, ... }, time: {...} } }
        if (!json || (json.status && json.status !== "ok")) {
            messageEl.innerText = "City not found or API returned error.";
            messageEl.classList.remove("hidden");
            return;
        }

        const data = json.data;
        if (!data) {
            messageEl.innerText = "No data returned for this city.";
            messageEl.classList.remove("hidden");
            return;
        }

        renderResults(city, data);

    } catch (err) {
        console.error(err);
        messageEl.innerText = "Error contacting backend. Make sure backend is running on http://localhost:8080";
        messageEl.classList.remove("hidden");
    }
}

function renderResults(city, data) {
    const resultsContainer = document.getElementById("results-container");
    const cityNameDisplay = document.getElementById("city-name-display");
    const aqiValueEl = document.getElementById("aqi-value");
    const pollutantsDetail = document.getElementById("pollutants-detail");
    const lastUpdated = document.getElementById("last-updated");

    // fill city and AQI
    cityNameDisplay.innerText = city;
    const aqi = (typeof data.aqi === "number") ? data.aqi : (data.aqi ? Number(data.aqi) : null);

    aqiValueEl.innerText = aqi !== null ? aqi : "--";

    // style aqi-card using classes
    const aqiCard = document.getElementById("aqi-card");
    aqiCard.className = "aqi-card"; // reset classes
    if (aqi !== null) {
        const cat = getAQICategory(aqi);
        aqiCard.classList.add(cat.className);
        // show health message under aqi-value
        // remove existing small message if any
        let existing = document.getElementById("health-message-inline");
        if (existing) existing.remove();
        const msg = document.createElement("div");
        msg.id = "health-message-inline";
        msg.style.marginTop = "10px";
        msg.style.fontSize = "1rem";
        msg.style.fontWeight = "600";
        msg.innerText = `${cat.level} — ${cat.msg}`;
        aqiCard.appendChild(msg);
    }

    // Pollutants parsing: WAQI uses iaqi object with keys like pm25, no2, co, o3, so2, t, w, h, p etc.
    const iaqi = data.iaqi || {};
    // Build list items
    let listHtml = "<h3>Key Pollutants:</h3><ul>";
    // iterate common keys we want to display in nice order
    const keysOrder = ["pm25", "pm10", "co", "no2", "so2", "o3", "t", "h", "w", "p", "dew"];
    const seen = new Set();
    for (const key of keysOrder) {
        if (iaqi[key]) {
            const short = key.toUpperCase().replace("PM25","PM25").replace("PM10","PM10");
            const value = iaqi[key].v;
            const displayName = mapIaqiKeyToFullName(key);
            listHtml += `<li><strong>${displayName}:</strong> ${value}</li>`;
            seen.add(key);
        }
    }
    // add any other pollutant keys that weren't in keysOrder
    for (const k in iaqi) {
        if (!seen.has(k)) {
            const value = iaqi[k].v;
            const displayName = mapIaqiKeyToFullName(k);
            listHtml += `<li><strong>${displayName}:</strong> ${value}</li>`;
        }
    }
    listHtml += "</ul>";
    pollutantsDetail.innerHTML = listHtml;

    // timestamp: WAQI often has data.time.s or data.time.iso, try those
    let timeText = "--";
    if (data.time) {
        if (data.time.s) timeText = data.time.s;
        else if (data.time.iso) timeText = data.time.iso;
        else if (data.time.t) timeText = String(data.time.t);
    } else {
        // fallback to now
        timeText = new Date().toLocaleString();
    }
    lastUpdated.innerText = timeText;

    // show container
    resultsContainer.classList.remove("hidden");
}

function mapIaqiKeyToFullName(key) {
    key = key.toLowerCase();
    switch (key) {
        case "co": return "Carbon Monoxide (CO)";
        case "no2": return "Nitrogen Dioxide (NO₂)";
        case "so2": return "Sulfur Dioxide (SO₂)";
        case "o3": return "Ozone (O₃)";
        case "pm10": return "Particulate Matter 10 (PM10)";
        case "pm25": return "Particulate Matter 2.5 (PM2.5)";
        case "t": return "Temperature (°C)";
        case "h": return "Humidity (%)";
        case "w": return "Wind Speed (m/s)";
        case "p": return "Air Pressure (hPa)";
        case "dew": return "Dew Point";
        default: return key.toUpperCase();
    }
}
