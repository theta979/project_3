// Create the tile layer for the map background
let streetmap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

// Create map of Philadelphia with layers
let PhillyMap = L.map("map", {
    center: [39.95, -75.16],
    zoom: 13
});

// Add streetmap tile layer to the map
streetmap.addTo(PhillyMap);


// Load GeoJSON data first
let link = "https://opendata.arcgis.com/datasets/8bc0786524a4486bb3cf0f9862ad0fbf_0.geojson"
d3.json(link).then(geojsonData => {
    
    // Load the CSV data - Note: I had to run a server in the project folder in order to view the CSV data
    // In a terminal window run: python -m http.server 8000
    d3.csv("/static/data/PhiladelphiaFoodAccess.csv").then(csvData => {

        // Create a lookup for faster access
        let censusLookup = {};
        csvData.forEach(row => {
            censusLookup[row["Census Tract"]] = row;

        });

        // Add the GeoJSON layer with data matching
        L.geoJson(geojsonData, {
            style: function (feature) {
                let tractID = feature.properties["GEOID10"];
                let data = censusLookup[tractID];

                if (data) {
                    let lowAccess5 = +data["LA - 0.5 mile radius"];
                    let lowAccess1 = +data["LA - 1 mile radius"];
                
                    return {
                        color: "black",
                        weight: 1,
                        fillColor: getColor(lowAccess5, lowAccess1), // Use CSV data
                        fillOpacity: 0.4
                    };
                 } else {
                    return {
                        color: "black",
                        weight: 1,
                        fillColor: "gray", // Default color
                        fillOpacity: 0.4
                    };
                }
            },
            onEachFeature: function (feature, layer) {
                let tractID = feature.properties["GEOID10"];
                let data = censusLookup[tractID];
                // Add content to pop-ups
                let popupContent = `<b>Census Tract:</b> ${tractID}<br>`;// Should we put Zip Code instead?
                if (data) {
                    let lowAccessStatus = data["LA - 1 mile radius", "LA - 0.5 mile radius"] === "1" ? "Low Access" : "Not Low Access";

                    popupContent += `<b>Population:</b> ${data["Population"]}<br>`;// What else should we include in pop-ups
                    popupContent += `<b>Status:</b> ${lowAccessStatus}<br>`;
                    popupContent += `<b>Median Income: </b> $${data["Median Family Income"]}<br>`;
                } else {
                    popupContent += "No data available";
                }

                layer.bindPopup(popupContent);
            }
        }).addTo(PhillyMap);

    }).catch(error => console.log("Error loading CSV:", error));
}).catch(error => console.log("Error loading GeoJSON:", error));

// Here we can adjust the colors that indicate food deserts and how far it is to grocery store, etc.
function getColor(lowAccess5, lowAccess1) {
    if (lowAccess5 == 0 && lowAccess1 == 0) {
        return "green";
    } else if (lowAccess5 == 1 && lowAccess1 == 0) {
        return "yellow";
    } else if (lowAccess1 == 1) {
        return "red"
    } else {
        return "gray";
    }
    // return value[0] == 1 ? "red" :
    //        value[1] == 0 ? "green" :
    //        value[1] == 1 ? "yellow" :
    //                       "gray";
}