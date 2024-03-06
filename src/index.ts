import * as itowns from "itowns";
import * as three from "three";

var viewerDiv = document.getElementById("viewerDiv") as HTMLDivElement;
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
    // @ts-ignore
    tileMatrixSet: "PM",
});

var orthoLayer = new itowns.ColorLayer("Ortho", {
    source: orthoSource,
});

view.addLayer(orthoLayer);

var elevationSource = new itowns.WMTSSource({
    url: "http://wxs.ign.fr/altimetrie/geoportail/wmts",
    crs: "EPSG:4326",
    // @ts-ignore
    name: "ELEVATION.ELEVATIONGRIDCOVERAGE.HIGHRES",
    tileMatrixSet: "WGS84G",
    format: "image/x-bil;bits=32",
    tileMatrixSetLimits: {
        11: {
            minTileRow: 442,
            maxTileRow: 1267,
            minTileCol: 1344,
            maxTileCol: 2683,
        },
        12: {
            minTileRow: 885,
            maxTileRow: 2343,
            minTileCol: 3978,
            maxTileCol: 5126,
        },
        13: {
            minTileRow: 1770,
            maxTileRow: 4687,
            minTileCol: 7957,
            maxTileCol: 10253,
        },
        14: {
            minTileRow: 3540,
            maxTileRow: 9375,
            minTileCol: 15914,
            maxTileCol: 20507,
        },
    },
});

var elevationLayer = new itowns.ElevationLayer("MNT_WORLD", {
    source: elevationSource,
});

view.addLayer(elevationLayer);

const pointCloudSource = new itowns.C3DTilesSource({
    url:
        "https://raw.githubusercontent.com/iTowns/iTowns2-sample-data/" +
        "master/3DTiles/lidar-hd-gorges-saint-chely-tarn/tileset.json",
});

function isPoints(obj: three.Object3D): obj is three.Points {
    return (obj as three.Points).isPoints !== undefined;
}

function updatePointCloudSize(
    event: three.Event<string, itowns.C3DTilesLayer>,
) {
    const tileContent = event.target.object3d;
    tileContent.traverse(function(obj: three.Object3D) {
        if (isPoints(obj)) {
            (obj.material as three.PointsMaterial).size = 3.0;
        }
    });
}

const pointCloudLayer = new itowns.C3DTilesLayer(
    "gorges",
    {
        source: pointCloudSource,
    },
    view,
);

pointCloudLayer.addEventListener(
    itowns.C3DTILES_LAYER_EVENTS.ON_TILE_CONTENT_LOADED,
    updatePointCloudSize,
);

itowns.View.prototype.addLayer.call(view, pointCloudLayer);
