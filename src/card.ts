import * as three from "three";
import { fromHTML } from "./utils";
import { EvalSourceMapDevToolPlugin } from "webpack";

export type CardCallbacks = {
    onClick: (card: Card, event: MouseEvent) => void;
    onDelete: (card: Card) => void;
};

export class Card {
    private cardId: number;
    private deletionCallback: (id: number) => void;

    active: boolean = false;
    domElement: Element;
    metadata: any;

    callbacks: CardCallbacks;

    static createElement(title: String, content: String): Element {
        return fromHTML(`
<button class="card">
    <div class="card-header"><b>${title}</b></div>
    <div class="card-body">
        <div class="card-content">
            ${content}
        </div>
    </div>
</button>
`) as Element;
    }

    constructor(
        id: number,
        domElement: Element,
        metadata: any,
        deletionCallback: (id: number) => void,
        callbacks?: CardCallbacks,
    ) {
        this.cardId = id;
        this.metadata = metadata;
        this.domElement = domElement;

        if (callbacks != null) this.callbacks = callbacks;
        else
            this.callbacks = {
                onClick: () => { },
                onDelete: () => { },
            };

        this.deletionCallback = deletionCallback;
        this.domElement.addEventListener("click", (event) => {
            this.onClick(event as MouseEvent);
        });
        this.domElement.addEventListener("contextmenu", (event) =>
            this.onContextMenu(event as MouseEvent),
        );
    }

    public get id() {
        return this.cardId;
    }

    public remove() {
        this.callbacks.onDelete(this);
        this.domElement.remove();
        this.deletionCallback(this.id);
    }

    private onClick(event: MouseEvent) {
        this.active = !this.active;
        this.callbacks.onClick(this, event);
    }

    private onContextMenu(event: MouseEvent) {
        event.preventDefault();
        this.remove();
    }
}
