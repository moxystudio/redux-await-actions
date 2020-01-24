'use strict';

module.exports = (createStore) => (reducer, initialState, enhancer) => {
    const actions = new Set();

    const actionCapturerReducer = (state, action) => {
        if (!action.type.startsWith('@@redux')) {
            actions.add(action);
        }

        return reducer(state, action);
    };

    const store = createStore(actionCapturerReducer, initialState, enhancer);

    return {
        ...store,
        getActions: () => Array.from(actions),
        clearActions: () => actions.clear(),
    };
};
