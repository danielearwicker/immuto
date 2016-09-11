import { List, Map } from "immutable";

import { action, reducer, collection, snapshot, amend, map, Store } from "../index";

interface Book {
    readonly title: string;
    readonly price: number;
    readonly authors: List<string>;
}

namespace Book {

    export const setTitle = action("SET_TITLE",
        (book: Book, title: string) => amend(book, { title }));

    export const setPrice = action("SET_PRICE",
        (book: Book, price: number) => amend(book, { price }));

    export const addAuthor = action("ADD_AUTHOR",
        (book: Book, author: string) => amend(book, { authors: book.authors.push(author) }));

    export const empty: Book = {
        title: "",
        price: 0,
        authors: List<string>()
    };

    export const reduce = reducer<Book>(empty)
        .action(setTitle)
        .action(setPrice)
        .action(addAuthor);
}

const b = Book.reduce(Book.empty, Book.setTitle("Daniel"));


interface Shelf {
    readonly description: string;
    readonly books: Map<number, Book>;
}

namespace Shelf {

    export const setDescription = action("SET_DESCRIPTION",
        (shelf: Shelf, description: string) => amend(shelf, { description }));

    export const books = collection({
        type: "BOOKS",
        reducer: Book.reduce,
        operations: map<number, Book>(),
        get: (shelf: Shelf) => shelf.books,
        set: (shelf, books) => amend(shelf, { books })
    });

    export const empty: Shelf = {
        description: "",
        books: Map<number, Book>()
    };

    export const reduce = reducer<Shelf>(empty)
        .action(setDescription)
        .action(books);
}

interface Shop {
    readonly name: string;
    readonly shelves: Map<string, Shelf>;
}

namespace Shop {

    export const setName = action("SET_NAME",
        (shop: Shop, name: string) => amend(shop, { name }));

    export const shelves = collection({
        type: "SHELVES",
        reducer: Shelf.reduce,
        operations: map<string, Shelf>(),
        get: (shop: Shop) => shop.shelves,
        set: (shop, shelves) => amend(shop, { shelves })
    });

    export const empty: Shop = {
        name: "",
        shelves: Map<string, Shelf>()
    };

    export const reduce = reducer(empty)
        .action(setName)
        .action(shelves);
}

const enableLogging = true;

function logStore<State, Types>(store: Store<State, Types>) {
    if (enableLogging) {
        store.subscribe(() => {
            console.log("");
            console.log(JSON.stringify(store.getState()));
            console.log("");
        });
    }
    return store;
}

describe("I", () => {

    it("has an initial state available via cursor", () => {

        {
            const store = Shop.reduce.store();

            const shop = snapshot(store);
            const shelf = Shop.shelves(shop, "fiction");
            const book = Shelf.books(shelf, 109423);

            book(Book.setTitle("1985"));

            expect(store.getState().shelves.get("fiction").books.get(109423).title).toEqual("1985");
        }

        const book = snapshot(logStore(Book.reduce.store())).state;

        expect(book.title).toEqual("");
        expect(book.price).toEqual(0);
        expect(book.authors.count()).toEqual(0);

        expect(JSON.stringify(book)).toEqual(`{"title":"","price":0,"authors":[]}`);
    });

    it("can be updated via cursors", () => {

        const store = logStore(Shelf.reduce.store());

        const shelf1 = snapshot(store);
        const shelf2 = shelf1(Shelf.setDescription("Romance"));

        expect(JSON.stringify(shelf2.state)).toEqual(`{"description":"Romance","books":{}}`);

        const shelf3 = shelf2(Shelf.books.update(1001, Book.setTitle("1985")));

        expect(JSON.stringify(shelf3.state)).toEqual(`{"description":"Romance","books":{"1001":{"title":"1985","price":0,"authors":[]}}}`);

        const firstBook1 = Shelf.books(shelf3, 1001);

        expect(firstBook1.state.title).toEqual("1985");
        expect(firstBook1.state.price).toEqual(0);

        const firstBook2 = firstBook1(Book.setPrice(5.99));

        expect(JSON.stringify(store.getState())).toEqual(`{"description":"Romance","books":{"1001":{"title":"1985","price":5.99,"authors":[]}}}`);

        expect(firstBook2.state.price).toEqual(5.99);
    });

    it("supports removing items from collections", () => {

        const store = logStore(Shelf.reduce.store());

        const shelf1 = snapshot(store)(Shelf.setDescription("Romance"));

        expect(JSON.stringify(shelf1.state)).toEqual(`{"description":"Romance","books":{}}`);

        const shelf2 = shelf1
            (Shelf.books.update(1001, Book.setTitle("1985")))
            (Shelf.books.update(1002, Book.setTitle("Indiana Smith")))
            (Shelf.books.update(1003, Book.setTitle("Gone With The Runs")));;

        expect(JSON.stringify(shelf2.state)).toEqual(`{"description":"Romance","books":{"1001":{"title":"1985","price":0,"authors":[]},"1002":{"title":"Indiana Smith","price":0,"authors":[]},"1003":{"title":"Gone With The Runs","price":0,"authors":[]}}}`);

        const shelf3 = shelf2(Shelf.books.remove(1002));

        expect(JSON.stringify(shelf3.state)).toEqual(`{"description":"Romance","books":{"1001":{"title":"1985","price":0,"authors":[]},"1003":{"title":"Gone With The Runs","price":0,"authors":[]}}}`);

        // Alternatively, remove via cursor
        Shelf.books(shelf3, 1003).remove();

        expect(JSON.stringify(store.getState())).toEqual(`{"description":"Romance","books":{"1001":{"title":"1985","price":0,"authors":[]}}}`);

    });

    it("supports nested layers of cursors", () => {

        const store = logStore(Shop.reduce.store());
        const shop1 = snapshot(store);

        const shop2 = shop1(Shop.setName("Buy the Book, Inc."));
        const shop3 = shop2(Shop.shelves.add("ADV"));

        const advShelf1 = Shop.shelves(shop3, "ADV");
        expect(advShelf1.state.description).toEqual("");

        const advShelf2 = advShelf1(Shelf.setDescription("Adventure"));
        expect(advShelf2.state.description).toEqual("Adventure");

        const advShelf3 = advShelf2(
            Shelf.books.update(1002, Book.setTitle("Indiana Smith")));

        expect(JSON.stringify(store.getState())).toEqual(`{"name":"Buy the Book, Inc.","shelves":{"ADV":{"description":"Adventure","books":{"1002":{"title":"Indiana Smith","price":0,"authors":[]}}}}}`);

        const firstBook1 = Shelf.books(advShelf3, 1002);
        expect(firstBook1.state.title).toEqual("Indiana Smith");

        const firstBook2 = firstBook1(Book.setPrice(4.99));
        const firstBook3 = firstBook2(Book.addAuthor("Jim Orwell"));

        expect(JSON.stringify(store.getState())).toEqual(`{"name":"Buy the Book, Inc.","shelves":{"ADV":{"description":"Adventure","books":{"1002":{"title":"Indiana Smith","price":4.99,"authors":["Jim Orwell"]}}}}}`);

        expect(firstBook3.state.title).toEqual("Indiana Smith");
        expect(firstBook3.state.price).toEqual(4.99);
        expect(firstBook3.state.authors.first()).toEqual("Jim Orwell");
    });
});
