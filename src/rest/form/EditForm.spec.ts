/*global describe,it, beforeEach, expect*/
//<editor-fold desc="imports">
import LinkedRepresentation from '../representation/LinkedRepresentation';
import FormItemRepresentation from '../representation/FormItemRepresentation';
import RestDomain from '../RestDomain';
import EditForm from './EditForm';
import PseudoPromise from '../promise/PseudoPromise';
import * as sinon from 'sinon';
//</editor-fold>

function makeEditFormWithFormItems(url, rest, formItems) {
    const editForm = new EditForm(LinkedRepresentation.makeLinksFrom(url), rest);
    editForm.items = formItems.map((id) => new FormItemRepresentation(id, '', id, 'type'));
    return editForm;
}

describe('EditForm', () => {
    const url = 'url22';
    const newUrl = 'newUrl';
    let rest;
    let cancellable;
    let editForm;
    let domainObject;
    let response;

    beforeEach(() => {
        rest = {
            http: {postForm: sinon.mock()},
            hydrate: sinon.stub()
        };
        cancellable = new PseudoPromise();

        editForm = makeEditFormWithFormItems(url, rest, ['a', 'b']);
        domainObject = new RestDomain(LinkedRepresentation.makeLinksFrom(url), rest);
        domainObject.a = 33;
        domainObject.b = 404;

        response = {
            headers: {get: sinon.stub()}
        };
    });

    it('submitEdit() with target back', () => {
        rest.http.postForm
            .withArgs(url, 'a=33&b=404', cancellable)
            .returns(new PseudoPromise(response));
        response.headers.get
            .withArgs('Location')
            .returns(newUrl);

        // When/Then
        editForm
            .submitEdit(domainObject, cancellable)
            .thenExpect(newUrl);
    });

    it('submitEdit() without target back', () => {
        rest.http.postForm
            .withArgs(url, 'a=33&b=404', cancellable)
            .returns(new PseudoPromise(response));
        response.headers.get
            .withArgs('Location')
            .returns(undefined);

        // When/Then
        editForm
            .submitEdit(domainObject, cancellable)
            .thenExpect('no.targetUrl');
    });
});
