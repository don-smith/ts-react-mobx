import {observable} from 'mobx';
import RestDomain from "../../rest/RestDomain"
import Link from "../../rest/representation/Link";
import Rest from "../../rest/Rest"
import CollectionRepresentation from "../../rest/representation/CollectionRepresentation";

export class Thing extends RestDomain {
    @observable name: string;
    @observable color: string;

    constructor(links: Array<Link>, rest: Rest) {
        super(links, rest);
    }

    static make(links: Array<Link>, rest: Rest): Thing {
        return new Thing(links, rest);
    }

    static makeUri(rest: Rest, id: string): string {
        return rest.makeUri("thing", id);
    }

    static makeNew(rest: Rest): Thing {
        const thing = Thing.make([], rest);
        thing.name = "";
        thing.color = "";
        return thing;
    }
}
