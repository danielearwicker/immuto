# A collection of people

Now we're going to deal with a whole room of people at once. Intimidating.

Start a new file `People.ts` and fill it with:

```ts
import { reducer, array } from "immuto";
import { Person } from "./Person";

export type People = Person[];

export namespace People {

    export const empty: People = [];
    export const at = array(Person);
    export const reduce = reducer(empty).action(at);

    export type Cursor = typeof reduce.cursorType;
}
```

It's really the same pattern as before. We've given a name to a data structure, only this time it's an array of `Person` instead of some custom interface we've cooked up.

Then we populate the corresponding namespace with the same useful bits and pieces. Doing it this way means we get to control exactly what operations are available on our collection.

The one apparent oddity is that instead of declaring properties, we just declare a single thing called `at`, but go with it for now. All will become clear.

Let's jump straight into the UI. Save this as `PeopleEditor.tsx`:

```tsx
import * as React from "react";
import { People } from "./People";
import { PersonEditor } from "./PersonEditor";

export interface PeopleEditorProps {
    people: People.Cursor;
}

export function PeopleEditor({people}: PeopleEditorProps) {
    return (
        <div>
        {
            people.state.map((person, index) => (
                <div key={index}>
                    <h1>{person.firstName} {person.lastName}</h1>
                    <PersonEditor person={people.$(People.at(index))} />
                </div>
            ))
        }            
        </div>
    );
}
```

See how we use `People.at`? Again, we're using `people.$(...)` to follow the cursor on to something else. Inside the parentheses we describe the thing we want. Only this time its not a named property, but position in the array, so we pass the position `index`:

```ts
people.$(People.at(position))
```

To see it working, let's modify `index.tsx`, basically replacing `Person` with `People` throughout:

```tsx
import * as React from "react";
import * as ReactDOM from "react-dom";
import { bindToStore } from "immuto-react";
import { People } from "./People";
import { PeopleEditor } from "./PeopleEditor";

const store = People.reduce.store();

const App = bindToStore(store, p => <PeopleEditor people={p} />);

ReactDOM.render(<App/>, document.querySelector("#root"));
```

There's one other thing we'll need to do, because we don't (yet) have a way to add or remove items from our list. In the next step, we'll dispatch some actions into our store.