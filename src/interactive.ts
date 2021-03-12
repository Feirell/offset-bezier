import {EventEmitter} from "event-emitter-typesafe";
import {fitSystemNewApproach, V2} from "./fit-system";
import {StaticBezier} from "nd-bezier";

const height = 900;
const width = 1400;
const margin = 100;

type Vector2 = [number, number];

/*
K(t) = a * t ^ b * (1 - t) ^ c
K'(t) = a * b * t ^ (b - 1) * (1 - t) ^ c - a * c * t ^ b * (1 - t) ^ (c - 1)
*/

//
// let bezierPoints: Vector2[] = [];
//
function ascent(points: Vector2[], t: number) {
    "use strict";

    const oneMinusT = 1 - t;
    const m0 = -3 * oneMinusT * oneMinusT;
    const m1 = 9 * t * t - 12 * t + 3;
    const m2 = 6 * t - 9 * t * t;
    const m3 = 3 * t * t;
    return [
        m0 * points[0][0] + m1 * points[1][0] + m2 * points[2][0] + m3 * points[3][0],
        m0 * points[0][1] + m1 * points[1][1] + m2 * points[2][1] + m3 * points[3][1]
    ];
}

const pointRadius = 20;

function drawPoints(ctx: CanvasRenderingContext2D, points: Vector2[], radius = pointRadius) {
    ctx.beginPath();

    for (let i = 0; i < points.length; i++) {
        const p = points[i];
        ctx.moveTo(p[0], p[1]);
        ctx.arc(p[0], p[1], radius, 0, 360);
    }

    ctx.fill();
    ctx.closePath();
}

function drawPolyline(ctx: CanvasRenderingContext2D, points: Vector2[]) {
    if (points.length == 0)
        return;

    ctx.beginPath();

    const startPoint = points[0];
    ctx.moveTo(startPoint[0], startPoint[1]);
    for (let i = 1; i < points.length; i++) {
        const point = points[i];
        ctx.lineTo(point[0], point[1]);
    }

    ctx.stroke();
    ctx.closePath();
}

/*
function getPointsLeftAndRightFromBezier(points: Vector2[], t: number, distance: number): [V2, V2, V2] {
    const asc = ascent(points, t);
    const ascLength = Math.sqrt(asc[0] * asc[0] + asc[1] * asc[1]);
    const ascNorm = [distance * asc[0] / ascLength, distance * asc[1] / ascLength];

    let bezier = new StaticBezier(points);
    const point = bezier.at(t);

    return [
        // left point
        [point[0] + ascNorm[1], point[1] + -ascNorm[0]],

        // center point
        [point[0], point[1]],

        // right point
        [point[0] + -ascNorm[1], point[1] + ascNorm[0]]
    ];
}
*/

function getPointsLeftAndRightFromBezier(points: Vector2[], t: number, distance: number): [V2, V2, V2] {
    const staticBezier = new StaticBezier(points);

    const leftPoint = staticBezier.offsetPointLeft(t, distance) as V2;
    const rightPoint = staticBezier.offsetPointRight(t, distance) as V2;

    return [
        // left point
        leftPoint,

        // center point
        staticBezier.at(t) as V2,

        // right point
        rightPoint
    ];
}

function drawOffsetBezier(ctx: CanvasRenderingContext2D, pinPoints: V2[], spikes: number, distance: number, renderSpikes: boolean) {
    if (spikes == 0 || pinPoints.length < 2)
        return;

    const rightSideLines: [Vector2, Vector2][] = [];
    const leftSideLines: [Vector2, Vector2][] = [];

    for (let i = 0; i <= spikes; i++) {
        const t = i / spikes;
        const [left, center, right] = getPointsLeftAndRightFromBezier(pinPoints, t, distance);

        rightSideLines.push([
            center,
            right
        ]);

        leftSideLines.push([
            center,
            left
        ]);
    }

    const originalStrokeStyle = ctx.strokeStyle;

    ctx.strokeStyle = '#444';
    drawPolyline(ctx, rightSideLines.map(p => p[1]));

    // ctx.strokeStyle = '#f00';
    // drawPolyline(ctx, rightSideLines.map(p => [
    //     (p[0][0] + p[1][0]) / 2,
    //     (p[0][1] + p[1][1]) / 2
    // ]));


    ctx.strokeStyle = '#444';
    drawPolyline(ctx, leftSideLines.map(p => p[1]));

    // ctx.strokeStyle = '#f00';
    // drawPolyline(ctx, leftSideLines.map(p => [
    //     (p[0][0] + p[1][0]) / 2,
    //     (p[0][1] + p[1][1]) / 2
    // ]));


    if (renderSpikes) {
        const originalWidth = ctx.lineWidth;
        ctx.strokeStyle = '#0ff';
        ctx.lineWidth = originalWidth / 2;
        ctx.beginPath();
        for (const arr of [leftSideLines, rightSideLines]) {
            for (const [start, end] of arr) {
                ctx.moveTo(start[0], start[1]);
                ctx.lineTo(end[0], end[1]);
            }
        }

        ctx.stroke();
        ctx.closePath();
        ctx.lineWidth = originalWidth;
    }

    ctx.strokeStyle = originalStrokeStyle;
}

