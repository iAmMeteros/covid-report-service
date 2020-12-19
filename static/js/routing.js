function switchRoute() {
    if (currentRoute == 0) {
        //Первый
        renderRoute(safestRoute)
        currentRoute = 1
        switch (safectRouteStatus) {
            case 0:
                $("#dangerLevel").html("низкий")
                $("#dangerLevel").removeClass()
                $("#dangerLevel").addClass("green")
                break;
            case 1:
                $("#dangerLevel").html("средний")
                $("#dangerLevel").removeClass()
                $("#dangerLevel").addClass("yellow")
                break;
            case 2:
                $("#dangerLevel").html("высокий")
                $("#dangerLevel").removeClass()
                $("#dangerLevel").addClass("red")
                break;
            default:
                break;
        }
    } else {
        //Безопасный
        renderRoute(firstFoundedRoute)
        currentRoute = 0
        switch (firstRouteStatus) {
            case 0:
                $("#dangerLevel").html("низкий")
                $("#dangerLevel").removeClass()
                $("#dangerLevel").addClass("green")
                break;
            case 1:
                $("#dangerLevel").html("средний")
                $("#dangerLevel").removeClass()
                $("#dangerLevel").addClass("yellow")
                break;
            case 2:
                $("#dangerLevel").html("высокий")
                $("#dangerLevel").removeClass()
                $("#dangerLevel").addClass("red")
                break;
            default:
                break;
        }
    }
}

function renderRoute(route) {
    map.removeObjects(map.getObjects())

    map.addObject(new H.map.Marker({
        lat: posA.lat,
        lng: posA.lng
    }))

    map.addObject(new H.map.Marker({
        lat: posB.lat,
        lng: posB.lng
    }))

    var routeS = route.shape
    addRouteShapeToMap(route)
    addManueversToMap(route);
    addManueversToPanel(route);
    addSummaryToPanel(route.summary);
}

function onRouteFound(result) {
    $("#switchRoute").hide(0)
    console.log(result)
    var firstRoute = result.response.route[0]
    var alternativeRoutes = result.response.route.slice(1)

    safestRoute = null;
    safeRouteFound = false;
    currentRoute = 0;
    firstFoundedRoute = firstRoute
    safectRouteStatus = 0
    firstRouteStatus = 0

    var routeS = firstRoute.shape
    addRouteShapeToMap(firstRoute)
    addManueversToMap(firstRoute);
    addManueversToPanel(firstRoute);
    addSummaryToPanel(firstRoute.summary);
    var payload = {
        "type": "LineString",
        "coordinates": [],
    }
    routeS.forEach(element => {
        var arrayToAppens = element.split(',')
        payload.coordinates.push([parseFloat(arrayToAppens[1]), parseFloat(arrayToAppens[0])])
    });
    fetch(`https://xyz.api.here.com/hub/spaces/${config.SPACE_ID}/spatial?access_token=${config.HUB_TOKEN}&radius=200`, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                'Content-Type': 'application/geo+json'
            }
        })
        .then((res) => res.json()).then((features) => {
            var points = features.features
            minimalFeaturesInRoute = points.length
            if (points.length == 0) {
                $("#dangerLevel").html("низкий")
                $("#dangerLevel").removeClass()
                $("#dangerLevel").addClass("green")
                firstRouteStatus = 0
            } else if (points.length < 5) {
                $("#dangerLevel").html("средний")
                $("#dangerLevel").removeClass()
                $("#dangerLevel").addClass("yellow")
                firstRouteStatus = 1
            } else {
                $("#dangerLevel").html("высокий")
                $("#dangerLevel").removeClass()
                $("#dangerLevel").addClass("red")
                firstRouteStatus = 2
            }

            $(".result").show(500)

            if (points.length > 0) {
                var loop = new Promise((resolve, reject) => {
                    alternativeRoutes.forEach((route, index, array) => {
                        var routeS = route.shape
                        var payload = {
                            "type": "LineString",
                            "coordinates": [],
                        }
                        routeS.forEach(element => {
                            var arrayToAppens = element.split(',')
                            payload.coordinates.push([parseFloat(arrayToAppens[1]), parseFloat(arrayToAppens[0])])
                        });
                        fetch(`https://xyz.api.here.com/hub/spaces/${config.SPACE_ID}/spatial?access_token=${config.HUB_TOKEN}&radius=200`, {
                                method: 'POST',
                                body: JSON.stringify(payload),
                                headers: {
                                    'Content-Type': 'application/geo+json'
                                }
                            })
                            .then((res) => res.json()).then((features) => {
                                var points = features.features
                                if (minimalFeaturesInRoute > points.length) {
                                    minimalFeaturesInRoute = points.length
                                    safestRoute = route
                                    safeRouteFound = true;
                                    if (points.length == 0) {
                                        safectRouteStatus = 0
                                    } else if (points.length < 5) {
                                        safectRouteStatus = 1
                                    } else {
                                        safectRouteStatus = 2
                                    }
                                }
                                if (index === array.length - 1) resolve()
                            })
                    })
                })

                loop.then(() => {
                    if (!safeRouteFound) {
                        $("#altTitle").html('Мы не нашли более безопасный маршрут')
                        $("#altDescription").html('Мы стараемся предлагать вам более быстрые маршруты, в данном случае маршрут с меньшим риском заражения отнимет у вас много времени.')
                        $(".alternative").show(500)
                    } else {
                        $("#altTitle").html('Альтернативный маршрут')
                        $("#altDescription").html('Построенный маршрут не является самым безопасным, вместо него мы нашли другой, с меньшим риском заражения.')
                        $("#switchRoute").show(0)
                        $(".alternative").show(500)
                    }
                })
            }
        })
}

