import { List, Map } from "immutable";

import * as I from "../index";
import { action, reducer, collection, amend, immutableMapOperations } from "../index";

import { Shelf } from "./shelf";

export interface Shop {
    readonly name: string;
    readonly shelves: Map<string, Shelf>;
}

export namespace Shop {

    export const setName = action("SET_NAME",
        (shop: Shop, name: string) => amend(shop, { name }));

    export const shelves = collection({
        type: "SHELVES",
        reducer: Shelf.reduce,
        operations: immutableMapOperations<string, Shelf>(),
        get: (shop: Shop) => shop.shelves
    });

    export const empty: Shop = {
        name: "",
        shelves: Map<string, Shelf>()
    };

    export const reduce = reducer(empty)
        .action(setName)
        .action(shelves);
}
