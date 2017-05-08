import {observable} from 'mobx';
import LinkedRepresentation from './LinkedRepresentation';
import FeedItemRepresentation from './FeedItemRepresentation';
import Link from './Link';
import LinkedFactory from "../LinkedFactory";
import Rest from "../Rest";
import RestDomain from "../RestDomain";

/*
 * A representation of a collection of resources). The links
 * may contain links to 'next', 'previous', 'first' and 'last'.
 */
class CollectionRepresentation<T extends RestDomain> extends LinkedRepresentation {
    @observable items: Array<T>;
    next: CollectionRepresentation<T>; // Used by PagingCollection
    previous: CollectionRepresentation<T>; // Used by PagingCollection

    constructor(links: Array<Link>, items: Array<T> = []) {
        super(links);
        this.items = items;
    }

    addItem(item: T): CollectionRepresentation<T> {
        this.items.push(item);
        return this;
    }

    findItem(itemUri: string): T {
        return this.items.find((item) => item.getUrl() === itemUri) as T;
    }

    /**
     * Number of items
     */
    size(): number {
        return this.items.length;
    }

    clearItems() {
        this.items.splice(0, this.items.length);
    }

    // Map the feed item to LinkedRepresentation, creating it or updating it if it exists
    addItemFromFeed(feedItem: FeedItemRepresentation,
                    factory: (links: Array<Link>) => RestDomain): T {
        const newItem = factory(LinkedRepresentation.makeLinksFrom(feedItem.id)) as T;
        newItem.setFeedTitle(feedItem.title);
        this.addItem(newItem);
        return newItem;
    }

    /*
     * All items provided in the feed are taken as is.
     * fromFeed - FeedRepresentation-like
     */
    replaceAllItemsFromFeed(fromFeed: {links: Array<Link>, items: Array<FeedItemRepresentation>},
                            factory: (links: Array<Link>) => RestDomain): CollectionRepresentation<T> {
        // Copy the links
        this.clearItems();
        this.links = fromFeed.links || this.links;

        fromFeed.items.forEach(item => {
            this.addItemFromFeed(item, factory);
        });
        return this;
    }

    hydrateEmbeddedItems(items: Array<LinkedRepresentation>,
                         factory: (links: Array<Link>) => T): CollectionRepresentation<T> {
        items.forEach(linked => {
            const child = factory(linked.links);
            child.update(linked);
            this.addItem(child);
        });
        return this;
    }

    static makeFrom<T extends RestDomain>(url: string, items: Array<T> = []): CollectionRepresentation<T> {
        return new CollectionRepresentation(LinkedRepresentation.makeLinksFrom(url), items);
    }
}

export default CollectionRepresentation