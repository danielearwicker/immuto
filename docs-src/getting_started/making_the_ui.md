# Making the UI

Start a new file and call it `PersonEditor.tsx`, so we can use JSX in our TypeScript. We'll need to import React of course, and our `Person` model. We'll also use some components from `immuto-react`:

```ts
import * as React from "react";
import { Person } from "./Person";
import { TextInput, CheckBox } from "immuto-react";
```

In Immuto all the model data is passed in through props, so let's declare the type of our props in TypeScript. There's that mysterious `Cursor` type we declared in the previous step:

```ts
export interface PersonEditorProps {
    person: Person.Cursor;    
}
```

Now we can declare our stateless component for editing a `Person`. We use destructuring to get the `person` prop into a simple named variable:

```tsx
export function PersonEditor({person}: PersonEditorProps) {
    return (
        <div>
            <fieldset>
                <legend>Person</legend>
                <TextInput binding={person.$(Person.firstName)}
                           placeholder="First name" />
                <TextInput binding={person.$(Person.lastName)}
                           placeholder="Last name" />            
                <label><CheckBox binding={person.$(Person.trusted)} /> Trusted</label>
            </fieldset>
            <fieldset>
                <legend>Summary</legend>
                {person.state.firstName} {person.state.lastName}
                : {person.state.trusted ? "Trusted" : "Not trusted"}
            </fieldset>
        </div>
    );
}
```

By the way, you don't have to use `TextInput` and `CheckBox`. They are just thin wrappers around `<input>` that make binding very succinct - [more about that here](../how_it_works/how_textinput_works.md).

`TextInput` requires a `binding` to "talk to". Turns out we can make just what it requires by using the `firstName` property we defined in our model. Note the simple pattern for looking up a property inside a cursor.

```ts
cursorToObject.$(TypeName.propertyName)
```

This is logically similar to getting a property from an ordinary object:

```ts
objectInstance.propertyName
```

If you want, you can make it more succinct in the JSX by destructuring the properties first:

```tsx
const { firstName, lastName, trusted } = Person;
```

Which means you can just say:

```
<TextInput binding={person.$(firstName)}</TextInput>
```

Why does it have to work in this special way? Because we're not traversing through simple references between objects. `person` is a cursor, and so is `person.$(Person.firstName)`. This is what gives us the power to make changes to the data, even though it's represented immutably.

Save this. One last thing we need to do is change `index.tsx`, which currently renders `Hello, world!`. So open it up and replace the content with:

```ts
import * as React from "react";
import { bindToStore } from "immuto-react";
import { Person } from "./Person";
import { PersonEditor } from "./PersonEditor";
```

Under the imports, add the following:

```ts
const store = Person.reduce.store();

const App = bindToStore(store, p => <PersonEditor person={p} />);
```

The first line creates a store to hold the current state of our `Person`. Behind the scenes it calls the `createStore` function from Redux, but this way it's given more strict static typing.

The second line creates a new component `App` that requires no props, and which renders `PersonEditor` using the current content of the store. This means it re-renders whenever the store changes.

Finally, put back the call to `ReactDOM.render` so it uses the new `App` component:

```ts
ReactDOM.render(<App/>, document.querySelector("#root"));
```

Save this too. Rebuild everything:

```bash
$ webpack
```

Now open `index.html` in your browser and have fun entering your own name, or that of a celebrity, and deciding whether you trust them. The possibilities are limited!
