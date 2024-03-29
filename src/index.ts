import * as itowns from "itowns";
import * as three from "three";
import proj4 from "proj4";
import {
    State,
    ApplicationState,
    StateTransition,
    UpdateableState,
} from "./state";
import dom from "./dom";
import { Card } from "./card";

// Button mapping
const buttonMapping = {
    distanceMeasureButton: State.DistanceMeasure,
    sliceButton: State.Slice,
};

function disableButtons(disabled: boolean) {
    Object.keys(buttonMapping)
        .map((id) => document.getElementById(id) as HTMLButtonElement)
        .forEach((button) => {
            button.disabled = disabled;
        });
}

function resetChecks() {
    dom.freezeToggle.checked = false;
    dom.renderingModeColor.checked = true;
}

// Resets to match the initial state
dom.eptUrl.value = "";
dom.entwineShareOutput.value = "";
resetChecks();

// Business logic ==========================
proj4.defs(
    "EPSG:3946",
    "+proj=lcc +lat_0=46 +lon_0=3 +lat_1=45.25" +
    "+lat_2=46.75 +x_0=1700000 +y_0=5200000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0" +
    "+units=m +no_defs +type=crs",
);

let eptSource: itowns.EntwinePointTileSource;
let eptLayer: itowns.EntwinePointTileLayer;

const view = new itowns.View("EPSG:3946", dom.viewerDiv);
view.mainLoop.gfxEngine.renderer.setClearColor(three.Color.NAMES.black, 1.0);

new ResizeObserver(() => {
    const rendererSize = view.renderer.getSize(new three.Vector2());
    const divSize = new three.Vector2(
        dom.viewerDiv.clientWidth,
        // HACK: Figure out why this offset exists
        dom.viewerDiv.clientHeight - 4,
    );

    if (!rendererSize.equals(divSize)) view.resize(divSize.x, divSize.y);
}).observe(dom.viewerDiv);

const controls = new itowns.PlanarControls(view as itowns.PlanarView);

// Interacting with the view with no data loaded causes errors
dom.viewerDiv.style.display = "none";
disableButtons(true);

let clickDown: MouseEvent | null = null;

function clickDownHandler(event: MouseEvent) {
    clickDown = event;
}

function clickUpHandler(event: MouseEvent) {
    const dist = (a: MouseEvent, b: MouseEvent) =>
        Math.sqrt((a.clientX - b.clientX) ** 2 + (a.clientY - b.clientY) ** 2);

    if (
        clickDown &&
        dist(clickDown, event) < Math.min((5 * window.outerWidth) / 1000, 5)
    ) {
        type Picked = {
            object: three.Points;
            point: three.Vector3;
            index: number;
            distance: number;
            layer: itowns.Layer;
        };

        const pick = <Picked[]>view.pickObjectsAt(event, 5, eptLayer);
        const closest = pick
            .filter((o) => o != null)
            .sort((a, b) => a.distance - b.distance)[0];

        if (closest) {
            console.info(
                `Selected point #${closest.index} in position (${closest.point.x}, ${closest.point.y}, ${closest.point.z}) - node ${closest.object.userData.node.id}`,
            );

            appState.selected.push({
                object: closest.object,
                position: closest.point,
            });

            appState.stateMap.get(appState.state)?.update(event);
        }
    }
}

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
    // resetChecks();
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
    dom.viewerDiv.style.display = "";
    dom.freezeToggle.disabled = false;
    disableButtons(false);
    resetChecks();

    view.domElement.removeEventListener("mousedown", clickDownHandler);
    view.domElement.removeEventListener("mouseup", clickUpHandler);

    view.domElement.addEventListener("mousedown", clickDownHandler);
    view.domElement.addEventListener("mouseup", clickUpHandler);
}

function readEPTURL() {
    const urlParams = new URL(location.href).searchParams;
    let url = dom.eptUrl.value || urlParams.get("ept");

    if (url) {
        const options: any = {};
        for (const key of urlParams.keys()) {
            if (key !== "ept") {
                options[key] = parseInt(urlParams.get(key), 10);
            }
        }
        loadEPT(url, options);

        if (dom.entwineShare.hasAttribute("disabled")) {
            dom.entwineShare.removeAttribute("disabled");
        }
        dom.entwineShareButton.addEventListener("click", function() {
            const url = `${location.href.replace(location.search, "")}?ept=${dom.eptUrl.value}`;
            dom.entwineShareOutput.value = url;
        });

        dom.eptUrl.value = url;
    }
}

