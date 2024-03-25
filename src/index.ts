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

enum State {
    Idle,
    DistanceMeasure,
    Slice,
}

interface UpdateableState {
    update(data: any): void;
}

class StateTransition {
    from: State;
    to: State;
    private transition: (appState: ApplicationState) => void;

    constructor(
        from: State,
        to: State,
        transition: (appState: ApplicationState) => void,
    ) {
        this.from = from;
        this.to = to;
        this.transition = transition;
    }

    public execute() {
        let appState = ApplicationState.getInstance();
        this.transition(appState);
        appState.state = this.to;
    }
}

class ApplicationState {
    private static instance: ApplicationState;

    state: State;
    stateMap: Map<State, UpdateableState>;
    transitions: StateTransition[];
    selected: three.Object3D[];

    private constructor() {
        this.stateMap = new Map<State, UpdateableState>([
            [
                State.Idle,
                {
                    update: function(_data: any) {
                        // Do nothing
                    },
                },
            ],
        ]);
        this.state = State.Idle;
        this.transitions = [
            new StateTransition(
                State.Idle,
                State.DistanceMeasure,
                function() { },
            ),
            new StateTransition(
                State.DistanceMeasure,
                State.Idle,
                function() { },
            ),
            new StateTransition(State.Idle, State.Slice, function() { }),
            new StateTransition(State.Slice, State.Idle, function() { }),
        ];
        this.selected = [];
    }

    public static getInstance(): ApplicationState {
        if (!ApplicationState.instance) {
            ApplicationState.instance = new ApplicationState();
        }

        return ApplicationState.instance;
    }
}

function entwine() {
    let appState = ApplicationState.getInstance();

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
        freezeToggle.disabled = false;

        function clickDownHandler(event: MouseEvent) {
            clickDown = event;
        }

        function clickUpHandler(event: MouseEvent) {
            const dist = (a: MouseEvent, b: MouseEvent) =>
                Math.sqrt(
                    (a.clientX - b.clientX) ** 2 + (a.clientY - b.clientY) ** 2,
                );

            if (clickDown && dist(clickDown, event) < 5) {
                type Picked = {
                    object: three.Points;
                    point: three.Vector3;
                    index: number;
                    distance: number;
                    layer: itowns.Layer;
                };

                const pick = <Picked[]>view.pickObjectsAt(event, 5, eptLayer);
                const closest = pick.sort((a, b) => a.distance - b.distance)[0];

                if (closest) {
                    console.info(
                        `Selected point #${closest.index} in position (${closest.point.x}, ${closest.point.y}, ${closest.point.z}) - node ${closest.object.userData.node.id}`,
                    );

                    appState.selected.push(closest.object);

                    appState.stateMap.get(appState.state)?.update(event);
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

    // ------ Cloud control
    const freezeToggle = document.getElementById(
        "freezeToggle",
    ) as HTMLInputElement;

    function updateFreeze() {
        if (viewerDiv.style.display == "none") {
            // setTimeout(() => (freezeToggle.checked = false), 100);
            freezeToggle.checked = false;
            return;
        }

        eptLayer.frozen = freezeToggle.checked;
        view.notifyChange();
    }

    freezeToggle.checked = false;
    freezeToggle.addEventListener("click", updateFreeze);

    // ------ Tools
    const toolGridDiv = document.getElementById(
        "toolGridDiv",
    ) as HTMLDivElement;

    function clearSelectedTool() {
        toolGridDiv.querySelector(".selected")?.classList.remove("selected");
    }

    function markSelectedTool(buttonId: string) {
        clearSelectedTool();
        toolGridDiv.querySelector(`#${buttonId}`).classList.add("selected");
    }

    function pickStateTool(state: State) {
        appState.selected = [];
        const transition = appState.transitions.find(
            (t: StateTransition) => t.from == appState.state && t.to == state,
        );
        if (transition != null) transition.execute();
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

    const buttonMapping = {
        distanceMeasureButton: State.DistanceMeasure,
        sliceButton: State.Slice,
    };

    for (const [buttonId, state] of Object.entries(buttonMapping)) {
        document
            .getElementById(buttonId)
            .addEventListener("click", function() {
                if (state == appState.state) {
                    if (appState.state == State.Idle) return;
                    console.log(`Switching to state ${State[State.Idle]}`);
                    pickStateTool(State.Idle);
                    clearSelectedTool();
                    return;
                }
                console.log(`Switching to state ${State[state]}`);
                pickStateTool(state);
                markSelectedTool(buttonId);
            });
    }

    readEPTURL();
}

entwine();
