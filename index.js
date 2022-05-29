
/**
 * Get the current location of the user. Will only work on https.
 * @returns { latitude, longitude }
 */
function _getLocation() {
    return new Promise((resolve, reject) => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(position => resolve(position.coords))
        } else {
            reject('Geolocation is not supported by this browser.')
        }
    })
}

async function getLocationLink() {
    const position = await _getLocation()
    const url = `https://www.openstreetmap.org/#map=17/${position.latitude}/${position.longitude}`
    return url
}

/**
 * Query an openstreetmap server to fetch POIs
 * 
 * @param {*} bbox the rectangle where to perform the query
 * @param {*} categories of pois. Like restaurant, cafe...
 * @returns Promise<Poi[]>
 */
function _getPois(bbox, categories) {
    const url = 'https://overpass-api.de/api/interpreter';

    let quest = '';
    categories.forEach(({ key, value }) => {
        const p = `
          node["${key}"="${value}"](${bbox});
          way["${key}"="${value}"](${bbox});
          relation["${key}"="${value}"](${bbox});`;
        quest += p;
    });

    const q = `
        [out:json][timeout:25];
        (
            ${quest}
        );
        out body;
        >;
        out skel qt;`;

    const xhr = new XMLHttpRequest()
    xhr.open('POST', url, true)
    xhr.setRequestHeader('Content-Type', 'application/json')
    xhr.send(q)
    return new Promise(resolve => {
        xhr.onload = function () {
            const data = JSON.parse(this.responseText)
            const pois = data.elements.filter(p => p.tags).map(p => {
                p = { ...p, ...p.tags } // merge the tags object into the main one
                delete p.tags
                const type = p.members ? 'relation' : p.type
                if (!p.website && p[`contact:website`]) p.website = p[`contact:website`]
                p.osm_url = `https://www.openstreetmap.org/${type}/${p.id}`
                p.osm_url_edit = `https://www.openstreetmap.org/edit?${type}=${p.id}`
                return p
            })
            resolve(pois)
        };
    })
}

/**
 * 
 * @returns Promise<POI[]> restaurants and cafes
 */
function getRestaurants() {
    return _getPois('37.8,-122.3,37.8,-122.2', [{ key: 'amenity', value: 'cafe' }, { key: 'amenity', value: 'restaurant' }])
}

async function getRestaurantsAroundMe(radius = 0.1) {
    const { latitude, longitude } = await _getLocation()
    const bbox = []
    bbox.push(latitude - radius)
    bbox.push(longitude - radius)
    bbox.push(latitude + radius)
    bbox.push(longitude + radius)
    const categories = [{ key: 'amenity', value: 'cafe' }, { key: 'amenity', value: 'restaurant' }]
    // const categories = [{ key: 'leisure', value: 'park' }]
    const pois = await _getPois(bbox.join(','), categories)
    return { pois, latitude, longitude }
}

// extract diets from POIs (only makes sense for restaurants)
function extractDiets(pois) {
    const dietsMap = new Map() // stores ['thai': 3] if thai restaurants have been seen 3 times
    pois.forEach(poi => {
        const diets = new Set()
        // extract poi.cuisine
        poi.cuisine?.split(`;`)?.forEach(c => diets.add(c?.trim()?.toLowerCase()))
        // extract poi.diet:thai == yes for example
        Object.keys(poi)
            .filter(key => key.startsWith(`diet`) && poi[key] === `yes`)
            .forEach(key => diets.add(key.split(`:`).at(1)))

        diets.forEach(diet => {
            if (dietsMap.has(diet)) dietsMap.set(diet, dietsMap.get(diet) + 1)
            else dietsMap.set(diet, 1)
        })
    })
    const dietsSorted = Array.from(dietsMap.entries()).sort((a, b) => b[1] - a[1])
    return dietsSorted
}