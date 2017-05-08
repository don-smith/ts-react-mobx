import Rest from './Rest';
import CollectionRepresentation from './representation/CollectionRepresentation';
import LinkedRepresentation from "./representation/LinkedRepresentation";
import RestDomain from "./RestDomain";

//todo this has not been tested!!
export default class PagingCollection<T extends RestDomain> {
    currentCollection: CollectionRepresentation<T>;
    next_: Object; // todo Relationship
    previous_: Object;
    /**
     * @param {Rest} rest
     * @param {CollectionRepresentation} collection
     * @param factory (Link[], Rest) => subtype of LinkedRepresentation
     */
    constructor(public rest: Rest, public collection: CollectionRepresentation<T>, factory) {
        this.currentCollection = collection;
        this.next_ = {name: 'next', toOne: true, optional: true, make: () => factory};
        this.previous_ = {name: 'previous', toOne: true, optional: true, make: () => factory};
    }

    nextPage() {
        return this.rest
            .hydrateRelationships(this.currentCollection, [this.next_], {alsoHydrateChildren: true})
            .then(() => {
                if (this.currentCollection.next) {
                    this.currentCollection = this.currentCollection.next;
                }
            });
    }

    previousPage() {
        return this.rest
            .hydrateRelationships(this.currentCollection, [this.previous_], {alsoHydrateChildren: true})
            .then(() => {
                if (this.currentCollection.previous) {
                    this.currentCollection = this.currentCollection.previous;
                }
            });
    }
}