dom.entwineLoadButton.addEventListener("click", readEPTURL);

function loadGrandLyon() {
    dom.eptUrl.value =
        "https://download.data.grandlyon.com/files/grandlyon/imagerie/mnt2018/lidar/ept/";
    readEPTURL();
}

dom.entwineGrandLyonButton.addEventListener("click", loadGrandLyon);

// ------ Cloud control
function updateFreeze() {
    if (dom.viewerDiv.style.display == "none") {
        dom.freezeToggle.checked = false;
        return;
    }

    eptLayer.frozen = dom.freezeToggle.checked;
    view.notifyChange();
}

dom.freezeToggle.addEventListener("click", updateFreeze);
dom.renderingModeColor.addEventListener("click", function() {
    if (eptLayer) {
        (eptLayer.material as itowns.PointsMaterial).mode =
            itowns.PNTS_MODE.COLOR;
        view.notifyChange(eptLayer, true);
    }
});
dom.renderingModeClassification.addEventListener("click", function() {
    if (eptLayer) {
        (eptLayer.material as itowns.PointsMaterial).mode =
            itowns.PNTS_MODE.CLASSIFICATION;
        view.notifyChange(eptLayer, true);
    }
});

// ------ Application state
let appState = ApplicationState.getInstance();
appState.stateMap = new Map<State, UpdateableState>([
    [State.Idle, { update: function() { } }],
    [
        State.DistanceMeasure,
        {
            update: function() {
                if (appState.selected.length < 2) return;

                const [a, b] = appState.selected
                    .slice(0, 2)
                    .map((picked) => picked.position);
                const distance = a.distanceTo(b);

                appState.addCard(
                    Card.createElement("Distance Measure", `${distance / 10}m`),
                );

                appState.selected = [];
            },
        },
    ],
    [
        State.Slice,
        {
            update: function() {
                /*TODO: implement slicing (requires new panel)*/
                if (appState.selected.length < 2) return;
            },
        },
    ],
]);
appState.transitions = [
    // DistanceMeasure
    new StateTransition(State.Idle, State.DistanceMeasure, function() { }),
    new StateTransition(State.DistanceMeasure, State.Idle, function() { }),
    // Slice
    new StateTransition(State.Idle, State.Slice, function() {
        dom.freezeToggle.checked = true;
        dom.sliceViewerDiv.style.display = "flex";
        updateFreeze();
    }),
    new StateTransition(State.Slice, State.Idle, function() { }),
];
appState.validate();

// ------ Tools
function clearSelectedTool() {
    dom.toolGridDiv.querySelector(".selected")?.classList.remove("selected");
}

function markSelectedTool(buttonId: string) {
    clearSelectedTool();
    dom.toolGridDiv.querySelector(`#${buttonId}`).classList.add("selected");
}

function pickToolState(state: State) {
    appState.selected = [];
    const transition = appState.transitions.find(
        (t: StateTransition) => t.from == appState.state && t.to == state,
    );
    if (transition != undefined) transition.execute();
    else {
        console.warn(
            `No transition found from ${State[appState.state]} to ${State[state]}, defaulting through Idle state.`,
        );
        [
            [appState.state, State.Idle],
            [State.Idle, state],
        ].forEach(([from, to]) => {
            appState.transitions
                .find((t) => t.from == from && t.to == to)
                .execute();
        });
    }
}

// Disable tools before loading a dataset
Object.keys(buttonMapping)
    .map((id) => document.getElementById(id) as HTMLButtonElement)
    .forEach((button) => {
        button.disabled = true;
    });

// Add tool button click listeners
for (const [buttonId, state] of Object.entries(buttonMapping)) {
    document.getElementById(buttonId).addEventListener("click", function() {
        if (state == appState.state) {
            if (appState.state == State.Idle) return;
            console.log(`Switching to state ${State[State.Idle]}`);
            pickToolState(State.Idle);
            clearSelectedTool();
            return;
        }
        console.log(`Switching to state ${State[state]}`);
        pickToolState(state);
        markSelectedTool(buttonId);
    });
}

// TESTING ==========================

appState.addCard(Card.createElement("Welcome", "Load a dataset to begin."));

// TESTING ==========================

readEPTURL();
