export interface Translation {
    title: string;
    description: string;
    search_placeholder: string;
    loading_data: string;
    searching_server: string;
    processing: string;
    servers_overloaded: string;
    legend_title: string;
    unknown: string;
    address_unknown: string;
    species: string;
    height: string;
    type: string;
    palm: string;
    magnolia: string;
    cherry: string;
    platan: string;
    filter_trees: string;
    zoom_too_high: string;
    no_trees_found: string;
    trees_shown: string;
}

export const translations: Record<string, Translation> = {
    en: {
        title: "Tree Species Map",
        description: "Interactive map showing where specific types of trees grow based on OpenStreetMap data.",
        search_placeholder: "Search address...",
        loading_data: "Loading data...",
        searching_server: "Searching for fastest server...",
        processing: "Processing...",
        servers_overloaded: "Servers overloaded. Try another area.",
        legend_title: "Tree Species",
        unknown: "Unknown",
        address_unknown: "Address unknown",
        species: "Species",
        height: "Height",
        type: "Type",
        palm: "Palm Trees",
        magnolia: "Magnolia",
        cherry: "Cherry & Sakura",
        platan: "Platanus",
        filter_trees: "Filter Trees",
        zoom_too_high: "Zoom in to see trees",
        no_trees_found: "No trees found in this area",
        trees_shown: "{count} trees are shown"
    },
    uk: {
        title: "Карта видів дерев",
        description: "Інтерактивна карта, що показує де ростуть певні види дерев на основі даних OpenStreetMap.",
        search_placeholder: "Пошук адреси...",
        loading_data: "Завантаження даних...",
        searching_server: "Пошук найшвидшого сервера...",
        processing: "Опрацювання...",
        servers_overloaded: "Сервери перевантажені. Спробуйте іншу ділянку.",
        legend_title: "Види дерев",
        unknown: "Невідомо",
        address_unknown: "Адреса невідома",
        species: "Вид",
        height: "Висота",
        type: "Тип",
        palm: "Пальми",
        magnolia: "Магнолія",
        cherry: "Вишня та Сакура",
        platan: "Платан",
        filter_trees: "Фільтр дерев",
        zoom_too_high: "Наблизьте карту, щоб побачити дерева",
        no_trees_found: "Дерев не знайдено в цій області",
        trees_shown: "Показано дерев: {count}"
    },
    de: {
        title: "Baumarten-Karte",
        description: "Interaktive Karte, die zeigt, wo bestimmte Baumarten wachsen, basierend auf OpenStreetMap-Daten.",
        search_placeholder: "Adresse suchen...",
        loading_data: "Daten werden geladen...",
        searching_server: "Suche nach dem schnellsten Server...",
        processing: "Verarbeitung...",
        servers_overloaded: "Server überlastet. Versuchen Sie einen anderen Bereich.",
        legend_title: "Baumarten",
        unknown: "Unbekannt",
        address_unknown: "Adresse unbekannt",
        species: "Spezies",
        height: "Höhe",
        type: "Typ",
        palm: "Palmen",
        magnolia: "Magnolie",
        cherry: "Kirsche & Sakura",
        platan: "Platane",
        filter_trees: "Bäume filtern",
        zoom_too_high: "Hineinzoomen, um Bäume zu sehen",
        no_trees_found: "In diesem Bereich wurden keine Bäume gefunden",
        trees_shown: "{count} Bäume werden angezeigt"
    },
    fr: {
        title: "Carte des espèces d'arbres",
        description: "Carte interactive montrant où poussent des types d'arbres spécifiques basés sur les données OpenStreetMap.",
        search_placeholder: "Rechercher une adresse...",
        loading_data: "Chargement des données...",
        searching_server: "Recherche du serveur le plus rapide...",
        processing: "Traitement...",
        servers_overloaded: "Serveurs surchargés. Essayez une autre zone.",
        legend_title: "Espèces d'arbres",
        unknown: "Inconnu",
        address_unknown: "Adresse inconnue",
        species: "Espèce",
        height: "Hauteur",
        type: "Type",
        palm: "Palmiers",
        magnolia: "Magnolia",
        cherry: "Cerisier & Sakura",
        platan: "Platane",
        filter_trees: "Filtrer les arbres",
        zoom_too_high: "Zoomez pour voir les arbres",
        no_trees_found: "Aucun arbre trouvé dans cette zone",
        trees_shown: "{count} arbres sont affichés"
    },
    es: {
        title: "Mapa de especies de árboles",
        description: "Mapa interactivo que muestra dónde crecen tipos específicos de árboles según los datos de OpenStreetMap.",
        search_placeholder: "Buscar dirección...",
        loading_data: "Cargando datos...",
        searching_server: "Buscando el servidor más rápido...",
        processing: "Procesando...",
        servers_overloaded: "Servidores sobrecargados. Intente con otra área.",
        legend_title: "Especies de árboles",
        unknown: "Desconocido",
        address_unknown: "Dirección desconocida",
        species: "Especie",
        height: "Altura",
        type: "Tipo",
        palm: "Palmeras",
        magnolia: "Magnolia",
        cherry: "Cerezo y Sakura",
        platan: "Plátano",
        filter_trees: "Filtrar árboles",
        zoom_too_high: "Acerca el mapa para ver los árboles",
        no_trees_found: "No se encontraron árboles en esta área",
        trees_shown: "Se muestran {count} árboles"
    }
};
