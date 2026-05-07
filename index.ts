import L from 'leaflet';
import osmtogeojson from 'osmtogeojson';
import { translations, Translation } from './translations';

// Language detection
const getBrowserLang = () => {
    const lang = navigator.language.split('-')[0];
    return translations[lang] ? lang : 'en';
};

const currentLang = getBrowserLang();
const t: Translation = translations[currentLang];

// Update static UI elements
document.documentElement.lang = currentLang;
document.title = t.title;
const metaDescription = document.querySelector('meta[name="description"]');
if (metaDescription) metaDescription.setAttribute('content', t.description);

const searchInput = document.getElementById('search-input') as HTMLInputElement;
if (searchInput) searchInput.placeholder = t.search_placeholder;

const loadingText = document.querySelector('#loading span') as HTMLElement;
if (loadingText) loadingText.innerText = t.loading_data;

const filterTitle = document.getElementById('filter-title');
if (filterTitle) filterTitle.innerText = t.filter_trees;

document.getElementById('label-palm')!.innerText = t.palm;
document.getElementById('label-magnolia')!.innerText = t.magnolia;
document.getElementById('label-cherry')!.innerText = t.cherry;
document.getElementById('label-platan')!.innerText = t.platan;

const map = L.map('map', {
    zoomControl: false
}).setView([50.4501, 30.5234], 16); // Centered on Kyiv

// Add Dark Matter tiles for premium look
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20
}).addTo(map);

L.control.zoom({ position: 'topright' }).addTo(map);

const treeLayer = L.geoJSON(undefined as any, {
    pointToLayer: (feature, latlng) => {
        const species = feature.properties['genus'] || feature.properties['species'] || feature.properties['name'] || t.unknown;
        const color = getTreeColor(feature.properties);

        return L.circleMarker(latlng, {
            radius: 8,
            fillColor: color,
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
        });
    },
    onEachFeature: (feature, layer) => {
        const props = feature.properties;
        const species = props['genus'] || props['species'] || props['species:en'] || props['name'] || t.unknown;
        const height = props['height'] ? `${props['height']}m` : t.unknown;
        const circum = props['circumference'] ? `${props['circumference']}m` : t.unknown;

        const content = `
            <div class="building-info">
                <h3>${species}</h3>
                <p><strong>${t.height}:</strong> ${height}</p>
                <p><strong>${t.type}:</strong> ${props['natural'] || 'tree'}</p>
                ${props['denotation'] ? `<p><strong>Denotation:</strong> ${props['denotation']}</p>` : ''}
                ${feature.id ? `<p><a href="https://www.openstreetmap.org/${feature.id}" target="_blank">Open in OSM</a></p>` : ''}
            </div>
        `;
        layer.bindPopup(content);
        layer.bindTooltip(species, { sticky: true, className: 'building-tooltip' });

        layer.on('mouseover', function (this: any) {
            this.setStyle({
                fillOpacity: 1,
                radius: 10,
                weight: 3
            });
        });

        layer.on('mouseout', function (this: any) {
            this.setStyle({
                fillOpacity: 0.8,
                radius: 8,
                weight: 2
            });
        });
    }
}).addTo(map);

function getTreeColor(props: any) {
    const genus = (props['genus'] || '').toLowerCase();
    const species = (props['species'] || '').toLowerCase();
    const name = (props['name'] || '').toLowerCase();

    if (genus.includes('phoenix') || genus.includes('washingtonia') || genus.includes('trachycarpus') || name.includes('palm') || species.includes('palm')) return '#22c55e';
    if (genus.includes('magnolia')) return '#ec4899';
    if (genus.includes('prunus') || name.includes('cherry') || name.includes('sakura') || name.includes('вишня') || name.includes('сакура')) return '#f43f5e';
    if (genus.includes('platanus') || name.includes('platan') || name.includes('платан')) return '#eab308';

    return '#475569';
}

const treeFilters = {
    palm: 'node["natural"="tree"]["genus"~"Phoenix|Washingtonia|Trachycarpus|Chamaerops|Areca|Cocos|Howea|Syagrus",i]',
    magnolia: 'node["natural"="tree"]["genus"~"Magnolia",i]',
    cherry: 'node["natural"="tree"]["genus"~"Prunus",i]',
    platan: 'node["natural"="tree"]["genus"~"Platanus",i]'
};

function getSelectedQueries(bbox: string) {
    const selected: string[] = [];
    document.querySelectorAll('.filter-item input:checked').forEach((input: any) => {
        const type = input.value as keyof typeof treeFilters;
        if (treeFilters[type]) {
            selected.push(`${treeFilters[type]}(${bbox});`);
        }
    });
    return selected;
}

let lastFetchedBounds: L.LatLngBounds | null = null;
const loadedTreeIds = new Set<string>();

