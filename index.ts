import { Unsubscribe, createStore } from "redux"

/**
 * The only thing all action types have in common is a string
 * property called type, which must be unique across all actions
 * handled by the same reducer.
 *
 * We adopt the additional (popular) pattern of collecting any
 * further data into a single payload property. This makes the
 * very common case of a single value very succinct.
 */
export interface Action<T extends string, P> {
    readonly type: T;
    readonly payload: P;
}

/**
 * Common features of an ActionCreator and a CollectionDefinition.
 */
export interface ActionDefinition<S, T extends string, P> {
    readonly type: T;

    reduce(state: S, payload: P): S;

    readonly payloadType: P;
    readonly stateType: S;
}

export function definition<S, T extends string, P, F>(
    type: T,
    reduce: (state: S, payload: P) => S,
    func: F
): F & ActionDefinition<S, T, P> {
    return assign(func, {
        type,
        reduce,
        payloadType: undefined! as P,
        stateType: undefined! as S
    });
}

/**
 * An ActionCreator is a function that creates actions and can
 * also be registered with a reducer.
 */
export interface ActionCreator<S, T extends string, P>
    extends ActionDefinition<S, T, P> {

    (payload: P): Action<T, P>;
}

/**
 * Defines an action, for later inclusion in a reducer.
 */
export function action<S, T extends string, P>(
    type: T,
    reduce: (state: S, payload: P) => S
): ActionCreator<S, T, P> {

    function create(payload: P) {
        return { type, payload };
    }

    return definition(type, reduce, create);
}

export interface MinimalReducer<S, A> {
    /**
     * Reduce function
     */
    (state: S, action: A): S;

    /**
     * A suitable initial state
     */
    empty: S;
}

/**
 * A Reducer is a function that takes a state object and an action
 * and returns a modified state object. Here it is also equipped
 * with a method called action which allows multiple reducer
 * functions to be declaratively merged together into a single
 * function, and a store method that wraps Redux's createStore
 * to make it perfectly type-safe.
 *
 * Note that reducers are immutable - given a reducer x, calling
 * x.action(...) returns a new reducer combination rather than
 * modifying x.
 */
export interface Reducer<S, A> extends MinimalReducer<S, A> {

    /**
     * Reduce function
     */
    (state: S, action: A): S;

    /**
     * A suitable initial state
     */
    empty: S;

    /**
     * Dummy member for use with typeof (does not have
     * a useful runtime value.)
     */
    actionType: A;
    cursorType: Cursor<S, A>;

    /**
     * Returns an enhanced Reducer capable of reducing
     * some additional action type.
     */
    action<T extends string, P>(
        definition: ActionDefinition<S, T, P>
    ): Reducer<S, A | Action<T, P>>;

    /**
     * Creates a Redux store with extra type-safety.
     */
    store(): Store<S, A>;
}

function isAction<T extends string>(
    obj: any,
    type: T
): obj is Action<T, any> {
    return obj && obj.type === type;
}

function chain<S, RA, HT extends string, HP>(
    headType: HT,
    empty: S,
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
        cursorType: undefined! as Cursor<S, A>,
        empty,

        action<T extends string, P>(
            def: ActionDefinition<S, T, P>
        ) : Reducer<S, Action<T, P> | A> {
            return chain<S, A | RA, T, P>(def.type, empty, def.reduce, reduce);
        },

        store(): Store<S, A> {
            return createStore(reduce);
        }
    });
}

/**
 * Creates a starter object from which a Reducer can be formed by
 * calling the action method.
 */
export function reducer<S>(empty: S) {
    return {
        action<T extends string, P>(
            def: ActionDefinition<S, T, P>
        ) : Reducer<S, Action<T, P>> {
            return chain<S, never, T, P>(def.type, empty, def.reduce, s => s === undefined ? empty : s);
        }
    };
}

export interface Subscribable {
    subscribe(listener: () => void): Unsubscribe;
}

/**
 * Describes a minimal Redux-like store. Note that stores are not
 * immutable (that's their whole purpose) and therefore getState is
 * not pure (it may return a different value each time you call it).
 */
