function onRouteFound(result) {
    var route = result.response.route[0].shape
    addRouteShapeToMap(result.response.route[0])
    addManueversToMap(result.response.route[0]);
    addManueversToPanel(result.response.route[0]);
    addSummaryToPanel(result.response.route[0].summary);
    var payload = {
        "type": "LineString",
        "coordinates": [],
    }
    route.forEach(element => {
        var arrayToAppens = element.split(',')
        payload.coordinates.push([parseFloat(arrayToAppens[1]), parseFloat(arrayToAppens[0])])
    });
    fetch(`https://xyz.api.here.com/hub/spaces/${config.SPACE_ID}/spatial?access_token=${config.HUB_TOKEN}&radius=100`, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                'Content-Type': 'application/geo+json'
            }
        })
        .then((res) => res.json()).then((features) => {
            var points = features.features
            if (points.length == 0) {
                $("#dangerLevel").html("низкий")
                $("#dangerLevel").addClass("green")
            } else if (points.length < 5) {
                $("#dangerLevel").html("средний")
                $("#dangerLevel").addClass("yellow")
            } else {
                $("#dangerLevel").html("высокий")
                $("#dangerLevel").addClass("red")
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
    content += '<b>Total distance</b>: ' + summary.distance + 'm. <br/>';
    content += '<b>Travel Time</b>: ' + summary.travelTime.toMMSS() + ' (in current traffic)';

    summaryDiv.style.fontSize = 'small';
    summaryDiv.style.marginLeft = '5%';
    summaryDiv.style.marginRight = '5%';
    summaryDiv.innerHTML = content;
    routeInstructionsContainer.appendChild(summaryDiv);
}

function addManueversToPanel(route) {
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

function createRoute() {
    var adressFrom = $("#pointA").val()
    var adressTo = $("#pointB").val()

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
        var posA = position

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

            var posB = position

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
    language: 'ru-ru'
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