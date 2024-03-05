import "itowns";

var viewerDiv = document.getElementById("viewerDiv");
var placement = {
    coord: new itowns.Coordinates("EPSG:4326", 3.3792, 44.3335, 844),
    tilt: 22,
    heading: -180,
    range: 2840,
};

var view = new itowns.GlobeView(viewerDiv, placement);

var orthoSource = new itowns.TMSSource({
    crs: "EPSG:3857",
    isInverted: true,
    format: "image/png",
    url: "http://osm.oslandia.io/styles/klokantech-basic/${z}/${x}/${y}.png",
    attribution: {
        name: "OpenStreetMap",
        url: "http://www.openstreetmap.org/",
    },
    tileMatrixSet: "PM",
});
