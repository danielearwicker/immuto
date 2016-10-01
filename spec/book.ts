import * as I from "../index";
import { action, property, reducer, amend, snapshot, Cursor, Reducer, array, replace, assign, 
    ReducerBuilder, ActionDefinition, Action, Store, ReducerOrProvider, getReducer } from "../index";
import { createStore } from "redux"

export interface Product {
    readonly price: number; 
}

export namespace Product {
    
    export const empty: Product = { price: 0 };

    export const setPrice = action("SET_PRICE",
        (product: Product, price: number) => amend(product, { price }));

    export const reduce = reducer(empty).action(setPrice);
}

export namespace Product {
    export type Cursor = typeof Product.reduce.cursorType;
}

export interface Book extends Product {
    readonly title: string;    
    readonly authors: string[];
}

export namespace Book {

    export const title = property("TITLE", (book: Book) => book.title);

    export const setTitle = action("SET_TITLE",
        (book: Book, title: string) => amend(book, { title }));

    export const addAuthor = action("ADD_AUTHOR",
        (book: Book, author: string) => amend(book, { authors: book.authors.concat(author) }));

    export const empty: Book = {
        price: 0,
        title: "",
        authors: []
    };

    export const reduce = Product.reduce.mixin(        
        reducer(empty)
            .action(title)
            .action(setTitle)
            .action(addAuthor)
    );

    export type Cursor = typeof Book.reduce.cursorType;
}

export type Flavour = "sweet"|"savoury"|"none";

export interface Food extends Product {
    readonly flavour: Flavour;
}

export namespace Food {

    export const flavour = property("FLAVOUR", (food: Food) => food.flavour);

    export const empty: Food = {     
        flavour: "none",
        price: 0
    };

    export const reduce = Product.reduce.mixin(
        reducer(empty).action(flavour)
    );

    export type Cursor = typeof Food.reduce.cursorType;
}
