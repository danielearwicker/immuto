# Making the UI

Start a new file and call it `PersonEditor.tsx`, so we can use JSX in our TypeScript. We'll need to import React of course, and our `Person` model. We'll also use a component from `immuto-react` called `TextInput`:

```ts
import * as React from "react";
import { Person } from "./Person";
import { TextInput } from "immuto-react";
```

In Immuto all the model data is passed in through props, so let's declare the type of our props in TypeScript. There's that mysterious `Cursor` type we declared in the previous step:

```ts
export interface PersonEditorProps {
    binding: Person.Cursor;    
}
```

Now we can declare our stateless component for editing a `Person`. We use destructuring to get the `binding` prop into a simple named variable:

```ts
export const PersonEditor = ({binding}: PersonEditorProps) => (
    <div>
        <div>
            <label>First name
                <TextInput binding={Person.firstName(binding)} />
            </label>
        </div>
        <div>
            <label>Last name
                <TextInput binding={Person.lastName(binding)} />
            </label>
        </div>
        <div>
            {binding.state.firstName} {binding.state.lastName}
        </div>
    </div>
);
```

Save this. One last thing we need to do is change `index.tsx`, which currently renders `Hello, world!`. So open it up and replace the content with:

```ts
import { bindToStore } from "immuto-react";
import { Person } from "./Person";
import { PersonEditor } from "./PersonEditor";
```

Under the imports, add the following:

```ts
const store = Person.reduce.store();

const App = bindToStore(store, root => <PersonEditor binding={root} />);
```

The first line creates a store to hold the current state of our `Person`. Behind the scenes it calls the `createStore` function from Redux, but this way it's given more strict static typing.

The second line creates a new component `App` that requires no props, and which renders `PersonEditor` using the current content of the store. This means it re-renders whenever the store changes.

Finally, fix the call to `ReactDOM.render` so it uses the new `App` component:

```ts
ReactDOM.render((

    <App/>

), document.querySelector("#root"));
```

Save this too. Rebuild everything:

```bash
$ webpack
```

Now open `index.html` in your browser and have fun entering your own name, or that of a celebrity. The possibilities are limited!
