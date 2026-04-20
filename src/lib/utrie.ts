// Unicode Trie data structure
// Original: utrie by Niklas von Hertzen (MIT License)

const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

const lookup: Uint8Array | number[] = typeof Uint8Array === 'undefined' ? [] : new Uint8Array(256);
for (let i = 0; i < chars.length; i++) {
    lookup[chars.charCodeAt(i)] = i;
}

export const decode = (base64: string): ArrayBuffer | number[] => {
    let bufferLength = base64.length * 0.75,
        len = base64.length,
        i,
        p = 0,
        encoded1,
        encoded2,
        encoded3,
        encoded4;

    if (base64[base64.length - 1] === '=') {
        bufferLength--;
        if (base64[base64.length - 2] === '=') {
            bufferLength--;
        }
    }

    const buffer =
        typeof ArrayBuffer !== 'undefined' &&
        typeof Uint8Array !== 'undefined' &&
        typeof Uint8Array.prototype.slice !== 'undefined'
            ? new ArrayBuffer(bufferLength)
            : new Array(bufferLength);
    const bytes: Uint8Array | number[] = Array.isArray(buffer) ? buffer : new Uint8Array(buffer);

    for (i = 0; i < len; i += 4) {
        encoded1 = lookup[base64.charCodeAt(i)];
        encoded2 = lookup[base64.charCodeAt(i + 1)];
        encoded3 = lookup[base64.charCodeAt(i + 2)];
        encoded4 = lookup[base64.charCodeAt(i + 3)];

        bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
        bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
        bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
    }

    return buffer;
};

export const polyUint16Array = (buffer: number[]): number[] => {
    const length = buffer.length;
    const bytes: number[] = [];
    for (let i = 0; i < length; i += 2) {
        bytes.push((buffer[i + 1] << 8) | buffer[i]);
    }
    return bytes;
};

export const polyUint32Array = (buffer: number[]): number[] => {
    const length = buffer.length;
    const bytes: number[] = [];
    for (let i = 0; i < length; i += 4) {
        bytes.push((buffer[i + 3] << 24) | (buffer[i + 2] << 16) | (buffer[i + 1] << 8) | buffer[i]);
    }
    return bytes;
};

/** Shift size for getting the index-2 table offset. */
const UTRIE2_SHIFT_2 = 5;

/** Shift size for getting the index-1 table offset. */
const UTRIE2_SHIFT_1 = 6 + 5;

/** Shift size for shifting left the index array values. */
const UTRIE2_INDEX_SHIFT = 2;

/** Difference between the two shift sizes, for getting an index-1 offset from an index-2 offset. */
const UTRIE2_SHIFT_1_2 = UTRIE2_SHIFT_1 - UTRIE2_SHIFT_2;

/**
 * The part of the index-2 table for U+D800..U+DBFF stores values for
 * lead surrogate code _units_ not code _points_.
 */
const UTRIE2_LSCP_INDEX_2_OFFSET = 0x10000 >> UTRIE2_SHIFT_2;

/** Number of entries in a data block. 32=0x20 */
const UTRIE2_DATA_BLOCK_LENGTH = 1 << UTRIE2_SHIFT_2;

/** Mask for getting the lower bits for the in-data-block offset. */
const UTRIE2_DATA_MASK = UTRIE2_DATA_BLOCK_LENGTH - 1;

const UTRIE2_LSCP_INDEX_2_LENGTH = 0x400 >> UTRIE2_SHIFT_2;

/** Count the lengths of both BMP pieces. 2080=0x820 */
const UTRIE2_INDEX_2_BMP_LENGTH = UTRIE2_LSCP_INDEX_2_OFFSET + UTRIE2_LSCP_INDEX_2_LENGTH;

const UTRIE2_UTF8_2B_INDEX_2_OFFSET = UTRIE2_INDEX_2_BMP_LENGTH;
const UTRIE2_UTF8_2B_INDEX_2_LENGTH = 0x800 >> 6;

