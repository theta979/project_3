// Create the tile layer for the map background
let streetmap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

// Create map of Philadelphia with layers
let PhillyMap = L.map("map", {
    center: [39.99, -75.16],
    zoom: 12
});

// Add streetmap tile layer to the map
streetmap.addTo(PhillyMap);


// Load GeoJSON data first
let link = "https://opendata.arcgis.com/datasets/8bc0786524a4486bb3cf0f9862ad0fbf_0.geojson"
d3.json(link).then(geojsonData => {
    
    // Load the CSV data - Note: I had to run a server in the project folder in order to view the CSV data
    // In a terminal window run: python -m http.server 8000
    // d3.csv("static/data/Philadelphia_Food_Access.csv").then(csvData => {
    d3.csv("static/data/Philadelphia_Food_Access.csv").then(csvData => { 

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
                let popupContent = `<b>Census Tract:</b> ${tractID}<br>`;
                if (data) {
                    let lowAccessStatus = data["LA - 1 mile radius", "LA - 0.5 mile radius"] === "1" ? "Low Access" : "Not Low Access";

                    popupContent += `<b>Population:</b> ${data["Population"]}<br>`;// What else should we include in pop-ups
                    popupContent += `<b>Status:</b> ${lowAccessStatus}<br>`;
                    // popupContent += `<b>Median Income: </b> $${data["Median Family Income"]}<br>`; Not needed for this Visualization
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
}
console.log(getColor(0, 0)); // Should be "green"
console.log(getColor(1, 0)); // Should be "yellow"
console.log(getColor(0, 1)); // Should be "red"
console.log(getColor(-1, -1)); // Should be "gray"

// Create a legend control object
let legend = L.control({
    position: "bottomright"
});

// Then add all the details for the legend
legend.onAdd = function () {
    let div = L.DomUtil.create("div", "info legend");

    // Set legend styles
    div.style.background = "white";
    div.style.opacity = ".90";
    div.style.padding = "10px";
    // div.style.border = "1px solid black";
    div.style.borderRadius = "5px";
    // div.style.width = "auto";
    // div.style.display = "flex";
    // div.style.flexDirection = "column";
    div.style.alignItems = "center";


    // Add title
    div.innerHTML = "<h2 style='text-align: center; margin-bottom: 10px;'>Legend</h2>";

    // Define categories based on getColor scheme
    let categories = [
        {label: "Not Low Access", color: getColor(0, 0)}, // Green
        {label: "Live > .5 miles from Quality food", color: getColor(1, 0)}, // Yellow
        {label: "Live > 1 mile from Quality food", color: getColor(1, 1)}, // Red
        {label: "Undefined / Other", color: getColor(-1, -1)} // Gray (Default)
    ];


    // Loop through categories to create legend items
    categories.forEach(item => {
        div.innerHTML += `<div style="display: flex; align-items: center; gap: 5px; margin-bottom: 10px;">
            <i style="background: ${item.color}; width: 18px; height: 18px; display: inline-block;"></i>
            ${item.label}
        </div>`;
    });

    // Footnote below the Legend
    div.innerHTML += `<p style="font-size: 12px; color: gray; margin-top: 10px;">
        * As determined by USDA, Treasury, & HHS.
    </p>`;
    return div;
};
// Finally, add the legend to the map.
legend.addTo(PhillyMap);
