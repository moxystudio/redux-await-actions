'use strict';

const diff = require('jest-diff').default;

class TimeoutError extends Error {
    constructor(expectedActions, dispatchedActions) {
        super(`Timeout reached while waiting for actions:\n\n${diff(expectedActions, dispatchedActions)}`);
        this.code = 'ETIMEDOUT';
        this.name = 'TimeoutError';
    }
}

class CancelledError extends Error {
    constructor() {
        super('Cancelled requested by user.');
        this.code = 'ECANCELLED';
        this.name = 'CancelledError';
    }
}

class MismatchError extends Error {
    constructor(expectedActions, dispatchedActions) {
        super(`Found mismatch between the order of the array of expected and dispatched actions:\n\n${diff(expectedActions, dispatchedActions)}`);
        this.code = 'EMISMATCH';
        this.name = 'MismatchError';
    }
}

exports.TimeoutError = TimeoutError;
exports.CancelledError = CancelledError;
exports.MismatchError = MismatchError;
