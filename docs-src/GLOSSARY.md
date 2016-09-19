## Action

A plain object of the form `{ type: string, payload: T }`. An action tells a reducer how to change data, and is in fact the only way to change the data in the store.

## Action Creator

A function that creates an action of a specific type.

## Reducer

A function that is passed an immutable object and an action, and returns a new version of the immutable object, which is different from the original as directed by the action. The simplest reducer is one that always returns the same state as before, ignoring the action, which isn't much use. The next simplest is probably one that returns the action's payload (this kind is used by properties in Immuto).

## Cursor

In most libraries, a cursor represents a single location in your data structure, and when you pass it a new value for that location, it takes care of cloning the rest of the structure around it, so it makes it easy to perform "non-destructive mutation" on large or complex immutable data structures.

Immuto cursors are a little different. Instead of passing a new value, you dispatch an action to the cursor. This makes them much more widely applicable in Redux-style applications. (Although the traditional kind of cursor is easily supported by simply sending an action that tells the cursor to replace the old value with a new one.)
