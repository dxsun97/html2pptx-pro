// Shared Unicode utility functions
// Original: css-line-break / text-segmentation by Niklas von Hertzen (MIT License)

export const toCodePoints = (str: string): number[] => {
    const codePoints: number[] = [];
    let i = 0;
    const length = str.length;
    while (i < length) {
        const value = str.charCodeAt(i++);
        if (value >= 0xd800 && value <= 0xdbff && i < length) {
            const extra = str.charCodeAt(i++);
            if ((extra & 0xfc00) === 0xdc00) {
                codePoints.push(((value & 0x3ff) << 10) + (extra & 0x3ff) + 0x10000);
            } else {
                codePoints.push(value);
                i--;
            }
        } else {
            codePoints.push(value);
        }
    }
    return codePoints;
};

export const fromCodePoint = (...codePoints: number[]): string => {
    if (String.fromCodePoint) {
        return String.fromCodePoint(...codePoints);
    }

    const length = codePoints.length;
    if (!length) {
        return '';
    }

    const codeUnits: number[] = [];
    let index = -1;
    let result = '';
    while (++index < length) {
        let codePoint = codePoints[index];
        if (codePoint <= 0xffff) {
            codeUnits.push(codePoint);
        } else {
            codePoint -= 0x10000;
            codeUnits.push((codePoint >> 10) + 0xd800, (codePoint % 0x400) + 0xdc00);
        }
        if (index + 1 === length || codeUnits.length > 0x4000) {
            result += String.fromCharCode(...codeUnits);
            codeUnits.length = 0;
        }
    }

    return result;
};
