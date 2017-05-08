import LinkedRepresentation from './LinkedRepresentation';
import FeedItemRepresentation from './FeedItemRepresentation';
import Link from './Link';

class FeedRepresentation extends LinkedRepresentation {
    constructor(links: Array<Link>, public items: Array<FeedItemRepresentation> = []) {
        super(links);
    }

    addItem(url: string, title: string): FeedRepresentation {
        this.items.push(new FeedItemRepresentation(url, title));
        return this;
    }

    static makeFrom(url: string, items: Array<FeedItemRepresentation> = []): FeedRepresentation {
        return new FeedRepresentation(LinkedRepresentation.makeLinksFrom(url), items);
    }
}

export default FeedRepresentation