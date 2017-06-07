import axios from 'axios';
import { $ } from './bling';

const defaultMapOptions = {
    center: {lat: 43.2, lng: -79.8},
    zoom: 10
};

function getUserLocation (){
    if(navigator.geolocation){
        navigator.geolocation.getCurrentPosition(geoSuccess, geoError);
    }
    else{
        clientFlash('geolocation not supported by this browser, sorry 💁‍');
        drawMap(defaultMapOptions);
        return;
    }
}

function geoSuccess (position){
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    // make map
    const mapOptions = {
        center: {lat, lng},
        zoom: 10
    };
    drawMap(mapOptions);
}

function geoError(){
    console.error('geolocation failed');
    drawMap(defaultMapOptions);
    return;
}

function clientFlash(msg){
    const html = `<div class="flash-messages">
        <div class="flash flash--error">
            <p class="flash__text">${msg}</p>
            <button class="flash__remove">&times</button>
        </div>
    </div >`;
    
    $('.inner').innerHTML = html;
    $('.flash__remove').addEventListener('click', function(){
        this.parentElement.remove();
    });
    return;
}

function loadPlaces (map, lat = 43.2, lng = -79.8){
    axios.get(`/api/stores/near?lat=${lat}&lng=${lng}`)
        .then(res => {
            const places = res.data;
            if(!places.length){
                // flash an error, if there are no places
                clientFlash('No Stores Found Near There, Sorry 🙇‍!');
                return;
            }

            // create a bounds to help center our map around our locations
            const bounds = new google.maps.LatLngBounds();

            // create infowindow
            const infoWindow = new google.maps.InfoWindow();

            // create and place markers for each place returned from Ajax query

            const markers = places.map(place => {
                const [placeLng, placeLat] = place.location.coordinates;
                const position = { lat: placeLat, lng: placeLng };
                bounds.extend(position); // will extend our bounds around this position
                const marker = new google.maps.Marker({ map, position });
                // above tells markers to go on map: map, at position: position
                marker.place = place;
                return marker;
            });

            // show location details on marker click

            markers.forEach( marker => 
                marker.addListener('click', function(){
                    const html = `
                        <div class="popup">
                            <a href="/store/${this.place.slug}">
                                <img src="/uploads/${this.place.photo || 'store.png'}" alt="${this.place.name}">
                                <p>${this.place.name} -  ${this.place.location.address}</p>
                            </a>
                        </div>
                    `;
                    infoWindow.setContent(html);
                    infoWindow.open(map, this);
                })
            );

            // zoom the map to fit the markers
            map.setCenter(bounds.getCenter());
            map.fitBounds(bounds);

        });
}

function drawMap(options) {
    const map = new google.maps.Map($('#map'), options);
    loadPlaces(map);

    const input = $('[name="geolocate"]');
    const autocomplete = new google.maps.places.Autocomplete(input);
    autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        loadPlaces(map, place.geometry.location.lat(), place.geometry.location.lng());
    });
}

function makeMap (mapDiv){
    if(!mapDiv) return;
    drawMap(defaultMapOptions); // give us a default map before we get location data
    // commented out bellow is the very-long-to-load method for building the map with the user location info
    //getUserLocation();
}

export default makeMap;