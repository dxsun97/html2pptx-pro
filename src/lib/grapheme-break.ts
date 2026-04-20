// Unicode grapheme cluster breaking (UAX #29)
// Original: text-segmentation by Niklas von Hertzen (MIT License)

import { base64, byteLength } from './grapheme-break-trie';
import { createTrieFromBase64 } from './utrie';
import { toCodePoints, fromCodePoint } from './unicode';

// Class 0 (Other) and 6 (Regional_Indicator) are defined in the trie but not referenced directly in break rules
const Prepend = 1;
const CR = 2;
const LF = 3;
const Control = 4;
const Extend = 5;
const SpacingMark = 7;
const L = 8;
const V = 9;
const T = 10;
const LV = 11;
const LVT = 12;
const ZWJ = 13;
const Extended_Pictographic = 14;
const RI = 15;

const UnicodeTrie = createTrieFromBase64(base64, byteLength);

const BREAK_NOT_ALLOWED = '\u00D7';
const BREAK_ALLOWED = '\u00F7';

const codePointToClass = (codePoint: number): number => UnicodeTrie.get(codePoint);

const _graphemeBreakAtIndex = (_codePoints: number[], classTypes: number[], index: number): string => {
    let prevIndex = index - 2;
    let prev = classTypes[prevIndex];
    const current = classTypes[index - 1];
    const next = classTypes[index];

    // GB3 Do not break between a CR and LF
    if (current === CR && next === LF) {
        return BREAK_NOT_ALLOWED;
    }

    // GB4 Otherwise, break before and after controls.
    if (current === CR || current === LF || current === Control) {
        return BREAK_ALLOWED;
    }

    // GB5
    if (next === CR || next === LF || next === Control) {
        return BREAK_ALLOWED;
    }

    // Do not break Hangul syllable sequences.
    // GB6
    if (current === L && [L, V, LV, LVT].indexOf(next) !== -1) {
        return BREAK_NOT_ALLOWED;
    }

    // GB7
    if ((current === LV || current === V) && (next === V || next === T)) {
        return BREAK_NOT_ALLOWED;
    }

    // GB8
    if ((current === LVT || current === T) && next === T) {
        return BREAK_NOT_ALLOWED;
    }

    // GB9 Do not break before extending characters or ZWJ.
    if (next === ZWJ || next === Extend) {
        return BREAK_NOT_ALLOWED;
    }

    // Do not break before SpacingMarks, or after Prepend characters.
    // GB9a
    if (next === SpacingMark) {
        return BREAK_NOT_ALLOWED;
    }

    // GB9a
    if (current === Prepend) {
        return BREAK_NOT_ALLOWED;
    }

    // GB11 Do not break within emoji modifier sequences or emoji zwj sequences.
    if (current === ZWJ && next === Extended_Pictographic) {
        while (prev === Extend) {
            prev = classTypes[--prevIndex];
        }
        if (prev === Extended_Pictographic) {
            return BREAK_NOT_ALLOWED;
        }
    }

    // GB12 Do not break within emoji flag sequences.
    if (current === RI && next === RI) {
        let countRI = 0;
        while (prev === RI) {
            countRI++;
            prev = classTypes[--prevIndex];
        }
        if (countRI % 2 === 0) {
            return BREAK_NOT_ALLOWED;
        }
    }

    return BREAK_ALLOWED;
};

const GraphemeBreaker = (str: string) => {
    const codePoints = toCodePoints(str);
    const length = codePoints.length;
    let index = 0;
    let lastEnd = 0;
    const classTypes = codePoints.map(codePointToClass);

    return {
        next: (): { done: boolean; value: string | null } => {
            if (index >= length) {
                return { done: true, value: null };
            }

            let graphemeBreak = BREAK_NOT_ALLOWED;
            while (
                index < length &&
                (graphemeBreak = _graphemeBreakAtIndex(codePoints, classTypes, ++index)) === BREAK_NOT_ALLOWED
            ) {
                // continue
            }

            if (graphemeBreak !== BREAK_NOT_ALLOWED || index === length) {
                const value = fromCodePoint(...codePoints.slice(lastEnd, index));
                lastEnd = index;
                return { value, done: false };
            }

            return { done: true, value: null };
        }
    };
};

export const splitGraphemes = (str: string): string[] => {
    const breaker = GraphemeBreaker(str);
    const graphemes: string[] = [];
    let bk;

    while (!(bk = breaker.next()).done) {
        if (bk.value) {
            graphemes.push(bk.value.slice());
        }
    }

    return graphemes;
};
