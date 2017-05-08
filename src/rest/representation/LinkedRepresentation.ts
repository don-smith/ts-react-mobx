import Link from './Link';

const internalState = Symbol(); // So it is "invisible" for usual use and doesn't impact on === in tests.
const feedTitle = Symbol(); // So it is "invisible" for usual use and doesn't impact on === in tests.
const doneHydratedTransitively = Symbol(); // Used by Rest.hydrateTransitivelyElementsOf() to avoid cycles with transitive hydration

const prototypeState = "PROTO";
const hydratedState = "HYDRATED";
declare type UriString = string

export default class LinkedRepresentation {
    constructor(public links: Array<Link> = []) {
        this[internalState] = prototypeState;
    }

    isHydrated(): boolean {
        return this[internalState] === hydratedState;
    }

    setHydrated(): LinkedRepresentation {
        this[internalState] = hydratedState;
        return this;
    }

    hasHydratedTransitively(): boolean {
        return this[doneHydratedTransitively];
    }

    setHasHydratedTransitively(): LinkedRepresentation {
        this[doneHydratedTransitively] = true;
        return this;
    }

    getUrl(optional: boolean = false): UriString {
        return this.getLink(/self|canonical/, optional);
    }

    getRouterPath() {
        return LinkedRepresentation.getRouterPathFrom(this.getUrl());
    }

    static getRouterPathFrom(url: UriString) {
        const colon = url.lastIndexOf(':');
        if (colon > 0) {
            const slash = url.indexOf('/', colon);
            if (colon > 0) {
                return url.substring(slash);
            }
        }
        return url;
    }

    getLink(relationshipType: string|RegExp, optional: boolean = false): UriString {
        return LinkedRepresentation.findLink(this.links, relationshipType, optional);
    }

    static findLink(links: Array<Link>, relationshipType: string|RegExp, optional: boolean = false): UriString {
        const link: Link = links.find(link => {
            if (!link || link === null) {
                throw new Error("LinkedRepresentation: Problem with links" + JSON.stringify(links));
            }
            return link.rel.match(relationshipType as RegExp) != null; //
        });
        if (link) {
            return link.href;
        } else if (!optional) {
            throw new Error("LinkedRepresentation: Unable to find '" + relationshipType + "' in links: " +
                JSON.stringify(links));
        }
        return undefined;
    }

    addLink(name: string, url: string): LinkedRepresentation {
        this.links.push({rel: name, href: url});
        return this;
    }

    /*
     * A trivial implementation of updating a local LinkedRepresentation with a new version.
     *
     * Known residuals:
     *   - don't update local artifacts (i.e. copies of child resources)
     *   - do delete those attributes that are gone
     *   - handle arrays by doing differential updates
     *   - need to check that any direct relationship links haven't changed todo
     */
    update(linkedUpdate): LinkedRepresentation {
        this.updateThis(linkedUpdate);
        this.setHydrated();
        return this;
    }

    updateThis(linkedUpdate: Object): LinkedRepresentation {
        for (let key in linkedUpdate) {
            this[key] = linkedUpdate[key];
        }
        return this;
    }

    getFeedTitle(): string {
        return this[feedTitle];
    }

    setFeedTitle(title: string) {
        this[feedTitle] = title;
    }

    // Make a new LinkedRepresentation with the given uri
    static makeFrom(resourceUri: string, defaultValues = {}): LinkedRepresentation {
        const linked = new LinkedRepresentation(LinkedRepresentation.makeLinksFrom(resourceUri));
        return linked.updateThis(defaultValues);
    }

    static makeLinksFrom(resourceUri: string): Array<Link> {
        return [{rel: 'self', href: resourceUri}];
    }
}