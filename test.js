import EasyOsmQuery from './index.js'

const easyOsmQuery = new EasyOsmQuery()

easyOsmQuery.getPois().then(restaurants => {
    restaurants.forEach(resto => {
        console.log(resto.tags.name)
    });
})