function drawBezier(pinPoints: Vector2[], ctx: CanvasRenderingContext2D, lines: number, spikes = lines) {
    if (pinPoints.length < 2)
        return;

    const bezier = new StaticBezier(pinPoints);
    const points: Vector2[] = [];

    for (let i = 0; i <= lines; i++) {
        points.push(bezier.at(i / lines) as Vector2);
    }

    drawPolyline(ctx, points);
}

const options = {
    approachDistance: ["1. Approach: Normal-Vector", true],
    approachControlPoints: ["2. Approach: Shift control points", false],
    spikes: ["Spikes for offset Beziér", false],
    attachedCoords: ["Write coordinates attached to node", false],
}

function getOption(key: keyof typeof options) {
    return options[key][1] as boolean;
}

const frm = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: false
}).format;

const nrFrm = (nr: number) => frm(nr).padStart(7, ' ');
const arrFrm = (arr: number[]) => '[' + arr.map(nrFrm).join(', ') + ']';

let debugElem!: HTMLOutputElement;
let context!: CanvasRenderingContext2D;

type FillStyle = CanvasRenderingContext2D["fillStyle"];

export function debug(point: V2, name: string, dotColor: FillStyle = 'black', textColor: FillStyle = 'black', radius: number = pointRadius) {
    if (!debugElem || !context)
        return;

    const frmPos = arrFrm(point);
    debugElem.innerText += name + ': ' + frmPos + '\n';

    const originalFill = context.fillStyle;

    context.fillStyle = dotColor;
    drawPoints(context, [point]);

    context.fillStyle = textColor;
    context.textAlign = 'left';
    context.textBaseline = 'bottom';
    const str = getOption("attachedCoords") ? name + ' ' + frmPos : name;
    context.fillText(str, point[0] + radius, point[1] - radius);

    context.fillStyle = originalFill;
}


