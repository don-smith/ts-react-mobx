/*global describe,it, beforeEach, expect*/
import LinkedRepresentation from '../representation/LinkedRepresentation';
import FormItemRepresentation from '../representation/FormItemRepresentation';
import FeedRepresentation from '../representation/FeedRepresentation';
import RestDomain from '../RestDomain';
import SearchForm from './SearchForm';
import PseudoPromise from '../promise/PseudoPromise';
import * as sinon from 'sinon';

function makeSearchFormWithFormItems(url, rest, formItems) {
    const editForm = new SearchForm(LinkedRepresentation.makeLinksFrom(url), rest);
    editForm.items = formItems.map((id) => new FormItemRepresentation(id, '', id, 'type'));
    return editForm;
}

describe('SearchForm', () => {
    const url = 'url22';
    const newUrl = 'newUrl';
    const pattern = "Rob";
    let rest;
    let cancellable;
    let searchForm;
    let response;
    let feed;

    beforeEach(() => {
        rest = {
            http: {postForm: sinon.mock()},
            hydrate: sinon.mock()
        };
        cancellable = new PseudoPromise();

        searchForm = makeSearchFormWithFormItems(url, rest, ['a', 'b']);
        response = {
            headers: {get: sinon.stub()}
        };
        feed = FeedRepresentation.makeFrom(newUrl);
    });

    it('submitSearch() with target back', () => {
        // Given
        rest.http.postForm
            .withArgs(url, 'search=' + pattern, cancellable)
            .returns(new PseudoPromise(response));
        response.headers.get
            .withArgs('Location')
            .returns(newUrl);
        rest.hydrate
            .onCall(0) // We don't have access to the argument at this point
            .returns(new PseudoPromise(feed));

        // When/Then
        searchForm
            .submitSearch(pattern, cancellable)
            .thenExpect(feed);
    });

    it('submitSearch() without target back', () => {
        // Given
        rest.http.postForm
            .withArgs(url, 'search=' + pattern, cancellable)
            .returns(new PseudoPromise(response));
        response.headers.get
            .withArgs('Location')
            .returns(undefined);

        // When/Then
        searchForm
            .submitSearch(pattern, cancellable)
            .thenExpect(new FeedRepresentation([]));
    });
});
