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
const locateButton = document.getElementById('locate-button') as HTMLButtonElement;
if (locateButton) locateButton.title = t.locate_me;

const loadingText = document.querySelector('#loading span') as HTMLElement;
if (loadingText) loadingText.innerText = t.loading_data;

const filterTitle = document.getElementById('filter-title');
if (filterTitle) filterTitle.innerText = t.filter_trees;

document.getElementById('label-palm')!.innerText = t.palm;
document.getElementById('label-magnolia')!.innerText = t.magnolia;
document.getElementById('label-cherry')!.innerText = t.cherry;
document.getElementById('label-platan')!.innerText = t.platan;
document.getElementById('label-syringa')!.innerText = t.syringa;



const urlParams = new URLSearchParams(window.location.search);
const latParam = urlParams.get('lat');
const lngParam = urlParams.get('lng') || urlParams.get('lon');
const zoomParam = urlParams.get('z') || urlParams.get('zoom');

let initialLat = 50.4501;
let initialLng = 30.5234;
let initialZoom = 16;

if (latParam && lngParam) {
    const lat = parseFloat(latParam);
    const lng = parseFloat(lngParam);
    if (!isNaN(lat) && !isNaN(lng)) {
        initialLat = lat;
        initialLng = lng;
    }
}

if (zoomParam) {
    const zoom = parseInt(zoomParam);
    if (!isNaN(zoom)) {
        initialZoom = zoom;
    }
}

const map = L.map('map', {
    zoomControl: false
}).setView([initialLat, initialLng], initialZoom);

// Add Dark Matter tiles for premium look
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20
}).addTo(map);

L.control.zoom({ position: 'topright' }).addTo(map);

