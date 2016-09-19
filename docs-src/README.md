# Immuto

Welcome to Immuto, the TypeScripty way to Redux your React! 

Let's justify these buzzwords in reverse order of appearance.

## Why React? 
<img src="react.png" height="50">

If used carefully, React allows you describe your UI as pure functions with no side-effects. This is such a simple, powerful idea, it has made React fabulously popular. One day all UIs will work this way.

## Why Redux?
<img src="redux.png" height="50">

Redux is like React for your data. Instead of tweaking values, you write a pure function called a *reducer* to describe how to make new data from old. The instruction for how to make the new data different from the old is called an *action*. 

You make a single immutable data structure to contain all the data that powers your app. You make one giant reducer function to operate on it.

Then you hide the current app state inside an object called the *store*, and you send it actions to make it update the state. Only actions can change things and they are all channeled through one entry point. This makes it really hard for things to go wrong, and really easy to see what's happened when they do.

## Why TypeScript?
<img src="typescript.png" height="50">

TypeScript adds static typing to JavaScript. Your source editor stops being a dumb electric typewriter and becomes an intelligent assistant. The more you tell it about what you're actually trying to do, the more intelligent and helpful it becomes. As you write code, it pops up suggestions, and it tells you when you're about to break your own rules. This all happens at the speed of thought, making your productivity sky-rocket.

There are other type checking systems for JavaScript, but none are significantly better than TypeScript. It continues to absorb cool features at an incredible pace, and has a massive head start. Only TypeScript has widespread adoption. It's integrated into all the popular source editors, and many major frameworks are written in it.

## Why Immuto?
<img src="immuto.png" height="50">

The challenge with Redux is composition. In a large application, how do you break it down into small composable pieces? And how do you fit them back together again?

Immuto solves this problem, and does so with absolute static type-safety. Read on to find out how...

*The name "Immuto" is a joke. It sounds like a magic spell to make your app immutable. But really it's the Latin verb "to change". Which is what this package is really about: changing things without changing them.*