function initialize() {
    const debugOutput = document.getElementById('debug-output') as HTMLOutputElement;
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    const optionContainer = document.getElementById('control') as HTMLDivElement;

    debugElem = debugOutput;

    canvas.setAttribute('height', height + '');
    canvas.setAttribute('width', width + '');


    for (const key of Object.keys(options)) {
        const [description, defaultValue] = (options as any)[key];
        const checkbox = document.createElement('input');
        const id = "option-" + key;
        checkbox.id = id;
        checkbox.type = "checkbox";
        checkbox.checked = defaultValue;

        const label = document.createElement('label');
        label.innerText = description;
        label.htmlFor = id;

        const wrapper = document.createElement('div');
        wrapper.className = "option-wrapper";

        wrapper.append(checkbox, label);

        optionContainer.append(wrapper);

        checkbox.addEventListener('change', () => (options as any)[key][1] = checkbox.checked);
    }

    const getCanvasPosition = (() => {
        let cache: undefined | ClientRect = undefined;

        const invalidate = () => {
            requestAnimationFrame(invalidate);
            cache = undefined;
        }
        invalidate();

        return function getCanvasPosition() {
            if (cache)
                return cache;

            return cache = canvas.getBoundingClientRect()
        }
    })();

    function mapPosition(ev: MouseEvent) {
        const rect = getCanvasPosition();

        return [
            ev.clientX - rect.left,
            ev.clientY - rect.top
        ] as Vector2;
    }

    const ctx = canvas.getContext('2d');

    if (!ctx)
        throw new Error('Could not initialize');

    context = ctx;

    ctx.lineWidth = 4;
    ctx.strokeStyle = "#000";

    const awaitFrame = () => new Promise(res => requestAnimationFrame(res));


    interface MouseEvents {
        "click": { type: "click", original: MouseEvent, position: Vector2 };

        "dragstart": { type: "dragstart", original: MouseEvent, position: Vector2 };
        "drag": { type: "drag", original: MouseEvent, position: Vector2, previous: Vector2 };
        "dragend": { type: "dragend", original: MouseEvent, position: Vector2 };

        "mousedown": { type: "mousedown", original: MouseEvent, position: Vector2 };
        "mouseup": { type: "mouseup", original: MouseEvent, position: Vector2 };

        "mousemove": { type: "mousemove", original: MouseEvent, position: Vector2 };
    }

    const mouseEvents = new EventEmitter<MouseEvents>();

    document.addEventListener("mousemove", ev =>
        mouseEvents.emit("mousemove", {type: "mousemove", original: ev, position: mapPosition(ev)}));

    document.addEventListener("mousedown", ev =>
        mouseEvents.emit("mousedown", {type: "mousedown", original: ev, position: mapPosition(ev)}));

    document.addEventListener("mouseup", ev =>
        mouseEvents.emit("mouseup", {type: "mouseup", original: ev, position: mapPosition(ev)}));

    let lastMouseDownPos: Vector2 | undefined = undefined;
    let emittedDragStart = false;

    mouseEvents.addEventListener("mousedown", ev => {
        lastMouseDownPos = ev.position;
        emittedDragStart = false;
    });

    mouseEvents.addEventListener("mouseup", ev => {
        lastMouseDownPos = undefined;
        if (emittedDragStart)
            mouseEvents.emit("dragend", {
                type: "dragend",
                original: ev.original,
                position: ev.position
            })
        else
            mouseEvents.emit("click", {
                type: "click",
                original: ev.original,
                position: ev.position
            })
    });

    let mousePosition: V2 | undefined = undefined;

    mouseEvents.addEventListener("mousemove", ev => {
        mousePosition = ev.position;
        if (ev.original.buttons > 0 && lastMouseDownPos) {
            const lmdp = lastMouseDownPos;
            lastMouseDownPos = ev.position;

            if (!emittedDragStart) {
                emittedDragStart = true;
                mouseEvents.emit("dragstart", {
                    type: "dragstart",
                    original: ev.original,
                    position: ev.position
                });
            } else {
                mouseEvents.emit("drag", {
                    type: "drag",
                    original: ev.original,
                    position: ev.position,
                    previous: lmdp
                })
            }
        }
    })

    type Values<T> = T extends object ? T extends { [key in keyof T]: infer V } ? V : never : never;

    let occurredEvents = [] as Values<MouseEvents>[];

    mouseEvents.addEventListener("click", ev => occurredEvents.push(ev));
    mouseEvents.addEventListener("dragstart", ev => occurredEvents.push(ev));
    mouseEvents.addEventListener("drag", ev => occurredEvents.push(ev));
    mouseEvents.addEventListener("dragend", ev => occurredEvents.push(ev));
    mouseEvents.addEventListener("mousedown", ev => occurredEvents.push(ev));
    mouseEvents.addEventListener("mouseup", ev => occurredEvents.push(ev));
    mouseEvents.addEventListener("mousemove", ev => occurredEvents.push(ev));

    const distance = 100;
    const bezierWidth = 800 + distance;
    const bezierHeight = 500 + distance * 2;

    const top = (height - bezierHeight) / 2;
    const left = (width - bezierWidth) / 2;
    const bottom = height - top;
    const right = width - left;

    let setPoints = [
        [left + distance / 2, top + distance],
        [right - distance / 2, top + distance],
        [right - distance / 2, bottom - distance],
        [left + distance / 2, bottom - distance]
    ] as Vector2[];

    function getHitPoint(points: Vector2[], pos: Vector2, range: number): number | undefined {

        for (let i = 0; i < points.length; i++) {
            const point = points[i];
            const deltaX = point[0] - pos[0];
            const deltaY = point[1] - pos[1];

            if ((deltaX * deltaX + deltaY * deltaY) <= range * range)
                return i;
        }

        return undefined;
    }

    let draggedNodeIndex: undefined | number;

    function indexToLetter(nr: number) {
        return String.fromCharCode('a'.charCodeAt(0) + nr);
    }

    ctx.font = `15px Verdana`;

    const start = Date.now();
    (async () => {
        while (true) {
            const delta = Date.now() - start;

            const perc = (Math.sin(delta / 10000 * Math.PI) + 1) / 2;
            ctx.clearRect(0, 0, width, height);
            debugElem.innerText = '';

            interface CombinedDragCommand {
                start: boolean;
                progressed: boolean;
                ended: boolean;

                startPosition: Vector2;
                endPosition: Vector2;
            }

            const combinedDragCommands: CombinedDragCommand[] = [];
            let currentDrag: CombinedDragCommand | undefined = undefined;

            for (const event of occurredEvents) {
                if (event.type == "dragstart") {
                    currentDrag = {
                        start: true,
                        progressed: false,
                        ended: false,

                        startPosition: event.position,
                        endPosition: event.position
                    };
                } else if (event.type == "drag") {
                    if (currentDrag) {
                        currentDrag.progressed = true;
                        currentDrag.endPosition = event.position;
                    } else {
                        // when the drag started before this frame
                        currentDrag = {
                            start: false,
                            progressed: true,
                            ended: false,

                            startPosition: event.previous,
                            endPosition: event.position
                        };
                    }
                } else if (event.type == "dragend") {
                    if (currentDrag) {
                        currentDrag.ended = true;
                        currentDrag.endPosition = event.position;
                        combinedDragCommands.push(currentDrag);
                        currentDrag = undefined;
                    } else {
                        // if the drag ends without any movement in this frame
                        combinedDragCommands.push({
                            start: false,
                            progressed: false,
                            ended: true,

                            startPosition: event.position,
                            endPosition: event.position
                        });
                    }
                }
            }

            if (currentDrag)
                combinedDragCommands.push(currentDrag);

            for (const dragCommand of combinedDragCommands) {
                if (draggedNodeIndex == undefined)
                    draggedNodeIndex = getHitPoint(setPoints, dragCommand.startPosition, pointRadius);

                if (draggedNodeIndex != undefined) {
                    const deltaX = dragCommand.endPosition[0] - dragCommand.startPosition[0];
                    const deltaY = dragCommand.endPosition[1] - dragCommand.startPosition[1];

                    const point = setPoints[draggedNodeIndex];

                    // console.log('hotted point', hotPoint, point);
                    point[0] += deltaX;
                    point[1] += deltaY;

                    if (dragCommand.ended)
                        draggedNodeIndex = undefined;
                }
            }

            if (draggedNodeIndex != undefined) {
                canvas.style.cursor = 'grabbing';
            } else if (mousePosition) {
                if (getHitPoint(setPoints, mousePosition, pointRadius) != undefined)
                    canvas.style.cursor = 'grab';
                else
                    canvas.style.cursor = 'default';
            }

            for (const event of occurredEvents) {
                const [x, y] = event.position;
                if (event.type == "click" && x >= 0 && x <= width && y >= 0 && y <= height) {
                    const elem = getHitPoint(setPoints, event.position, pointRadius);
                    if (elem != undefined) {
                        setPoints.splice(elem, 1);
                    } else {
                        setPoints.push(event.position);
                    }
                }
            }

            occurredEvents = [];

            const numberOfLines = 40;

            if (setPoints.length > 1) {

                ctx.fillStyle = 'black';
                ctx.lineWidth = 4;
                ctx.strokeStyle = "#000";

                drawBezier(setPoints, ctx, numberOfLines);

                if (getOption("approachDistance"))
                    drawOffsetBezier(ctx, setPoints, numberOfLines, distance, getOption("spikes"));

                ctx.fillStyle = 'black';
                ctx.strokeStyle = "#000";

                if (getOption("approachControlPoints")) {
                    for (const side of ['left', 'right']) {
                        const morphed = fitSystemNewApproach(setPoints, side as any, distance);
                        ctx.lineWidth = 4;
                        ctx.strokeStyle = "#f0a";

                        drawBezier(morphed, ctx, numberOfLines, 0);
                        ctx.setLineDash([8, 8]);
                        drawPolyline(ctx, morphed);
                        ctx.setLineDash([]);

                        for (let i = 0; i < morphed.length; i++)
                            debug(morphed[i], indexToLetter(i) + '_morphed_' + side);
                    }
                }

                ctx.fillStyle = 'black';
                ctx.strokeStyle = "#000";


            }

            drawPolyline(ctx, setPoints);

            for (let i = 0; i < setPoints.length; i++)
                debug(setPoints[i], indexToLetter(i), draggedNodeIndex == i ? 'red' : 'orange');

            await awaitFrame();
        }
    })()


}

document.addEventListener('DOMContentLoaded', initialize);