import { Map } from "immutable";
import { Unsubscribe, createStore } from "redux"

export interface Action<T extends string, P> {
    readonly type: T,
    readonly payload: P
}

export function action<T extends string, P>(type: T, payload: P) {
    return { type, payload };
}

export interface Reducer<S, A> {

    /**
     * Reduce function
     */
    (state: S, action: A): S;

    /**
     * Dummy member for use with typeof
     */
    actionType: A;

    /**
     * Returns an enhanced Reducer capable of reducing
     * an additional action type
     */
    action<T extends string, P>(
        type: T,
        reduce: (state: S, payload: P) => S
    ) : Reducer<S, A | Action<T, P>>

    /**
     * Creates a Redux store with extra type-safety
     */
    createStore(): Store<S, A>;
}

function isAction<T extends string>(
    obj: any,
    type: T
): obj is Action<T, any> {
    return obj && obj.type === type;
}

export function chain<S, RA, HT extends string, HP>(
    headType: HT,
    head: (state: S, payload: HP) => S,
    rest: (state: S, action: RA) => S
): Reducer<S, RA | Action<HT, HP>> {

    type A = RA | Action<HT, HP>;

    function reduce(state: S, action: A) {
        if (isAction(action, headType)) {
            return head(state, action.payload);
        }

        return rest(state, action);
    }

    return assign(reduce, {

        actionType: undefined! as A,

        action<T extends string, P>(
            type: T,
            newReduce: (state: S, payload: P) => S
        ) : Reducer<S, Action<T, P> | A> {
            return chain<S, A | RA, T, P>(type, newReduce, reduce);
        },

        createStore(): Store<S, A> {
            return createStore(reduce);
        }
    });
}

export function reducer<S>(init: S) {
    return {
        action<T extends string, P>(
            type: T,
            reduce: (state: S, payload: P) => S
        ) : Reducer<S, Action<T, P>> {
            return chain<S, never, T, P>(type, reduce, s => s === undefined ? init : s);
        }
    };
}

export interface Store<S, A> {
    dispatch(action: A): void;
    getState(): S;
    subscribe(listener: () => void): Unsubscribe;
}

export interface Cursor<S, A> {
    readonly value: S;
    dispatch(action: A): Cursor<S, A>;
}

export function createStoreCursor<S, A>(
    store: Store<S, A>
): Cursor<S, A> {
    return {
        value: store.getState(),
        dispatch(action) {
            store.dispatch(action);
            return createStoreCursor(store);
        }
    };
}

export function defineCursor<OS, OA, K, IS, IA>(
    fetch: (outer: OS, key: K) => IS,
    update: (key: K, action: IA) => OA
) {
    return (outer: Cursor<OS, OA>, key: K): Cursor<IS, IA> => {
        return {
            value: fetch(outer.value, key),
            dispatch(innerAction: IA) {
                return defineCursor(fetch, update)(
                    outer.dispatch(update(key, innerAction)), key);
            }
        };
    };
}

function assign<T, S1, S2>(target: T, source1: S1, source2: S2): T & S1 & S2;
function assign<T, S1>(target: T, source1: S1): T & S1;
function assign<T>(target: T, ...sources: any[]): any {
    for (const source of sources) {
        for (const key of Object.keys(source)) {
            (target as any)[key] = (source as any)[key];
        }
    }
    return target;
}
