"use strict";
var index_1 = require("../index");
var immutable_1 = require("immutable");
var Book = (function () {
    function Book(title, price, authors) {
        this.title = title;
        this.price = price;
        this.authors = authors;
    }
    Book.reduce = index_1.reducer(new Book("", 0, immutable_1.List()))
        .action("SET_TITLE", function (book, title) {
        return new Book(title, book.price, book.authors);
    })
        .action("SET_PRICE", function (book, price) {
        return new Book(book.title, price, book.authors);
    })
        .action("ADD_AUTHOR", function (book, author) {
        return new Book(book.title, book.price, book.authors.push(author));
    });
    return Book;
}());
exports.Book = Book;
var Shelf = (function () {
    function Shelf(description, books) {
        this.description = description;
        this.books = books;
    }
    Shelf.reduce = index_1.reducer(new Shelf("", immutable_1.List()))
        .action("SET_DESCRIPTION", function (shelf, descr) {
        return new Shelf(descr, shelf.books);
    })
        .action("ADD_BOOK", function (shelf, title) {
        return new Shelf(shelf.description, shelf.books.push(new Book(title, 0, immutable_1.List())));
    })
        .action("UPDATE_BOOK", function (shelf, args) {
        return new Shelf(shelf.description, shelf.books.update(args[0], function (b) { return Book.reduce(b, args[1]); }));
    });
    Shelf.bookAt = index_1.defineCursor(function (shelf, pos) { return shelf.books.get(pos); }, function (pos, bookAction) {
        return ({ type: "UPDATE_BOOK", payload: [pos, bookAction] });
    });
    return Shelf;
}());
var Shop = (function () {
    function Shop(name, shelves) {
        this.name = name;
        this.shelves = shelves;
    }
    Shop.reduce = index_1.reducer(new Shop("", immutable_1.List()))
        .action("SET_NAME", function (shop, name) {
        return new Shop(name, shop.shelves);
    })
        .action("ADD_SHELF", function (shop, name) {
        return new Shop(shop.name, shop.shelves.push(new Shelf(name, immutable_1.List())));
    })
        .action("UPDATE_SHELF", function (shop, args) {
        return new Shop(shop.name, shop.shelves.update(args[0], function (s) { return Shelf.reduce(s, args[1]); }));
    });
    Shop.shelfAt = index_1.defineCursor(function (shop, pos) { return shop.shelves.get(pos); }, function (pos, shelfAction) {
        return ({ type: "UPDATE_SHELF", payload: [pos, shelfAction] });
    });
    return Shop;
}());
var enableLogging = false;
function logStore(store) {
    if (enableLogging) {
        store.subscribe(function () {
            console.log("");
            console.log(JSON.stringify(store.getState()));
            console.log("");
        });
    }
    return store;
}
describe("immuto", function () {
    it("has an initial state available via cursor", function () {
        var book = index_1.createStoreCursor(logStore(Book.reduce.createStore()))();
        expect(book.title).toEqual("");
        expect(book.price).toEqual(0);
        expect(book.authors.count()).toEqual(0);
        expect(JSON.stringify(book)).toEqual("{\"title\":\"\",\"price\":0,\"authors\":[]}");
    });
    it("can be updated via late-bound cursors", function () {
        var shelf = index_1.createStoreCursor(logStore(Shelf.reduce.createStore()));
        shelf(Shelf.setDescription("Romance"));
        expect(JSON.stringify(shelf())).toEqual("{\"description\":\"Romance\",\"books\":[]}");
        var firstBook = Shelf.bookAt(shelf, 0);
        shelf(Shelf.addBook("1985"));
        expect(JSON.stringify(shelf())).toEqual("{\"description\":\"Romance\",\"books\":[{\"title\":\"1985\",\"price\":0,\"authors\":[]}]}");
        expect(firstBook().title).toEqual("1985");
        expect(firstBook().price).toEqual(0);
        firstBook(Book.setPrice(5.99));
        expect(JSON.stringify(shelf())).toEqual("{\"description\":\"Romance\",\"books\":[{\"title\":\"1985\",\"price\":5.99,\"authors\":[]}]}");
        expect(firstBook().price).toEqual(5.99);
    });
    it("can be updated via snapshot cursors", function () {
        var shelf = index_1.createStoreCursor(logStore(Shelf.reduce.createStore()));
        shelf(Shelf.setDescription("Romance"));
        shelf(Shelf.addBook("1985"));
        expect(JSON.stringify(shelf())).toEqual("{\"description\":\"Romance\",\"books\":[{\"title\":\"1985\",\"price\":0,\"authors\":[]}]}");
        var firstBook = Shelf.bookAt(shelf, 0, true);
        expect(firstBook().title).toEqual("1985");
        expect(firstBook().price).toEqual(0);
        firstBook(Book.setPrice(5.99));
        expect(JSON.stringify(shelf())).toEqual("{\"description\":\"Romance\",\"books\":[{\"title\":\"1985\",\"price\":5.99,\"authors\":[]}]}");
        expect(firstBook().price).toEqual(0);
        var firstBookAgain = Shelf.bookAt(shelf, 0, true);
        expect(firstBookAgain().price).toEqual(5.99);
    });
    it("supports nested layers of cursors", function () {
        var shop = index_1.createStoreCursor(logStore(Shop.reduce.createStore()));
        shop(Shop.setName("Buy the Book, Inc."));
        shop(Shop.addShelf("Adventure"));
        var firstShelf = Shop.shelfAt(shop, 0);
        expect(firstShelf().description).toEqual("Adventure");
        firstShelf(Shelf.addBook("Indiana Smith"));
        expect(JSON.stringify(shop())).toEqual("{\"name\":\"Buy the Book, Inc.\",\"shelves\":[{\"description\":\"Adventure\",\"books\":[{\"title\":\"Indiana Smith\",\"price\":0,\"authors\":[]}]}]}");
        var firstBookOfFirstShelf = Shelf.bookAt(firstShelf, 0);
        expect(firstBookOfFirstShelf().title).toEqual("Indiana Smith");
        firstBookOfFirstShelf(Book.setPrice(4.99));
        firstBookOfFirstShelf(Book.addAuthor("Jim Orwell"));
        expect(JSON.stringify(shop())).toEqual("{\"name\":\"Buy the Book, Inc.\",\"shelves\":[{\"description\":\"Adventure\",\"books\":[{\"title\":\"Indiana Smith\",\"price\":4.99,\"authors\":[\"Jim Orwell\"]}]}]}");
        expect(firstBookOfFirstShelf().title).toEqual("Indiana Smith");
        expect(firstBookOfFirstShelf().price).toEqual(4.99);
        expect(firstBookOfFirstShelf().authors.first()).toEqual("Jim Orwell");
    });
});
