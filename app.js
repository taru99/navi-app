var map;
var userMarker;
var userCircle;
var restaurantMarkers = [];
var fixedZoomLevel = 17;  // Change this to set your desired zoom level
var markers = {};

if (navigator.geolocation) {
    navigator.geolocation.watchPosition(showPosition);
} else {
    alert("Geolocation is not supported by this browser.");
}

function hideMarker(id) {
    var marker = markers[id];
    if (marker) {
        map.removeLayer(marker);
    }
}

function showPosition(position) {
    var lat = position.coords.latitude;
    var lon = position.coords.longitude;

    if (!map) {
        map = L.map('map', {
            zoomControl: false,
            doubleClickZoom: false,
            minZoom: 15,
            maxZoom: 18
        }).setView([lat, lon], fixedZoomLevel);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 18,
        }).addTo(map);
    } else {
        map.panTo(new L.LatLng(lat, lon));
        map.setZoom(fixedZoomLevel);
    }

    // Define green icon
    var greenIcon = new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    var TreasureIcon = new L.Icon({
        iconUrl: 'https://1.bp.blogspot.com/-abtG2HYMsA8/UU--5kLFD0I/AAAAAAAAO_w/ta20nlofB6Y/s1600/kaizoku_takara.png',
        shadowUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        iconSize: [25, 25],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [25, 41]
    });






    function createMarker(lat, lon, filterName, popupMessage) {
        var marker = L.marker([lat, lon], { icon: TreasureIcon }).addTo(map);
        marker.bindPopup(`<b>${popupMessage}</b>`);
        marker._id = filterName;

        markers[marker._id] = marker;

        marker.on('click', function () {
            navigator.bluetooth.requestDevice({
                filters: [{ name: filterName }],
                optionalServices: ['generic_access']
            })
                .then(device => {
                    console.log('Connecting to device...');
                    return device.gatt.connect();
                })
                .then(server => {
                    console.log('Connected to device');
                    hideMarker(filterName);
                })
                .catch(error => {
                    console.log('Connection failed: ' + error);
                });
        });
    }

    createMarker(34.69966999309896, 135.49287644107454, "items:1", "クーポン:200円OFF");
    createMarker(34.70051456779639, 135.49341296425536, "items:3", "hazure");



    // Update user marker
    if (userMarker) {
        userMarker.setLatLng(new L.LatLng(lat, lon));
    } else {
        userMarker = L.marker([lat, lon], { icon: greenIcon }).addTo(map);
    }

    // Update user circle
    if (userCircle) {
        userCircle.setLatLng(new L.LatLng(lat, lon));
    } else {
        userCircle = L.circle([lat, lon], { radius: 250 }).addTo(map);
    }

    var query = '[out:json][timeout:25];(node["amenity"="restaurant"](around:250,' + lat + ',' + lon + '););out body;>;out skel qt;';

    fetch('https://overpass-api.de/api/interpreter?data=' + query)
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            // Remove old restaurant markers
            restaurantMarkers.forEach(function (marker) {
                map.removeLayer(marker);
            });
            restaurantMarkers = [];

            // Add new restaurant markers
            data.elements.forEach(function (element) {
                if (element.lat && element.lon) {
                    var marker = L.marker([element.lat, element.lon]).addTo(map).bindPopup(element.tags.name || 'Unnamed');
                    restaurantMarkers.push(marker);
                }
            });
        });


}