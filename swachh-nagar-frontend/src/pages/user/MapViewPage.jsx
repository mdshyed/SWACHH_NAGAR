import { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, HeatmapLayer } from '@react-google-maps/api';
import { Link } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import api from '../../config/axios';
import { getSocket } from '../../config/socket';
import Spinner from '../../components/common/Spinner';

const LIBRARIES = ['visualization'];

const STATUS_COLORS = {
  pending:    '#ef4444',
  assigned:   '#3b82f6',
  in_progress:'#f59e0b',
  resolved:   '#22c55e',
  rejected:   '#6b7280',
  escalated:  '#f97316',
};

const MAP_CENTER = { lat: 19.076, lng: 72.8777 };

// Build a custom SVG icon — cluster (>1) gets a purple badge, single gets a coloured circle
const makeIcon = (status, clusterCount) => {
  if (!window.google) return null;
  const isCluster = clusterCount > 1;
  const color = isCluster ? '#7c3aed' : (STATUS_COLORS[status] || '#9ca3af');
  const size = isCluster ? 44 : (status === 'escalated' ? 36 : 28);
  const svg = isCluster
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
        <circle cx="${size/2}" cy="${size/2}" r="${size/2-2}" fill="${color}" stroke="white" stroke-width="2.5"/>
        <text x="${size/2}" y="${size/2+5}" text-anchor="middle" fill="white" font-size="13" font-family="Arial" font-weight="bold">${clusterCount}</text>
       </svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
        <circle cx="${size/2}" cy="${size/2}" r="${size/2-2}" fill="${color}" stroke="white" stroke-width="2.5"/>
       </svg>`;
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new window.google.maps.Size(size, size),
    anchor: new window.google.maps.Point(size / 2, size / 2),
  };
};

const MapViewPage = () => {
  const [complaints, setComplaints] = useState([]);
  const [heatmapPoints, setHeatmapPoints] = useState([]);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('all');
  const [viewMode, setViewMode] = useState('markers');
  const [map, setMap] = useState(null);
  const [liveCount, setLiveCount] = useState(0);
  const [userPos, setUserPos] = useState(null);
  const [nearby, setNearby] = useState([]);
  const [showNearby, setShowNearby] = useState(false);
  const complaintsRef = useRef([]);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries: LIBRARIES,
  });

  useEffect(() => { complaintsRef.current = complaints; }, [complaints]);

  // Fetch markers
  useEffect(() => {
    const params = filter !== 'all' ? `?status=${filter}` : '';
    api.get(`/complaints/map${params}`)
      .then((r) => setComplaints(r.data.data.features || []))
      .catch(() => {});
  }, [filter]);

  // Fetch heatmap data
  useEffect(() => {
    if (viewMode !== 'heatmap') return;
    api.get('/complaints/locations')
      .then((r) => setHeatmapPoints(r.data.data || []))
      .catch(() => {});
  }, [viewMode]);

  // Socket.io — real-time updates
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    socket.emit('join:map');

    const onCreated = (feature) => {
      setLiveCount((n) => n + 1);
      if (filter === 'all' || feature.properties?.status === filter) {
        setComplaints((prev) => {
          const exists = prev.some((c) => c.properties?.id?.toString() === feature.properties?.id?.toString());
          return exists ? prev : [...prev, feature];
        });
      }
      if (feature.geometry?.coordinates) {
        setHeatmapPoints((prev) => [
          ...prev,
          { lat: feature.geometry.coordinates[1], lng: feature.geometry.coordinates[0], weight: 2 },
        ]);
      }
    };

    const onUpdated = ({ id, status }) => {
      setComplaints((prev) =>
        prev
          .map((c) => c.properties?.id?.toString() === id?.toString()
            ? { ...c, properties: { ...c.properties, status } }
            : c
          )
          .filter((c) => filter === 'all' || c.properties?.status === filter)
      );
    };

    const onClusterUpdated = ({ id, clusterCount }) => {
      setComplaints((prev) =>
        prev.map((c) => c.properties?.id?.toString() === id?.toString()
          ? { ...c, properties: { ...c.properties, clusterCount } }
          : c
        )
      );
    };

    socket.on('complaint:created', onCreated);
    socket.on('complaint:updated', onUpdated);
    socket.on('cluster:updated', onClusterUpdated);

    return () => {
      socket.off('complaint:created', onCreated);
      socket.off('complaint:updated', onUpdated);
      socket.off('cluster:updated', onClusterUpdated);
      socket.emit('leave:map');
    };
  }, [filter]);

  // Detect user location for nearby panel
  const detectAndShowNearby = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setUserPos({ lat, lng });
        api.get(`/complaints/nearby?lat=${lat}&lng=${lng}&radius=1500`)
          .then((r) => { setNearby(r.data.data || []); setShowNearby(true); })
          .catch(() => {});
        if (map) map.panTo({ lat, lng });
      },
      () => alert('Could not detect location. Please enable GPS.'),
    );
  };

  const onLoad = useCallback((m) => setMap(m), []);

  const heatmapData = isLoaded && window.google && heatmapPoints.length > 0
    ? heatmapPoints.map((p) => ({
        location: new window.google.maps.LatLng(p.lat, p.lng),
        weight: p.weight,
      }))
    : [];

  if (!isLoaded) return (
    <div className="min-h-screen bg-gray-50"><Navbar />
      <div className="flex items-center justify-center h-96">
        <div className="text-center"><Spinner size="xl" /><p className="text-gray-500 mt-3">Loading map...</p></div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Complaints Map</h1>
            {liveCount > 0 && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-green-100 text-green-700 border border-green-200">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                {liveCount} live update{liveCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={detectAndShowNearby}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border bg-white text-gray-600 border-gray-300 hover:border-primary-400 hover:text-primary-600 transition-colors"
            >
              📍 Nearby Issues
            </button>
            <div className="flex bg-white border border-gray-300 rounded-lg overflow-hidden text-sm font-medium">
              <button onClick={() => setViewMode('markers')}
                className={`px-3 py-1.5 transition-colors ${viewMode === 'markers' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                📍 Markers
              </button>
              <button onClick={() => setViewMode('heatmap')}
                className={`px-3 py-1.5 transition-colors border-l border-gray-300 ${viewMode === 'heatmap' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                🔥 Heatmap
              </button>
            </div>
            {viewMode === 'markers' && (
              <div className="flex gap-1.5 flex-wrap">
                {['all', 'pending', 'in_progress', 'escalated', 'resolved'].map((s) => (
                  <button key={s} onClick={() => setFilter(s)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${filter === s ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:border-gray-400'}`}>
                    {s === 'all' ? 'All' : s.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Legend */}
        {viewMode === 'markers' ? (
          <div className="flex gap-4 mb-3 flex-wrap items-center">
            {Object.entries(STATUS_COLORS).map(([status, color]) => (
              <div key={status} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-xs text-gray-600 capitalize">{status.replace(/_/g, ' ')}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-gray-200">
              <div className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs font-bold">3</div>
              <span className="text-xs text-gray-600">Cluster</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xs text-gray-500">Density:</span>
            <div className="h-2.5 w-24 rounded-full" style={{ background: 'linear-gradient(to right, #4ade80, #facc15, #ef4444)' }} />
            <span className="text-xs text-gray-500">Low → High</span>
            <span className="text-xs text-gray-400">· {heatmapPoints.length} active</span>
          </div>
        )}

        <div className="flex gap-4">
          {/* Map */}
          <div className={`rounded-xl overflow-hidden border border-gray-200 shadow-sm flex-1`} style={{ height: '600px' }}>
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '100%' }}
              center={MAP_CENTER}
              zoom={12}
              onLoad={onLoad}
              options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: true }}
            >
              {viewMode === 'markers' && complaints.map((feature) => {
                const [lng, lat] = feature.geometry.coordinates;
                const { id, status, clusterCount = 1 } = feature.properties;
                return (
                  <Marker
                    key={id}
                    position={{ lat, lng }}
                    onClick={() => setSelected(feature)}
                    icon={makeIcon(status, clusterCount)}
                  />
                );
              })}

              {/* User location marker */}
              {userPos && (
                <Marker
                  position={userPos}
                  icon={{
                    path: window.google.maps.SymbolPath.CIRCLE,
                    fillColor: '#3b82f6',
                    fillOpacity: 1,
                    strokeColor: '#fff',
                    strokeWeight: 3,
                    scale: 10,
                  }}
                />
              )}

              {viewMode === 'heatmap' && heatmapData.length > 0 && (
                <HeatmapLayer
                  data={heatmapData}
                  options={{
                    radius: 30,
                    opacity: 0.75,
                    gradient: ['rgba(0,255,0,0)', 'rgba(0,255,0,1)', 'rgba(255,255,0,1)', 'rgba(255,165,0,1)', 'rgba(255,0,0,1)'],
                  }}
                />
              )}

              {selected && viewMode === 'markers' && (
                <InfoWindow
                  position={{ lat: selected.geometry.coordinates[1], lng: selected.geometry.coordinates[0] }}
                  onCloseClick={() => setSelected(null)}
                >
                  <div className="p-1 max-w-[210px]">
                    <p className="font-semibold text-gray-900 text-sm mb-1">{selected.properties.title}</p>
                    <p className={`text-xs capitalize mb-1 font-medium ${selected.properties.status === 'escalated' ? 'text-orange-600' : 'text-gray-500'}`}>
                      {selected.properties.status === 'escalated' ? '🚨 ' : ''}{selected.properties.status?.replace(/_/g, ' ')}
                    </p>
                    {(selected.properties.clusterCount || 1) > 1 && (
                      <p className="text-xs text-purple-600 font-medium mb-1">
                        🔗 {selected.properties.clusterCount} similar complaints here
                      </p>
                    )}
                    <Link to={`/complaints/${selected.properties.id}`} className="text-xs text-primary-600 hover:underline font-medium">View details →</Link>
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          </div>

          {/* Nearby panel */}
          {showNearby && (
            <div className="w-72 flex-shrink-0 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col" style={{ height: '600px' }}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900 text-sm">Nearby Issues <span className="text-gray-400 font-normal">(1.5 km)</span></h3>
                <button onClick={() => setShowNearby(false)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {nearby.length === 0 ? (
                  <p className="text-center text-gray-400 text-sm py-8">No active complaints nearby 🎉</p>
                ) : (
                  nearby.map((c) => (
                    <Link
                      key={c._id}
                      to={`/complaints/${c._id}`}
                      className="block p-3 rounded-lg border border-gray-100 hover:border-primary-200 hover:bg-primary-50 transition-colors"
                    >
                      <p className="text-xs font-medium text-gray-900 truncate">{c.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-400 capitalize">{c.category?.replace(/_/g, ' ')}</span>
                        <span className={`text-xs font-medium capitalize ${c.status === 'escalated' ? 'text-orange-500' : 'text-gray-500'}`}>
                          · {c.status?.replace(/_/g, ' ')}
                        </span>
                      </div>
                      {c.location?.address && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{c.location.address}</p>
                      )}
                    </Link>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <p className="text-xs text-gray-400 mt-2 text-center">
          {viewMode === 'markers'
            ? `${complaints.length} cluster root${complaints.length !== 1 ? 's' : ''} · purple = multiple complaints · live updates active`
            : 'Heatmap intensity weighted by priority · red = critical density'}
        </p>
      </div>
    </div>
  );
};

export default MapViewPage;
