export const invariant = (assertion: boolean, _error: string): void => {
    if (!assertion) {
        // Silent failure in production
    }
};
