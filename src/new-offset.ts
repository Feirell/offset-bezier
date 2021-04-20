import {bc} from "nd-bezier/lib/math-functions";
import {DEBUG, DebugHandler} from "./debug-helper";
import {coefficients} from "nd-bezier/lib/coefficient-creator";
import {polynomialDivision, stringifyPolynomial} from "./polynomial-dev";

type Vector2 = [number, number];
type Vector3 = [number, number, number];

// const p: Points<3, 2> = [
//     [0, 0],
//     [0, 1],
//     [1, 1]
// ];
//
function bernstein(n: number, i: number, t: number) {
    return bc(n, i) * t ** i * (1 - t) ** (n - i);
}

function atWithBernstein(t: number, points: number[][]) {
    const ret = points[0].map(v => 0);

    for (let i = 0; i < points.length; i++) {
        const bern = bernstein(points.length - 1, i, t);

        const po = points[i];
        for (let c = 0; c < ret.length; c++)
            ret[c] += bern * po[c];
    }

    return ret;
}

function bezierInterpolation(points: number[], t: number) {
    let sum = 0;

    for (let i = 0; i < points.length; i++) {
        const bern = bernstein(points.length - 1, i, t);
        sum += bern * points[i];
    }

    return sum;
}

//
// const derivedP: number[][] = [];
// for (let i = 0; i < p.length - 1; i++) {
//     const newP = [];
//     for (let c = 0; c < p[i].length; c++)
//         newP.push((p.length - 1) * (p[i + 1][c] - p[i][c]));
//
//     derivedP.push(newP);
// }
//
// function directionWithBernstein(t: number) {
//
//     const ret = p[0].map(v => 0);
//
//     for (let i = 0; i < p.length - 1; i++) {
//         const bern = bernstein(p.length - 2, i, t);
//
//         const poA = p[i + 1];
//         const poB = p[i];
//         for (let c = 0; c < ret.length; c++)
//             ret[c] += bern * (poA[c] - poB[c]);
//     }
//
//     for (let c = 0; c < ret.length; c++)
//         ret[c] *= p.length - 1;
//
//     return ret;
// }
//
// const sb = new StaticBezier(p);
//
// console.log(sb.at(.4));
// console.log(atWithBernstein(.4));
//
// console.log(sb.direction(.4));
// console.log(directionWithBernstein(.4));
// console.log(atWithBernstein(.4, derivedP));

type Points = [
    [number, number],
    [number, number],
    [number, number],
    [number, number],
];

