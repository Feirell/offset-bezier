// import {Vector2} from "three";

export type V2 = [number, number];

// const av = new Vector2();
// const aMv = new Vector2();
//
// const bv = new Vector2();
// const bMv = new Vector2();
//
// const abv = new Vector2();
// const aMbMv = new Vector2();

const distance = (a: V2, b: V2) => Math.sqrt((b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2);

/**
 * This function morphs all provided other points in such a way, that the relative position of all points (a, b and other)
 * is the same as (aMorphed, bMorphed and the returning points). You could image two layers, the first with the original
 * points and the second with the a copy of that layer. Then you would scale and rotate the second layer in such a way
 * that a of the second layer is in the position aMorphed and b is the position bMorphed.
 *
 * The position of all other points of this imaginary layer will be returned. Those are morphed as a and b were.
 *
 * @param a
 * @param aMorphed
 * @param b
 * @param bMorphed
 *
 * @param other
 */
export function fitSystem<Other extends V2[]>(a: V2, aMorphed: V2, b: V2, bMorphed: V2, other: Other): Other {
    // calculate the scaling of the ab and aMorphedBMorphed
    const scale = distance(aMorphed, bMorphed) / distance(a, b);

    // scaled vector from a to b
    const sab: V2 = [
        // bMorphed[0] - aMorphed[0],
        (b[0] - a[0]) * scale,
        // bMorphed[1] - aMorphed[1]
        (b[1] - a[1]) * scale
    ];

    const sinA = (bMorphed[1] - aMorphed[1] + (bMorphed[0] - aMorphed[0]) * sab[1] / sab[0]) *
        sab[0] / (sab[0] * sab[0] - sab[1] * sab[1])

    const cosA = Math.cos(Math.asin(sinA));

    return other.map(([x, y]) => {
        // get vector a to current point
        const ac: V2 = [x - a[0], y - a[1]];

        // apply same transform as for a to b
        const morphedDelta = [
            (cosA * scale * ac[0] - sinA * scale * ac[1]),
            (sinA * scale * ac[0] + cosA * scale * ac[1])
        ];

        // apply morphed delta on a to get morphed c
        return [
            a[0] + morphedDelta[0],
            a[1] + morphedDelta[1]
        ];
    }) as Other;
}

export function fitSystemFixed<Other extends V2[]>(av: V2, aMorphed: V2, bv: V2, bMorphed: V2, other: Other): Other {
    const a = av[0];
    const b = av[1];

    const i = bv[0];
    const j = bv[1];

    const g = aMorphed[0];
    const h = aMorphed[1];

    const k = bMorphed[0];
    const l = bMorphed[1];

    const d = (k - g * i / a) * a / (i * -b + j * a);
    const f = (l - h * i / a) * a / (i * -b + j * a);

    const c = (g - d * b) / a;
    const e = (h - f * b) / a;

    return other.map(([x, y]) => {
        // get vector a to current point

        // apply morphed delta on a to get morphed c
        return [
            x * c + y * d,
            x * e + y * f
        ];
    }) as Other;
}

const setLength = (v: V2, desLength = 1) => {
    const length = Math.sqrt(v[0] * v[0] + v[1] * v[1]);

    return [
        desLength * v[0] / length,
        desLength * v[1] / length
    ] as V2;
}

const turn90Left = (v: V2) => {
    return [
        v[1],
        -v[0]
    ] as V2;
}

const turn90Right = (v: V2) => {
    return [
        -v[1],
        v[0]
    ] as V2;
}

const vecFromTo = (from: V2, to: V2) => {
    return [
        to[0] - from[0],
        to[1] - from[1]
    ] as V2;
}

const add = (a: V2, b: V2) => {
    return [
        a[0] + b[0],
        a[1] + b[1]
    ] as V2;
}

const isSame = (a: number, b: number, delta = 1e-8) => Math.abs(a - b) < delta;

const sameDirection = (a: V2, b: V2) => {
    const aUnit = setLength(a, 1);
    const bUnit = setLength(b, 1);


    return (isSame(aUnit[0], bUnit[0]) && isSame(aUnit[1], bUnit[1])) ||
        (isSame(aUnit[0], -bUnit[0]) && isSame(aUnit[1], -bUnit[1]));
}

const multiply = (v: V2, scalar: number) => {
    return [
        v[0] * scalar,
        v[1] * scalar
    ];
}


const intersection = (aBase: V2, aDirection: V2, bBase: V2, bDirection: V2): 'parallel-or-identical' | V2 => {
    if (sameDirection(aDirection, bDirection))
        return 'parallel-or-identical';

    // would result in a == 0 which in turn would result in a division by 0
    // so we just switch the args, they can both have a direction in y direction of 0
    // since then they would have the same direction which is already tested
    if (aDirection[1] == 0) {
        const tempBase = aBase;
        aBase = bBase;
        bBase = tempBase;

        const tempDirection = aDirection;
        aDirection = bDirection;
        bDirection = tempDirection;
    }

    const a_1_x = aBase[0];
    const a_1_y = aBase[1];

    const a_2_x = aBase[0] + aDirection[0];
    const a_2_y = aBase[1] + aDirection[1];

    const a = a_1_y - a_2_y;
    const b = a_2_x - a_1_x;
    const c = a_1_x * a_2_y - a_2_x * a_1_y;

    const b_1_x = bBase[0];
    const b_1_y = bBase[1];

    const b_2_x = bBase[0] + bDirection[0];
    const b_2_y = bBase[1] + bDirection[1];

    const d = b_1_y - b_2_y;
    const e = b_2_x - b_1_x;
    const f = b_1_x * b_2_y - b_2_x * b_1_y;

    const y = (d * c - f * a) / (a * e - d * b);
    const x = (-c - b * y) / a;

    return [x, y];
}

export function fitSystemNewApproach<Other extends V2[]>(p: Other, direction: 'left' | 'right', distance: number): Other {
    const turner = direction == 'left' ? turn90Left : turn90Right;
    const otherTurner = direction == 'left' ? turn90Right : turn90Left;

    const ret: Other = [] as any;

    {
        const toSecond = vecFromTo(p[0], p[1]);
        const unitToSecond = setLength(toSecond, distance);
        const offset = turner(unitToSecond);
        ret.push(add(p[0], offset));
    }

    for (let i = 1; i < p.length - 1; i++) {
        const fromLast = vecFromTo(p[i - 1], p[i]);
        const fromLastBase = add(p[i - 1], setLength(turner(fromLast), distance));

        const fromNext = vecFromTo(p[i + 1], p[i]);
        const fromNextBase = add(p[i + 1], setLength(otherTurner(fromNext), distance));

        const hitPoint = intersection(fromLastBase, fromLast, fromNextBase, fromNext);
        if (typeof hitPoint == 'string')
            // TODO handle straight piece
            //  should just take straight up
            ret.push(add(p[i], setLength(turner(fromLast), distance)));
        else
            ret.push(hitPoint);
        // With same length between p[i] and morphed p[i]
        // ret.push(add(p[i], setLength(vecFromTo(p[i], hitPoint), distance)));
    }

    {
        const toLast = vecFromTo(p[p.length - 2], p[p.length - 1]);
        const unitToSecond = setLength(toLast, distance);
        const offset = turner(unitToSecond);
        ret.push(add(p[p.length - 1], offset));
    }

    return ret;
}