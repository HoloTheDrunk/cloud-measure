import * as three from "three";
import { Card } from "./card";
import dom from "./dom";

enum State {
    Idle,
    DistanceMeasure,
    Slice,
}

export interface UpdateableState {
    update(data?: any): void;
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

export type Picked = {
    object: three.Object3D;
    position: three.Vector3;
};

class ApplicationState {
    private static instance: ApplicationState;

    state: State;
    stateMap: Map<State, UpdateableState>;
    transitions: StateTransition[];
    selected: Picked[];

    private cardCount: number = 0;
    cards: Card[] = [];

    private constructor() {
        this.state = State.Idle;
        this.selected = [];
    }

    /** @throws {Error} if the state machine is invalid */
    public validate() {
        (
            Object.values(State).filter((v) => typeof v === "number") as State[]
        ).forEach((state) => {
            if (!this.stateMap.has(state)) {
                throw new Error(
                    `State ${State[state]} is not in the state map.`,
                );
            }

            if (
                state != State.Idle &&
                this.transitions.filter(
                    (t) =>
                        (t.from == state && t.to == State.Idle) ||
                        (t.to == state && t.from == State.Idle),
                ).length != 2
            ) {
                throw new Error(
                    `State ${State[state]} has no transition to or from Idle state.`,
                );
            }
        });
    }

    public addCard(domElement: Element) {
        dom.toolOutputDiv.prepend(domElement);

        let metadata = (() => {
            switch (this.state) {
                case State.Idle:
                    return {};
                case State.DistanceMeasure:
                    return { points: this.selected.slice(0, 2) };
                case State.Slice:
                    // TODO:
                    return {};
            }
        })();

        this.cards.push(
            new Card(this.cardCount++, domElement, metadata, (id) =>
                this.deleteCard(id),
            ),
        );
    }

    public deleteCard(id: number) {
        this.cards = this.cards.filter((card) => card.id != id);
    }

    public static getInstance(): ApplicationState {
        if (!ApplicationState.instance) {
            ApplicationState.instance = new ApplicationState();
        }

        return ApplicationState.instance;
    }
}

export default { ApplicationState, State, StateTransition };
export { ApplicationState, State, StateTransition };
