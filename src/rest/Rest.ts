/*global console*/
import LinkedRepresentation from './representation/LinkedRepresentation';
import Link from './representation/Link';
import CollectionRepresentation from './representation/CollectionRepresentation';
import CreateForm from './form/CreateForm';
import RestDomain from './RestDomain';
import LinkedFactory from './LinkedFactory';
import Http from './http/Http';
import Relationship from "./Relationship";

/**
 * Manages the hydration of domain objects from the REST network of data.
 * Factory functions are used to create any new LinkedRepresentations, as subtypes,
 * so that the representations are rather like a lazy-loading ORM system.
 *
 * It caches all representations, given that they form a graph of objects.
 * We don't want any duplicates as that would lead to inconsistency.
 *
 * Will later have capability to:
 *  -- Poll for some resources that age, using expiry
 *  -- PUT/PATCH changed resources instead of POST
 *  -- Track etags for PUT update consistency
 */

declare type UriString = string

export default class Rest {
    // WeakMap has some problems, making it not useful here.
    // The key has to be an object, but two objects with the same contents are not equal.
    // So it looks like it's only useful with existing objects, such as in the DOM.
    // The following cache holds LinkedRepresentations, but Not FeedRepresentations.
    cache = new Map();
    // Cache the "up" of the FeedRepresentation so we don't need to keep Getting the feed for hydrating up links
    cacheFeedUrlToFeedParent = new Map();

    constructor(public http: Http, protected promises, protected apiUri: string) {
    }

    makeUri(type: string, id: string = ""): string {
        return this.apiUri + type + "/" + id
    }

    /**
     * Create using the factory and hydrate from the URL -- if it doesn't yet exist.
     * @param {string} url
     * @param factory (Links[]) => subtype of LinkedRepresentation
     * @returns {LinkedRepresentation} that was/is being hydrated
     */
    hydrateFromUrl(url: UriString, factory: LinkedFactory): Promise<LinkedRepresentation> {
        let linked = this.cache.get(url);
        if (!linked) {
            linked = factory(LinkedRepresentation.makeLinksFrom(url), this);
            this.cache.set(url, linked);
            return this
                .hydrate(linked)
                .then(hydrated => {
                    this.informOnHydrated(hydrated as RestDomain); // todo reconsider
                    return hydrated;
                });
        }
        return this.resolve(linked);
    }

    informOnHydrated(linked: RestDomain) {
        if (linked.doInformOnHydrated) {
            linked.doInformOnHydrated();
        }
    }

    /*
     * Hydrate the linked if not yet hydrated
     */
    hydrate(linked: LinkedRepresentation,
        {reloadResource = false, cancellable = undefined} = {}): Promise<LinkedRepresentation> {
        if (!reloadResource && linked.isHydrated()) {
            return this.resolve(linked);
        }
        return this.http
            .get(linked.getLink(/self|canonical/), cancellable)
            .then(response => {
                return linked.update(response.data);
            })
            .then(() => {
                this.informOnHydrated(linked as RestDomain);
                return linked;
            });
    }

    hydrateChild(linked: LinkedRepresentation, attributeName: string, relationshipType: string|RegExp,
                 factory: LinkedFactory, {optional = false, reloadResource = false, cancellable = undefined} = {}) {
        let child: RestDomain = linked[attributeName] as RestDomain;
        let childUrl = linked.getLink(relationshipType, optional);
        if (child) {
            if (!child.isHydrated) {
                console.log("hydrateChild: Child exists without a isHydrated", child);
            }
            if (!reloadResource && child.isHydrated()) {
                return this.resolve(child);
            }
            return this.http
                .get(childUrl, cancellable)
                .then(response => {
                    return child.update(response.data);
                });
        }
        if (childUrl) {
            if (!reloadResource) {
                let cached = this.cache.get(childUrl);
                if (cached) {
                    linked[attributeName] = cached;
                    return this.resolve(cached);
                }
            }
            return this.http
                .get(childUrl, cancellable)
                .then(response => {
                    if (linked[attributeName]) { // Another GET has arrived meanwhile, so it's already cached
                        return linked[attributeName].update(response.data);
                    }
                    // The following assumes that the type of the element can't change once created.
                    // If the type can change, then we need our class to be fixed and hold the union of types
                    // plus type discriminator.
                    child = factory((response.data as LinkedRepresentation).links, this);
                    child.update(response.data);
                    linked[attributeName] = child;
                    this.cache.set(childUrl, child);
                    child.setHydrated();
                    this.informOnHydrated(child);
                    return child;
                });
        }
        // If we get here, it must have been both optional and missing:
        return this.resolve(undefined);
    }

