import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import {
    FiActivity,
    FiAlertTriangle,
    FiClock,
    FiCloudRain,
    FiCrosshair,
    FiDatabase,
    FiDownload,
    FiExternalLink,
    FiFilter,
    FiMapPin,
    FiMousePointer,
    FiNavigation,
    FiRefreshCw,
    FiRotateCcw,
    FiTarget,
    FiThermometer,
    FiWind,
} from 'react-icons/fi';
import {
    geocodeDisasterLocation,
    getDisasterNews,
    getDisasterOverview,
    getDisasterWeather,
    reverseGeocodeDisasterLocation,
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

const DEFAULT_RADIUS_KM = 500;
const radiusOptions = [100, 250, DEFAULT_RADIUS_KM, 1000];
const severityOptions = ['all', 'high', 'medium', 'low'];
const timeWindowOptions = [
    { value: 'all', label: 'All time' },
    { value: '24h', label: '24 hours' },
    { value: '72h', label: '72 hours' },
    { value: '7d', label: '7 days' },
];
const sortOptions = [
    { value: 'recent', label: 'Newest first' },
    { value: 'nearest', label: 'Nearest first' },
    { value: 'severity', label: 'Highest severity' },
];
const maxTypeFilters = 8;

const sourceDescriptions = {
    USGS: 'Real-time earthquake feed',
    'NASA EONET': 'Active natural hazard feed',
};

const severityLabels = {
    high: 'High',
    medium: 'Medium',
    low: 'Low',
};

const formatDate = (value) => {
    if (!value) return 'Unknown time';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Unknown time';
    return date.toLocaleString();
};

const formatDistance = (value) =>
    typeof value === 'number' ? `${value.toFixed(value < 10 ? 1 : 0)} km away` : 'Distance unavailable';

const escapeCsv = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

const severityScore = (severity) => {
    if (severity === 'high') return 3;
    if (severity === 'medium') return 2;
    return 1;
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
        if (
            typeof event?.coordinates?.lat !== 'number' ||
            typeof event?.coordinates?.lng !== 'number'
        ) {
            return;
        }

        map.flyTo([event.coordinates.lat, event.coordinates.lng], Math.max(map.getZoom(), 6), {
            duration: 0.8,
        });
    }, [event, map]);

    return null;
}

function MapClickSelector({ onPick }) {
    useMapEvents({
        click(event) {
            onPick?.(event.latlng);
        },
    });

    return null;
}

