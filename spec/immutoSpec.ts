import * as I from "../index";
import { List, Map } from "immutable";

interface Book {
    readonly title: string;
    readonly price: number;
    readonly authors: List<string>;
}

const Book = I.reducer<Book>(
    {
        title: "",
        price: 0,
        authors: List<string>()
    })
    .action("SET_TITLE", (book: Book, title: string) => (
        {
            title,
            price: book.price,
            authors: book.authors
        }
    ))
    .action("SET_PRICE", (book: Book, price: number) => (
        {
            title: book.title,
            price,
            authors: book.authors
        }
    ))
    .action("ADD_AUTHOR", (book: Book, author: string) => (
        {
            title: book.title,
            price: book.price,
            authors: book.authors.push(author)
        }
    ));


interface Shelf {
    readonly description: string;
    readonly books: Map<number, Book>;
}

const Shelf = (() => {

    const books = I.collection({
        type: "BOOKS",
        reducer: Book,
        operations: I.map<number, Book>(),

        get(shelf: Shelf) { return shelf.books; },

        set(shelf: Shelf, books: Map<number, Book>) {
            return { description: shelf.description, books };
        }
    });

    const reduce = I.reducer<Shelf>(
        {
            description: "",
            books: Map<number, Book>()
        })
        .action("SET_DESCRIPTION", (shelf: Shelf, description: string) => (
            {
                description,
                books: shelf.books
            }
        ))
        .action(books.type, books.reduce);

    return I.assign(reduce, { books });
})();

interface Shop {
    readonly name: string;
    readonly shelves: Map<string, Shelf>;
}

const Shop = (() => {

    const shelves = I.collection({
        type: "SHELVES",
        reducer: Shelf,
        operations: I.map<string, Shelf>(),

        get(shop: Shop) { return shop.shelves; },

        set(shop: Shop, shelves: Map<string, Shelf>) {
            return { name: shop.name, shelves };
        }
    });

    const reduce = I.reducer<Shop>(
        {
            name: "",
            shelves: Map<string, Shelf>()
        })
        .action("SET_NAME", (shop: Shop, name: string) =>
            ({ name, shelves: shop.shelves })
        )
        .action(shelves.type, shelves.reduce);

    return I.assign(reduce, { shelves });
})();

const enableLogging = true;

function logStore<State, Types>(store: I.Store<State, Types>) {
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

        const book = I.snapshot(logStore(Book.createStore())).state;

        expect(book.title).toEqual("");
        expect(book.price).toEqual(0);
        expect(book.authors.count()).toEqual(0);

        expect(JSON.stringify(book)).toEqual(`{"title":"","price":0,"authors":[]}`);
    });

    it("can be updated via cursors", () => {

        const store = logStore(Shelf.createStore());

        const shelf1 = I.snapshot(store);
        const shelf2 = shelf1.dispatch(I.action("SET_DESCRIPTION", "Romance"));

        expect(JSON.stringify(shelf2.state)).toEqual(`{"description":"Romance","books":{}}`);

        const shelf3 = shelf2.dispatch(I.update("BOOKS", 1001, I.action("SET_TITLE", "1985")));

        expect(JSON.stringify(shelf3.state)).toEqual(`{"description":"Romance","books":{"1001":{"title":"1985","price":0,"authors":[]}}}`);

        const firstBook1 = Shelf.books(shelf3, 1001);

        expect(firstBook1.state.title).toEqual("1985");
        expect(firstBook1.state.price).toEqual(0);

        const firstBook2 = firstBook1.dispatch(I.action("SET_PRICE", 5.99));

        expect(JSON.stringify(store.getState())).toEqual(`{"description":"Romance","books":{"1001":{"title":"1985","price":5.99,"authors":[]}}}`);

        expect(firstBook2.state.price).toEqual(5.99);
    });

    it("supports removing items from collections", () => {

        const store = logStore(Shelf.createStore());

        const shelf1 = I.snapshot(store).dispatch(I.action("SET_DESCRIPTION", "Romance"));

        expect(JSON.stringify(shelf1.state)).toEqual(`{"description":"Romance","books":{}}`);

        const shelf2 = shelf1
            .dispatch(I.update("BOOKS", 1001, I.action("SET_TITLE", "1985")))
            .dispatch(I.update("BOOKS", 1002, I.action("SET_TITLE", "Indiana Smith")))
            .dispatch(I.update("BOOKS", 1003, I.action("SET_TITLE", "Gone With The Runs")));;

        expect(JSON.stringify(shelf2.state)).toEqual(`{"description":"Romance","books":{"1001":{"title":"1985","price":0,"authors":[]},"1002":{"title":"Indiana Smith","price":0,"authors":[]},"1003":{"title":"Gone With The Runs","price":0,"authors":[]}}}`);

        const shelf3 = shelf2.dispatch(I.remove("BOOKS", 1002));

        expect(JSON.stringify(shelf3.state)).toEqual(`{"description":"Romance","books":{"1001":{"title":"1985","price":0,"authors":[]},"1003":{"title":"Gone With The Runs","price":0,"authors":[]}}}`);
    });

    it("supports nested layers of cursors", () => {

        const store = logStore(Shop.createStore());
        const shop1 = I.snapshot(store);

        const shop2 = shop1.dispatch(I.action("SET_NAME", "Buy the Book, Inc."));
        const shop3 = shop2.dispatch(I.action("SHELVES", { key: "ADV" }));

        const advShelf1 = Shop.shelves(shop3, "ADV");
        expect(advShelf1.state.description).toEqual("");

        const advShelf2 = advShelf1.dispatch(I.action("SET_DESCRIPTION", "Adventure"));
        expect(advShelf2.state.description).toEqual("Adventure");

        const advShelf3 = advShelf2.dispatch(I.action("BOOKS", {
            key: 1002,
            update: I.action("SET_TITLE", "Indiana Smith")
        }));

        expect(JSON.stringify(store.getState())).toEqual(`{"name":"Buy the Book, Inc.","shelves":{"ADV":{"description":"Adventure","books":{"1002":{"title":"Indiana Smith","price":0,"authors":[]}}}}}`);

        const firstBook1 = Shelf.books(advShelf3, 1002);
        expect(firstBook1.state.title).toEqual("Indiana Smith");

        const firstBook2 = firstBook1.dispatch(I.action("SET_PRICE", 4.99));
        const firstBook3 = firstBook2.dispatch(I.action("ADD_AUTHOR", "Jim Orwell"));

        expect(JSON.stringify(store.getState())).toEqual(`{"name":"Buy the Book, Inc.","shelves":{"ADV":{"description":"Adventure","books":{"1002":{"title":"Indiana Smith","price":4.99,"authors":["Jim Orwell"]}}}}}`);

        expect(firstBook3.state.title).toEqual("Indiana Smith");
        expect(firstBook3.state.price).toEqual(4.99);
        expect(firstBook3.state.authors.first()).toEqual("Jim Orwell");
    });
});
