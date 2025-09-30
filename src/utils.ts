// https://stackoverflow.com/questions/494143/creating-a-new-dom-element-from-an-html-string-using-built-in-dom-methods-or-pro/35385518#35385518

import { Box2, Box3, Line3, Vector2, Vector3 } from "three";

/**
 * @param html HTML representing a single element.
 * @param trim flag representing whether or not to trim input whitespace, defaults to true.
 */
function fromHTML(
    html: string,
    trim: boolean = true,
): Element | HTMLCollection | null {
    // Process the HTML string.
    html = trim ? html.trim() : html;
    if (!html) return null;

    // Then set up a new template element.
    const template = document.createElement("template");
    template.innerHTML = html;
    const result = template.content.children;

    // Then return either an HTMLElement or HTMLCollection,
    // based on whether the input HTML had one or more roots.
    if (result.length === 1) return result[0];
    return result;
}

function lineIntersectsBox(line: Line3, box: Box3) {
    // Check if all the points are on the same side of the line
    const leftOf = function (point: Vector2) {
        return (
            (line.end.y - line.start.y) * point.x +
                (line.start.x - line.end.x) * point.y +
                (line.end.x * line.start.y - line.start.x * line.end.y) >=
            0
        );
    };

    const res: number[] = [
        new Vector2(box.min.x, box.min.y),
        new Vector2(box.min.x, box.max.y),
        new Vector2(box.max.x, box.max.y),
        new Vector2(box.max.x, box.min.y),
    ]
        .map(leftOf)
        .map((x) => (x ? 1 : 0));

    const a_miss = res.reduce((a, b) => a + b) % 4 === 0;

    // Perform shadow intersection test
    const b_miss =
        (line.start.x > box.max.x && line.end.x > box.max.x) ||
        (line.start.x < box.min.x && line.end.x < box.min.x) ||
        (line.start.y > box.max.y && line.end.y > box.max.y) ||
        (line.start.y < box.min.y && line.end.y < box.min.y);

    return !(a_miss || b_miss);
}

export { fromHTML, lineIntersectsBox };