export function translateRealToUV(a: Vector2, b: Vector2, c: Vector2) {
    const start = a;

    // a is p0 b is p1 and we want u[0] and v[0], solving equation system
    // I   p1[0] = p0[0] + 1 / 3 * (u[0] ** 2 - v[0] ** 2)
    //     b[0]  = a[0]  + 1 / 3 * (u ** 2    - v ** 2)

    // II  p1[1] = p0[1] + 1 / 3 * (2 * u[0] * v[0])
    //     b[1]  = a[1]  + 1 / 3 * (2 * u    * v)

    // I for u
    // (b[1] - a[1]) * 3 / (2 * v) = u

    // II in I, solving for v
    // b[1]  = a[1]  + 1 / 3 * (2 * u    * v)
    // a[0] = b[0] + 1 / 3 * (((a[1] - b[1]) * 3 / (2 * v)) ** 2 - v ** 2)

    const uv0Options: Vector2[] = [];

    const sqrt = Math.sqrt;
    let u, v, triedPoints;

    u = -(sqrt(3) * sqrt(sqrt(b[1] ** 2 - 2 * a[1] * b[1] + a[1] ** 2 + b[0] ** 2 - 2 * a[0] * b[0] + a[0] ** 2) + b[0] - a[0])) / sqrt(2);
    v = -(sqrt(sqrt(b[1] ** 2 - 2 * a[1] * b[1] + a[1] ** 2 + b[0] ** 2 - 2 * a[0] * b[0] + a[0] ** 2) + b[0] - a[0]) * (sqrt(2) * sqrt(3) * sqrt(b[1] ** 2 - 2 * a[1] * b[1] + a[1] ** 2 + b[0] ** 2 - 2 * a[0] * b[0] + a[0] ** 2) - sqrt(2) * sqrt(3) * b[0] + sqrt(2) * sqrt(3) * a[0])) / (2 * b[1] - 2 * a[1]);

    uv0Options.push([u, v]);

    u = (sqrt(3) * sqrt(sqrt(b[1] ** 2 - 2 * a[1] * b[1] + a[1] ** 2 + b[0] ** 2 - 2 * a[0] * b[0] + a[0] ** 2) + b[0] - a[0])) / sqrt(2);
    v = (sqrt(sqrt(b[1] ** 2 - 2 * a[1] * b[1] + a[1] ** 2 + b[0] ** 2 - 2 * a[0] * b[0] + a[0] ** 2) + b[0] - a[0]) * (sqrt(2) * sqrt(3) * sqrt(b[1] ** 2 - 2 * a[1] * b[1] + a[1] ** 2 + b[0] ** 2 - 2 * a[0] * b[0] + a[0] ** 2) - sqrt(2) * sqrt(3) * b[0] + sqrt(2) * sqrt(3) * a[0])) / (2 * b[1] - 2 * a[1]);

    uv0Options.push([u, v]);

    // triedPoints = translateToRealBezierGrade2([[u, v], [0, 0]], a)
    // DEB.pushTextLine('tp0: x: ' + nrFrm(triedPoints[0][0]) + ' y: ' + nrFrm(triedPoints[0][1]));
    // DEB.pushTextLine('tp1: x: ' + nrFrm(triedPoints[1][0]) + ' y: ' + nrFrm(triedPoints[1][1]));
    // DEB.pushTextLine('u: ' + nrFrm(u) + ' v: ' + nrFrm(v));
    //
    // triedPoints = translateToRealBezierGrade2([[u, v], [0, 0]], a)
    // DEB.pushTextLine('tp0: x: ' + nrFrm(triedPoints[0][0]) + ' y: ' + nrFrm(triedPoints[0][1]));
    // DEB.pushTextLine('tp1: x: ' + nrFrm(triedPoints[1][0]) + ' y: ' + nrFrm(triedPoints[1][1]));
    // DEB.pushTextLine('u: ' + nrFrm(u) + ' v: ' + nrFrm(v));

    /*
    // would produce NaN values
    u = -(sqrt(3) * sqrt(-sqrt(b[1] ** 2 - 2 * a[1] * b[1] + a[1] ** 2 + b[0] ** 2 - 2 * a[0] * b[0] + a[0] ** 2) + b[0] - a[0])) / sqrt(2);
    v = (sqrt(-sqrt(b[1] ** 2 - 2 * a[1] * b[1] + a[1] ** 2 + b[0] ** 2 - 2 * a[0] * b[0] + a[0] ** 2) + b[0] - a[0]) * (sqrt(2) * sqrt(3) * sqrt(b[1] ** 2 - 2 * a[1] * b[1] + a[1] ** 2 + b[0] ** 2 - 2 * a[0] * b[0] + a[0] ** 2) + sqrt(2) * sqrt(3) * b[0] - sqrt(2) * sqrt(3) * a[0])) / (2 * b[1] - 2 * a[1]);

    u = (sqrt(3) * sqrt(-sqrt(b[1] ^ 2 - 2 * a[1] * b[1] + a[1] ^ 2 + b[0] ^ 2 - 2 * a[0] * b[0] + a[0] ^ 2) + b[0] - a[0])) / sqrt(2);
    v = -(sqrt(-sqrt(b[1] ^ 2 - 2 * a[1] * b[1] + a[1] ^ 2 + b[0] ^ 2 - 2 * a[0] * b[0] + a[0] ^ 2) + b[0] - a[0]) * (sqrt(2) * sqrt(3) * sqrt(b[1] ^ 2 - 2 * a[1] * b[1] + a[1] ^ 2 + b[0] ^ 2 - 2 * a[0] * b[0] + a[0] ^ 2) + sqrt(2) * sqrt(3) * b[0] - sqrt(2) * sqrt(3) * a[0])) / (2 * b[1] - 2 * a[1]);
     */

    // b is p1 c is p2 and we want u[1] and v[1], solving equation system
    // I   c[0] = b[0] + 1 / 3 * (u[0] * u[1] - v[0] * v[1])
    //     c[0] = b[0] + 1 / 3 * (m    * u    - n    * v   )

    // II  c[1] = b[1] + 1 / 3 * (u[0] * v[1] + u[1] * v[0])
    //     c[1] = b[1] + 1 / 3 * (m    * v    + u    * n   )

    for (let i = 0; i < uv0Options.length; i++) {
        let m = uv0Options[i][0];
        let n = uv0Options[i][1];

        let u = ((3 * c[1] - 3 * b[1]) * n + (3 * c[0] - 3 * b[0]) * m) / (n ** 2 + m ** 2);
        let v = -((3 * c[0] - 3 * b[0]) * n + (3 * b[1] - 3 * c[1]) * m) / (n ** 2 + m ** 2);

        triedPoints = translateToRealBezierGrade2([[m, n], [u, v]], a)
        for (let c = 0; c < triedPoints.length; c++)
            DEB.pushTextLine('tp' + c + ': x: ' + nrFrm(triedPoints[c][0]) + ' y: ' + nrFrm(triedPoints[c][1]));

        DEB.pushTextLine('u0: ' + nrFrm(m) + ' v0: ' + nrFrm(n));
        DEB.pushTextLine('u1: ' + nrFrm(u) + ' v1: ' + nrFrm(v));
        return {
            start, uvPoints: [
                [m, n], [u, v]
            ] as [Vector2, Vector2]
        };
    }

    const uvPoints = [] as unknown as [Vector2, Vector2];
    return {start, uvPoints};
}

