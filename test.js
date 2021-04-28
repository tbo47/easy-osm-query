const easyOsm = require('./index');

easyOsm.getPois().then(restaurants => {
    restaurants.forEach(resto => {
        console.log(resto.tags.name)
    });
})