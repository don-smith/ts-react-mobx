import Rest from '../Rest';
import Form from './Form';
import FeedRepresentation from '../representation/FeedRepresentation';
import Link from '../representation/Link';
import HttpResponse from '../http/HttpResponse';

export default class SearchForm extends Form {
    constructor(links: Array<Link>, rest: Rest) {
        super(links, rest);
    }

    /*
     *  Search for the pattern: POST and immediately GET the feed back (for matches) as a FeedRepresentation
     *  {Promise} cancellable
     *  Returns a Promise<FeedRepresentation> with unhydrated items
     */
    submitSearch(pattern: string, cancellable): Promise<FeedRepresentation> {
        const resultingFeed = new FeedRepresentation([]);
        return super
            .submit({search: pattern}, {loadTarget: resultingFeed, cancellable: cancellable}) // todo Don't want to cache the feed
            .then(() => resultingFeed);
    }

    static make(links: Array<Link>, rest: Rest): SearchForm {
        return new SearchForm(links, rest);
    }
}