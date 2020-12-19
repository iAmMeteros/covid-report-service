function placesFound(result) {
    var places = result.items
    var placesList = ''

    console.log(places)

    var count = 0

    places.forEach(place => {
        if (place.title != currentPlace) {
            if (place.categories[0].id == currentCategory.id) {
                fetch(`https://xyz.api.here.com/hub/spaces/${config.SPACE_ID}/spatial?lat=${place.position.lat}&lon=${place.position.lng}&radius=400`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/geo+json',
                        'Authorization': 'Bearer ' + config.HUB_TOKEN
                    }
                }).then((res) => res.json()).then((features) => {
                    if(count < 5){
                        var points = features.features
                        if(points.length == 0){
                            map.addObject(new H.map.Marker({
                                lat: place.position.lat,
                                lng: place.position.lng
                            }))
                            placesList += place.title + '<br>'
                        }
                        count ++
                    }
                }).then(()=>{
                    if(placesList.length > 0){
                        $("#placesList").html(placesList)
                        $(".nearby").show(500)
                    }
                })
            }
        }
    })

    
}

function searchPlace() {
    $(".nearby").hide(0)
    map.removeObjects(map.getObjects())
    var rawAdress = $("#adress").val()

    service.autosuggest({
        q: rawAdress,
        at: map.getCenter().lat + ',' + map.getCenter().lng
    }, (result) => {
        let {
            position,
            title,
            resultType,
            categories
        } = result.items[0];
        console.log(result.items[0])
        map.addObject(new H.map.Marker({
            lat: position.lat,
            lng: position.lng
        }))
        map.setCenter({
            lat: position.lat,
            lng: position.lng
        })
        map.setZoom(15)

        currentPlace = title
        try {
            
        } catch (error) {
            
        }
        try {
            currentCategory = categories[0]
        } catch (error) {
            currentCategory = ''
        }

        var dangerLevel = 0

        fetch(`https://xyz.api.here.com/hub/spaces/${config.SPACE_ID}/spatial?lat=${position.lat}&lon=${position.lng}&radius=400`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/geo+json',
                    'Authorization': 'Bearer ' + config.HUB_TOKEN
                }
            })
            .then((res) => res.json()).then((features) => {
                console.log(features)
                var points = features.features
                if (points.length == 0) {
                    dangerLevel = 1
                    $("#dangerLevel").html("низкий")
                    $("#dangerLevel").addClass("green")
                } else if (points.length < 5) {
                    dangerLevel = 2
                    $("#dangerLevel").html("средний")
                    $("#dangerLevel").addClass("yellow")
                } else {
                    dangerLevel = 3
                    $("#dangerLevel").html("высокий")
                    $("#dangerLevel").addClass("red")
                }

                $("#placeTitle").html(title)

                if (resultType == 'houseNumber') {
                    $("#placeType").html("Жилой дом")
                } else {
                    $("#placeType").html(categories[0].name)
                }

                $(".result").show(500)

                if (dangerLevel > 0) {
                    if (resultType == 'place') {
                        service.browse({
                            at: position.lat.toString() + ',' + position.lng.toString(),
                            in: 'circle:' + position.lat.toString() + ',' + position.lng.toString() + ';r=5000',
                            limit: 60,
                            categories: categories[0].id
                        }, placesFound, console.error)
                    } else {

                    }
                }
            })
    })
}

var platform = new H.service.Platform({
    'apikey': config.MAPS_API
})

var service = platform.getSearchService();

var map;
var currentPlace;
var currentCategory;

function showMapWithPosition(lat, lng) {
    map = new H.Map(
        document.getElementById('map'),
        defaultLayers.vector.normal.map, {
            zoom: 12,
            center: {
                lat: lat,
                lng: lng
            }
        });

    window.addEventListener('resize', () => map.getViewPort().resize());
    var behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(map));

    ui = H.ui.UI.createDefault(map, defaultLayers, 'ru-RU');
}

function saveCoords(position) {
    showMapWithPosition(position.coords.latitude, position.coords.longitude)
}

function setDefaultCoords(position) {
    $(".error").show()
    showMapWithPosition(55.7522200, 37.6155600)
}

var platform = new H.service.Platform({
    'apikey': config.MAPS_API
})

var defaultLayers = platform.createDefaultLayers({
    lg: 'ru-ru'
});

var userLocation = navigator.geolocation.getCurrentPosition(saveCoords, setDefaultCoords)