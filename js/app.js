var locations = [{
        title: 'Smithsonian National Museum of Natural History',
        location: {
            lat: 38.891266,
            lng: -77.026065
        },
        type: 'museum'
    },
    {
        title: 'Smithsonian National Air and Space Museum',
        location: {
            lat: 38.888160,
            lng: -77.019868
        },
        type: 'museum'
    },
    {
        title: 'Smithsonian National Zoo',
        location: {
            lat: 38.929616,
            lng: -77.049784
        },
        type: 'museum'
    },
    {
        title: 'Smithsonian Gardens',
        location: {
            lat: 38.888168,
            lng: -77.025973
        },
        type: 'museum'
    },
    {
        title: 'Smithsonian Castle',
        location: {
            lat: 38.888786,
            lng: -77.026023
        },
        type: 'museum'
    },
    {
        title: 'Smithsonian Postal Museum',
        location: {
            lat: 38.898097,
            lng: -77.008238
        },
        type: 'museum'
    },
    {
        title: 'Astro Doughnuts & Fried Chicken',
        location: {
            lat: 38.898108,
            lng: -77.030405
        },
        type: 'restaurant'
    },
    {
        title: 'District Wharf',
        location: {
            lat: 38.877203,
            lng: -77.021670
        },
        type: 'restaurant'
    },
    {
        title: 'National Mall',
        location: {
            lat: 38.889620,
            lng: -77.022977
        },
        type: 'park'
    },
    {
        title: 'Georgetown Waterfront Park',
        location: {
            lat: 38.902888,
            lng: -77.065320
        },
        type: 'park'
    },
    {
        title: 'Founding Farmers DC',
        location: {
            lat: 38.900285,
            lng: -77.044527
        },
        type: 'restaurant'
    },
];
var iconBase = 'http://maps.google.com/mapfiles/kml/pal2/';
var icons = {
    museum: {
        icon: iconBase + 'icon2.png'
    },
    restaurant: {
        icon: iconBase + 'icon33.png'
    },
    park: {
        icon: iconBase + 'icon4.png'
    }
};

var styles = [{
        "featureType": "road",
        "elementType": "geometry",
        "stylers": [{
                "lightness": 100
            },
            {
                "visibility": "simplified"
            }
        ]
    },
    {
        "featureType": "water",
        "elementType": "geometry",
        "stylers": [{
                "visibility": "on"
            },
            {
                "color": "#C6E2FF"
            }
        ]
    },
    {
        "featureType": "poi",
        "elementType": "geometry.fill",
        "stylers": [{
            "color": "#C5E3BF"
        }]
    },
    {
        "featureType": "road",
        "elementType": "geometry.fill",
        "stylers": [{
            "color": "#D1D1B8"
        }]
    }
];

var map;
var infoWindow;
var bounds;
var markers = [];

//initialize map
function initMap() {
    var washingtonDC = {
        lat: 38.907192,
        lng: -77.036871
    };
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 13,
        center: washingtonDC,
        styles: styles,
        mapTypeControl: false
    });

    infoWindow = new google.maps.InfoWindow();

    bounds = new google.maps.LatLngBounds();

    ko.applyBindings(new AppViewModel());

    document.getElementById('show-listings').addEventListener('click', showListings);
    document.getElementById('hide-listings').addEventListener('click', hideListings);
}

var MarkerMaker = function(data) {
    var self = this;

    this.title = data.title;
    this.position = data.location;
    this.icon = icons[data.type].icon;
    this.street = '';
    this.city = '';
    this.phone = '';

    this.visible = ko.observable(true);

    var clientID = 'OZYFOTBF0MA0AASYHV1WSB0WTTI5ZC05MJCKBLUCJB3H5XBC';
    var clientSecret = 'WRWZDBFLCTNLJMEKXTRYTNXYYZU45P3J5FGT2RFE5EIMJH5Q';

    // foursquare JSON data
    var reqURL = 'https://api.foursquare.com/v2/venues/search?ll=' + this.position.lat + ',' + this.position.lng + '&client_id=' + clientID + '&client_secret=' + clientSecret + '&v=20160118' + '&query=' + this.title;

    $.getJSON(reqURL).done(function(data) {
        var results = data.response.venues[0];
        self.street = results.location.formattedAddress[0] ? results.location.formattedAddress[0] : 'N/A';
        self.city = results.location.formattedAddress[1] ? results.location.formattedAddress[1] : 'N/A';
        self.phone = results.contact.formattedPhone ? results.contact.formattedPhone : 'N/A';
    }).fail(function() {
        alert('Oppsy Daisy! foursquare made a boo-boo!');
    });

    // Create a marker per location, and put into markers array
    this.marker = new google.maps.Marker({
        position: this.position,
        title: this.title,
        animation: google.maps.Animation.DROP,
        icon: this.icon
    });

    self.showListings = ko.computed(function() {
        // apply markers and extend map to show all markers
        if (self.visible() === true) {
            self.marker.setMap(map);
            bounds.extend(self.marker.position);
            map.fitBounds(bounds);
        } else {
            self.marker.setMap(null);
        }
    });

    markers.push(this.marker);

    // When click infowindow will show on the marker
    this.marker.addListener('click', function() {
        populateInfoWindow(this, self.street, self.city, self.phone, infoWindow);
        markerBounce(this);
        map.panTo(this.getPosition());
    });

    // infow window pop up with info
    this.infowindow = function(location) {
        google.maps.event.trigger(self.marker, 'click');
    };

    // bounce effect on click
    this.bounce = function(place) {
        google.maps.event.trigger(self.marker, 'click');
    };
};

