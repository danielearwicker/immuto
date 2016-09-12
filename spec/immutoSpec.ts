import { List, Map } from "immutable";

import { snapshot, amend, Store } from "../index";

import { Book } from "./book";
import { Shelf } from "./shelf";
import { Shop } from "./shop";
import { Founder } from "./founder";

const enableLogging = false;

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

    it("supports references and cursors through them", () => {

        const store = logStore(Founder.reduce.store());

        const founder1 = snapshot(store)(Founder.setName("Samuel J. Borders"));

        const shop1 = Founder.shop(founder1);

        shop1(Shop.setName("Borders"));

        expect(store.getState().name).toEqual("Samuel J. Borders");
        expect(store.getState().shop.name).toEqual("Borders");
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
