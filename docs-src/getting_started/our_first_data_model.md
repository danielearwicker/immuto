# Our first data model

We're using Immuto because we want all our data to be immutable. For a really simple example we'll go with:

```ts
export interface Person {
    readonly firstName: string;
    readonly lastName: string;
    readonly trusted: boolean;
}
```

Looks like we have trust issues. But anyway. Save the above into your project directory as `Person.ts`.

Now let's describe this structure to Immuto. At the top of the file add:

```ts
import { property, reducer } from "immuto";
```

Then at the bottom continue with:

```ts
export namespace Person {

    export const empty: Person = {
        firstName: "",
        lastName: "",
        trusted: false
    };

    export const firstName = property("FIRST_NAME", (p: Person) => p.firstName);
    export const lastName = property("LAST_NAME", (p: Person) => p.lastName);
    export const trusted = property("TRUSTED", (p: Person) => p.trusted);

    export const reduce = reducer(empty)
        .action(firstName)
        .action(lastName)
        .action(trusted);

    export type Cursor = typeof reduce.cursorType;
}
```

We've declared an `empty` Person (not saying they're emotionally empty.) Then we've declared `property` helpers for each of the properties we want user to be able to independently edit, giving each one a Redux-style all-caps name.

Then we create `reduce` function. This is the crux of the Redux approach, but here Immuto writes the function for us.

The last part, where we declare a type alias called `Cursor`, is hard to explain at this point, but we'll get to it soon.
