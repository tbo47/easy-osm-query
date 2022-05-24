
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

    const xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(q);
    return new Promise(resolve => {
        xhr.onload = function () {
            const data = JSON.parse(this.responseText);
            const pois = data.elements.filter(p => p.tags).map(p => {
                p = { ...p, ...p.tags } // merge the tags object into the main one
                delete p.tags
                p.osm_url = `https://www.openstreetmap.org/${p.type}/${p.id}`
                p.osm_url_edit = `https://www.openstreetmap.org/edit?${p.type}=${p.id}`
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

async function getRestaurantsAroundMe(radius = 0.01) {
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
