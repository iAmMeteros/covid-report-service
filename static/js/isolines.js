function onResult(result) {
    map.removeObjects(map.getObjects())
    var center = new H.geo.Point(
            result.response.center.latitude,
            result.response.center.longitude),
        isolineCoords = result.response.isoline[0].component[0].shape,
        linestring = new H.geo.LineString(),
        isolineCenter;

    isolineCoords.forEach(function (coords) {
        linestring.pushLatLngAlt.apply(linestring, coords.split(','));
    });

    actualPolygon = new H.map.Polygon(linestring, {
        style: {
            strokeColor: '#05A',
            fillColor: 'rgba(0, 85, 170, 0.4)',
            lineWidth: 1,
            lineCap: 'round',
            lineJoin: 'miter',
            miterLimit: 1,
            lineDash: [],
            lineDashOffset: 0
        }
    });
    isolineCenter = new H.map.Marker(center);

    map.addObjects([isolineCenter, actualPolygon]);

    map.getViewModel().setLookAtData({
        bounds: actualPolygon.getBoundingBox()
    });
}

function placesFound(result) {
    places = result.items
    places.forEach(place => {
        console.log(place.categories[0].name)
        if(place.categories[0].name == 'Аптеки' || place.categories[0].name == 'Магазин с аптекой'){
            var point = new H.geo.Point(place.position.lat, place.position.lng)
            if (turf.booleanPointInPolygon(point.toGeoJSON(), actualPolygon.toGeoJSON())) {
                var placeMarker = new H.map.Marker({
                    lat: place.position.lat,
                    lng: place.position.lng
                })
                map.addObject(placeMarker)
            }
        }else if(place.categories[0].name == 'Медицинские услуги или клиника'){
            var point = new H.geo.Point(place.position.lat, place.position.lng)
            if (turf.booleanPointInPolygon(point.toGeoJSON(), actualPolygon.toGeoJSON())) {
                var placeMarker = new H.map.Marker({
                    lat: place.position.lat,
                    lng: place.position.lng
                })
                map.addObject(placeMarker)
            }
        }
    });
}

function startSearch(lat, lng, categories) {
    var locomotionType = $("input[name='locomotion']:checked").val()

    routingParams.start = 'geo!' + lat.toString() + ',' + lng.toString()
    routingParams.mode = 'fastest;' +  locomotionType
    routingParams.range = $("#time").val() * 60

    router.calculateIsoline(
        routingParams,
        onResult,
        (err) => {
            console.error(err.message)
        }
    )

    var rad = $("#time").val() * 1000

    service.browse({
        at: lat.toString() + ',' + lng.toString(),
        in: 'circle:' + lat.toString() + ',' + lng.toString() + ';r=' + rad.toString(),
        limit: 60,
        categories: categories
    }, placesFound, console.error)
}

function searchObjects(byAdress, pos = null) {
    var categories = []
    if ($("#pharmacy").is(":checked")) {
        categories.push('600-6400-0070')
    }
    if ($("#hospitals").is(":checked")) {
        categories.push('700-7300-0280')
    }
    categories = categories.join(',')

    if (categories != '') {
        if (byAdress) {
            var rawAdress = $("#adress").val()
            service.autosuggest({
                q: rawAdress,
                at: map.getCenter().lat + ',' + map.getCenter().lng
            }, (result) => {
                let {
                    position,
                    title
                } = result.items[0];
                startSearch(position.lat, position.lng, categories)
                ui.addBubble(new H.ui.InfoBubble(position, {
                    content: title
                }));
            });
        } else {
            startSearch(pos.lat, pos.lng, categories)
        }

    }
}

var platform = new H.service.Platform({
    'apikey': config.MAPS_API
})

var routingParams = {
    'mode': 'fastest;',
    'start': 'geo!00.00,00.00',
    'range': '900',
    'rangetype': 'time'
}

// var footRoutingParams = {
//     'mode': 'fastest;pedestrian;',
//     'start': 'geo!00.00,00.00',
//     'range': '300',
//     'rangetype': 'time'
// }

var router = platform.getRoutingService();

var service = platform.getSearchService();
var actualPolygon = null;

var map;
var ui;

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


    map.addEventListener('tap', function (e) {
        var coords = map.screenToGeo(e.currentPointer.viewportX, e.currentPointer.viewportY)
        var lat = coords.lat
        var lng = coords.lng

        searchObjects(true, new H.map.Point({
            lat: lat,
            lng: lng
        }))


    })
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

var defaultLayers = platform.createDefaultLayers();

var userLocation = navigator.geolocation.getCurrentPosition(saveCoords, setDefaultCoords)