export interface Store<S, A> extends Subscribable {
    dispatch<A1 extends A>(action: A1): A1;
    getState(): S;
}

/**
 * A pure representation of the state of a store or part of a store.
 * A cursor's value property never changes. Instead, the dispatch
 * method returns a new cursor representing the new state.
 *
 * Note that, unlike a traditional non-Redux cursor, updating is
 * always performed by dispatching an action.
 */
export interface Cursor<S, A> {

    /**
     * The state at the time this cursor was created.
     */
    readonly state: S;

    /**
     * Sends an action into the store's reducer, resulting in the
     * store updating, and a new cursor is returned representing
     * the new state.
     */
    (action: A): Cursor<S, A>;

    /**
     * Piping operator - allows left-to-write composition to navigate
     * down through a tree of cursors. This variant is for simple
     * references or properties.
     */
    $<S2, A2>(ref: (outer: Cursor<S, A>) => Cursor<S2, A2>): Cursor<S2, A2>;
}

export function cursor<S, A>(state: S, dispatch: (action: A) => Cursor<S, A>): Cursor<S, A> {

    let outer: Cursor<S, A>;

    function pipe<S2, A2>(ref: (outer: Cursor<S, A>) => Cursor<S2, A2>): Cursor<S2, A2> {
        return ref(outer);
    }

    outer = assign(dispatch, {
        $: pipe,
        state,        
        valueOf() {
            return state;
        }
    });

    return outer;
}

/**
 * Takes a snapshot of a Redux-like store, making it into a pure cursor.
 */
export function snapshot<S, A>(store: Store<S, A>): Cursor<S, A> {    
    return cursor(store.getState(), (action: A) => {
        store.dispatch(action);
        return snapshot(store);
    });
}

export interface ReferenceDefinition<T extends string, S, I, A>
    extends ActionDefinition<S, T, A> {
    (outer: Cursor<S, Action<T, A>>): Cursor<I, A>;
    //update(action: A): Action<T, A>;
}

function item<OS, OA, IS, IA>(
    fetch: (outer: OS) => IS,
    update: (action: IA) => OA
) {
    return (outer: Cursor<OS, OA>): Cursor<IS, IA> => {
        return cursor(fetch(outer.state), (innerAction: IA) => 
            item(fetch, update)(outer(update(innerAction))));
    };
}

export function reference<T extends string, S, I, A>(
    type: T,
    reducer: MinimalReducer<I, A>,
    get: (state: S) => I,
    set?: (state: S, item: I) => S
): ReferenceDefinition<T, S, I, A> {

    const ensuredSet = ensureReducer(`reference(${type})`, get, set);

    function update(payload: A): Action<T, A> {
        return { type, payload };
    }

    function reduce(outerState: S, innerAction: A) {
        return ensuredSet(outerState, reducer(get(outerState), innerAction));        
    }

    const traverser = item((state: S) => get(state), update);

    return definition(type, reduce, assign(traverser, { update }));
}

export interface At<K, A> {
    key: K;
    action: A;
}

export function collection<C, K, I, A>(
    itemReducer: MinimalReducer<I, A>,
    get: (collection: C, key: K) => I | undefined,
    set: (collection: C, key: K, item: I) => C
) {
    function substitute(col: C, key: K): I {
        const itemOrMissing = get(col, key);
        return itemOrMissing === undefined ? itemReducer.empty : itemOrMissing;
    }

    function reduce(col: C, at: At<K, A>) {        
        return set(col, at.key, itemReducer(substitute(col, at.key), at.action));
    }

    function update(key: K, action: A): Action<"AT", At<K, A>> {
        return { type: "AT", payload: { key, action } };
    }

    function traverser(key: K) {
        return item((col: C) => substitute(col, key), (action: A) => update(key, action));
    }

    return definition("AT", reduce, assign(traverser, { update }));
}

export function array<I, A>(itemReducer: MinimalReducer<I, A>) {
    return collection<I[], number, I, A>(
        itemReducer,
        (ar, index) => ar[index],
        (ar, index, item) => {
            ar = ar.slice(0);
            ar[index] = item;
            return ar;
        });
}

