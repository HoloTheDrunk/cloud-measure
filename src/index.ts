import * as itowns from "itowns";
import * as three from "three";
import proj4 from "proj4";

const viewerDiv = document.getElementById("viewerDiv") as HTMLDivElement;
// const renderer = new three.WebGL1Renderer({
//     canvas: document.createElement("canvas"),
// });
//
// viewerDiv.appendChild(renderer.domElement);

proj4.defs(
    "EPSG:3946",
    "+proj=lcc +lat_0=46 +lon_0=3 +lat_1=45.25 +lat_2=46.75 +x_0=1700000 +y_0=5200000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs",
);

// var debugDiv = document.getElementById("debugDiv") as HTMLDivElement;

var view = new itowns.View("EPSG:3946", viewerDiv);
view.mainLoop.gfxEngine.renderer.setClearColor(0x000000, 1.0);

const controls = new itowns.PlanarControls(view as itowns.PlanarView);

var eptUrl = document.getElementById("ept_url") as HTMLInputElement;
var eptSource: itowns.EntwinePointTileSource;
var eptLayer: itowns.EntwinePointTileLayer;

function onLayerReady() {
    var lookAt = new three.Vector3();
    var size = new three.Vector3();
    eptLayer.root.bbox.getSize(size);
    eptLayer.root.bbox.getCenter(lookAt);

    controls.groundLevel = eptLayer.root.bbox.min.z;
    var position = eptLayer.root.bbox.min
        .clone()
        .add(size.multiply({ x: 0, y: 0, z: size.x / size.z }));

    view.camera3D.position.copy(position);
    view.camera3D.lookAt(lookAt);
    (view.camera3D as itowns.OrientedImageCamera).updateProjectionMatrix();

    view.notifyChange(view.camera3D);
}

function loadEPT(url: string, options: any) {
    eptSource = new itowns.EntwinePointTileSource({ url });

    if (eptLayer) {
        view.removeLayer("Entwine Point Tile");
        view.notifyChange();
        eptLayer.delete();
    }

    const config = {
        source: eptSource,
        crs: view.referenceCrs,
        ...options,
    };
    eptLayer = new itowns.EntwinePointTileLayer("Entwine Point Tile", config);

    view.addLayer(eptLayer).then(onLayerReady);

    function dblClickHandler(event: three.Vector2 | MouseEvent | TouchEvent) {
        var pick = view.pickObjectsAt(event, 5, eptLayer);

        for (const p of pick) {
            console.info(
                "Selected point #" +
                p.index +
                " in position (" +
                p.object.position.x +
                ", " +
                p.object.position.y +
                ", " +
                p.object.position.z +
                ") - node " +
                p.object.userData.node.id,
            );
        }
    }

    view.domElement.addEventListener("dblclick", dblClickHandler);
}

function readEPTURL() {
    const urlParams = new URL(location.href).searchParams;
    let url = eptUrl.value || urlParams.get("ept");

    if (url) {
        const options: any = {};
        for (const key of urlParams.keys()) {
            if (key !== "ept") {
                options[key] = parseInt(urlParams.get(key), 10);
            }
        }
        loadEPT(url, options);

        const entwineShare = document.getElementById("entwineShare");
        if (entwineShare.hasAttribute("disabled")) {
            entwineShare.removeAttribute("disabled");
        }
        document
            .getElementById("entwineShareButton")
            .addEventListener("click", function() {
                const url =
                    location.href.replace(location.search, "") +
                    "?ept=" +
                    eptUrl.value;
                (
                    document.getElementById(
                        "entwineShareOutput",
                    ) as HTMLInputElement
                ).value = url;
            });

        eptUrl.value = url;
    }
}

document
    .getElementById("entwineLoadButton")
    .addEventListener("click", readEPTURL);

export function loadGrandLyon() {
    eptUrl.value =
        "https://download.data.grandlyon.com/files/grandlyon/imagerie/mnt2018/lidar/ept/";
    readEPTURL();
}

document
    .getElementById("entwineGrandLyonButton")
    .addEventListener("click", loadGrandLyon);

readEPTURL();

// var placement = {
//     coord: new itowns.Coordinates("EPSG:4326", 3.3792, 44.3335, 844),
//     tilt: 22,
//     heading: -180,
//     range: 2840,
// };
//
// var view = new itowns.GlobeView(viewerDiv, placement);
//
// const pointCloudSource = new itowns.C3DTilesSource({
//     url:
//         "https://raw.githubusercontent.com/iTowns/iTowns2-sample-data/" +
//         "master/3DTiles/lidar-hd-gorges-saint-chely-tarn/tileset.json",
// });
//
// function isPoints(obj: three.Object3D): obj is three.Points {
//     return (obj as three.Points).isPoints !== undefined;
// }
//
// function updatePointCloudSize(
//     event: three.Event<string, itowns.C3DTilesLayer>,
// ) {
//     const tileContent = event.target.object3d;
//     tileContent.traverse(function(obj: three.Object3D) {
//         if (isPoints(obj)) {
//             (obj.material as three.PointsMaterial).size = 3.0;
//         }
//     });
// }
//
// const pointCloudLayer = new itowns.C3DTilesLayer(
//     "gorges",
//     {
//         source: pointCloudSource,
//     },
//     view,
// );
//
// pointCloudLayer.addEventListener(
//     itowns.C3DTILES_LAYER_EVENTS.ON_TILE_CONTENT_LOADED,
//     updatePointCloudSize,
// );
//
// viewerDiv.addEventListener("click", function(event) {
//     console.log(event);
//     let picked = pointCloudLayer.pickObjectsAt(
//         view,
//         view.eventToViewCoords(event),
//     );
//     console.log(picked);
//
//     let now = new Date(Date.now());
//     let hours = `${now.getHours()}`.padStart(2, "0");
//     let minutes = `${now.getMinutes()}`.padStart(2, "0");
//     let seconds = `${now.getSeconds()}`.padStart(2, "0");
//     let tt = `${hours}:${minutes}:${seconds}`;
//     debugDiv.innerHTML = `[${tt}] Picked`;
// });
//
// itowns.View.prototype.addLayer.call(view, pointCloudLayer);
