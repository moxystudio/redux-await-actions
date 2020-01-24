'use strict';

module.exports = (actions, timeout = 10) => (dispatch) => new Promise((resolve) => {
    setTimeout(() => {
        actions.forEach((action) => dispatch(action));
        resolve();
    }, timeout);
});
