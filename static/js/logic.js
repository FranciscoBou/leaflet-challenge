// Store our API endpoint as queryUrl.
let queryUrl = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson";

  // Define a function to get color based on magnitude
function getColor(depth) {
    return depth > 50 ? '#FF0000' : // red for depths greater than 50 km
           depth > 30 ? '#FF7F00' : // orange for depths between 30 and 50 km
           depth > 10 ? '#FFFF00' : // yellow for depths between 10 and 30 km
           depth > 0  ? '#7FFF00' : // light green for depths between 0 and 10 km
                       '#00FF00';   // green for very shallow depths
}

// Perform a GET request to the query URL/
d3.json(queryUrl).then(function (data) {
  // Once we get a response, send the data.features object to the createFeatures function.
  createFeatures(data.features);
});

function createFeatures(earthquakeData) {
     // Create an array to hold the heatmap data
  let heatArray = [];
  
  // Create an array to hold bubble markers
  let bubbleMarkers = [];

  // Define a function that we want to run once for each feature in the features array.
  // Give each feature a popup that describes the place and time of the earthquake.
  function onEachFeature(feature, layer) {
    layer.bindPopup(`<h3>${feature.properties.place}</h3><hr><p>${new Date(feature.properties.time)}</p>`);

    // Push the latitude, longitude, and magnitude into the heatArray
    heatArray.push([feature.geometry.coordinates[1], feature.geometry.coordinates[0], feature.properties.mag]);

    // Create a bubble marker for each earthquake
    // Create a bubble marker for each earthquake
    let bubbleMarker = L.circleMarker([feature.geometry.coordinates[1], feature.geometry.coordinates[0]], {
        radius: feature.properties.mag * 3, // Scale the radius by magnitude
        fillColor: getColor(feature.geometry.coordinates[2]), // Use depth for color
        color: "#000",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.6
      }).bindPopup(`<h3>${feature.properties.place}</h3><hr><p>Magnitude: ${feature.properties.mag}</p><p>Depth: ${feature.geometry.coordinates[2]} km</p><p>${new Date(feature.properties.time)}</p>`);
    
      bubbleMarkers.push(bubbleMarker);
  }

  // Create a GeoJSON layer that contains the features array on the earthquakeData object.
  // Run the onEachFeature function once for each piece of data in the array.
  let earthquakes = L.geoJSON(earthquakeData, {
    onEachFeature: onEachFeature
  });

  // Create a heatmap layer using the heatArray
  let heat = L.heatLayer(heatArray, {
    radius: 40,
    blur: 15,
    maxZoom: 10
  });

   // Create a layer for bubble markers
   let bubbleLayer = L.layerGroup(bubbleMarkers);

  // Send our earthquakes layer to the createMap function/
  createMap(heat, bubbleLayer);
}


function createMap(heat, bubbleLayer) {

  // Create the base layers.
  let street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  })

  let topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
  });

  // Create a baseMaps object.
  let baseMaps = {
    "Street Map": street,
    "Topographic Map": topo
  };

  // Create an overlay object to hold our overlay.
  let overlayMaps = {
    Earthquakes: bubbleLayer,
    Heatmap: heat,
    
  };

  // Create our map, giving it the streetmap and earthquakes layers to display on load.
  let myMap = L.map("map", {
    center: [
      37.09, -95.71
    ],
    zoom: 5,
    layers: [street, bubbleLayer]
  });

  // Create a layer control.
  // Pass it our baseMaps and overlayMaps.
  // Add the layer control to the map.
  L.control.layers(baseMaps, overlayMaps, {
    collapsed: false
  }).addTo(myMap);

  // Add the legend to the map
  addLegend(myMap);
}

function addLegend(map) {
    // Create a div for the legend
    let legend = L.control({ position: 'topleft' });

    legend.onAdd = function () {
        let div = L.DomUtil.create('div', 'info legend');
        let depths = [0, 10, 30, 50]; // Depth ranges
        
        // Loop through the depth intervals and generate a label with a colored square
        for (let i = 0; i < depths.length; i++) {
            div.innerHTML +=
                '<div class="legend-item">' +
                '<span class="legend-square" style="background:' + getColor(depths[i] + 1) + '"></span> ' +
                depths[i] + (depths[i + 1] ? '&ndash;' + depths[i + 1] + ' km' : '+ km') +
                '</div><br>';
        }
        return div;
    };

    legend.addTo(map);
}