const UTRIE2_INDEX_1_OFFSET = UTRIE2_UTF8_2B_INDEX_2_OFFSET + UTRIE2_UTF8_2B_INDEX_2_LENGTH;
const UTRIE2_OMITTED_BMP_INDEX_1_LENGTH = 0x10000 >> UTRIE2_SHIFT_1;

/** Number of entries in an index-2 block. 64=0x40 */
const UTRIE2_INDEX_2_BLOCK_LENGTH = 1 << UTRIE2_SHIFT_1_2;

/** Mask for getting the lower bits for the in-index-2-block offset. */
const UTRIE2_INDEX_2_MASK = UTRIE2_INDEX_2_BLOCK_LENGTH - 1;

const slice16 = (view: Uint16Array | number[], start: number, end?: number): Uint16Array | number[] => {
    if ('slice' in view) {
        return (view as Uint16Array).slice(start, end);
    }
    return new Uint16Array(Array.prototype.slice.call(view, start, end));
};

const slice32 = (view: Uint32Array | number[], start: number, end?: number): Uint32Array | number[] => {
    if ('slice' in view) {
        return (view as Uint32Array).slice(start, end);
    }
    return new Uint32Array(Array.prototype.slice.call(view, start, end));
};

export class Trie {
    initialValue: number;
    errorValue: number;
    highStart: number;
    highValueIndex: number;
    index: Uint16Array | number[];
    data: Uint32Array | Uint16Array | number[];

    constructor(
        initialValue: number,
        errorValue: number,
        highStart: number,
        highValueIndex: number,
        index: Uint16Array | number[],
        data: Uint32Array | Uint16Array | number[]
    ) {
        this.initialValue = initialValue;
        this.errorValue = errorValue;
        this.highStart = highStart;
        this.highValueIndex = highValueIndex;
        this.index = index;
        this.data = data;
    }

    /**
     * Get the value for a code point as stored in the Trie.
     */
    get(codePoint: number): number {
        let ix: number;
        if (codePoint >= 0) {
            if (codePoint < 0x0d800 || (codePoint > 0x0dbff && codePoint <= 0x0ffff)) {
                ix = this.index[codePoint >> UTRIE2_SHIFT_2];
                ix = (ix << UTRIE2_INDEX_SHIFT) + (codePoint & UTRIE2_DATA_MASK);
                return this.data[ix];
            }

            if (codePoint <= 0xffff) {
                ix = this.index[UTRIE2_LSCP_INDEX_2_OFFSET + ((codePoint - 0xd800) >> UTRIE2_SHIFT_2)];
                ix = (ix << UTRIE2_INDEX_SHIFT) + (codePoint & UTRIE2_DATA_MASK);
                return this.data[ix];
            }

            if (codePoint < this.highStart) {
                ix = UTRIE2_INDEX_1_OFFSET - UTRIE2_OMITTED_BMP_INDEX_1_LENGTH + (codePoint >> UTRIE2_SHIFT_1);
                ix = this.index[ix];
                ix += (codePoint >> UTRIE2_SHIFT_2) & UTRIE2_INDEX_2_MASK;
                ix = this.index[ix];
                ix = (ix << UTRIE2_INDEX_SHIFT) + (codePoint & UTRIE2_DATA_MASK);
                return this.data[ix];
            }

            if (codePoint <= 0x10ffff) {
                return this.data[this.highValueIndex];
            }
        }

        return this.errorValue;
    }
}

export const createTrieFromBase64 = (base64: string, _byteLength: number): Trie => {
    const buffer = decode(base64);
    const view32: Uint32Array | number[] = Array.isArray(buffer) ? polyUint32Array(buffer) : new Uint32Array(buffer);
    const view16: Uint16Array | number[] = Array.isArray(buffer) ? polyUint16Array(buffer) : new Uint16Array(buffer);
    const headerLength = 24;
    const index = slice16(view16, headerLength / 2, view32[4] / 2);
    const data =
        view32[5] === 2
            ? slice16(view16, (headerLength + view32[4]) / 2)
            : slice32(view32, Math.ceil((headerLength + view32[4]) / 4));
    return new Trie(view32[0], view32[1], view32[2], view32[3], index, data);
};