export function translateToRealBezierGrade2(p: [Vector2, Vector2], start: Vector2 = [0, 0]) {
    const u = [p[0][0], p[1][0]];
    const v = [p[0][1], p[1][1]];

    // the first point is freely chooseable since we only work with the directions
    const p0: Vector2 = start;
    const p1: Vector2 = [
        p0[0] + 1 / 3 * (u[0] ** 2 - v[0] ** 2),
        p0[1] + 1 / 3 * (2 * u[0] * v[0])
    ];
    const p2: Vector2 = [
        p1[0] + 1 / 3 * (u[0] * u[1] - v[0] * v[1]),
        p1[1] + 1 / 3 * (u[0] * v[1] + u[1] * v[0])
    ];
    const p3: Vector2 = [
        p2[0] + 1 / 3 * (u[1] ** 2 - v[1] ** 2),
        p2[1] + 1 / 3 * (2 * u[1] * v[1])
    ];

    return [p0, p1, p2, p3] as Points;
}

export function translateToRealBezierGrade3(p: [Vector2, Vector2, Vector2], start: Vector2 = [0, 0]) {
    const u = [p[0][0], p[1][0], p[2][0]];
    const v = [p[0][1], p[1][1], p[2][1]];

    // the first point is freely chooseable since we only work with the directions
    const p0: Vector2 = [0, 0];
    const p1: Vector2 = [
        p0[0] + 1 / 5 * (u[0] ** 2 - v[0] ** 2),
        p0[1] + 1 / 5 * (2 * u[0] * v[0])
    ];
    const p2: Vector2 = [
        p1[0] + 1 / 5 * (u[0] * u[1] - v[0] * v[1]),
        p1[1] + 1 / 5 * (u[0] * v[1] + u[1] * v[0])
    ];
    const p3: Vector2 = [
        p2[0] + 2 / 15 * (u[1] ** 2 - v[1] ** 2) + 1 / 15 * (u[0] * u[2] - v[0] * v[2]),
        p2[1] + 2 / 15 * (2 * u[1] * v[1] + 1 / 15 * (u[0] * v[2] + v[2] * v[0]))
        // p2[0] + 1 / 3 * (u[1] ** 2 - v[1] ** 2),
        // p2[0] + 1 / 3 * (2 * u[1] * v[1])
    ];
    const p4: Vector2 = [
        p3[0] + 1 / 5 * (u[1] * u[2] - v[1] * v[2]),
        p3[1] + 1 / 5 * (u[1] * v[2] + u[2] * v[1])
    ];
    const p5: Vector2 = [
        p4[0] + 1 / 5 * (u[2] ** 2 - v[2] ** 2),
        p4[1] + 1 / 5 * (2 * u[2] * v[2])
    ];

    return [p0, p1, p2, p3, p4, p5] as Vector2[];
}

