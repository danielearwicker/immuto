# Dispatching some people

Here's one way to set the `firstName` property of a person in position `0`. It's pure Redux, although the action format has a fussy structure:

```ts
store.dispatch({
    type: "AT",
    payload: {
        key: 0,
        action: {
            type: "FIRST_NAME", 
            payload: { 
                type: "REPLACE", 
                payload: "John" 
            }
        }
    }
});
```

See how it's nested? Actions inside actions. Each action has `type` and `payload`, and sometimes the `payload` contains a further action. We call this an **action path**. It just naturally emerges from the structure of the data model.

Try it in `index.tsx`. Also, try changing `"John"` into `3.14` so it's the wrong type. Or misspell one of the action names. TypeScript won't let you do that.

We can do it with cursors instead. Add these to your imports:

```ts
import { snapshot, replace } from "immuto";
import { Person } from "./Person";
```

And try:

```ts
snapshot(store)
    .$(People.at(0))
    .$(Person.lastName)
        (replace("Zoidberg"));
```

The `snapshot` function gets a cursor for the current state of the store. It's the Immuto way of doing `store.getState()`, except it also retains the power of `dispatch`. As it's a cursor, we can then take the path of our choice down the data structure.

The result is a function that we can directly call to dispatch an action. It *is* a custom dispatch function. `replace` is a good old action creator, just like in Redux (remember: Immuto *is* Redux). So we we could have said:

```ts
snapshot(store)
    .$(People.at(0))
    .$(Person.lastName)
        ({ type: "REPLACE", payload: "Zoidberg" });
```

Again, any typo such as `type: "REPLOCE"` is caught instantly. And try piping in the wrong order:

```ts
snapshot(store).$(Person.firstName) // error: Person[] is not assignable to Person
```

Our store's internal state is of type `People` so it's just a plain ol' array of objects:

```ts
const example: People = [
    { firstName: "Homer",  lastName: "Simpson", trusted: false },
    { firstName: "Marge",  lastName: "Simpson", trusted: true  },
    { firstName: "Bart",   lastName: "Simpson", trusted: false },
    { firstName: "List",   lastName: "Simpson", trusted: true  },
    { firstName: "Maggie", lastName: "Simpson", trusted: false },
]
```

So I guess we could copy it into the store like this:

```
for (let p = 0; p < example.length; p++) {
    const person = snapshot(store).$(People.at(p));

    person.$(Person.firstName)(replace(example[p].firstName));
    person.$(Person.lastName)(replace(example[p].lastName));
    person.$(Person.trusted)(replace(example[p].trusted));
}
```

On the other hand, it would be nice if we could just throw the whole `example` straight in the store. Let's do something completely off-the-wall and define an action! Go into `People.ts` and fix your `immuto` import so it says:

```ts
import { reducer, array, action } from "immuto";
```

Then between the `at` and `reduce` declarations, add:

```ts
export const initialize = action("INITIALIZE", 
    (state: People, payload: People) => payload);
```

See how we have to write a kind a partial reducer? We just get given the current `state` and the `payload` of our action. The `state` needs to be the right type for the object, in this case `People`, but the type of `payload` could be anything we want (usually something JSON-compatible though. In this case we set the payload to be of type `People` so we can simply return it as the new state, throwing away the old state.

Finally, tack it on to the reducer:

```ts
export const reduce = reducer(empty)
        .action(at)
        .action(initialize);
```

With this added ingredient, all we need in `index.tsx` is:

```ts
store.dispatch(People.initialize(example));
```

`People.initialize` is an action creator. We just pass it the payload. Again, to be super clear, we could have said:

```ts
store.dispatch({ type: "INITIALIZE", payload: example });
```

So in summary, this is all `index.tsx` now needs to contain:

```tsx
import * as React from "react";
import * as ReactDOM from "react-dom";
import { bindToStore } from "immuto-react";
import { People } from "./People";
import { PeopleEditor } from "./PeopleEditor";

const store = People.reduce.store();

const App = bindToStore(store, p => <PeopleEditor people={p} />);

ReactDOM.render(<App/>, document.querySelector("#root"));

const example: People = [
    { firstName: "Homer",  lastName: "Simpson", trusted: false },
    { firstName: "Marge",  lastName: "Simpson", trusted: true  },
    { firstName: "Bart",   lastName: "Simpson", trusted: false },
    { firstName: "Lisa",   lastName: "Simpson", trusted: true  },
    { firstName: "Maggie", lastName: "Simpson", trusted: false },
]

store.dispatch({ type: "INITIALIZE", payload: example });
```

Let's give it a whirl:

```bash
$ webpack
```

Open `index.html` in your browser and try changing the names of the Simpsons family. It's really awesome.

*To be continued...*