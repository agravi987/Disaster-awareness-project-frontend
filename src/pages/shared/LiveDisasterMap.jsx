import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
    FiAlertTriangle,
    FiCloudRain,
    FiCrosshair,
    FiFilter,
    FiMapPin,
    FiRefreshCw,
    FiThermometer,
    FiWind,
} from 'react-icons/fi';
import {
    geocodeDisasterLocation,
    getDisasterNews,
    getDisasterOverview,
    getDisasterWeather,
} from '../../services/api';
import './LiveDisasterMap.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const DEFAULT_LOCATION = {
    label: 'India (Default)',
    lat: 20.5937,
    lng: 78.9629,
};

const radiusOptions = [100, 250, 500, 1000];
const severityOptions = ['all', 'high', 'medium', 'low'];
const maxTypeFilters = 8;

const formatDate = (value) => {
    if (!value) return 'Unknown time';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Unknown time';
    return date.toLocaleString();
};

const getSeverityIcon = (severity, active = false) =>
    L.divIcon({
        className: 'custom-marker-wrap',
        html: `<span class="custom-marker custom-marker-${severity || 'low'} ${active ? 'custom-marker-active' : ''}"></span>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
        popupAnchor: [0, -10],
    });

function MapFlyToEvent({ event }) {
    const map = useMap();

    useEffect(() => {
        if (!event?.coordinates?.lat || !event?.coordinates?.lng) return;
        map.flyTo([event.coordinates.lat, event.coordinates.lng], Math.max(map.getZoom(), 6), {
            duration: 0.8,
        });
    }, [event, map]);

    return null;
}

function LiveDisasterMap() {
    const [locationInput, setLocationInput] = useState('Chennai, India');
    const [focus, setFocus] = useState(DEFAULT_LOCATION);
    const [radiusKm, setRadiusKm] = useState(500);

    const [events, setEvents] = useState([]);
    const [summary, setSummary] = useState(null);
    const [news, setNews] = useState([]);
    const [weather, setWeather] = useState(null);

    const [selectedSeverity, setSelectedSeverity] = useState('all');
    const [selectedType, setSelectedType] = useState('all');
    const [selectedEventId, setSelectedEventId] = useState(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const loadDisasterIntel = useCallback(async (lat, lng, label, selectedRadius = 500) => {
        setLoading(true);
        setError('');
        try {
            const [overviewRes, newsRes, weatherRes] = await Promise.all([
                getDisasterOverview({ lat, lng, radiusKm: selectedRadius }),
                getDisasterNews({ location: label, limit: 8 }),
                getDisasterWeather({ lat, lng }),
            ]);

            const incomingEvents = overviewRes.data?.events || [];
            setEvents(incomingEvents);
            setSummary(overviewRes.data?.summary || null);
            setNews(newsRes.data?.articles || []);
            setWeather(weatherRes.data || null);
            setFocus({ lat, lng, label });
            setSelectedEventId(incomingEvents[0]?.id || null);
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Failed to load live disaster data.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const loadInitialData = async () => {
            if (!navigator.geolocation) {
                loadDisasterIntel(DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lng, DEFAULT_LOCATION.label, radiusKm);
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    loadDisasterIntel(latitude, longitude, 'My Current Location', radiusKm);
                },
                () => {
                    loadDisasterIntel(DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lng, DEFAULT_LOCATION.label, radiusKm);
                },
                { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
            );
        };

        loadInitialData();
    }, [loadDisasterIntel, radiusKm]);

    const topTypes = useMemo(() => {
        const entries = Object.entries(summary?.countsByType || {});
        return entries
            .sort((a, b) => b[1] - a[1])
            .slice(0, maxTypeFilters)
            .map(([type]) => type);
    }, [summary]);

    const filteredEvents = useMemo(() => {
        return events.filter((event) => {
            const severityMatch =
                selectedSeverity === 'all' || event.severity === selectedSeverity;
            const typeMatch = selectedType === 'all' || event.type === selectedType;
            return severityMatch && typeMatch;
        });
    }, [events, selectedSeverity, selectedType]);

    const mapEvents = useMemo(() => filteredEvents.slice(0, 120), [filteredEvents]);
    const feedEvents = useMemo(() => filteredEvents.slice(0, 10), [filteredEvents]);
    const topNews = useMemo(() => news.slice(0, 6), [news]);

    const selectedEvent = useMemo(
        () => filteredEvents.find((event) => event.id === selectedEventId) || null,
        [filteredEvents, selectedEventId]
    );

    useEffect(() => {
        if (!selectedEventId) return;
        const exists = filteredEvents.some((event) => event.id === selectedEventId);
        if (!exists) {
            setSelectedEventId(filteredEvents[0]?.id || null);
        }
    }, [filteredEvents, selectedEventId]);

    const handleSearchLocation = async (event) => {
        event.preventDefault();
        const query = locationInput.trim();
        if (!query) return;

        try {
            setError('');
            const { data } = await geocodeDisasterLocation(query);
            const first = data?.results?.[0];
            if (!first) {
                setError('No matching location found. Try city, district, or country.');
                return;
            }
            await loadDisasterIntel(first.lat, first.lng, first.displayName, radiusKm);
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Could not find location.');
        }
    };

    const handleUseMyLocation = () => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported in this browser.');
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                loadDisasterIntel(latitude, longitude, 'My Current Location', radiusKm);
            },
            () => {
                setError('Location permission denied. Search manually instead.');
            },
            { enableHighAccuracy: true, timeout: 6000, maximumAge: 120000 }
        );
    };

    return (
        <div className="live-map-page">
            <div className="page-header live-map-header">
                <div>
                    <h1 className="page-title">Live Disaster Map</h1>
                    <p className="subtitle">Location-aware incidents, weather risk signals, and disaster headlines.</p>
                </div>
            </div>

            <section className="card live-map-controls">
                <form onSubmit={handleSearchLocation} className="live-map-form">
                    <div className="form-group">
                        <label htmlFor="locationSearch">Search Location</label>
                        <input
                            id="locationSearch"
                            type="text"
                            value={locationInput}
                            onChange={(event) => setLocationInput(event.target.value)}
                            placeholder="City, district, or country"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="radiusFilter">Radius</label>
                        <select
                            id="radiusFilter"
                            value={radiusKm}
                            onChange={(event) => {
                                const nextRadius = Number(event.target.value);
                                setRadiusKm(nextRadius);
                                loadDisasterIntel(focus.lat, focus.lng, focus.label, nextRadius);
                            }}
                        >
                            {radiusOptions.map((radius) => (
                                <option key={radius} value={radius}>
                                    {radius} km
                                </option>
                            ))}
                        </select>
                    </div>
                    <button type="submit" className="btn btn-primary">
                        <FiMapPin /> Find Area
                    </button>
                    <button type="button" className="btn btn-outline" onClick={handleUseMyLocation}>
                        <FiCrosshair /> Use My Location
                    </button>
                    <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => loadDisasterIntel(focus.lat, focus.lng, focus.label, radiusKm)}
                    >
                        <FiRefreshCw /> Refresh
                    </button>
                </form>
                <p className="focus-label">Current focus: {focus.label}</p>
            </section>

            {error ? <div className="alert alert-error">{error}</div> : null}

            {summary ? (
                <section className="grid-4 live-map-summary">
                    <div className="card summary-card">
                        <p>Total events</p>
                        <h3>{summary.totalEvents}</h3>
                    </div>
                    <div className="card summary-card">
                        <p>High severity</p>
                        <h3>{summary.highSeverity}</h3>
                    </div>
                    <div className="card summary-card">
                        <p>Last 24 hours</p>
                        <h3>{summary.recent24h}</h3>
                    </div>
                    <div className="card summary-card">
                        <p>Distinct types</p>
                        <h3>{Object.keys(summary.countsByType || {}).length}</h3>
                    </div>
                </section>
            ) : null}

            <section className="live-map-layout">
                <div className="card map-card">
                    <div className="map-card-head">
                        <h2>
                            <FiAlertTriangle /> Incident Map
                        </h2>
                        <div className="map-status">
                            <span>Showing {filteredEvents.length} of {events.length}</span>
                            {loading ? <span className="map-loading">Loading...</span> : null}
                        </div>
                    </div>

                    <div className="map-filter-panel">
                        <div className="map-filter-row">
                            <p><FiFilter /> Severity</p>
                            <div className="map-filter-chips">
                                {severityOptions.map((severity) => (
                                    <button
                                        key={severity}
                                        type="button"
                                        className={`chip ${selectedSeverity === severity ? 'chip-active' : ''}`}
                                        onClick={() => setSelectedSeverity(severity)}
                                    >
                                        {severity}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="map-filter-row">
                            <p><FiFilter /> Hazard Type</p>
                            <div className="map-filter-chips">
                                <button
                                    type="button"
                                    className={`chip ${selectedType === 'all' ? 'chip-active' : ''}`}
                                    onClick={() => setSelectedType('all')}
                                >
                                    all
                                </button>
                                {topTypes.map((type) => (
                                    <button
                                        key={type}
                                        type="button"
                                        className={`chip ${selectedType === type ? 'chip-active' : ''}`}
                                        onClick={() => setSelectedType(type)}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="map-legend">
                            <span><i className="legend-dot high" /> High</span>
                            <span><i className="legend-dot medium" /> Medium</span>
                            <span><i className="legend-dot low" /> Low</span>
                        </div>
                    </div>

                    <MapContainer
                        key={`${focus.lat}-${focus.lng}-${radiusKm}`}
                        center={[focus.lat, focus.lng]}
                        zoom={5}
                        scrollWheelZoom={true}
                        className="leaflet-map"
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Circle
                            center={[focus.lat, focus.lng]}
                            radius={radiusKm * 1000}
                            pathOptions={{ color: '#2e7d32', fillColor: '#66bb6a', fillOpacity: 0.12 }}
                        />
                        <MapFlyToEvent event={selectedEvent} />
                        {mapEvents.map((event) => (
                            <Marker
                                key={event.id}
                                position={[event.coordinates.lat, event.coordinates.lng]}
                                icon={getSeverityIcon(event.severity, event.id === selectedEventId)}
                                eventHandlers={{
                                    click: () => setSelectedEventId(event.id),
                                }}
                            >
                                <Popup>
                                    <strong>{event.title}</strong>
                                    <p>{event.type}</p>
                                    <p>Severity: {event.severity}</p>
                                    <p>{formatDate(event.occurredAt)}</p>
                                    {event.distanceKm ? <p>Distance: {event.distanceKm} km</p> : null}
                                    {event.url ? (
                                        <a href={event.url} target="_blank" rel="noreferrer">
                                            View source
                                        </a>
                                    ) : null}
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>
                </div>

                <div className="live-map-side">
                    <div className="card">
                        <h2 className="side-title">
                            <FiCloudRain /> Weather Snapshot
                        </h2>
                        {weather?.current ? (
                            <>
                                <div className="weather-grid">
                                    <div>
                                        <span>
                                            <FiThermometer /> Temperature
                                        </span>
                                        <strong>{weather.current.temperatureC} C</strong>
                                    </div>
                                    <div>
                                        <span>
                                            <FiCloudRain /> Rain
                                        </span>
                                        <strong>{weather.current.precipitationMm} mm</strong>
                                    </div>
                                    <div>
                                        <span>
                                            <FiWind /> Wind
                                        </span>
                                        <strong>{weather.current.windSpeedKmh} km/h</strong>
                                    </div>
                                </div>
                                <div className="risk-list">
                                    {weather.riskSignals?.length ? (
                                        weather.riskSignals.map((signal) => (
                                            <p key={signal} className="risk-item">{signal}</p>
                                        ))
                                    ) : (
                                        <p className="risk-ok">No immediate severe weather signal.</p>
                                    )}
                                </div>
                            </>
                        ) : (
                            <p className="subtitle">Weather data is loading.</p>
                        )}
                    </div>

                    <div className="card side-list">
                        <h2 className="side-title">Nearby Incident Feed</h2>
                        {feedEvents.length ? (
                            <ul>
                                {feedEvents.map((event) => (
                                    <li key={`feed-${event.id}`}>
                                        <button
                                            type="button"
                                            className={`event-link-btn ${selectedEventId === event.id ? 'event-link-btn-active' : ''}`}
                                            onClick={() => setSelectedEventId(event.id)}
                                        >
                                            <strong>{event.title}</strong>
                                            <span>
                                                {event.type} - {event.distanceKm ? `${event.distanceKm} km` : 'Global'}
                                            </span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="subtitle">No incidents found for this range and filter.</p>
                        )}
                    </div>

                    <div className="card side-list">
                        <h2 className="side-title">Location Disaster News</h2>
                        {topNews.length ? (
                            <ul>
                                {topNews.map((article) => (
                                    <li key={article.url}>
                                        <a href={article.url} target="_blank" rel="noreferrer">
                                            {article.title}
                                        </a>
                                        <span>{article.source?.name || 'Source'}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="subtitle">No related articles yet.</p>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}

export default LiveDisasterMap;
