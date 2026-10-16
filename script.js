
const aircraftTrails = new Map();
const MAX_TRAIL_POINTS = 12;

const API_URL =
    "/api/states/all?lamin=12&lomin=79&lamax=14&lomax=81";

const map = L.map("map").setView([13.1, 80.2], 7);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);

const aircraftMarkers = new Map();

let aircraftList = [];
let selectedAircraft = null;
let lastSuccessfulUpdate = null;

const aircraftTable = document.getElementById("aircraftTable");
const connectionStatus = document.getElementById("connectionStatus");
const message = document.getElementById("message");

function displayValue(value, unit = "") {
    if (value === null || value === undefined || !Number.isFinite(value)) {
        return "Unavailable";
    }

    return `${Math.round(value).toLocaleString()}${unit}`;
}


function showFlightDetails(aircraft) {
    selectedAircraft = aircraft;

    const details = document.getElementById("flightDetails");
    const freshness = getDataFreshness(aircraft);

    let statusClass = "status-unknown";

    if (freshness.label.startsWith("FRESH")) {
        statusClass = "status-fresh";
    } else if (freshness.label.startsWith("STALE")) {
        statusClass = "status-stale";
    }

    details.innerHTML = `
        <p class="eyebrow">SELECTED AIRCRAFT</p>
        <h2>${aircraft.callsign || "Unknown callsign"}</h2>
        <p>ICAO24: ${aircraft.icao24}</p>

        <div class="${statusClass}">
            DATA STATUS: ${freshness.label}
        </div>

        <div class="detail-grid">
            <div class="detail-item">
                <span>ALTITUDE</span>
                <strong>${displayValue(aircraft.altitude, " m")}</strong>
            </div>
            <div class="detail-item">
                <span>GROUND SPEED</span>
                <strong>${displayValue(aircraft.velocity, " m/s")}</strong>
            </div>
            <div class="detail-item">
                <span>HEADING</span>
                <strong>${displayValue(aircraft.heading, "°")}</strong>
            </div>
            <div class="detail-item">
                <span>ON GROUND</span>
                <strong>${aircraft.onGround ? "Yes" : "No"}</strong>
            </div>
        </div>
    `;
}


function updateStatistics(aircraft) {
    document.getElementById("aircraftCount").textContent =
        aircraft.length.toLocaleString();

    const airborne = aircraft.filter(
        plane => !plane.onGround && plane.altitude !== null
    );

    const moving = aircraft.filter(
        plane => plane.velocity !== null
    );

    const averageAltitude = airborne.length
        ? airborne.reduce((sum, plane) => sum + plane.altitude, 0) /
          airborne.length
        : null;

    const averageSpeed = moving.length
        ? moving.reduce((sum, plane) => sum + plane.velocity, 0) /
          moving.length
        : null;

    document.getElementById("averageAltitude").textContent =
        averageAltitude === null ? "—" : displayValue(averageAltitude, " m");

    document.getElementById("averageSpeed").textContent =
        averageSpeed === null ? "—" : displayValue(averageSpeed, " m/s");
}


function updateTable() {
    const search = document.getElementById("searchInput")
        .value.trim().toLowerCase();

    const filtered = aircraftList.filter(plane =>
        (plane.callsign || "").toLowerCase().includes(search) ||
        plane.icao24.toLowerCase().includes(search)
    );

    if (filtered.length === 0) {
        aircraftTable.innerHTML =
            '<tr><td colspan="5">No matching aircraft found.</td></tr>';
        return;
    }

    aircraftTable.innerHTML = filtered.slice(0, 100).map(plane => `
        <tr data-icao="${plane.icao24}" style="cursor: pointer;">
            <td>${plane.callsign || "Unknown"}</td>
            <td>${plane.icao24}</td>
            <td>${displayValue(plane.altitude, " m")}</td>
            <td>${displayValue(plane.velocity, " m/s")}</td>
            <td>${plane.onGround ? "Yes" : "No"}</td>
        </tr>
    `).join("");

    // Make each aircraft row clickable
    aircraftTable.querySelectorAll("tr[data-icao]").forEach(row => {
        row.addEventListener("click", () => {
            const icao = row.dataset.icao;

            const plane = aircraftList.find(
                aircraft => aircraft.icao24 === icao
            );

            if (!plane) return;

            // Zoom the map to the selected aircraft
            if (plane.latitude != null && plane.longitude != null) {
                map.setView(
                    [plane.latitude, plane.longitude],
                    10
                );
            }

            // Display the selected aircraft's details
            showFlightDetails(plane);

            // Highlight the selected row
            aircraftTable.querySelectorAll("tr").forEach(item => {
                item.classList.remove("selected-row");
            });

            row.classList.add("selected-row");
        });
    });
}


aircraftTable.addEventListener("click", event => {
    const row = event.target.closest("tr[data-icao]");

    if (!row) return;

    const aircraft = aircraftList.find(
        plane => plane.icao24 === row.dataset.icao
    );

    if (aircraft) {
        showFlightDetails(aircraft);

        if (aircraft.latitude !== null && aircraft.longitude !== null) {
            map.setView([aircraft.latitude, aircraft.longitude], 10);
            aircraftMarkers.get(aircraft.icao24)?.openPopup();
        }
    }
});

document.getElementById("searchInput").addEventListener("input", updateTable);

