import {StaticBezier} from '../../nd-bezier/src/static-bezier';

const height = 800;
const width = 800;
const margin = 100;

let bezierPoints: [number, number][] = [];

function ascent(points: [number, number][], t: number) {
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

function drawPolyline(ctx: CanvasRenderingContext2D, points: [number, number][], showPoints = false) {
    ctx.beginPath();
    const startPoint = points[0];
    ctx.moveTo(startPoint[0], startPoint[1]);
    for (let i = 1; i < points.length; i++) {
        const point = points[i];
        ctx.lineTo(point[0], point[1]);
    }

    ctx.stroke();
    ctx.closePath();

    if (showPoints) {
        ctx.beginPath();
        for (let i = 0; i < points.length; i++) {
            const p = points[i];
            ctx.moveTo(p[0], p[1]);
            ctx.arc(p[0], p[1], 8, 0, 360);
        }
        ctx.fill();
        ctx.closePath();
    }
}

function drawBezier(bezier: StaticBezier, ctx: CanvasRenderingContext2D, lines: number) {
    const points: [number, number][] = [];

    for (let i = 0; i <= lines; i++) {
        points.push(bezier.at(i / lines) as [number, number]);
    }

    ctx.strokeStyle = '#000';
    drawPolyline(ctx, points);


    for (let i = 0; i <= lines; i++) {
        const t = i / lines;
        const asc = ascent(bezierPoints, t);
        const ascLength = Math.sqrt(asc[0] * asc[0] + asc[1] * asc[1]);
        const ascNorm = [100 * asc[0] / ascLength, 100 * asc[1] / ascLength];
        const point = bezier.at(t);

        ctx.strokeStyle = '#f0f';
        ctx.beginPath();
        ctx.moveTo(point[0], point[1]);
        ctx.lineTo(point[0] + -ascNorm[1], point[1] + ascNorm[0]);
        ctx.stroke();
        ctx.closePath();

        ctx.strokeStyle = '#0ff';
        ctx.beginPath();
        ctx.moveTo(point[0], point[1]);
        ctx.lineTo(point[0] + ascNorm[1], point[1] + -ascNorm[0]);
        ctx.stroke();
        ctx.closePath();
    }

    // const leftBorderPoints: [number, number][] = [];
    //
    // const distance = 50;
    //
    // const a = new Vector2();
    // const b = new Vector2();
    // const c = new Vector2();
    //
    // const ba = new Vector2();
    // const bc = new Vector2();
    //
    // const bd = new Vector2();
    //
    // const d = new Vector2();
    //
    // for (let i = 1; i < points.length - 1; i++) {
    //     a.set(...points[i - 1] as [number, number]);
    //     b.set(...points[i] as [number, number]);
    //     c.set(...points[i + 1] as [number, number]);
    //
    //     ba.copy(a).sub(b);
    //     bc.copy(c).sub(b);
    //
    //
    //     bd.copy(ba).add(bc).normalize().multiplyScalar(distance);
    //
    //     d.copy(b).add(bd);
    //
    //     leftBorderPoints.push([d.x, d.y]);
    // }
    //
    // ctx.strokeStyle = '#f00';
    // drawPolyline(ctx, leftBorderPoints);
    //
    // // ctx.beginPath();
    // // bezier
    // // ctx.arc()
}


function initialize() {
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;

    canvas.setAttribute('height', height + '');
    canvas.setAttribute('width', width + '');


    const ctx = canvas.getContext('2d');

    if (!ctx)
        throw new Error('Could not initialize');

    const awaitFrame = () => new Promise(res => requestAnimationFrame(res));

    const origPoints: [number, number][] = [
        [margin, margin],
        [margin, height - margin],
        [width - margin, margin],
        [width - margin, height - margin]
    ];

    const start = Date.now();
    (async () => {
        while (true) {
            ctx.clearRect(0, 0, width, height);

            const perc = (Math.sin((Date.now() - start) / 10000 * Math.PI) + 1) / 2;

            bezierPoints = [
                [margin, margin],
                [margin + perc * (width - margin * 2), height - margin],
                [width - margin, margin + (1 - perc) * (height - margin * 2)],
                [width - margin, height - margin]
            ];

            const bezier = new StaticBezier(bezierPoints);

            const numberOfLines = 32;

            drawBezier(bezier, ctx, numberOfLines);
            drawPolyline(ctx, bezierPoints, true);
            await awaitFrame();
        }
    })()


}

document.addEventListener('DOMContentLoaded', initialize);