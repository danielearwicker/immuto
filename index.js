"use strict";
function isAction(obj, type) {
    return obj && obj.type === type;
}
function chain(headType, head, rest) {
    function reduce(state, action) {
        if (isAction(action, headType)) {
            return head(state, action.payload);
        }
        return rest(state, action);
    }
    return assign(reduce, {
        action: function (type, newReduce) {
            return chain(type, newReduce, reduce);
        },
        actionType: { type: "", payload: undefined }
    });
}
exports.chain = chain;
function reducer(init) {
    return {
        action: function (type, reduce) {
            return chain(type, reduce, function (s) { return s === undefined ? init : s; });
        }
    };
}
exports.reducer = reducer;
function createStoreCursor(store) {
    var dummyState = {};
    return function (action) {
        if (action) {
            store.dispatch(action);
            return dummyState;
        }
        return store.getState();
    };
}
exports.createStoreCursor = createStoreCursor;
function defineCursor(fetch, update) {
    var dummyState = {};
    return function (container, address, snapshot) {
        var snapshotValue = snapshot ? fetch(container(), address) : dummyState;
        return function (targetAction) {
            if (targetAction) {
                container(update(address, targetAction));
                return dummyState;
            }
            return snapshot ? snapshotValue : fetch(container(), address);
        };
    };
}
exports.defineCursor = defineCursor;
function assign(target, source) {
    Object.keys(source).forEach(function (key) {
        target[key] = source[key];
    });
    return target;
}
