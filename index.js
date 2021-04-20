import axios from "axios";

export default class EasyOsmQuery {

    overpassUrl = 'https://overpass-api.de/api/interpreter';

    async getPois(bbox = '37.845138693438756,-122.3001480102539,37.87644551927934,-122.27182388305664', categories = ['cafe', 'restaurant']) {

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


        const response = await axios.post(this.overpassUrl, q);
        const pois = response.data.elements;
        pois.forEach(p_1 => p_1.osm_url = `https://www.openstreetmap.org/${p_1.type}/${p_1.id}`);
        return pois.filter(p_2 => p_2.tags);
    }

}