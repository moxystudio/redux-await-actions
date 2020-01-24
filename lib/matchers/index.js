'use strict';

const differenceWith = require('lodash/differenceWith');
const isEqualWith = require('lodash/isEqualWith');
const isMatch = require('lodash/isMatch');
const { MismatchError } = require('../errors');

const wasDispatchedMatcher = (expectedActions, dispatchedActions) =>
    differenceWith(
        expectedActions,
        dispatchedActions,
        (expectedAction, dispatchedAction) => isMatch(dispatchedAction, expectedAction),
    ).length === 0;

const dispatchOrderMatcher = (expectedActions, dispatchedActions) => {
    const isEqual = isEqualWith(
        expectedActions,
        dispatchedActions,
        (expectedAction, dispatchedAction) => isMatch(dispatchedAction, expectedAction),
    );

    if (!isEqual && dispatchedActions.length >= expectedActions.length) {
        throw new MismatchError(expectedActions, dispatchedActions);
    }

    return isEqual;
};

exports.wasDispatchedMatcher = wasDispatchedMatcher;
exports.dispatchOrderMatcher = dispatchOrderMatcher;
