import { Color } from "three";
import { fromHTML } from "utils";

export type PointCallbacks = {
    onClick: (point: Point, event: MouseEvent) => void;
    onDelete: (point: Point) => void;
};

export class Point {
    private pointId: number;
    private deletionCallback: (id: number) => void;

    active: boolean = false;
    domElement: HTMLElement;
    metadata: any;

    callbacks: PointCallbacks;

    // TODO: Finish absolute positioning point component
    static createHTMLElement(
        progress: number,
        height: number,
        color: Color = new Color(0xffffff),
    ): HTMLElement {
        return fromHTML(`<div class="point" style="
left: ${5 + progress * 90}%;
bottom: ${height * 90}%;
background-color: #${color.getHexString()}
></div>`) as HTMLElement;
    }

    constructor(
        id: number,
        domElement: HTMLElement,
        metadata: any,
        deletionCallback: (id: number) => void,
        callbacks?: PointCallbacks,
    ) {
        this.pointId = id;
        this.domElement = domElement;
        this.metadata = metadata;
        this.deletionCallback = deletionCallback;

        if (callbacks != null) this.callbacks = callbacks;
        else
            this.callbacks = {
                onClick: () => { },
                onDelete: () => { },
            };

        this.domElement.addEventListener("click", (event) => {
            this.onClick(event as MouseEvent);
        });
        this.domElement.addEventListener("contextmenu", (event) =>
            this.onContextMenu(event as MouseEvent),
        );
    }

    public get id() {
        return this.pointId;
    }

    public remove() {
        this.callbacks.onDelete(this);
        this.domElement.remove();
        this.deletionCallback(this.pointId);
    }

    public hide() {
        this.domElement.style.display = "none";
    }

    public unhide() {
        this.domElement.style.display = "block";
    }

    private onClick(event: MouseEvent) {
        this.callbacks.onClick(this, event);
    }

    private onContextMenu(_event: MouseEvent) {
        this.hide();
    }
}