    hydrateUpThroughFeed(linked: LinkedRepresentation, relationship: Relationship): Promise<LinkedRepresentation> {
        const relationshipType = relationship.relationship || relationship.name;
        let up: RestDomain = linked[relationship.name] as RestDomain;
        if (up) {
            return this.hydrateChild(linked, relationship.name, relationshipType, undefined);
        }
        const upUrl = linked.getLink(relationshipType, false);
        const grandParent = this.cacheFeedUrlToFeedParent.get(upUrl);
        if (grandParent) {
            linked[relationship.name] = grandParent;
            return this.resolve(grandParent);
        }
        return this.http
            .get(upUrl)
            .then(feed => {
                const upAgainUrl = LinkedRepresentation.findLink((feed.data as any).links, "up", true);
                console.log('upAgainUrl:', upAgainUrl)
                if (!upAgainUrl || !(feed as any).items) {
                    throw new Error("Doesn't make sense to use a upToOne relationship " + relationshipType +
                        " for " + linked.getUrl() + " when the link doesn't involve a feed");
                }
                return this
                    .hydrateFromUrl(upAgainUrl, relationship.make())
                    .then(grandParent => {
                        this.cacheFeedUrlToFeedParent.set(upUrl, grandParent);
                        linked[relationship.name] = grandParent;
                        return grandParent;
                    })
            })
    }

    hydrateCollection(linked: LinkedRepresentation, attributeName: string, relationshipType: string|RegExp,
                      factory: LinkedFactory,
                      options = {
                          optional: false,
                          alsoHydrateChildren: false,
                          reloadFeed: false,
                          cancellable: undefined
                      }): Promise<Array<LinkedRepresentation>> {
        const optional = options && options.optional;
        const alsoHydrateChildren = options && options.alsoHydrateChildren;
        const reloadFeed = options && options.reloadFeed;
        const cancellable = options && options.cancellable;
        let collection = linked[attributeName];
        const collectionUrl = linked.getLink(relationshipType, optional);
        this.cacheFeedUrlToFeedParent.set(collectionUrl, linked);
        if (collection && !reloadFeed) {
            // Nothing more to do, as we assume that everything has been hydrated.
            // Untrue if we later hydrate partially!
            return this.resolve(collection.items);
        }
        if (!collection) {
            collection = CollectionRepresentation.makeFrom(collectionUrl);
            collection.setHydrated();
            linked[attributeName] = collection;
        }
        if (!collectionUrl) { // todo check is optional
            collection.setHydrated();
            return this.resolve(collection.items); // Empty collection
        }
        return this.http
            .get(collectionUrl, cancellable)
            .then(feedResponse => {
                const factoryUsingCache = links => {
                    const cached = this.cache.get(links[0].href);
                    if (cached) {
                        return cached;
                    }
                    const child = factory(links, this);
                    this.cache.set(child.getUrl(), child);
                    return child;
                };
                const data = feedResponse.data as any;
                if (data.items.length > 0 && data.items[0].links) {
                    return collection.hydrateEmbeddedItems(data.items, factoryUsingCache);
                }
                // Need to replace the items when reloading
                return collection.replaceAllItemsFromFeed(data, factoryUsingCache);
            })
            .then(()=> {
                if (alsoHydrateChildren) {
                    return this.promises.all(collection.items.map((item)=> this.hydrate(item, options)));
                }
                return collection.items;
            })
            .then(()=> {
                return collection.items;
            });
    }

