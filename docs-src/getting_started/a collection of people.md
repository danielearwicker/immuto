# A collection of people

Now we're going to deal with a whole room of people at once. Intimidating.

Start a new file `Room.ts` and fill it with:

```ts
import { property, reducer, collection, arrayOperations } from "immuto";
import { Person } from "./Person";

export interface Room {
    readonly people: Person[];
}

export namespace Room {

    export const empty: Room = { people: [] };

    export const people = collection("PEOPLE", Person.reduce,
        arrayOperations<Person>(), (r: Room) => r.people);

    export const reduce = reducer(empty).action(people);

    export type Cursor = typeof reduce.cursorType;
}
```

Pause a second to note that when we define a `collection`, we have to tell it two extra things compared to a property:

* `Person.reduce` is the reducer function for an item in the collection.
* `arrayOperations<Person>()` is an object that defines how to operate immutably on an array. Immuto doesn't assume you'll want to use arrays. You can use any kind of collection.

And let's go right ahead and make a UI for a room, save it as `RoomEditor.tsx`:

... to be continued
