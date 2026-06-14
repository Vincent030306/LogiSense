/**
 * LogiSense — Live Fleet Map (Leaflet.js)
 */

let map;
const fleetMarkers = {};

// Custom truck icon
const truckIcon = L.divIcon({
    className: 'custom-truck-icon',
    html: `<div style="background: var(--color-primary); color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 10px var(--color-primary-glow);"><i class="ph-fill ph-truck"></i></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15]
});

function initMap() {
    const mapEl = document.getElementById('fleet-map');
    if (!mapEl) return;

    // Initialize map centered on Java island
    map = L.map('fleet-map', {
        zoomControl: false
    }).setView([-7.2504, 112.7419], 7); // Center Surabaya

    // Add zoom control to bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Dark theme map tiles (CartoDB Dark Matter)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(map);

    // Initial load
    fetchInitialFleetPositions();
}

async function fetchInitialFleetPositions() {
    const vehicles = await api.getSummary().then(res => res ? res.fleet.vehicles : 0);
    // Real implementation would fetch /api/fleet
    // For now we rely on WebSocket simulated events, but let's do a fetch just in case
    
    try {
        const res = await fetch('/api/fleet');
        const data = await res.json();
        
        data.forEach(v => {
            if (v.current_lat && v.current_lng) {
                updateFleetMarker(v.id, v.plate_number, v.current_lat, v.current_lng);
            }
        });
        
        // Fit bounds if we have markers
        const group = new L.featureGroup(Object.values(fleetMarkers));
        if (Object.keys(fleetMarkers).length > 0) {
            map.fitBounds(group.getBounds(), { padding: [50, 50] });
        }
    } catch (e) {
        console.error('Failed to fetch initial fleet:', e);
    }
}

function updateFleetMarker(id, plate, lat, lng) {
    if (!map) return;

    if (fleetMarkers[id]) {
        // Update position smoothly
        fleetMarkers[id].setLatLng([lat, lng]);
    } else {
        // Create new marker
        const marker = L.marker([lat, lng], { icon: truckIcon }).addTo(map);
        marker.bindPopup(`<b>${plate}</b><br>ID: ${id}`);
        fleetMarkers[id] = marker;
    }
}

// Hook into existing nav to resize map when tab is shown
document.addEventListener('DOMContentLoaded', () => {
    // We need to wait for the DOM
    setTimeout(() => {
        initMap();
        
        const dispatchNav = document.querySelector('[data-target="dispatch"]');
        if (dispatchNav) {
            dispatchNav.addEventListener('click', () => {
                // Leaflet needs to recalculate size when unhidden
                setTimeout(() => map.invalidateSize(), 100);
            });
        }
    }, 500);
});
