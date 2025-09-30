import dom from "dom";
import { Picked } from "state";

class SliceViewer {
    slice: Picked[];

    constructor(slice: Picked[]) {
        this.slice = slice;
    }

    render() {
        dom.sliceViewerGraphDiv.innerHTML = "";
        // TODO: instantiate points

        // Get start -> end vector (<ground->)
        // For each point
        //   Get coordinates of projection on <ground->
        //   Calculate progress
        //   Calculate height based on <ground-> normal
        //   Init Point with picked info as metadata
    }
}
