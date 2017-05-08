import LinkedRepresentation from './representation/LinkedRepresentation';
import Link from './representation/Link';
import Rest from './Rest';
import EditForm from './form/EditForm';
import SearchForm from './form/SearchForm';
import FeedRepresentation from "./representation/FeedRepresentation";
import CollectionRepresentation from "./representation/CollectionRepresentation";
import Relationship from "./Relationship";
import LinkedFactory from "./LinkedFactory";

const hasOnHydrated = Symbol(); // So it is "invisible" for usual use and doesn't impact on === in tests.

// The superclass of all of our Domain objects, holding common methods
export default class RestDomain extends LinkedRepresentation {
    changed: boolean = false;
    editForm: any // Will only be defined in some case, including in use in save()

    constructor(links: Array<Link>, public rest: Rest) {
        super(links);
        this[hasOnHydrated] = false;
    }

    /**
     * Called from Rest object after it has been hydrated
     * @param {boolean} rehydrated
     */
    onHydrated(rehydrated) {
    }

    /**
     * Only called from Rest to handle onHydrated(). Override onHydrated() in subclasses.
     */
    doInformOnHydrated() {
        this.onHydrated(this[hasOnHydrated]);
        this[hasOnHydrated] = true;
    }

    /**
     * @param {object} options
     * @returns {Promise} of linked
     */
    hydrate(options = {reloadResource: false}) {
        return this.rest.hydrate(this, options);
    }

    hydrateUpThroughFeed(relationship: Relationship): Promise<LinkedRepresentation> {
        return this.rest.hydrateUpThroughFeed(this, relationship);
    }

    hydrateUp() {
        // Allow for override, so subclasses can hydrate an "up" when called from rest.hydrateUpThroughFeed()
    }

    /**
     * Hydrate the relationships of the domain object; optionally hydrate transitively in a depth-first manner
     * @param {string[]} attributes to be hydrated
     * @param {object} options {reloadFeed = false, reloadResource = false, alsoHydrateChildren = false, transitiveHydrate = false}
     * @returns {Promise}
     */
    hydrateRelationships(relationships, options = {}) {
        return this.rest.hydrateRelationships(this, relationships, options)
    }

    /**
     * Copy over the given attributes of this into a new object
     * @param {string[]} attributeNames
     * @returns {object}
     */
    dataToPutOrPost(attributeNames: Array<string>) {
        let data = {};
        let missingAttributes = [];
        attributeNames.forEach(name => {
            if (!this[name]) {
                missingAttributes.push(name);
            }
            data[name] = this[name];
        });
        if (missingAttributes.length > 0) {
            console.log(`RestDomain save: ${this.identity()} is missing ${JSON.stringify(missingAttributes)}.`);
        }
        return data;
    }

    identity(): string {
        return this.getUrl(true) || (this.constructor.name + ' object');
    }

    /**
     * Copy over the given attributes of this into a new object containing patch items
     * @param {string[]} attributeNames
     * @returns {Promise}
     */
    patch(attributeNames: Array<string>) {
        const patchData = attributeNames.map((name) => {
            return {op: "replace", path: "/" + name, value: this[name]};
        });
        return this.rest.http.patch(this.getUrl(), patchData);
    }

    /*
     * Hydrate the collection itself. Add all the given elements to that collection on the server.
     * Optionally reload the collection.
     */
    addElementsToCollectionOnServer(elements: Array<RestDomain>, relationship: Relationship,
                                    option: {createFormName?: string, reloadFeed?: boolean}={}) {
        return this.rest.addElementsToCollectionOnServer(this, elements, relationship, option);
    }

    /**
     * Note that the domain object has been changed (and so may need to be saved).
     */
    change() {
        this.changed = true;
    }

    /**
     * Save this object using the EditForm associated with it
     * @param {object} options -- {reloadResource: false}
     * @returns {Promise} of this, or exception if no /edit-form/ or if conflict detected (need to later track updates)
     */
    save({reloadResource = false} = {}) {
        if (this.changed) {
            this.changed = false;
            return this.rest
                .hydrateRelationships(this, [editForm_])
                .then(() => this.editForm.submitEdit(this))
                .then(() => {
                    if (reloadResource) {
                        this.hydrate({reloadResource: true});
                    }
                })
                .then(() => this);
        } else {
            return this.rest.resolve(this);
        }
    }

    /*
     * Search the collection with the given criteria and get back a feed.
     * returns Promise<FeedRepresentation> with unhydrated items
     */
    searchCollection(collection: CollectionRepresentation<RestDomain>, pattern: string,
                     cancellable = undefined): Promise<FeedRepresentation> {
        return this.search(collection, searchForm_, pattern, cancellable);
    }

    /*
     * Search the linked with the given attribute, relationship and pattern and get back a feed.
     * relationship: Relationship
     * returns Promise<FeedRepresentation> with unhydrated items
     */
    search(linked: LinkedRepresentation, relationship, pattern: string,
           cancellable = undefined): Promise<FeedRepresentation> {
        return this.rest
            .hydrateRelationships(linked, [relationship], {cancellable: cancellable})
            .then(() => linked[relationship.name].submitSearch(pattern, cancellable));
    }

    static clone(object) {
        return JSON.parse(JSON.stringify(object));
    }
}

const editForm_ = {name: 'editForm', toOne: true, relationship: 'edit-form', make: () => EditForm.make};
const searchForm_ = {name: 'search', toOne: true, make: () => SearchForm.make};
