# SkyWatch — Real-Time Air Traffic Intelligence

SkyWatch is a web-based air traffic monitoring dashboard that visualizes aircraft positions and flight information using live data from the OpenSky Network. It combines an interactive map, an aircraft registry, flight details, movement trails, and data-freshness indicators in a single interface.

## Features

- **Live aircraft tracking:** Retrieve aircraft state data from the OpenSky Network through a local Python server.
- **Interactive flight map:** Visualize aircraft with Leaflet markers and inspect individual aircraft.
- **Aircraft registry:** Browse aircraft by callsign, ICAO24 identifier, altitude, speed, and ground status.
- **Aircraft search:** Filter the registry by callsign or ICAO24 identifier.
- **Flight details:** Select an aircraft to inspect its available altitude, ground speed, heading, and ground status.
- **Movement trails:** Display recent observed aircraft positions to help visualize movement between updates.
- **Data-freshness indicators:** Label aircraft data as `FRESH`, `STALE`, or `UNKNOWN` based on the reported timestamp.
- **Periodic updates:** Refresh aircraft data automatically and allow manual refreshes.
- **Connection feedback:** Display the status of data requests and handle unsuccessful requests without immediately discarding the last displayed data.

## Technology Stack

| Technology | Purpose |
|---|---|
| HTML5 | Dashboard structure |
| CSS3 | Styling and responsive layout |
| JavaScript | API requests, aircraft data processing, interactions, and updates |
| Leaflet | Interactive map and aircraft markers |
| Python 3 | Local server and API proxy |
| OpenSky Network API | Aircraft state data |

## Getting Started

### Prerequisites

- Python 3 installed on your computer
- Visual Studio Code or another code editor
- A modern web browser
- An internet connection to retrieve aircraft data

### 1. Open the project

Open the SkyWatch project folder in Visual Studio Code.

The main files are:

```text
SkyWatch/
├── index.html
├── style.css
├── script.js
├── server.py
└── README.md
```

### 2. Start the local server

Open the VS Code terminal in the project folder and run:

```powershell
py server.py
```

Keep the terminal open while using the dashboard.

### 3. Open SkyWatch

Visit the following address in your browser:

**http://127.0.0.1:8000**

The dashboard should load and begin requesting aircraft data.

### 4. Explore the dashboard

1. Inspect aircraft markers on the map.
2. Click a marker to view its flight information.
3. Select a row in the aircraft registry to focus on an aircraft.
4. Use the search box to filter by callsign or ICAO24.
5. Observe aircraft movement trails and the data-freshness indicator.
6. Check the connection status and last-update time.

## Data Source

SkyWatch uses the OpenSky Network API to retrieve aircraft state information. The displayed information depends on the data returned by the service and the geographic area configured in the application.

Aircraft fields may be unavailable or delayed. SkyWatch therefore distinguishes fresh, stale, and unknown report timestamps rather than assuming every report is current.

## Data Freshness

The dashboard classifies aircraft reports using their reported `lastContact` timestamp:

- **FRESH:** The report is no more than 120 seconds old.
- **STALE:** The report is more than 120 seconds old.
- **UNKNOWN:** A usable report timestamp is unavailable.

These labels describe the age of the reported data, not a guarantee that an aircraft's current real-world position is exact.

## Error Handling and Limitations

- Aircraft visibility depends on the availability of data from the OpenSky Network.
- Aircraft without valid latitude and longitude values cannot be displayed as map markers.
- API connectivity, service availability, and request limits may affect updates.
- The dashboard requires the local Python server to remain running.
- The freshness indicator reflects the reported timestamp and does not independently verify an aircraft's physical location.

## Future Improvements

Potential extensions include:

- Configurable geographic filters
- Aircraft type and airline information where available
- Historical flight playback
- More detailed connection and API error messages
- Improved accessibility and small-screen layouts
- Additional flight statistics and route visualizations

## Acknowledgements

- [OpenSky Network](https://opensky-network.org/) — aircraft state data
- [Leaflet](https://leafletjs.com/) — interactive mapping library

---

**SkyWatch**  
*Real-time visibility into the skies, one aircraft at a time.*
