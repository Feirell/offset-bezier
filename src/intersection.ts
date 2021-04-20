import {V2} from "./fit-system";

export const setLength = (v: V2, desLength = 1) => {
    const length = Math.sqrt(v[0] * v[0] + v[1] * v[1]);

    return [
        desLength * v[0] / length,
        desLength * v[1] / length
    ] as V2;
}
const isSame = (a: number, b: number, delta = 1e-8) => Math.abs(a - b) < delta;
const sameDirection = (a: V2, b: V2) => {
    const aUnit = setLength(a, 1);
    const bUnit = setLength(b, 1);


    return (isSame(aUnit[0], bUnit[0]) && isSame(aUnit[1], bUnit[1])) ||
        (isSame(aUnit[0], -bUnit[0]) && isSame(aUnit[1], -bUnit[1]));
}
export const intersection = (aBase: V2, aDirection: V2, bBase: V2, bDirection: V2): 'parallel-or-identical' | V2 => {
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
