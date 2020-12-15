$('form').submit(() => {
    if ($("input[name='has_result']").is(":checked")) {
        if (!$("input[name='test_result']").is(":checked")) {
            $(".alert").fadeIn(200)
            $(".close").click(() => {
                $(".alert").fadeOut(200)
            })
            return false
        }
    }

    if (!$("input[name='contacts']").is(":checked")) {
        $(".alert").fadeIn(200)
        $(".close").click(() => {
            $(".alert").fadeOut(200)
        })
        return false
    }

    var symptoms = [];
    $('input:checked[name="symptoms"]').each((index, el) => {
        symptoms.push($(el).val());
    });
    $('#symptoms').val(symptoms.join(';'));
    $("#places").val(points.join(';'));
    return true
});

$('input[name="has_result"]').change(() => {
    if ($('input[name="has_result"]').is(":checked")) {
        $('input[name="has_result_h"]').val("true")
        $("#test_result_div").show(500)
        $('input[name="test_result"]').prop('required', true)
    } else {
        $('input[name="has_result_h"]').val("false")
        $("#test_result_div").hide(500)
        $('input[name="test_result"]').prop('required', false)
    }
})

function showMapWithPosition(lat, lng){
    var map = new H.Map(
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

    var ui = H.ui.UI.createDefault(map, defaultLayers, 'ru-RU');

    map.addEventListener('tap', function (e) {
        if (e.target instanceof H.map.Marker) {
            var index = markers.indexOf(e.target)
            points.splice(index, 1)
            markers.splice(index, 1)
            map.removeObject(e.target)
        } else {
            var coords = map.screenToGeo(e.currentPointer.viewportX, e.currentPointer.viewportY)
            var lat = coords.lat
            var lng = coords.lng
    
            var newMarker = new H.map.Marker({
                lat: lat,
                lng: lng
            }, {
                volatility: true
            })
    
            newMarker.draggable = true
            map.addObject(newMarker)
            map.setCenter(map.getCenter())
            markers.push(newMarker)
            points.push([lat, lng])
            map.addEventListener('dragstart', function (ev) {
                var target = ev.target,
                    pointer = ev.currentPointer;
                if (target instanceof H.map.Marker) {
                    var targetPosition = map.geoToScreen(target.getGeometry());
                    target['offset'] = new H.math.Point(pointer.viewportX - targetPosition.x, pointer
                        .viewportY - targetPosition.y);
                    behavior.disable();
                }
            }, false);
    
            map.addEventListener('dragend', function (ev) {
                var target = ev.target;
                if (target instanceof H.map.Marker) {
                    behavior.enable();
                }
            }, false);
    
            map.addEventListener('drag', function (ev) {
                var target = ev.target,
                    pointer = ev.currentPointer;
                if (target instanceof H.map.Marker) {
                    target.setGeometry(map.screenToGeo(pointer.viewportX - target['offset'].x, pointer
                        .viewportY - target['offset'].y));
                    points[markers.indexOf(target)] = [target.getGeometry().lat, target.getGeometry().lng]
                }
            }, false);
        }
    })
}

function saveCoords(position){
    showMapWithPosition(position.coords.latitude, position.coords.longitude)
}

function setDefaultCoords(position){
    $(".error").show()
    showMapWithPosition(55.7522200, 37.6155600)
}

var platform = new H.service.Platform({
    'apikey': config.MAPS_API
})

var defaultLayers = platform.createDefaultLayers();

var userLocation = navigator.geolocation.getCurrentPosition(saveCoords, setDefaultCoords)

var points = []
var markers = []

