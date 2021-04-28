function getRestaurants() {
    const url = 'https://overpass-api.de/api/interpreter';
    const bbox = '37.845138693438756,-122.3001480102539,37.87644551927934,-122.27182388305664'
    const categories = ['cafe', 'restaurant']

    let quest = '';
    categories.forEach(c => {
        const p = `
          node["amenity"="${c}"](${bbox});
          way["amenity"="${c}"](${bbox});
          relation["amenity"="${c}"](${bbox});`;
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
            resolve(data.elements.filter(p => p.tags));
        };
    })
}
