# Creating the project

This is the same type of stuff as any modern web app project, and in fact is similar to [the TypeScript guidelines for React and webpack](https://www.typescriptlang.org/docs/handbook/react-&-webpack.html). 

First install [nodejs](https://nodejs.org/en/), then make sure you have TypeScript and webpack installed:

```bash
$ npm install -g typescript@rc webpack
```

Note we're using the release candidate, because Immuto requires TypeScript 2.0 which hasn't gone mainstream just yet.

Now create your project directory:

```bash
$ mkdir myapp
$ cd myapp
$ npm init
```

And accept all the defaults. Then add the packages that we need for the app to run:

```bash
$ npm install --save react react-dom immuto immuto-react
```

And then the packages we'll need to develop the app:

```bash
$ npm install --save-dev @types/react @types/react-dom typescript@rc webpack ts-loader source-map-loader
```

Run this command to get a minimal React project in place:

```bash
$ node node_modules/immuto-react/templates/get
```

This creates:

* `tsconfig.json` - strictest TypeScript rules
* `index.tsx` - entry point for app
* `webpack.config.js` - builds `index.tsx` to `built/bundle.js` with source maps 
* `index.html` - minimal container page, loads `built/bundle.js`

You can now build the app with:

```bash
$ webpack
```

You can keep webpack running all the time by adding the `-w` switch, so it rebuilds every time you save a modification.

If you open `index.html` in your browser you should see the message:

```
Hello, world!
```

Now our aim is to improve on that...