export function translateToRealBezier(p: Vector2[], start: Vector2) {
    switch (p.length) {
        case 2:
            return translateToRealBezierGrade2(p as any, start);

        case 3:
            return translateToRealBezierGrade3(p as any, start);

        default:
            return undefined;
    }
}

const frm = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: false
}).format;

const frmLonger = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 6,
    useGrouping: false
}).format;

const nrFrm = (nr: number) => frm(nr).padStart(7, ' ');
const arrFrm = (arr: number[]) => '[' + arr.map(nrFrm).join(', ') + ']';

const DEB = new DebugHandler();
DEBUG.registerDebugContentCollector(DEB);

/**
 * Used to get the coefficients for the bezier expression based on the (u, v) points.
 *
 * @param uvPoints
 * @param k
 */
export function sigmaK(uvPoints: Vector2[], k: number) {
    const m = uvPoints.length - 1;
    const n = 2 * m + 1;

    const u = uvPoints.map(v => v[0]);
    const v = uvPoints.map(v => v[1]);

    let sum = 0;

    const start = Math.max(0, k - m);
    const end = Math.min(m, k);

    for (let j = start; j <= end; j++) {
        const mult = bc(m, j) * bc(m, k - j) / bc(n - 1, k);
        sum += mult * (u[j] * u[k - j] + v[j] * v[k - j]);
    }

    return sum;
}