function LiveDisasterMap() {
    const locationInputRef = useRef(null);
    const [locationInput, setLocationInput] = useState('Chennai, India');
    const [focus, setFocus] = useState(DEFAULT_LOCATION);
    const [radiusKm, setRadiusKm] = useState(DEFAULT_RADIUS_KM);

    const [events, setEvents] = useState([]);
    const [summary, setSummary] = useState(null);
    const [news, setNews] = useState([]);
    const [weather, setWeather] = useState(null);

    const [selectedSeverity, setSelectedSeverity] = useState('all');
    const [selectedType, setSelectedType] = useState('all');
    const [selectedTimeWindow, setSelectedTimeWindow] = useState('all');
    const [sortBy, setSortBy] = useState('recent');
    const [selectedEventId, setSelectedEventId] = useState(null);
    const [overviewStatus, setOverviewStatus] = useState({
        stale: false,
        message: '',
        updatedAt: null,
    });
    const [weatherStatus, setWeatherStatus] = useState({
        stale: false,
        message: '',
        updatedAt: null,
    });
    const [newsStatus, setNewsStatus] = useState({
        stale: false,
        message: '',
        updatedAt: null,
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [mapPickLoading, setMapPickLoading] = useState(false);

    const loadDisasterIntel = useCallback(async (lat, lng, label, selectedRadius = DEFAULT_RADIUS_KM) => {
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
            setOverviewStatus({
                stale: Boolean(overviewRes.data?.stale),
                message: overviewRes.data?.message || '',
                updatedAt: overviewRes.data?.generatedAt || null,
            });
            setWeatherStatus({
                stale: Boolean(weatherRes.data?.stale),
                message: weatherRes.data?.message || '',
                updatedAt: weatherRes.data?.fetchedAt || null,
            });
            setNewsStatus({
                stale: Boolean(newsRes.data?.stale),
                message: newsRes.data?.message || '',
                updatedAt: new Date().toISOString(),
            });
            setFocus({ lat, lng, label });
            setSelectedEventId(incomingEvents[0]?.id || null);
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Failed to load live disaster data.');
        } finally {
            setLoading(false);
        }
    }, []);

    const handleMapLocationPick = useCallback(async (lat, lng) => {
        setMapPickLoading(true);
        setError('');

        try {
            const { data } = await reverseGeocodeDisasterLocation({ lat, lng });
            const resolvedLabel = data?.label || `${lat.toFixed(3)}, ${lng.toFixed(3)}`;
            setLocationInput(resolvedLabel);
            await loadDisasterIntel(lat, lng, resolvedLabel, radiusKm);
        } catch (requestError) {
            const fallbackLabel = `${lat.toFixed(3)}, ${lng.toFixed(3)}`;
            setLocationInput(fallbackLabel);
            await loadDisasterIntel(lat, lng, fallbackLabel, radiusKm);
        } finally {
            setMapPickLoading(false);
        }
    }, [loadDisasterIntel, radiusKm]);

    useEffect(() => {
        const loadInitialData = async () => {
            if (!navigator.geolocation) {
                loadDisasterIntel(
                    DEFAULT_LOCATION.lat,
                    DEFAULT_LOCATION.lng,
                    DEFAULT_LOCATION.label,
                    DEFAULT_RADIUS_KM
                );
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    loadDisasterIntel(latitude, longitude, 'My Current Location', DEFAULT_RADIUS_KM);
                },
                () => {
                    loadDisasterIntel(
                        DEFAULT_LOCATION.lat,
                        DEFAULT_LOCATION.lng,
                        DEFAULT_LOCATION.label,
                        DEFAULT_RADIUS_KM
                    );
                },
                { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
            );
        };

        loadInitialData();
    }, [loadDisasterIntel]);

    const topTypes = useMemo(() => {
        const entries = Object.entries(summary?.countsByType || {});
        return entries
            .sort((a, b) => b[1] - a[1])
            .slice(0, maxTypeFilters)
            .map(([type]) => type);
    }, [summary]);

    const filteredEvents = useMemo(() => {
        const now = Date.now();
        const windowMs =
            selectedTimeWindow === '24h'
                ? 24 * 60 * 60 * 1000
                : selectedTimeWindow === '72h'
                  ? 72 * 60 * 60 * 1000
                  : selectedTimeWindow === '7d'
                    ? 7 * 24 * 60 * 60 * 1000
                    : null;

        return events.filter((event) => {
            const severityMatch =
                selectedSeverity === 'all' || event.severity === selectedSeverity;
            const typeMatch = selectedType === 'all' || event.type === selectedType;
            const occurredAt = event.occurredAt ? new Date(event.occurredAt).getTime() : null;
            const timeMatch =
                !windowMs || (occurredAt && Number.isFinite(occurredAt) && now - occurredAt <= windowMs);
            return severityMatch && typeMatch && Boolean(timeMatch);
        });
    }, [events, selectedSeverity, selectedType, selectedTimeWindow]);

    const sortedEvents = useMemo(() => {
        const cloned = [...filteredEvents];
        return cloned.sort((a, b) => {
            if (sortBy === 'nearest') {
                const distanceA =
                    typeof a.distanceKm === 'number' ? a.distanceKm : Number.POSITIVE_INFINITY;
                const distanceB =
                    typeof b.distanceKm === 'number' ? b.distanceKm : Number.POSITIVE_INFINITY;
                return distanceA - distanceB;
            }

            if (sortBy === 'severity') {
                const severityDiff = severityScore(b.severity) - severityScore(a.severity);
                if (severityDiff !== 0) return severityDiff;
            }

            const timeA = a.occurredAt ? new Date(a.occurredAt).getTime() : 0;
            const timeB = b.occurredAt ? new Date(b.occurredAt).getTime() : 0;
            return timeB - timeA;
        });
    }, [filteredEvents, sortBy]);

    const severityBreakdown = useMemo(() => {
        return sortedEvents.reduce(
            (acc, event) => {
                if (event.severity === 'high') acc.high += 1;
                else if (event.severity === 'medium') acc.medium += 1;
                else acc.low += 1;
                return acc;
            },
            { high: 0, medium: 0, low: 0 }
        );
    }, [sortedEvents]);

    const mapEvents = useMemo(() => sortedEvents.slice(0, 120), [sortedEvents]);
    const feedEvents = useMemo(() => sortedEvents.slice(0, 8), [sortedEvents]);
    const topNews = useMemo(() => news.slice(0, 5), [news]);

    const selectedEvent = useMemo(
        () => sortedEvents.find((event) => event.id === selectedEventId) || sortedEvents[0] || null,
        [sortedEvents, selectedEventId]
    );

    useEffect(() => {
        if (!selectedEventId) return;
        const exists = sortedEvents.some((event) => event.id === selectedEventId);
        if (!exists) {
            setSelectedEventId(sortedEvents[0]?.id || null);
        }
    }, [sortedEvents, selectedEventId]);

    const dataHealthItems = useMemo(
        () => [
            { key: 'events', label: 'Incident feeds', ...overviewStatus },
            { key: 'weather', label: 'Weather', ...weatherStatus },
            { key: 'news', label: 'News', ...newsStatus },
        ],
        [newsStatus, overviewStatus, weatherStatus]
    );

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

    const handleUseMyLocation = useCallback(() => {
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
    }, [loadDisasterIntel, radiusKm]);

    useEffect(() => {
        const onKeyDown = (event) => {
            const target = event.target;
            const tagName = target?.tagName?.toUpperCase?.() || '';
            const isTypingField =
                target?.isContentEditable ||
                tagName === 'INPUT' ||
                tagName === 'TEXTAREA' ||
                tagName === 'SELECT';

            if (event.key === '/' && !isTypingField) {
                event.preventDefault();
                locationInputRef.current?.focus();
                locationInputRef.current?.select?.();
                return;
            }

            if ((event.key === 'r' || event.key === 'R') && !isTypingField) {
                event.preventDefault();
                loadDisasterIntel(focus.lat, focus.lng, focus.label, radiusKm);
                return;
            }

            if ((event.key === 'g' || event.key === 'G') && !isTypingField) {
                event.preventDefault();
                handleUseMyLocation();
                return;
            }

            if (event.key === 'Escape') {
                setError('');
            }
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [focus.label, focus.lat, focus.lng, handleUseMyLocation, loadDisasterIntel, radiusKm]);

    const handleExportCsv = () => {
        if (!sortedEvents.length) return;
        const header = [
            'Title',
            'Type',
            'Severity',
            'Occurred At',
            'Distance Km',
            'Latitude',
            'Longitude',
            'Source',
            'URL',
        ];
        const rows = sortedEvents.map((event) => [
            event.title,
            event.type,
            event.severity,
            event.occurredAt || '',
            event.distanceKm ?? '',
            event.coordinates?.lat ?? '',
            event.coordinates?.lng ?? '',
            event.source || '',
            event.url || '',
        ]);
        const csv = [header, ...rows]
            .map((row) => row.map((cell) => escapeCsv(cell)).join(','))
            .join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `disaster-events-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const resetFilters = () => {
        setSelectedSeverity('all');
        setSelectedType('all');
        setSelectedTimeWindow('all');
        setSortBy('recent');
    };

    const hazardBreakdown = useMemo(
        () =>
            Object.entries(summary?.countsByType || {})
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5),
        [summary]
    );

    const sourceBreakdown = useMemo(
        () =>
            Object.entries(summary?.countsBySource || {})
                .sort((a, b) => b[1] - a[1]),
        [summary]
    );

    const summaryCards = useMemo(() => {
        const activeSources = summary?.sources?.length || sourceBreakdown.length || 0;
        return [
            {
                label: 'Incidents in view',
                value: summary?.totalEvents ?? 0,
                note: `Within ${radiusKm} km of ${focus.label}`,
                icon: <FiActivity />,
            },
            {
                label: 'High severity',
                value: summary?.highSeverity ?? 0,
                note: `${severityBreakdown.medium} medium and ${severityBreakdown.low} low`,
                icon: <FiAlertTriangle />,
            },
            {
                label: 'Closest incident',
                value: summary?.closestEvent ? formatDistance(summary.closestEvent.distanceKm) : 'None',
                note: summary?.closestEvent?.title || 'No nearby incident found',
                icon: <FiTarget />,
            },
            {
                label: 'Active sources',
                value: activeSources,
                note: sourceBreakdown.map(([source]) => source).join(', ') || 'No source data',
                icon: <FiDatabase />,
            },
        ];
    }, [focus.label, radiusKm, severityBreakdown.low, severityBreakdown.medium, sourceBreakdown, summary]);

    const renderEventMeta = (event) => (
        <div className="incident-meta-list">
            <span><FiClock /> {formatDate(event.occurredAt)}</span>
            <span><FiNavigation /> {formatDistance(event.distanceKm)}</span>
            <span><FiMapPin /> {event.coordinates?.lat?.toFixed?.(2)}, {event.coordinates?.lng?.toFixed?.(2)}</span>
        </div>
    );

    return (
        <div className="live-map-page">
            <section className="card live-map-hero">
                <div className="live-map-hero-copy">
                    <span className="eyebrow">Live Disaster Intelligence</span>
                    <h1 className="page-title">Clear, location-based incident tracking</h1>
                    <p className="subtitle">
                        This view combines real disaster feeds, current weather signals, and related headlines
                        so students and teachers can understand what is happening around a chosen area.
                    </p>

                    <div className="hero-highlight-row">
                        <div className="hero-highlight">
                            <span>Current focus</span>
                            <strong>{focus.label}</strong>
                        </div>
                        <div className="hero-highlight">
                            <span>Coverage</span>
                            <strong>{radiusKm} km radius</strong>
                        </div>
                        <div className="hero-highlight">
                            <span>Last incident refresh</span>
                            <strong>{overviewStatus.updatedAt ? formatDate(overviewStatus.updatedAt) : 'Loading...'}</strong>
                        </div>
                    </div>
                </div>

                <div className="live-map-hero-panel">
                    <form onSubmit={handleSearchLocation} className="live-map-form">
                        <div className="form-group live-map-search-group">
                            <label htmlFor="locationSearch">Search location</label>
                            <input
                                id="locationSearch"
                                type="text"
                                ref={locationInputRef}
                                value={locationInput}
                                onChange={(event) => setLocationInput(event.target.value)}
                                placeholder="City, district, or country"
                            />
                        </div>
                        <div className="form-group live-map-radius-group">
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

                    <div className="data-health-strip">
                        {dataHealthItems.map((item) => (
                            <span
                                key={item.key}
                                className={`health-pill ${item.stale ? 'health-pill-stale' : 'health-pill-fresh'}`}
                                title={item.message || `${item.label} data status`}
                            >
                                {item.label}: {item.stale ? 'Cached' : 'Live'}
                            </span>
                        ))}
                    </div>

                    <div className="shortcut-strip">
                        <span><kbd>/</kbd> search</span>
                        <span><kbd>R</kbd> refresh</span>
                        <span><kbd>G</kbd> my location</span>
                        <span><FiMousePointer /> click map to choose</span>
                        <span><kbd>Esc</kbd> clear error</span>
                    </div>
                </div>
            </section>

            {error ? <div className="alert alert-error">{error}</div> : null}

            <section className="grid-4 live-map-summary">
                {summaryCards.map((card) => (
                    <div key={card.label} className="card summary-card">
                        <div className="summary-card-top">
                            <span>{card.label}</span>
                            <i>{card.icon}</i>
                        </div>
                        <h3>{card.value}</h3>
                        <p>{card.note}</p>
                    </div>
                ))}
            </section>

            <section className="live-map-layout">
                <div className="live-map-main">
                    <div className="card map-card">
                        <div className="map-card-head">
                            <div>
                                <h2>
                                    <FiAlertTriangle /> Incident Map
                                </h2>
                                <p className="subtitle">
                                    {loading || mapPickLoading
                                        ? 'Refreshing live feeds and weather signals.'
                                        : `Showing ${sortedEvents.length} filtered incidents from ${events.length} total results.`}
                                </p>
                            </div>
                            <div className="map-head-actions">
                                <button
                                    type="button"
                                    className="btn btn-outline btn-sm"
                                    onClick={resetFilters}
                                >
                                    <FiRotateCcw /> Reset Filters
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-outline btn-sm"
                                    onClick={handleExportCsv}
                                    disabled={!sortedEvents.length}
                                >
                                    <FiDownload /> Export CSV
                                </button>
                            </div>
                        </div>

                        <div className="map-filter-panel">
                            <div className="map-click-hint">
                                <FiMousePointer />
                                <span>
                                    Click anywhere on the map to set that place as the new focus area and load real data for it.
                                </span>
                            </div>
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
                                <p><FiClock /> Time window</p>
                                <div className="map-filter-chips">
                                    {timeWindowOptions.map((option) => (
                                        <button
                                            key={option.value}
                                            type="button"
                                            className={`chip ${selectedTimeWindow === option.value ? 'chip-active' : ''}`}
                                            onClick={() => setSelectedTimeWindow(option.value)}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="map-filter-row">
                                <p><FiFilter /> Sort</p>
                                <div className="map-filter-chips">
                                    {sortOptions.map((option) => (
                                        <button
                                            key={option.value}
                                            type="button"
                                            className={`chip ${sortBy === option.value ? 'chip-active' : ''}`}
                                            onClick={() => setSortBy(option.value)}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="map-filter-row">
                                <p><FiFilter /> Hazard type</p>
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
                                pathOptions={{ color: '#0f766e', fillColor: '#14b8a6', fillOpacity: 0.12 }}
                            />
                            <MapClickSelector onPick={({ lat, lng }) => handleMapLocationPick(lat, lng)} />
                            <MapFlyToEvent event={selectedEvent} />
                            <Marker position={[focus.lat, focus.lng]}>
                                <Popup>
                                    <strong>{focus.label}</strong>
                                    <p>Current focus area</p>
                                </Popup>
                            </Marker>
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
                                        <p>Severity: {severityLabels[event.severity] || 'Low'}</p>
                                        <p>{formatDate(event.occurredAt)}</p>
                                        {typeof event.distanceKm === 'number' ? <p>Distance: {event.distanceKm} km</p> : null}
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
                </div>

                <div className="live-map-side">
                    <div className="card spotlight-card">
                        <div className="spotlight-head">
                            <h2 className="side-title">
                                <FiMapPin /> Selected Incident
                            </h2>
                            {selectedEvent ? (
                                <span className={`severity-pill severity-pill-${selectedEvent.severity}`}>
                                    {severityLabels[selectedEvent.severity] || 'Low'}
                                </span>
                            ) : null}
                        </div>

                        {selectedEvent ? (
                            <>
                                {mapPickLoading ? (
                                    <p className="spotlight-note">Loading data for the map point you selected...</p>
                                ) : null}
                                <h3 className="spotlight-title">{selectedEvent.title}</h3>
                                <div className="spotlight-pill-row">
                                    <span className="meta-pill">{selectedEvent.type}</span>
                                    <span className="meta-pill">{selectedEvent.source}</span>
                                    {selectedEvent.magnitude ? <span className="meta-pill">M {selectedEvent.magnitude}</span> : null}
                                </div>
                                <p className="spotlight-description">
                                    {selectedEvent.description || 'No additional incident description provided.'}
                                </p>
                                {renderEventMeta(selectedEvent)}
                                {selectedEvent.metadata?.severityReason ? (
                                    <p className="spotlight-note">{selectedEvent.metadata.severityReason}</p>
                                ) : null}
                                {selectedEvent.url ? (
                                    <a href={selectedEvent.url} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm spotlight-link">
                                        <FiExternalLink /> Open source report
                                    </a>
                                ) : null}
                            </>
                        ) : (
                            <div className="side-empty">
                                <FiAlertTriangle />
                                <p>{mapPickLoading ? 'Loading data for the clicked map location.' : 'No incident is selected yet.'}</p>
                            </div>
                        )}
                    </div>

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
                                <p className="risk-note">
                                    Updated: {weatherStatus.updatedAt ? formatDate(weatherStatus.updatedAt) : 'Loading...'}
                                    {weatherStatus.stale ? ' from cached weather data.' : ''}
                                </p>
                            </>
                        ) : (
                            <p className="subtitle">Weather data is loading.</p>
                        )}
                    </div>

                    <div className="card source-card">
                        <h2 className="side-title">
                            <FiDatabase /> Actual Data Sources
                        </h2>
                        <div className="source-list">
                            {sourceBreakdown.length ? (
                                sourceBreakdown.map(([source, count]) => (
                                    <div key={source} className="source-item">
                                        <strong>{source}</strong>
                                        <span>{count} incidents</span>
                                        <p>{sourceDescriptions[source] || 'Live incident source feed'}</p>
                                    </div>
                                ))
                            ) : (
                                <p className="subtitle">Source information will appear after the first successful refresh.</p>
                            )}
                        </div>

                        {hazardBreakdown.length ? (
                            <div className="hazard-summary">
                                <h3>Top hazards in this area</h3>
                                <div className="hazard-list">
                                    {hazardBreakdown.map(([type, count]) => (
                                        <span key={type} className="meta-pill">{type}: {count}</span>
                                    ))}
                                </div>
                            </div>
                        ) : null}
                    </div>

                    <div className="card side-list">
                        <h2 className="side-title">Nearby Incident Feed</h2>
                        {loading && events.length === 0 ? (
                            <p className="subtitle">Loading incident feed...</p>
                        ) : feedEvents.length ? (
                            <ul>
                                {feedEvents.map((event) => (
                                    <li key={`feed-${event.id}`}>
                                        <button
                                            type="button"
                                            className={`event-link-btn ${selectedEventId === event.id ? 'event-link-btn-active' : ''}`}
                                            onClick={() => setSelectedEventId(event.id)}
                                        >
                                            <div className="event-feed-top">
                                                <strong>{event.title}</strong>
                                                <span className={`severity-pill severity-pill-${event.severity}`}>
                                                    {severityLabels[event.severity] || 'Low'}
                                                </span>
                                            </div>
                                            <span>{event.type} • {event.source}</span>
                                            <span>{formatDistance(event.distanceKm)} • {formatDate(event.occurredAt)}</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="side-empty">
                                <FiAlertTriangle />
                                <p>No incidents found for this range and filter.</p>
                            </div>
                        )}
                    </div>

                    <div className="card side-list">
                        <h2 className="side-title">Location Disaster News</h2>
                        {loading && news.length === 0 ? (
                            <p className="subtitle">Loading related headlines...</p>
                        ) : topNews.length ? (
                            <ul>
                                {topNews.map((article) => (
                                    <li key={article.url}>
                                        <a href={article.url} target="_blank" rel="noreferrer">
                                            {article.title}
                                        </a>
                                        <span>{article.source?.name || 'Source'} • {formatDate(article.publishedAt)}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="side-empty">
                                <FiAlertTriangle />
                                <p>No related articles yet for this location.</p>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}

export default LiveDisasterMap;