const treeLayer = L.geoJSON(undefined as any, {
    pointToLayer: (feature, latlng) => {
        const typeId = treeFilter(feature.properties);
        const treeDef = TREE_TYPES.find(t => t.id === typeId);

        if (treeDef) {
            const icon = L.divIcon({
                className: 'tree-icon-container',
                html: `<div class="tree-icon-marker" style="background-color: ${treeDef.color};">
                        <img src="${treeDef.icon}" alt="${treeDef.id}" />
                       </div>`,
                iconSize: [32, 32],
                iconAnchor: [16, 16]
            });
            return L.marker(latlng, { icon });
        }

        return L.circleMarker(latlng, {
            radius: 6,
            fillColor: '#ffffff',
            color: '#fff',
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8
        });
    },
    onEachFeature: (feature, layer) => {
        const props = feature.properties;
        const height = props['height'] ? `${props['height']}m` : t.unknown;

        const typeId = treeFilter(feature.properties);
        const typeName = typeId ? (t[typeId as keyof Translation] || typeId) : t.unknown;

        const content = `
            <div class="building-info">
                <h3>${typeName}</h3>
                <p><strong>${t.height}:</strong> ${height}</p>
                <p><strong>${t.type}:</strong> ${props['natural'] || 'tree'}</p>
                ${props['denotation'] ? `<p><strong>Denotation:</strong> ${props['denotation']}</p>` : ''}
                ${feature.id ? `<p><a href="https://www.openstreetmap.org/${feature.id}" target="_blank">Open in OSM</a></p>` : ''}
            </div>
        `;
        layer.bindPopup(content);
        layer.bindTooltip(typeName, { sticky: true, className: 'building-tooltip' });

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

interface TreeDefinition {
    id: string;
    color: string;
    keywords: string[]; // Combined genus, wikiKeywords, and nameKeywords
    wikidata: string[];
    icon: string;
}

const TREE_TYPES: TreeDefinition[] = [
    {
        id: 'palm',
        color: '#22c55e',
        icon: 'icons/palm.png',
        keywords: [
            'Phoenix', 'Washingtonia', 'Trachycarpus', 'Chamaerops', 'Areca', 'Cocos', 'Howea', 'Syagrus',
            'Brahea', 'Livistona', 'Rhapis', 'Sabal', 'Archontophoenix', 'Dypsis', 'Roystonea', 'Bismarckia',
            'Butia', 'Jubaea', 'Chamaedorea', 'Caryota', 'Latania', 'Hyophorbe', 'Wodyetia', 'Rhopalostylis',
            'Cycas', 'Encephalartos', 'Zamia', 'Dracaena', 'Yucca', 'Cordyline',
            'Arecaceae', 'Palm', 'Cycad', 'Cycadaceae', 'Arecopsida',
            'пальма', 'цикас', 'юкка', 'драцена', 'drago', 'кордилина'
        ],
        wikidata: [
            'Q103447', // Arecaceae (Family)
            'Q156294', // Palm (Concept/Family)
            'Q156574', // Phoenix (Genus)
            'Q156934', // Washingtonia (Genus)
            'Q156948', // Trachycarpus (Genus)
            'Q156946', // Chamaerops (Genus)
            'Q156938', // Butia (Genus)
            'Q156939', // Jubaea (Genus)
            'Q156928', // Syagrus (Genus)
            'Q156926', // Areca (Genus)
            'Q131346', // Cocos nucifera (Species)
            'Q165313', // Phoenix dactylifera (Species)
            'Q27661',  // Phoenix canariensis (Species)
            'Q161688', // Washingtonia robusta (Species)
            'Q159152', // Washingtonia filifera (Species)
            'Q133379', // Livistona
            'Q164097', // Rhapis
            'Q2715011', // Dypsis
            'Q820113', // Chamaedorea
            'Q135067', // Hyophorbe
            'Q3003837', // Rhopalostylis
            'Q2593999', // Brahea
            'Q159190', // Sabal
            'Q2707208', // Archontophoenix
            'Q142274', // Roystonea
            'Q13055333', // Bismarckia
            'Q158737', // Butia
            'Q13065504', // Jubaea
            'Q161747', // Caryota
            'Q136371', // Latania
            'Q13091280', // Wodyetia
            'Q161073', // Cycas
            'Q133703', // Encephalartos
            'Q144747', // Zamia
            'Q157640', // Dracaena
            'Q156317', // Yucca
            'Q158498', // Cordyline
            'Q14080'   // Arecaceae (Family)
        ]
    },
    {
        id: 'magnolia',
        color: '#9d09ab',
        icon: 'icons/magnolia.png',
        keywords: ['Magnolia'],
        wikidata: [
            'Q157017', // Magnolia (Genus)
            'Q156942', // Magnolia (Concept)
            'Q161116', // Magnolia grandiflora (Species)
            'Q161114', // Magnolia × soulangeana (Species)
            'Q161121', // Magnolia stellata (Species)
            'Q161115', // Magnolia denudata (Species)
            'Q161113'  // Magnolia kobus (Species)
        ]
    },
    {
        id: 'cherry',
        color: '#ff6363',
        icon: 'icons/cherry.png',
        keywords: ['Prunus', 'Cherry', 'Sakura', 'вишня', 'сакура'],
        wikidata: [
            'Q190545', // Prunus (Genus)
            'Q156214', // Prunus (Concept)
            'Q161352', // Prunus serrulata (Species)
            'Q157672', // Prunus × yedoensis (Species)
            'Q161357', // Prunus subhirtella (Species)
            'Q165137', // Prunus avium (Species)
            'Q146951', // Prunus cerasifera (Species)
            'Q165424', // Prunus padus (Species)
            'Q165415'  // Prunus nipponica (Species)
        ]
    },
    {
        id: 'platan',
        color: '#4287f5',
        icon: 'icons/platan.png',
        keywords: ['Platanus', 'Platan', 'платан'],
        wikidata: [
            'Q163025', // Platanus (Genus)
            'Q156202', // Platanus (Concept)
            'Q161374', // Platanus × hispanica (Species)
            'Q157739', // Platanus × acerifolia (Alternative QID for London Plane)
            'Q161376', // Platanus occidentalis (Species)
            'Q161375'  // Platanus orientalis (Species)
        ]
    },
    {
        id: 'syringa',
        color: '#a855f7',
        icon: 'icons/syringa.svg',
        keywords: ['Syringa', 'Lilac', 'бузок', 'сирень', 'Lilas', 'Flieder', 'Lila'],
        wikidata: [
            'Q157011', // Syringa (Genus)
            'Q156212',  // Syringa vulgaris (Common Lilac)
            'Q157449'
        ]
    }
];

// Apply colors from code to UI
TREE_TYPES.forEach(tree => {
    const checkbox = document.querySelector(`.custom-checkbox.${tree.id}`) as HTMLElement;
    if (checkbox) {
        checkbox.style.borderColor = tree.color;
    }
});

const KEYWORD_TAGS = ['genus', 'species', 'species:wikipedia', 'wikipedia', 'name', 'taxon', 'leaf_type', 'family', 'taxon:name', 'order', 'natural'];
const WIKIDATA_TAGS = ['species:wikidata', 'wikidata', 'taxon:wikidata', 'genus:wikidata'];

function treeFilter(input: any, bbox?: string): any {
    if (bbox) {
        const tree = input as TreeDefinition;
        const queries: string[] = [];
        const baseTypes = [
            'node["natural"="tree"]',
            'node["natural"="shrub"]',
            'node["natural"="palm"]',
            'way["natural"="tree_row"]',
            'way["natural"="wood"]',
            'way["natural"="palm"]',
            'relation["natural"="tree_row"]',
            'relation["natural"="palm"]'
        ];

        baseTypes.forEach(type => {
            // If the filter is for palms and the type is natural=palm, add it unconditionally
            if (tree.id === 'palm' && type.includes('"natural"="palm"')) {
                queries.push(`${type}(${bbox});`);
                return;
            }

            // Wikidata filter
            if (tree.wikidata.length > 0) {
                const qidRegex = tree.wikidata.join('|');
                WIKIDATA_TAGS.forEach(tag => {
                    queries.push(`${type}["${tag}"~"${qidRegex}"](${bbox});`);
                });
            }

            // Keywords filter
            if (tree.keywords.length > 0) {
                const kwRegex = tree.keywords.join('|');
                KEYWORD_TAGS.forEach(tag => {
                    queries.push(`${type}["${tag}"~"${kwRegex}",i](${bbox});`);
                });
            }
        });
        return queries;
    } else {
        const props = input;
        const natural = (props['natural'] || '').toLowerCase();
        const leaf_type = (props['leaf_type'] || '').toLowerCase();
        const wikidataValue = WIKIDATA_TAGS.map(tag => props[tag]).find(v => v) || '';

        for (const tree of TREE_TYPES) {
            // Match Wikidata
            if (tree.wikidata.includes(wikidataValue)) {
                return tree.id;
            }

            // Match Keywords
            const keywordMatch = tree.keywords.some(kw => {
                const kwl = kw.toLowerCase();
                return KEYWORD_TAGS.some(tag => (props[tag] || '').toLowerCase().includes(kwl));
            });

            // Special case for palms: also check natural tag
            const isPalmTag = tree.id === 'palm' && (
                natural === 'palm' ||
                leaf_type === 'palm' ||
                leaf_type === 'palmlike'
            );

            if (keywordMatch || isPalmTag) {
                return tree.id;
            }
        }
        return undefined;
    }
}

let lastFetchedBounds: L.LatLngBounds | null = null;
const loadedTreeIds = new Set<string>();
let cachedFeatures: any[] = [];

const CACHE_KEY = 'tree_map_data_cache';
const MAX_CACHE_SIZE = 20 * 1024 * 1024; // 20MB

function transformFeatures(features: any[]): any[] {
    return features.map((f: any) => {
        const type = f.geometry.type;
        if (type.includes('LineString') || type.includes('Polygon')) {
            const coords = f.geometry.coordinates.flat(Infinity);
            if (coords.length < 2) return f;

            let sumLng = 0;
            let sumLat = 0;
            let count = 0;

            for (let i = 0; i < coords.length; i += 2) {
                sumLng += coords[i];
                sumLat += coords[i + 1];
                count++;
            }

            return {
                ...f,
                geometry: {
                    type: 'Point',
                    coordinates: [sumLng / count, sumLat / count]
                }
            };
        }
        return f;
    });
}

function loadCache() {
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            cachedFeatures = transformFeatures(JSON.parse(cached));
            console.log(`Loaded ${cachedFeatures.length} trees from cache`);
            applyCache();
        }
    } catch (e) {
        console.error('Failed to load cache:', e);
        cachedFeatures = [];
    }
}

function saveCache() {
    try {
        let cacheString = JSON.stringify(cachedFeatures);
        // If exceeds 2MB, remove oldest 20% until it fits
        while (cacheString.length > MAX_CACHE_SIZE && cachedFeatures.length > 0) {
            const toRemove = Math.max(1, Math.floor(cachedFeatures.length * 0.2));
            cachedFeatures.splice(0, toRemove);
            cacheString = JSON.stringify(cachedFeatures);
        }
        localStorage.setItem(CACHE_KEY, cacheString);
    } catch (e) {
        console.error('Failed to save cache:', e);
    }
}

function applyCache() {
    const selectedTypes = Array.from(document.querySelectorAll('.filter-item input:checked')).map((input: any) => input.value);

    const featuresToShow = cachedFeatures.filter(f => {
        if (loadedTreeIds.has(f.id)) return false;
        const typeId = treeFilter(f.properties);
        return typeId && selectedTypes.includes(typeId);
    });

    if (featuresToShow.length > 0) {
        featuresToShow.forEach(f => loadedTreeIds.add(f.id));
        treeLayer.addData({
            type: 'FeatureCollection',
            features: featuresToShow
        } as any);
        console.log(`Applied ${featuresToShow.length} trees from cache to map`);
    }
}

function updateCache(newFeatures: any[]) {
    const zoom = map.getZoom();
    if (zoom < 13) {
        console.log(`Zoom level ${zoom} too low for caching, skipping storage`);
        return;
    }

    // Add new features, avoiding duplicates in the cache array itself
    const existingIds = new Set(cachedFeatures.map(f => f.id));
    const uniqueNewFeatures = newFeatures.filter(f => !existingIds.has(f.id));

    if (uniqueNewFeatures.length > 0) {
        cachedFeatures.push(...uniqueNewFeatures);
        saveCache();
    }
}

let currentFetchController: AbortController | null = null;

async function fetchTrees() {
    if (currentFetchController) {
        currentFetchController.abort();
    }
    currentFetchController = new AbortController();
    const signal = currentFetchController.signal;
    const loading = document.getElementById('loading');
    const loadingText = loading?.querySelector('span');
    const spinner = loading?.querySelector('.loading-spinner') as HTMLElement;

    const setStatus = (msg: string | null, showSpinner: boolean = true) => {
        if (!loading || !loadingText) return;
        if (msg) {
            loading.style.display = 'flex';
            loadingText.innerText = msg;
            if (spinner) spinner.style.display = showSpinner ? 'block' : 'none';
        } else {
            loading.style.display = 'none';
        }
    };

    const zoom = map.getZoom();
    const bounds = map.getBounds();

    if (zoom < 13) {
        setStatus(t.zoom_too_high, false);
        return;
    }

    // Check if current bounds are already covered by the last fetch
    if (lastFetchedBounds && lastFetchedBounds.contains(bounds)) {
        console.log('Area already cached, skipping fetch');

        // Still check if anything is visible (in case user changed filters or moved within coverage)
        const currentBounds = map.getBounds();
        let count = 0;
        treeLayer.eachLayer((layer: any) => {
            if (currentBounds.contains((layer as L.CircleMarker).getLatLng())) {
                count++;
            }
        });

        if (count === 0) {
            setStatus(t.no_trees_found, false);
        } else {
            setStatus(t.trees_shown.replace('{count}', count.toString()), false);
        }
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

    const selectedQueries: string[] = [];
    document.querySelectorAll('.filter-item input:checked').forEach((input: any) => {
        const tree = TREE_TYPES.find(t => t.id === input.value);
        if (tree) {
            selectedQueries.push(...treeFilter(tree, paddedBbox));
        }
    });

    if (selectedQueries.length === 0) {
        treeLayer.clearLayers();
        loadedTreeIds.clear();
        setStatus(null);
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

    setStatus(t.searching_server);

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
                signal: signal
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

        setStatus(t.processing);

        const geojson = osmtogeojson(result.data);

        if (signal.aborted) return;

        const transformedFeatures = transformFeatures((geojson as any).features);

        // Filter to only add new trees we haven't seen before AND verify they match current filters
        const selectedTypes = Array.from(document.querySelectorAll('.filter-item input:checked')).map((input: any) => input.value);

        const newFeatures = transformedFeatures.filter((f: any) => {
            const id = f.id;
            if (loadedTreeIds.has(id)) return false;

            const typeId = treeFilter(f.properties);
            return typeId && selectedTypes.includes(typeId);
        });

        if (newFeatures.length > 0) {
            newFeatures.forEach((f: any) => loadedTreeIds.add(f.id));
            treeLayer.addData({
                type: 'FeatureCollection',
                features: newFeatures
            } as any);
            updateCache(newFeatures);
        }

        lastFetchedBounds = L.latLngBounds([south, west], [north, east]);
        controller.abort();

        // Check if there are any trees visible on the map after fetch
        const currentBounds = map.getBounds();
        let count = 0;
        treeLayer.eachLayer((layer: any) => {
            if (currentBounds.contains((layer as L.CircleMarker).getLatLng())) {
                count++;
            }
        });

        if (count === 0) {
            setStatus(t.no_trees_found, false);
        } else {
            setStatus(t.trees_shown.replace('{count}', count.toString()), false);
        }

    } catch (error) {
        if (signal.aborted) return;
        console.error('All mirrors failed:', error);
        setStatus(t.servers_overloaded, false);
    } finally {
        clearTimeout(timeoutId);
    }
}

// Re-fetch when filters change
document.querySelectorAll('.filter-item input').forEach(input => {
    input.addEventListener('change', () => {
        if (currentFetchController) currentFetchController.abort();
        treeLayer.clearLayers();
        loadedTreeIds.clear();
        lastFetchedBounds = null;
        applyCache();
        fetchTrees();
    });
});

let fetchTimeout: any = null;
function updateUrl() {
    const center = map.getCenter();
    const zoom = map.getZoom();
    const url = new URL(window.location.href);
    url.searchParams.set('lat', center.lat.toFixed(5));
    url.searchParams.set('lng', center.lng.toFixed(5));
    url.searchParams.set('z', zoom.toString());
    window.history.replaceState({}, '', url.toString());
}

function debouncedFetch() {
    // Apply cache immediately for instant feedback when moving to already-visited areas
    applyCache();
    updateUrl();

    // Refresh count status immediately from cache/existing layers
    const currentBounds = map.getBounds();
    const loading = document.getElementById('loading');
    const loadingText = loading?.querySelector('span');
    const zoom = map.getZoom();

    const t_trees_shown = translations[currentLang].trees_shown;
    const t_no_trees_found = translations[currentLang].no_trees_found;
    const t_zoom_too_high = translations[currentLang].zoom_too_high;

    if (loading && loadingText) {
        if (zoom < 11) {
            loading.style.display = 'flex';
            loadingText.innerText = t_zoom_too_high;
            const spinner = loading.querySelector('.loading-spinner') as HTMLElement;
            if (spinner) spinner.style.display = 'none';
        } else {
            let count = 0;
            treeLayer.eachLayer((layer: any) => {
                if (currentBounds.contains((layer as L.CircleMarker).getLatLng())) {
                    count++;
                }
            });

            if (count === 0) {
                loading.style.display = 'flex';
                loadingText.innerText = t_no_trees_found;
                const spinner = loading.querySelector('.loading-spinner') as HTMLElement;
                if (spinner) spinner.style.display = 'none';
            } else {
                loading.style.display = 'flex';
                loadingText.innerText = t_trees_shown.replace('{count}', count.toString());
                const spinner = loading.querySelector('.loading-spinner') as HTMLElement;
                if (spinner) spinner.style.display = 'none';
            }
        }
    }

    if (fetchTimeout) clearTimeout(fetchTimeout);
    fetchTimeout = setTimeout(fetchTrees, 400);
}

map.on('moveend', debouncedFetch);
loadCache();
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

// --- Locate Me Functionality ---
if (locateButton) {
    locateButton.addEventListener('click', () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser');
            return;
        }

        const originalColor = locateButton.style.color;
        locateButton.style.color = '#38bdf8';
        
        const getPosition = (options: PositionOptions) => {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    map.setView([latitude, longitude], 17);
                    
                    const userMarker = L.circleMarker([latitude, longitude], {
                        radius: 8,
                        color: '#38bdf8',
                        fillColor: '#38bdf8',
                        fillOpacity: 0.6,
                        weight: 2
                    }).addTo(map);

                    const pulse = L.circle([latitude, longitude], {
                        radius: 50,
                        color: '#38bdf8',
                        fillOpacity: 0,
                        weight: 1
                    }).addTo(map);

                    let radius = 50;
                    const animatePulse = () => {
                        radius += 2;
                        pulse.setRadius(radius);
                        pulse.setStyle({ opacity: 1 - (radius / 200) });
                        if (radius < 200) {
                            requestAnimationFrame(animatePulse);
                        } else {
                            map.removeLayer(pulse);
                        }
                    };
                    requestAnimationFrame(animatePulse);

                    setTimeout(() => {
                        map.removeLayer(userMarker);
                    }, 4000);

                    locateButton.style.color = originalColor;
                },
                (error) => {
                    console.error('Geolocation error:', error);
                    
                    // Fallback to lower accuracy if high accuracy failed
                    if (options.enableHighAccuracy && (error.code === error.TIMEOUT || error.code === error.POSITION_UNAVAILABLE)) {
                        console.log('High accuracy failed, trying standard accuracy...');
                        getPosition({ enableHighAccuracy: false, timeout: 5000, maximumAge: 10000 });
                        return;
                    }

                    // Last resort: IP-based geolocation
                    if (error.code === error.POSITION_UNAVAILABLE || error.code === error.TIMEOUT) {
                        console.log('Browser geolocation failed, trying IP-based fallback...');
                        fetch('https://ipapi.co/json/')
                            .then(res => res.json())
                            .then(data => {
                                if (data.latitude && data.longitude) {
                                    const lat = data.latitude;
                                    const lon = data.longitude;
                                    map.setView([lat, lon], 13); // Lower zoom for IP-based as it's less accurate
                                    
                                    const userMarker = L.circleMarker([lat, lon], {
                                        radius: 8,
                                        color: '#38bdf8',
                                        fillColor: '#38bdf8',
                                        fillOpacity: 0.6,
                                        weight: 2
                                    }).addTo(map);

                                    setTimeout(() => map.removeLayer(userMarker), 4000);
                                    locateButton.style.color = originalColor;
                                } else {
                                    throw new Error('IP geolocation failed');
                                }
                            })
                            .catch(err => {
                                console.error('IP fallback failed:', err);
                                locateButton.style.color = originalColor;
                                alert('Could not find your location. Please check your system settings.');
                            });
                        return;
                    }

                    locateButton.style.color = originalColor;
                    
                    let errorMsg = 'Could not find your location';
                    if (error.code === error.PERMISSION_DENIED) {
                        errorMsg = 'Location access denied. Please enable it in your browser settings.';
                    } else if (error.code === error.POSITION_UNAVAILABLE) {
                        errorMsg = 'Location information is unavailable.';
                    } else if (error.code === error.TIMEOUT) {
                        errorMsg = 'Location request timed out.';
                    }
                    alert(errorMsg);
                },
                options
            );
        };

        getPosition({ 
            enableHighAccuracy: true,
            timeout: 6000,
            maximumAge: 0
        });
    });
}

// Close search results when clicking outside
document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target as Node) && !searchResults.contains(e.target as Node)) {
        searchResults.style.display = 'none';
    }
});