async function fetchAircraft() {
    const refreshButton = document.getElementById("refreshButton");

    refreshButton.disabled = true;
    connectionStatus.textContent = "CONNECTING";
    message.textContent = "Requesting aircraft data from OpenSky...";

    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error(`OpenSky returned HTTP ${response.status}`);
        }

        const data = await response.json();

        if (!Array.isArray(data.states)) {
            throw new Error("The response did not contain aircraft state data.");
        }

        aircraftList = data.states.map(state => ({
            icao24: state[0],
            callsign: (state[1] || "").trim(),
            longitude: state[5],
            latitude: state[6],
            altitude: state[7],
            onGround: state[8],
            velocity: state[9],
            heading: state[10],
            lastContact: state[4]
        }));

        lastSuccessfulUpdate = new Date();

        const positionedAircraft = aircraftList.filter(
            plane =>
                plane.latitude !== null &&
                plane.longitude !== null &&
                Number.isFinite(plane.latitude) &&
                Number.isFinite(plane.longitude)
        );

        const visibleIds = new Set(
            positionedAircraft.map(plane => plane.icao24)
        );

        
for (const [icao24, marker] of aircraftMarkers) {
    if (!visibleIds.has(icao24)) {
        map.removeLayer(marker);
        aircraftMarkers.delete(icao24);

        // Remove the trail when the aircraft is no longer returned
        const trail = aircraftTrails.get(icao24);

        if (trail) {
            map.removeLayer(trail);
            aircraftTrails.delete(icao24);
        }
    }
}


        positionedAircraft.forEach(plane => {
            const position = [plane.latitude, plane.longitude];

            
            // Record this aircraft's recent positions
            let trailData = aircraftTrails.get(plane.icao24);

            if (!trailData) {
                trailData = {
                    positions: [],
                    line: null
                };
                aircraftTrails.set(plane.icao24, trailData);
            }

            const positions = trailData.positions;
            const lastPosition = positions[positions.length - 1];

            // Avoid recording the same position twice
            if (
                !lastPosition ||
                lastPosition[0] !== position[0] ||
                lastPosition[1] !== position[1]
            ) {
                positions.push(position);
            }

            // Keep only the most recent 12 positions
            while (positions.length > MAX_TRAIL_POINTS) {
                positions.shift();
            }

            // Draw or update the aircraft's movement trail
            if (!trailData.line) {
                trailData.line = L.polyline(positions, {
                    color: "#38bdf8",
                    weight: 3,
                    opacity: 0.85
                }).addTo(map);

                trailData.line.bringToBack();
            } else {
                trailData.line.setLatLngs(positions);
            }


            let marker = aircraftMarkers.get(plane.icao24);

            if (marker) {
                marker.setLatLng(position);
            } else {
                marker = L.marker(position).addTo(map);
                aircraftMarkers.set(plane.icao24, marker);
            }

            
            const freshness = getDataFreshness(plane);

            marker.bindPopup(
                `<strong>${plane.callsign || "Unknown aircraft"}</strong>` +
                `<br>ICAO24: ${plane.icao24}` +
                `<br>Altitude: ${displayValue(plane.altitude, " m")}` +
                `<br>Data status: ${freshness.label}`
            );


            marker.off("click");
            marker.on("click", () => showFlightDetails(plane));
        });

        updateStatistics(aircraftList);
        updateTable();

        document.getElementById("lastUpdated").textContent =
            lastSuccessfulUpdate.toLocaleTimeString();

        document.getElementById("dataStatus").textContent =
            "Latest request succeeded";

        connectionStatus.textContent = "CONNECTED";
        message.textContent =
            `Showing ${positionedAircraft.length} aircraft with valid positions.`;

        if (selectedAircraft) {
            const updatedSelection = aircraftList.find(
                plane => plane.icao24 === selectedAircraft.icao24
            );

            if (updatedSelection) {
                showFlightDetails(updatedSelection);
            } else {
                selectedAircraft = null;
                document.getElementById("flightDetails").innerHTML =
                    "<h4>Aircraft no longer in the latest response</h4>" +
                    "<p>Select another aircraft to inspect its flight data.</p>";
            }
        }
    } catch (error) {
        console.error("SkyWatch data error:", error);

        connectionStatus.textContent = "CONNECTION ERROR";
        message.textContent =
            `${error.message}. Your last successful data, if any, is retained.`;

        document.getElementById("dataStatus").textContent =
            lastSuccessfulUpdate
                ? `Last success: ${lastSuccessfulUpdate.toLocaleTimeString()}`
                : "No successful data yet";
    } finally {
        refreshButton.disabled = false;
    }
}


function getDataFreshness(plane) {
    if (!Number.isFinite(plane.lastContact)) {
        return {
            label: "UNKNOWN",
            className: "status-unknown"
        };
    }

    const ageSeconds = Math.max(
        0,
        Date.now() / 1000 - plane.lastContact
    );

    if (ageSeconds > 120) {
        return {
            label: `STALE (${Math.round(ageSeconds)}s)`,
            className: "status-stale"
        };
    }

    return {
        label: `FRESH (${Math.round(ageSeconds)}s)`,
        className: "status-fresh"
    };
}


document.getElementById("refreshButton")
    .addEventListener("click", fetchAircraft);

fetchAircraft();

// Refresh every 60 seconds to avoid unnecessarily frequent requests.
setInterval(fetchAircraft, 60000);