    /**
     * Hydrate the relationships of the domain object; optionally hydrate transitively in a depth-first manner
     * @param {LinkedRepresentation} linked
     * @param {relationship[]} relationship to be hydrated
     * @param {boolean} reloadFeed -- in case of toMany
     * @param {boolean} reloadResource -- in case of toOne
     * @param {boolean} alsoHydrateChildren
     * @param {boolean} transitiveHydrate
     * @returns {Promise}
     */
    hydrateRelationships(linked: LinkedRepresentation, relationships,
        {reloadFeed = false, reloadResource = false, alsoHydrateChildren = false,
            transitiveHydrate = false, cancellable = undefined} = {}): Promise<LinkedRepresentation> {
        return this
            .hydrate(linked)
            .then(() => this.waitForEach(relationships, relation => {
                    if (relation && relation.name && relation.make && (relation.toMany || relation.toOne)) {
                        const relationshipType = relation.relationship || relation.name;
                        if (relation.toMany) {
                            return this
                                .hydrateCollection(linked, relation.name, relationshipType, relation.make(),
                                    {
                                        optional: relation.optional,
                                        reloadFeed: reloadFeed,
                                        alsoHydrateChildren: alsoHydrateChildren,
                                        cancellable: cancellable
                                    })
                                .then(result => {
                                    if (transitiveHydrate) {
                                        return this.hydrateTransitivelyElementsOf(linked[relation.name]);
                                    } else {
                                        return this.resolve(result);
                                    }
                                });
                        } else if (relation.toOne) {
                            return this
                                .hydrateChild(linked, relation.name, relationshipType, relation.make(),
                                    {optional: relation.optional, reloadResource: reloadResource})
                                .then(result => {
                                    if (transitiveHydrate && linked[relation.name] && linked[relation.name].hydrateTransitively) {
                                        return linked[relation.name].hydrateTransitively();
                                    } else {
                                        return this.resolve(result);
                                    }
                                });
                        }
                    } else if (relation.upToOne) {
                        return this
                            .hydrateUpThroughFeed(linked, relation)
                            .then(() => linked[relation.name].hydrateUp())
                            .then(() => linked[relation.name].hydrate());
                    }
                    throw new Error("Invalid relationship: " + relation + " for " + linked.getUrl());
                }
            ))
            .then(() => linked);
    }

    /*
     * hydrateTransitively each of the items that have not already been done.
     * Need to slice the ObservableArray so that waitForEach() can handle it.
     */
    hydrateTransitivelyElementsOf<T extends RestDomain>(collection: CollectionRepresentation<T>): CollectionRepresentation<T> {
        return this
            .waitForEach(collection.items.slice(), linked => {
                if (linked.hydrateTransitively && !linked.hasHydratedTransitively()) {
                    linked.setHasHydratedTransitively();
                    return linked.hydrateTransitively();
                } else {
                    return this.resolve(linked);
                }
            })
            .then(() => collection);
    }

    /*
     * Hydrate the collection itself. Add all the given elements to that collection on the server.
     * Optionally reload the collection.
     */
    addElementsToCollectionOnServer(linked: LinkedRepresentation, elements: Array<RestDomain>,
                                    relationship, option: {createFormName?: string, reloadFeed?: boolean} = {}) {
        const createFormName = option.createFormName || 'create-form';
        const reloadFeed = option.reloadFeed || true;
        if (!relationship.toMany) {
            throw new Error("Can't addElementsToCollectionOnServer to a relationship that is not toMany");
        }
        const createForm_ = {
            name: createFormName,// The form is held under this name. Any reason why it shouldn't be (ie, reload needed)?
            toOne: true,
            relationship: createFormName,
            make: () => CreateForm.make
        };
        if (elements.length > 0) {
            return this
                .hydrateRelationships(linked, [relationship], {reloadFeed: false}) // Option so can disambiguate in tests
                .then(() => this.hydrateRelationships(linked[relationship.name], [createForm_]))
                .then(() => this.waitForEach(elements, e => linked[relationship.name][createFormName].submit(e)))
                .then(() => {
                    if (reloadFeed) {
                        return this
                            .hydrateRelationships(linked, [relationship], {
                                reloadFeed: true,
                                alsoHydrateChildren: true
                            });
                    }
                    return this.resolve(undefined);
                });
        } else {
            return this.resolve(undefined);
        }
    }

    /**
     * @param {LinkedRepresentation[]} elements
     * @param {function} f: LinkedRepresentation -> Promise
     * @returns {Promise} of all the results, once they've completed
     */
    waitForEach(elements: Array<any>, f) {
        return this.promises.all(elements.map(f));
    }

    resolve(result) {
        return this.promises.resolve(result);
    }

    /** Create a defer.
     *    const cancellable = rest.createCancellable();
     *  To get the resulting promise to pass as the cancellable:
     *    cancellable.promise
     *  And to cause the cancellation of any outstanding HTTP (no effect if it has completed):
     *    cancellable.resolve();
     *  See https://docs.angularjs.org/api/ng/service/$q
     * @returns {Deferred}
     */
    createCancellable() {
        return this.promises.defer(true);
    }
}