function openBubble(position, text) {
    if (!bubble) {
        bubble = new H.ui.InfoBubble(
            position, {
                content: text
            });
        ui.addBubble(bubble);
    } else {
        bubble.setPosition(position);
        bubble.setContent(text);
        bubble.open();
    }
}

var safestRoute = null;
var minimalFeaturesInRoute;
var safeRouteFound = false;
var firstFoundedRoute = null;
var currentRoute = 0;
var safectRouteStatus = 0;
var firstRouteStatus = 0;

function addRouteShapeToMap(route, color = 'rgba(0, 128, 255, 0.7)') {
    var lineString = new H.geo.LineString(),
        routeShape = route.shape,
        polyline;

    routeShape.forEach(function (point) {
        var parts = point.split(',');
        lineString.pushLatLngAlt(parts[0], parts[1]);
    });

    polyline = new H.map.Polyline(lineString, {
        style: {
            lineWidth: 4,
            strokeColor: color
        }
    });
    map.addObject(polyline);
    map.getViewModel().setLookAtData({
        bounds: polyline.getBoundingBox()
    });
}

function addManueversToMap(route) {
    var svgMarkup = '<svg width="18" height="18" ' +
        'xmlns="http://www.w3.org/2000/svg">' +
        '<circle cx="8" cy="8" r="8" ' +
        'fill="#1b468d" stroke="white" stroke-width="1"  />' +
        '</svg>',
        dotIcon = new H.map.Icon(svgMarkup, {
            anchor: {
                x: 8,
                y: 8
            }
        }),
        group = new H.map.Group(),
        i,
        j;

    for (i = 0; i < route.leg.length; i += 1) {
        for (j = 0; j < route.leg[i].maneuver.length; j += 1) {
            maneuver = route.leg[i].maneuver[j];
            var marker = new H.map.Marker({
                lat: maneuver.position.latitude,
                lng: maneuver.position.longitude
            }, {
                icon: dotIcon
            });
            marker.instruction = maneuver.instruction;
            group.addObject(marker);
        }
    }

    group.addEventListener('tap', function (evt) {
        map.setCenter(evt.target.getGeometry());
        openBubble(
            evt.target.getGeometry(), evt.target.instruction);
    }, false);

    map.addObject(group);
}

function addSummaryToPanel(summary) {
    var summaryDiv = document.createElement('div'),
        content = '';
    content += '<b>Время в пути: </b>: ' + summary.travelTime.toMMSS();

    summaryDiv.style.fontSize = 'small';
    summaryDiv.style.marginLeft = '5%';
    summaryDiv.style.marginRight = '5%';
    summaryDiv.innerHTML = content;
    routeInstructionsContainer.appendChild(summaryDiv);
}

function addManueversToPanel(route) {
    $("#info").html('')
    var nodeOL = document.createElement('ol'),
        i,
        j;

    nodeOL.style.fontSize = 'small';
    nodeOL.style.marginLeft = '5%';
    nodeOL.style.marginRight = '5%';
    nodeOL.className = 'directions';

    for (i = 0; i < route.leg.length; i += 1) {
        for (j = 0; j < route.leg[i].maneuver.length; j += 1) {
            maneuver = route.leg[i].maneuver[j];

            var li = document.createElement('li'),
                spanArrow = document.createElement('span'),
                spanInstruction = document.createElement('span');

            spanArrow.className = 'arrow ' + maneuver.action;
            spanInstruction.innerHTML = maneuver.instruction;
            li.appendChild(spanArrow);
            li.appendChild(spanInstruction);

            nodeOL.appendChild(li);
        }
    }

    routeInstructionsContainer.appendChild(nodeOL);
}


Number.prototype.toMMSS = function () {
    return Math.floor(this / 60) + ' minutes ' + (this % 60) + ' seconds.';
}

function onError(error) {
    alert('Мы не смогли проложить маршрут.')
}

var posA
var posB

function createRoute() {
    var adressFrom = $("#pointA").val()
    var adressTo = $("#pointB").val()

    map.removeObjects(map.getObjects())

    service.autosuggest({
        q: adressFrom,
        at: map.getCenter().lat + ',' + map.getCenter().lng
    }, (result) => {
        let {
            position
        } = result.items[0];
        map.addObject(new H.map.Marker({
            lat: position.lat,
            lng: position.lng
        }))
        posA = position

        service.autosuggest({
            q: adressTo,
            at: map.getCenter().lat + ',' + map.getCenter().lng
        }, (result) => {
            let {
                position
            } = result.items[0];
            map.addObject(new H.map.Marker({
                lat: position.lat,
                lng: position.lng
            }))

            posB = position

            routingParams.waypoint0 = posA.lat.toString() + ',' + posA.lng.toString()
            routingParams.waypoint1 = posB.lat.toString() + ',' + posB.lng.toString()

            router.calculateRoute(
                routingParams,
                onRouteFound,
                onError
            )
        })
    })
}

var platform = new H.service.Platform({
    'apikey': config.MAPS_API
})

var routingParams = {
    mode: 'fastest;publicTransport;',
    representation: 'display',
    waypoint0: '00.00,00.00',
    waypoint1: '00.00,00.00',
    routeAttributes: 'waypoints,summary,shape,legs',
    maneuverattributes: 'direction,action',
    language: 'ru-ru',
    alternatives: 5
}


var router = platform.getRoutingService();

var service = platform.getSearchService();

var map;
var ui;
var bubble;
var mapContainer = document.getElementById('map')
var routeInstructionsContainer = document.getElementById('info')

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