import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';
import * as toGeoJSON from 'togeojson';
import * as turf from '@turf/turf';

function App() {
  const [geoJsonData, setGeoJsonData] = useState(null);
  const [summary, setSummary] = useState(null);
  const [details, setDetails] = useState(null);
  const mapRef = useRef();

  // Handle file upload and parse KML to GeoJSON
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const parser = new DOMParser();
      const kml = parser.parseFromString(text, 'text/xml');
      const geoJson = toGeoJSON.kml(kml);
      setGeoJsonData(geoJson);
      // Reset previous outputs when a new file is loaded
      setSummary(null);
      setDetails(null);
    };
    reader.readAsText(file);
  };

  // Generate a summary of geometry types
  const handleSummary = () => {
    if (!geoJsonData) return;
    const counts = {};
    geoJsonData.features.forEach((feature) => {
      const geomType = feature.geometry.type;
      counts[geomType] = (counts[geomType] || 0) + 1;
    });
    setSummary(counts);
  };

  // Calculate detailed lengths for line features
  const handleDetailed = () => {
    if (!geoJsonData) return;
    const detailsData = {};
    geoJsonData.features.forEach((feature) => {
      const geomType = feature.geometry.type;
      if (geomType === 'LineString' || geomType === 'MultiLineString') {
        const length = turf.length(feature, { units: 'kilometers' });
        detailsData[geomType] = (detailsData[geomType] || 0) + length;
      }
    });
    setDetails(detailsData);
  };

  // Auto-adjust map view to fit the uploaded GeoJSON data
  useEffect(() => {
    if (geoJsonData && mapRef.current) {
      // Calculate bounding box using turf
      const bbox = turf.bbox(geoJsonData);
      const southWest = [bbox[1], bbox[0]];
      const northEast = [bbox[3], bbox[2]];
      // Fit the map to the bounds of the GeoJSON layer
      mapRef.current.fitBounds([southWest, northEast], { padding: [20, 20] });
    }
  }, [geoJsonData]);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>KML File Viewer</h1>
      </header>
      <main>
        <section className="upload-section">
          <input 
            type="file" 
            accept=".kml" 
            onChange={handleFileUpload} 
            className="file-input"
          />
          <div className="button-group">
            <button onClick={handleSummary} className="btn">
              Summary
            </button>
            <button onClick={handleDetailed} className="btn">
              Detailed
            </button>
          </div>
        </section>

        {summary && (
          <section className="table-container">
            <h2>Summary</h2>
            <table>
              <thead>
                <tr>
                  <th>Geometry Type</th>
                  <th>Count</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(summary).map(([type, count]) => (
                  <tr key={type}>
                    <td>{type}</td>
                    <td>{count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {details && (
          <section className="table-container">
            <h2>Detailed (Total Length in KM)</h2>
            <table>
              <thead>
                <tr>
                  <th>Geometry Type</th>
                  <th>Total Length (KM)</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(details).map(([type, length]) => (
                  <tr key={type}>
                    <td>{type}</td>
                    <td>{length.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        <section className="map-container">
          <MapContainer
            center={[51.505, -0.09]}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            whenCreated={(mapInstance) => {
              mapRef.current = mapInstance;
            }}
          >
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {geoJsonData && <GeoJSON data={geoJsonData} />}
          </MapContainer>
        </section>
      </main>
      <footer className="app-footer">
        <p>&copy; 2025 KML Viewer</p>
      </footer>
    </div>
  );
}

export default App;
