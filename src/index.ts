import * as itowns from "itowns";
import * as three from "three";
import proj4 from "proj4";

const viewerDiv = document.getElementById("viewerDiv") as HTMLDivElement;
const debugDiv = document.getElementById("debugDiv") as HTMLDivElement;

proj4.defs(
    "EPSG:3946",
    "+proj=lcc +lat_0=46 +lon_0=3 +lat_1=45.25 +lat_2=46.75 +x_0=1700000 +y_0=5200000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs",
);

let clickDown: MouseEvent | null = null;

function entwine() {
    const eptUrl = document.getElementById("ept_url") as HTMLInputElement;
    eptUrl.value = "";
    const entwineShareOutput = document.getElementById(
        "entwineShareOutput",
    ) as HTMLInputElement;
    entwineShareOutput.value = "";

    let eptSource: itowns.EntwinePointTileSource;
    let eptLayer: itowns.EntwinePointTileLayer;

    const view = new itowns.View("EPSG:3946", viewerDiv);
    view.mainLoop.gfxEngine.renderer.setClearColor(
        three.Color.NAMES.black,
        1.0,
    );

    const controls = new itowns.PlanarControls(view as itowns.PlanarView);

    // Interacting with the view with no data loaded causes errors
    viewerDiv.style.display = "none";

    function onLayerReady() {
        const lookAt = new three.Vector3();
        const size = new three.Vector3();
        eptLayer.root.bbox.getSize(size);
        eptLayer.root.bbox.getCenter(lookAt);

        (view.camera3D as three.PerspectiveCamera).far = size.length() * 2.0;

        controls.groundLevel = eptLayer.root.bbox.min.z;
        const position = eptLayer.root.bbox.min
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
        eptLayer = new itowns.EntwinePointTileLayer(
            "Entwine Point Tile",
            config,
        );

        view.addLayer(eptLayer).then(onLayerReady);
        viewerDiv.style.display = "";

        function clickDownHandler(event: MouseEvent) {
            clickDown = event;
        }

        function clickUpHandler(event: MouseEvent) {
            const dist = (a: MouseEvent, b: MouseEvent) =>
                Math.sqrt(
                    (a.clientX - b.clientX) ** 2 + (a.clientY - b.clientY) ** 2,
                );

            if (clickDown && dist(clickDown, event) < 5) {
                const pick = view.pickObjectsAt(event, 5, eptLayer);
                const closest = pick.sort((a, b) => a.distance - b.distance)[0];

                if (closest) {
                    console.info(
                        "Selected point #" +
                        closest.index +
                        " in position (" +
                        closest.object.position.x +
                        ", " +
                        closest.object.position.y +
                        ", " +
                        closest.object.position.z +
                        ") - node " +
                        closest.object.userData.node.id,
                    );
                }
            }
        }

        view.domElement.addEventListener("mousedown", clickDownHandler);
        view.domElement.addEventListener("mouseup", clickUpHandler);
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
                    entwineShareOutput.value = url;
                });

            eptUrl.value = url;
        }
    }

    document
        .getElementById("entwineLoadButton")
        .addEventListener("click", readEPTURL);

    function loadGrandLyon() {
        eptUrl.value =
            "https://download.data.grandlyon.com/files/grandlyon/imagerie/mnt2018/lidar/ept/";
        readEPTURL();
    }

    document
        .getElementById("entwineGrandLyonButton")
        .addEventListener("click", loadGrandLyon);

    // ------ Additional UI
    const freezeToggle = document.getElementById(
        "freezeToggle",
    ) as HTMLInputElement;

    function updateFreeze() {
        eptLayer.frozen = freezeToggle.checked;
        view.notifyChange();
    }

    freezeToggle.checked = false;
    freezeToggle.addEventListener("click", updateFreeze);

    readEPTURL();
}

function c3dtiles() {
    const placement = {
        coord: new itowns.Coordinates("EPSG:4326", 3.3792, 44.3335, 844),
        tilt: 22,
        heading: -180,
        range: 2840,
    };

    const view = new itowns.GlobeView(viewerDiv, placement);

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

    viewerDiv.addEventListener("click", function(event) {
        let picked = pointCloudLayer.pickObjectsAt(
            view,
            view.eventToViewCoords(event),
        );

        if (picked.length > 0) {
            console.log(picked);

            let now = new Date(Date.now());
            let hours = `${now.getHours()}`.padStart(2, "0");
            let minutes = `${now.getMinutes()}`.padStart(2, "0");
            let seconds = `${now.getSeconds()}`.padStart(2, "0");
            let tt = `${hours}:${minutes}:${seconds}`;
            debugDiv.innerHTML = `[${tt}] Picked`;
        }
    });

    itowns.View.prototype.addLayer.call(view, pointCloudLayer);
}

entwine();