export function offsetFnc(uvPoints: Vector2[], d: number, start: Vector2 = [0, 0]) {
    const m = uvPoints.length - 1;
    const n = 2 * m + 1; // is equal to actual.length

    const actual = translateToRealBezier(uvPoints, [0, 0]);

    if (actual === undefined)
        throw new Error('Can not create offset for this uv degree ' + n);

    // implementation of the section 17.5 of the book ISBN: 978-3-540-73398-0

    const x = (k: number) => actual[k][0];
    const y = (k: number) => actual[k][1];

    // P_k = (1, x_k, y_k)
    // k has to be 0..Degree of the Bezier
    const P_k = (k: number): Vector3 => [1, x(k), y(k)];

    const d_x = (k: number) => x(k + 1) - x(k);
    const d_y = (k: number) => y(k + 1) - y(k);

    // delta_P_k = P_{k+1} - P_k = (0, delta_x_k, delta_y_k)
    // k has to be 0..Degree-1 of the Bezier
    const d_P_k = (k: number): Vector3 => [0, d_x(k), d_y(k)];

    // delta_P_inverse_k = (0, delta_y_k, -delta_x_k)
    const d_P_inverse_k = (k: number): Vector3 => [0, d_y(k), -d_x(k)];

    // result should be r_d(t) = [X(t) / W(t), Y(t) / W(t)]
    // X(t), Y(t) and W(t) are polynomials, ideally is W(t) a constant then we just got another polynomial parameter
    // curve as the offset curve

    // The coefficients for X(t), Y(t) and W(t) are represented as O_k = [W_k, X_k, Y_k] where k is from 0..2n-1 (n the degree of the bezier)
    // I will unpack this with another parameter c (for component) where W == 0, X == 1 and Y == 2

    function O_k(k: number, c: 0 | 1 | 2) {
        let sum = 0;

        const start = Math.max(0, k - n);
        const end = Math.min(n - 1, k);

        for (let j = start; j <= end; j++) {
            const mult = bc(n - 1, j) * bc(n, k - j) / bc(2 * n - 1, k);
            sum += mult * (sigmaK(uvPoints, j) * P_k(k - j)[c] + d * n * d_P_inverse_k(j)[c]);
        }

        return sum;
    }

    // function staticO_k(k: number, c: 0 | 1 | 2) {
    //     if (n == 3) {
    //         const sig = (k: number) => sigmaK(uvPoints, k);
    //         const P = (k: number) => P_k(k)[c];
    //         const d_P_i = (k: number) => d_P_inverse_k(k)[c];
    //
    //         switch (k) {
    //             case 0:
    //                 return 1 * (
    //                     1 * sig(0) * P(0) +
    //                     3 * d * (
    //                         1 * d_P_i(0)
    //                     )
    //                 );
    //
    //             case 1:
    //                 return 1 / 5 * (
    //                     2 * sig(1) * P(0) +
    //                     3 * sig(0) * P(1) +
    //                     3 * d * (
    //                         3 * d_P_i(0) +
    //                         2 * d_P_i(1)
    //                     )
    //                 );
    //
    //             case 2:
    //                 return 1 / 10 * (
    //                     1 * sig(2) * P(0) +
    //                     6 * sig(1) * P(1) +
    //                     3 * sig(0) * P(2) +
    //                     3 * d * (
    //                         3 * d_P_i(0) +
    //                         6 * d_P_i(1) +
    //                         1 * d_P_i(2)
    //                     )
    //                 );
    //
    //             case 3:
    //                 return 1 / 10 * (
    //                     3 * sig(2) * P(1) +
    //                     6 * sig(1) * P(2) +
    //                     1 * sig(0) * P(3) +
    //                     3 * d * (
    //                         1 * d_P_i(0) +
    //                         6 * d_P_i(1) +
    //                         3 * d_P_i(2)
    //                     )
    //                 );
    //
    //             case 4:
    //                 return 1 / 5 * (
    //                     3 * sig(2) * P(2) +
    //                     6 * sig(1) * P(3) +
    //                     3 * d * (
    //                         2 * d_P_i(1) +
    //                         3 * d_P_i(2)
    //                     )
    //                 );
    //
    //             case 5:
    //                 return 1 * (
    //                     1 * sig(2) * P(3) +
    //                     3 * d * (
    //                         1 * d_P_i(2)
    //                     )
    //                 );
    //
    //             default:
    //                 throw new Error('Invalid k');
    //         }
    //     }
    //
    //     throw new Error('Invalid number of uv points ' + n);
    // }

    const xComp: number[] = [];
    const yComp: number[] = [];
    const wComp: number[] = [];

    for (let i = 0; i <= 2 * n - 1; i++) {
        wComp.push(O_k(i, 0));
        xComp.push(O_k(i, 1));
        yComp.push(O_k(i, 2));
        // DEB.pushTextLine('i: ' + i);
        // for (let c = 0; c < 3; c++)
        //     DEB.pushTextLine('  c: ' + c + ' dyn: ' + O_k(i, c) + ' static: ' + staticO_k(i, c));
    }

    const calcPolynome = (comp: number[]) => {
        const polynomial = [];
        let fullStr = '';
        const coeffs = coefficients(comp.length);
        for (let i = 0; i < coeffs.length; i++) {
            // let str = '';
            let sum = 0;

            for (let c = 0; c < coeffs[i].length; c++) {
                const p = coeffs[i][c];

                // if (p == 0)
                //     continue;

                // if (str.length > 0)
                //     str += p < 0 ? ' - ' : ' + ';
                // const pAbs = Math.abs(p);
                // if (pAbs != 1)
                //     str += frm(pAbs) + '*';

                // str += 'w' + c;
                sum += comp[c] * p;
            }
            polynomial.push(sum);
            // DEB.pushTextLine('t^' + i + ': ' + str);
            // DEB.pushTextLine('   : ' + nrFrm(sum));


            // if (Math.abs(sum) > 1e-6) {
            //     if (fullStr.length > 0)
            //         fullStr += sum < 0 ? ' - ' : ' + ';
            //
            //     fullStr += frmLonger(Math.abs(sum)) + '*t^' + i;
            //
            // }
        }

        // return fullStr || '0';
        return polynomial;
    }

    const xPoly = calcPolynome(xComp);
    const yPoly = calcPolynome(yComp);

    const wPoly = calcPolynome(wComp);

    const devX = polynomialDivision(
        xPoly,
        wPoly
    );

    const devY = polynomialDivision(
        yPoly,
        wPoly
    );

    DEB.pushTextLine('xPoly = ' + stringifyPolynomial(xPoly, 't'));
    DEB.pushTextLine('yPoly = ' + stringifyPolynomial(yPoly, 't'));
    DEB.pushTextLine('wPoly = ' + stringifyPolynomial(wPoly, 't'));

    DEB.pushTextLine('devXRes = ' + stringifyPolynomial(devX.result, 't'));
    DEB.pushTextLine('devXRem = ' + stringifyPolynomial(devX.remainder, 't'));

    DEB.pushTextLine('devYRes = ' + stringifyPolynomial(devY.result, 't'));
    DEB.pushTextLine('devYRem = ' + stringifyPolynomial(devY.remainder, 't'));
    // DEB.pushTextLine('y(t) = ' + calcPolynome(yComp));
    // DEB.pushTextLine('w(t) = ' + calcPolynome(wComp));

    // for (let i = 0; i < wComp.length; i++) {
    //     DEB.pushTextLine('w' + i + ': ' + nrFrm(wComp[i]));
    // }

    for (let i = 0; i <= 2 * n - 1; i++) {
        const w = wComp[i];
        xComp[i] = xComp[i] + start[0] * wComp[i];
        yComp[i] = yComp[i] + start[1] * wComp[i];
    }

    function getPointsWithWeights() {
        let res = [];
        for (let i = 0; i < xComp.length; i++) {
            res.push({
                point: [xComp[i], yComp[i]] as Vector2,
                weight: wComp[i]
            });
        }

        return res;
    }

    function at(t: number) {
        const w = bezierInterpolation(wComp, t);
        const x = bezierInterpolation(xComp, t) / w;
        const y = bezierInterpolation(yComp, t) / w;

        return [x, y] as Vector2;
    }

    return {getPointsWithWeights, at};
}