async function fetchTrees() {
    const zoom = map.getZoom();
    const bounds = map.getBounds();

    if (zoom < 14) {
        console.log('Zoom too low, skipping fetch');
        return;
    }

    // Check if current bounds are already covered by the last fetch
    if (lastFetchedBounds && lastFetchedBounds.contains(bounds)) {
        console.log('Area already cached, skipping fetch');
        return;
    }

    // Calculate padded bbox (50% extra on each side)
    const latPadding = (bounds.getNorth() - bounds.getSouth()) * 0.5;
    const lngPadding = (bounds.getEast() - bounds.getWest()) * 0.5;

    const south = bounds.getSouth() - latPadding;
    const north = bounds.getNorth() + latPadding;
    const west = bounds.getWest() - lngPadding;
    const east = bounds.getEast() + lngPadding;

    const paddedBbox = `${south},${west},${north},${east}`;
    const selectedQueries = getSelectedQueries(paddedBbox);

    if (selectedQueries.length === 0) {
        treeLayer.clearLayers();
        loadedTreeIds.clear();
        return;
    }

    const query = `
        [out:json][timeout:30];
        (
          ${selectedQueries.join('\n')}
        );
        out body;
        >;
        out skel qt;
    `;

    const loading = document.getElementById('loading');
    const loadingText = loading?.querySelector('span');
    if (loading) loading.style.display = 'flex';
    if (loadingText) loadingText.innerText = t.searching_server;

    const OVERPASS_INSTANCES = [
        'https://overpass.kumi.systems/api/interpreter',
        'https://overpass.osm.ch/api/interpreter',
        'https://overpass.openstreetmap.fr/api/interpreter',
        'https://lz4.overpass-api.de/api/interpreter',
        'https://overpass.nchc.org.tw/api/interpreter'
    ];

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);

    const fetchPromises = OVERPASS_INSTANCES.map(async (instance) => {
        const hostname = new URL(instance).hostname;
        try {
            const response = await fetch(instance, {
                method: 'POST',
                body: query,
                signal: controller.signal
            });
            if (response.ok) {
                const data = await response.json();
                if (data.elements && data.elements.length > 0) {
                    return { data, hostname };
                }
                throw new Error('No trees found in this area');
            }
            throw new Error(`HTTP ${response.status}`);
        } catch (e) {
            console.warn(`Mirror ${hostname} failed:`, e);
            throw e;
        }
    });

    try {
        const result = await Promise.any(fetchPromises);
        console.log(`Success from ${result.hostname}. Elements:`, result.data.elements?.length);

        if (loadingText) loadingText.innerText = t.processing;

        const geojson = osmtogeojson(result.data);

        // Filter to only add new trees we haven't seen before
        const newFeatures = (geojson as any).features.filter((f: any) => {
            const id = f.id;
            if (loadedTreeIds.has(id)) return false;
            loadedTreeIds.add(id);
            return true;
        });

        if (newFeatures.length > 0) {
            treeLayer.addData({
                type: 'FeatureCollection',
                features: newFeatures
            } as any);
        }

        lastFetchedBounds = L.latLngBounds([south, west], [north, east]);
        controller.abort();
    } catch (error) {
        console.error('All mirrors failed:', error);
        if (loadingText) loadingText.innerText = t.servers_overloaded;
    } finally {
        clearTimeout(timeoutId);
        if (loading) loading.style.display = 'none';
    }
}

// Re-fetch when filters change
document.querySelectorAll('.filter-item input').forEach(input => {
    input.addEventListener('change', () => {
        treeLayer.clearLayers();
        loadedTreeIds.clear();
        lastFetchedBounds = null;
        fetchTrees();
    });
});

let fetchTimeout: any = null;
function debouncedFetch() {
    if (fetchTimeout) clearTimeout(fetchTimeout);
    fetchTimeout = setTimeout(fetchTrees, 500);
}

map.on('moveend', debouncedFetch);
fetchTrees();

// --- Search Functionality ---

const searchResults = document.getElementById('search-results') as HTMLDivElement;

let searchTimeout: any = null;

async function performSearch(query: string) {
    if (query.length < 3) {
        searchResults.style.display = 'none';
        return;
    }

    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`);
        const data = await response.json();

        if (data && data.length > 0) {
            searchResults.innerHTML = '';
            searchResults.style.display = 'block';

            data.forEach((item: any) => {
                const div = document.createElement('div');
                div.className = 'search-result-item';

                // Try to get a clean name and address
                const name = item.display_name.split(',')[0];
                const address = item.display_name.split(',').slice(1).join(',').trim();

                div.innerHTML = `
                    <span class="search-result-name">${name}</span>
                    <span class="search-result-address">${address}</span>
                `;

                div.onclick = () => {
                    const lat = parseFloat(item.lat);
                    const lon = parseFloat(item.lon);

                    map.setView([lat, lon], 17);

                    // Clear search
                    searchInput.value = '';
                    searchResults.style.display = 'none';

                    // Optional: add a pulse effect or temporary marker
                    const pulse = L.circleMarker([lat, lon], {
                        radius: 10,
                        color: '#38bdf8',
                        fillColor: '#38bdf8',
                        fillOpacity: 0.5
                    }).addTo(map);

                    setTimeout(() => {
                        map.removeLayer(pulse);
                    }, 2000);
                };
                searchResults.appendChild(div);
            });
        } else {
            searchResults.style.display = 'none';
        }
    } catch (error) {
        console.error('Search error:', error);
    }
}

searchInput.addEventListener('input', (e) => {
    const query = (e.target as HTMLInputElement).value;
    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => performSearch(query), 400);
});

searchInput.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
        if (searchTimeout) clearTimeout(searchTimeout);

        // Check if we already have results
        let firstResult = searchResults.querySelector('.search-result-item') as HTMLElement;

        if (!firstResult && searchInput.value.length >= 3) {
            // Try to fetch results immediately if none are shown
            await performSearch(searchInput.value);
            firstResult = searchResults.querySelector('.search-result-item') as HTMLElement;
        }

        if (firstResult) {
            firstResult.click();
        }
    }
});

// Close search results when clicking outside
document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target as Node) && !searchResults.contains(e.target as Node)) {
        searchResults.style.display = 'none';
    }
});
