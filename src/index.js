// import * as itowns from "itowns";
// const itowns = require("itowns");
//
// var viewerDiv = document.getElementById("viewerDiv");
// var placement = {
//     coord: new itowns.Coordinates("EPSG:4326", 3.3792, 44.3335, 844),
//     tilt: 22,
//     heading: -180,
//     range: 2840,
// };
//
// var view = new itowns.GlobeView(viewerDiv, placement);
//
// var orthoSource = new itowns.TMSSource({
//     crs: "EPSG:3857",
//     isInverted: true,
//     format: "image/png",
//     url: "http://osm.oslandia.io/styles/klokantech-basic/${z}/${x}/${y}.png",
//     attribution: {
//         name: "OpenStreetMap",
//         url: "http://www.openstreetmap.org/",
//     },
//     tileMatrixSet: "PM", // TODO: Apparently deprecated, figure out why
// });
//
// var orthoLayer = new itowns.ColorLayer("Ortho", {
//     source: orthoSource,
// });
//
// view.addLayer(orthoLayer);
//
// var elevationSource = new itowns.WMTSSource({
//     url: "https://wxs.ign.fr/choisirgeoportail/geoportail/wmts",
//     crs: "EPSG:4326",
//     name: "ELEVATION.ELEVATIONGRIDCOVERAGE.HIGHRES",
//     tileMatrixSet: "WGS84G", // TODO: Same thing
//     format: "image/x-bil;bits=32",
//     tileMatrixSetLimits: {
//         11: {
//             minTileRow: 442,
//             maxTileRow: 1267,
//             minTileCol: 1344,
//             maxTileCol: 2683,
//         },
//         12: {
//             minTileRow: 885,
//             maxTileRow: 2343,
//             minTileCol: 3978,
//             maxTileCol: 5126,
//         },
//         13: {
//             minTileRow: 1770,
//             maxTileRow: 4687,
//             minTileCol: 7957,
//             maxTileCol: 10253,
//         },
//         14: {
//             minTileRow: 3540,
//             maxTileRow: 9375,
//             minTileCol: 15914,
//             maxTileCol: 20507,
//         },
//     },
// });
//
// var elevationLayer = new itowns.ElevationLayer("MNT_WORLD", {
//     source: elevationSource,
// });
//
// view.addLayer(elevationLayer);

import * as itowns from "itowns";

const placement = {
    coord: new itowns.Coordinates("EPSG:4326", 2.351323, 48.856712),
    range: 250000,
};

const viewerDiv = document.getElementById("viewerDiv");
const view = new itowns.GlobeView(viewerDiv, placement);

function addColorLayerFromConfig(config) {
    const layer = new itowns.ColorLayer("ortho", config);
    view.addLayer(layer);
}

function createWMTSSourceFromConfig(config) {
    config.source = new itowns.WMTSSource(config.source);
    return config;
}

itowns.Fetcher.json("assets/layers/ortho.json")
    .then(createWMTSSourceFromConfig)
    .then(addColorLayerFromConfig);

export default placement;