// export function staticQuad(uvPoints: Vector2[], k: number): number {
//     const u = uvPoints.map(v => v[0]);
//     const v = uvPoints.map(v => v[1]);
//
//     if (uvPoints.length == 2)
//         switch (k) {
//             case 0:
//                 return u[0] ** 2 + v[0] ** 2;
//
//             case 1:
//                 return u[0] * u[1] + v[0] * v[1];
//
//             case 2:
//                 return u[1] ** 2 + v[1] ** 2;
//
//             default:
//                 throw new Error('k is invalid');
//         }
//     else if (uvPoints.length == 3)
//         switch (k) {
//             case 0:
//                 return u[0] ** 2 + v[0] ** 2;
//
//             case 1:
//                 return u[0] * u[1] + v[0] * v[1];
//
//             case 2:
//                 return 2 / 3 * (u[1] ** 2 + v[1] ** 2) + 1 / 3 * (u[0] * u[2] + v[0] * v[2]);
//
//             case 3:
//                 return u[1] * u[2] + v[1] * v[2];
//
//             case 4:
//                 return u[2] ** 2 + v[2] ** 2;
//
//             default:
//                 throw new Error('k is invalid');
//         }
//     else
//         throw new Error('No static Quad for uvPoints.length == ' + uvPoints.length);
// }

export function distance(uvPoints: Vector2[], t: number) {
    const m = uvPoints.length - 1;
    const n = m * 2 + 1;

    let sum = 0;

    for (let k = 0; k <= n; k++) {
        let sk = 0;
        for (let j = 0; j <= k - 1; j++)
            sk += sigmaK(uvPoints, j);

        sum += sk * bc(n, k) * (1 - t) ** (n - k) * t ** k;
    }

    sum *= 1 / n;

    return sum;
}

// export function translateToRealBezierGrade3(p: [[number, number], [number, number], [number, number]]) {
//     const u = [p[0][0], p[1][0], p[2][0]];
//     const v = [p[0][1], p[1][1], p[2][1]];
//
//     // the first point is freely chooseable since we only work with the directions
//     const p0: [number, number] = [0, 0];
//     const p1: [number, number] = [
//         p0[0] + 1 / 3 * (u[0] ** 2 - v[0] ** 2),
//         p0[1] + 1 / 3 * (2 * u[0] * v[0])
//     ];
//     const p2: [number, number] = [
//         p1[0] + 1 / 3 * (u[0] * u[1] - v[0] * v[1]),
//         p1[1] + 1 / 3 * (u[0] * v[1] - v[1] * v[0])
//     ];
//     const p3: [number, number] = [
//         p0[0] + 1 / 3 * (u[1] ** 2 - v[1] ** 2),
//         p0[0] + 1 / 3 * (2 * u[1] * v[1])
//     ];
//
//     return [p0, p1, p2, p3] as Points;
// }