export function objectByString<I, A>(itemReducer: MinimalReducer<I, A>) {
    return collection<{ [key: string]: I }, string, I, A>(
        itemReducer, (obj, key) => obj[key],
        (obj, key, item) => amend(obj, { [key]: item }));
}

export function objectByNumber<I, A>(itemReducer: MinimalReducer<I, A>) {
    return collection<{ [key: number]: I }, number, I, A>(
        itemReducer, (obj, key) => obj[key],
        (obj, key, item) => amend(obj, { [key]: item }));
}

export function removeFromObjectByString<I>() {
    return action("REMOVE", (obj: { [key: string]: I }, key: string) => {
        const clone = assign({}, obj);
        delete clone[key];
        return clone;
    });
}

export function removeFromObjectByNumber<I>() {
    return action("REMOVE", (obj: { [key: number]: I }, key: number) => {
        const clone = assign({}, obj);
        delete clone[key];
        return clone;
    });
}

export const REPLACE = "REPLACE";
export type REPLACE = typeof REPLACE;

export type Replace<V> = Action<REPLACE, V>;

/**
 * Defines the reducer for a value that can only be assigned a whole new value. 
 * It only supports the action "REPLACE" whose payload is the replacement value.
 */
export function primitive<V>() {
    return reducer(undefined! as V).action(action(REPLACE, (s: V, v: V) => v));
}

/**
 * Action that replaces a whole value, supported by primitives
 */
export function replace<T>(value: T): Replace<T> {
    return { type: REPLACE, payload: value };
}

/**
 * Property is just a type alias for a cursor to a primitive
 */
export type Property<V> = Cursor<V, Replace<V>>;

/**
 * Defines a property, which is a simple value that can be
 * replaced with a new value. It uses the primitive reducer.
 */
export function property<T extends string, S, V>(
    type: T,
    fetch: (state: S) => V,
    reduce?: (state: S, payload: V) => S
): ReferenceDefinition<T, S, V, Replace<V>> {

    return reference(type, primitive<V>(), fetch, reduce);
}

/**
 * Basic substitute for Object.assign
 */
export function assign<T, S1, S2>(target: T, source1: S1, source2: S2): T & S1 & S2;
export function assign<T, S1>(target: T, source1: S1): T & S1;
export function assign<T>(target: T, ...sources: any[]): any {
    for (const source of sources) {
        for (const key of Object.keys(source)) {
            (target as any)[key] = (source as any)[key];
        }
    }
    return target;
}

/**
 * Pretty good subsitute for object spread syntax. Instead of:
 *
 *    { ...book, title }
 *
 * say:
 *
 *    amend(book, { title })
 */
export function amend<O1, O2>(o1: O1, o2: O2) {
    return assign({}, o1, o2);
}

// Oh yes, I went there...
var matchFunction = /function\s*[a-z]*\s*\(\s*([a-z]+)\s*\)\s*\{\s*return\s+([a-z]+)\.([a-z]+)/i;
var matchLambda = /\(?\s*([a-z]+)\s*\)?\s*\=\>\s*([a-z]+)\.([a-z]+)/i

function ensureReducer<S, P>(
    context: string,
    fetch: (state: S) => P,
    reduce?: (state: S, payload: P) => S
): (state: S, payload: P) => S {
    if (reduce) {
        return reduce;
    }
    // We might be able to generate reduce by parsing the source of fetch!
    const src = fetch.toString();

    matchFunction.lastIndex = 0;
    matchLambda.lastIndex = 0;
    const matched = matchFunction.exec(src) || matchLambda.exec(src)
    if (!matched) {
        throw new Error(`Cannot generate reducer for ${context} `
            + `- too complex to parse, needs explicit reduce`);
    }

    if (matched[1] !== matched[2]) {
        throw new Error(`Cannot generate reducer for ${context} ` +
            `- inconsistent parameter usage: ${matched[1]}, ${matched[2]}`);
    }

    return (state, value) => amend(state, { [matched[3]]: value });
}