/* View Model */
var AppViewModel = function() {
    var self = this;

    this.searchPlace = ko.observable('');

    this.mapLocation = ko.observableArray([]);

    // add location markers for each location
    locations.forEach(function(location) {
        self.mapLocation.push(new MarkerMaker(location));
    });

    // locations viewed on map
    this.locationFilter = ko.computed(function() {
        var searchFilter = self.searchPlace().toLowerCase();
        if (searchFilter) {
            return ko.utils.arrayFilter(self.mapLocation(), function(location) {
                var str = location.title.toLowerCase();
                var result = str.includes(searchFilter);
                location.visible(result);
                return result;
            });
        }
        self.mapLocation().forEach(function(location) {
            location.visible(true);
        });
        return self.mapLocation();
    }, self);

};

// This function populates the infowindow when the marker is clicked. We'll only allow
// one infowindow which will open at the marker that is clicked, and populate based
// on that markers position.
function populateInfoWindow(marker, street, city, phone, infowindow) {
    // Check to make sure the infowindow is not already opened on this marker.
    if (infowindow.marker != marker) {
        infowindow.setContent('');
        infowindow.marker = marker;
        infowindow.open(map, marker);
        // Make sure the marker property is cleared if the infowindow is closed.
        infowindow.addListener('closeclick', function() {
            infowindow.setMarker = null;
        });
        var streetViewService = new google.maps.StreetViewService();
        var radius = 50;
        var windowContent = '<h4>' + marker.title + '</h4>' +
            '<p>' + street + "<br>" + city + '<br>' + phone + "</p>";

        // In case the status is OK, which means the pano was found, compute the
        // position of the streetview image, then calculate the heading, then get a
        // panorama from that and set the options
        var getStreetView = function(data, status) {
            if (status == google.maps.StreetViewStatus.OK) {
                var nearStreetViewLocation = data.location.latLng;
                var heading = google.maps.geometry.spherical.computeHeading(
                    nearStreetViewLocation, marker.position);
                infowindow.setContent(windowContent + '<div id="pano"></div>');
                var panoramaOptions = {
                    position: nearStreetViewLocation,
                    pov: {
                        heading: heading,
                        pitch: 10
                    }
                };
                var panorama = new google.maps.StreetViewPanorama(
                    document.getElementById('pano'), panoramaOptions);
            } else {
                infowindow.setContent(windowContent + '<div>No Street View Found</div>');
            }
        };
        // Use streetview service to get the closest streetview image within
        // 50 meters of the markers position
        streetViewService.getPanoramaByLocation(marker.position, radius, getStreetView);
        // Open the infowindow on the correct marker.
        infowindow.open(map, marker);
    }
}
//function to make marker bounce
function markerBounce(marker) {
    if (marker.getAnimation() !== null) {
        marker.setAnimation(null);
    } else {
        marker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(function() {
            marker.setAnimation(null);
        }, 790);
    }
}
//show listings
function showListings() {
    var bounds = new google.maps.LatLngBounds();
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(map);
        bounds.extend(markers[i].position);
    }
    map.fitBounds(bounds);
}
//hide listings
function hideListings() {
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
}
//open and close off canvas nav
function openNav() {
    document.getElementById("mySidenav").style.width = "250px";
}

function closeNav() {
    document.getElementById("mySidenav").style.width = "0";
}

// message that comes up if google goes wrong
function ErrorGoogleMaps() {
    alert('Something went wrong with Google Maps');
}
