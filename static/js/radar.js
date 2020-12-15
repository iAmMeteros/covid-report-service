function showMapWithPosition(lat, lng) {
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
        var coords = map.screenToGeo(e.currentPointer.viewportX, e.currentPointer.viewportY)
        var lat = coords.lat
        var lng = coords.lng

        $.ajax({
            url: "/api/placescan",
            type: "GET",
            data: {
                lat: lat,
                lng: lng
            },
            success: (data, status) => {
                let answer = JSON.parse(data)
                if (answer["status"] == "notfound") {
                    $(".danger").show()
                    $(".danger").css("color", "#48ce2d")
                    $("#1").removeClass("fal").addClass("fas")
                    $("#2").removeClass("fas").addClass("fal")
                    $("#3").removeClass("fas").addClass("fal")
                    $(".verdict").text("Безопасно")
                    $(".description").text(
                        "Судя по всему, данное место безопасно для посещения.")
                    $(".alert").fadeIn(250)
                } else if (answer["status"] == "apilimit") {
                    $(".danger").hide()
                    $(".description").text(
                        "Превышен лимит обращений к внешнему API. Подождите минуту.")
                    $(".alert").fadeIn(250)
                } else {
                    $(".danger").show()
                    $("#1").removeClass("fas").addClass("fal")
                    $("#2").removeClass("fas").addClass("fal")
                    $("#3").removeClass("fas").addClass("fal")
                    if (answer["danger"] >= 1) {
                        $("#1").removeClass("fal").addClass("fas")
                        $(".danger").css("color", "#48ce2d")
                        $(".verdict").text("Безопасно")
                        $(".description").html(
                            "Судя по всему, данное место безопасно для посещения.")
                    }
                    if (answer["danger"] >= 2) {
                        $("#2").removeClass("fal").addClass("fas")
                        $(".danger").css("color", "#F29F3A")
                        $(".verdict").text("Средне")
                        $(".description").html("Мы нашли здесь следующие типы мест:<br><br>" +
                            createFormattedList(answer["places"]))
                    }
                    if (answer["danger"] >= 3) {
                        $("#3").removeClass("fal").addClass("fas")
                        $(".danger").css("color", "#FF4343")
                        $(".verdict").text("Опасно")
                        $(".description").html("Мы нашли здесь следующие типы мест:<br><br>" +
                            createFormattedList(answer["places"]))
                    }
                    $(".alert").fadeIn(250)
                }
                $(".close").click(() => {
                    $(".alert").fadeOut(250)
                })
            }
        })
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