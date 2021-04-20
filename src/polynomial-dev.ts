const frmLonger = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 6,
    useGrouping: false
}).format;

export function polynomialDivision(coeffsNumerator: number[], coeffsDenominator: number[], epsilon = 1e-7) {
    const is0 = (nr: number) => Math.abs(nr) <= epsilon;
    const a = coeffsNumerator.map(v => is0(v) ? 0 : v);
    const b = coeffsDenominator.map(v => is0(v) ? 0 : v);

    if (b.length > a.length)
        throw new Error('denominator has to be of a lower grade than numerator');

    const result = a.slice().fill(0);
    const remainder = a.slice();


    const greatestNonNull = (arr: number[]) => {
        for (let i = arr.length - 1; i >= 0; i--)
            if (arr[i] != 0)
                return i;

        return undefined;
    }

    const greatestNonNullDen = greatestNonNull(b);
    if (greatestNonNullDen == undefined)
        throw new Error('can not devise through zero');

    while (true) {
        const remNonNull = greatestNonNull(remainder);
        // could fully devise
        if (remNonNull === undefined)
            return {result, remainder, hasRemainder: false};
        // there is a remainder smaller in degree then our divisor
        else if (remNonNull < greatestNonNullDen)
            return {result, remainder, hasRemainder: true};

        const leftShift = remNonNull - greatestNonNullDen;
        const mult = remainder[remNonNull] / b[greatestNonNullDen];

        result[leftShift] += mult;
        for (let i = leftShift; i <= remNonNull; i++) {
            remainder[i] -= mult * b[i - leftShift];
            if (is0(remainder[i]))
                remainder[i] = 0;
        }
    }
}

export function stringifyPolynomial(coeffs: number[], variableName: string, dropEpsilon = 1e-6) {
    let fullStr = '';
    for (let i = 0; i < coeffs.length; i++) {
        const coeff = coeffs[i];

        if (Math.abs(coeff) <= dropEpsilon)
            continue;

        if (fullStr.length > 0)
            fullStr += coeff < 0 ? ' - ' : ' + ';

        fullStr += frmLonger(Math.abs(coeff)) + '*' + variableName + '^' + i;
    }

    return fullStr;
}
