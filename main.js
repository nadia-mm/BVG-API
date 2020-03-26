
async function calculateDuration() {

    //check entered data
    let origin = document.getElementById("origin");// Berlin Nordbahnhof 900000007104
    let destination = document.getElementById("destination"); //Alexanderplatz 900000100003
    let duration = document.getElementById("duration");
    checkData(origin.value, destination.value);




    async function getJourney(origin, destination) {

        let originID = await getID(origin);
        checkID(originID);
        let destinationID = await getID(destination);
        checkID(destinationID);
        let getQuery = "https://2.bvg.transport.rest/journeys?from=" + originID + "&to=" + destinationID + "&results=1";

        //find the first result according to selected means of transport
        let checkboxes = document.getElementsByName('transport');
        for (let checkbox of checkboxes) {
            if (checkbox.checked) {
                getQuery += "&" + checkbox.value + "=true";
                // console.log(getQuery);
            }
        }
        let journeys = await fetch(getQuery);
        let parsed = await journeys.json();
        let v_legs = parsed.journeys[0].legs[0];
        let v_departure = v_legs.departure;
        let v_arrival = v_legs.arrival;

        //Display stops on the map
        getLongitudeLatitudeBVG(getQuery);


        console.log("departure: ", moment(v_departure.toString()).format("YYYY-MM-DDTHH:mm:ss.SSSZ"));
        console.log("arrival: ", moment(v_arrival.toString()).format("YYYY-MM-DDTHH:mm:ss.SSSZ"));
        let diff = moment(v_arrival.toString()) - moment(v_departure.toString());
        console.log("Duration of the journey:", moment.duration(diff).asMinutes(), "minute(s)");


        return moment.duration(diff).asMinutes();

    }


    //Display the duration of the journey
    let dur = await getJourney(origin.value, destination.value);
    duration.textContent = "Duration of the journey (" + origin.value + "-" + destination.value + "): " + dur.toString() + " minute(s)";

}

async function getLongitudeLatitudeBVG(url) {
    //create or reinitialize the map container
    document.getElementById('mapId').innerHTML = "<div id='map' style='width: 100%; height: 100%;'></div>"
    let mymap = L.map('map');

    let layer = L.tileLayer(
        "http://1.base.maps.cit.api.here.com/maptile/2.1/maptile/newest/normal.day/{z}/{x}/{y}/256/png8?app_id=fQbm3OvKtn44q7f7wqu0&app_code=wBdfzzXp6j6sEYkp-pqP4g"
    );

    // add the new layer to the map:

    layer.addTo(mymap);

    let response = await fetch(url);
    let parsed = await response.json();
    let v_legs = await parsed.journeys[0].legs;

    //Departure
    let v_departure = v_legs[0].origin;
    let v_location = await v_departure.location;
    let v_lat = await v_location.latitude;
    let v_lng = await v_location.longitude;
    let marker = L.marker([v_lat, v_lng]);
    mymap.setView([v_lat, v_lng], 13);
    marker.addTo(mymap);
    marker.bindPopup("<b> Departure says:</b></br>" + v_departure.name + " is here!");


    //intermediate stations
    for (let i = 1; i < v_legs.length; i++) {
        v_leg = await v_legs[i];
        v_stop = v_leg.origin;

        v_location = await v_stop.location;
        v_lat = await v_location.latitude;
        v_lng = await v_location.longitude;
        //console.log(v_lat);
        //console.log(v_lng);

        marker = L.marker([v_lat, v_lng]);
        marker.addTo(mymap);
        marker.bindPopup("<b> Stop #" + i + " says:</b></br>" + v_stop.name + " is here!");
    }

    //Arrival
    v_destination = v_legs[v_legs.length - 1].destination;
    v_location = await v_destination.location;
    v_lat = await v_location.latitude;
    v_lng = await v_location.longitude;
    marker = L.marker([v_lat, v_lng]);
    marker.addTo(mymap);
    marker.bindPopup("<b> Final stop says:</b></br>" + v_destination.name + " is here!");

}


function tickAll(source) {
    checkboxes = document.getElementsByName('transport');
    for (let checkbox of checkboxes) {
        checkbox.checked = source.checked;
    }

}
function checkData(origin, destination) {
    if (origin === "" || destination === "") {
        alert("Please enter valid departure and destination!");

    }
}

function checkID(id) {
    if (typeof id === undefined) {
        alert("Please enter valid departure and destination from the Berlin area!");
    }
}

// get destination and origin IDs to get the matching journey
async function getID(name) {
    let getQuery = "https://2.bvg.transport.rest/locations?query=" + encodeURIComponent(name) + "&results=1";
    let locations = await fetch(getQuery);
    let parsed = await locations.json();
    console.log(name + " ID :" + parsed[0].id);
    return parsed[0].id;
}
