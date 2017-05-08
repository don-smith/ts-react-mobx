/*global describe,it, beforeEach, expect*/
import LinkedRepresentation from '../representation/LinkedRepresentation';
import FormItemRepresentation from '../representation/FormItemRepresentation';
import RestDomain from '../RestDomain';
import CreateForm from './CreateForm';
import PseudoPromise from '../promise/PseudoPromise';
import * as sinon from 'sinon';

function makeCreateFormWithFormItems(url, rest, formItems) {
    const createForm = new CreateForm(LinkedRepresentation.makeLinksFrom(url), rest);
    createForm.items = formItems.map((id) => new FormItemRepresentation(id, '', id, 'type'));
    return createForm;
}

describe('CreateForm', () => {
    const url = 'url22';
    const newUrl = 'newUrl';
    let rest;
    let cancellable;
    let createForm;
    let domainObject;
    let response;

    beforeEach(() => {
        rest = {
            setPostContentTypeFormUrlEncoded: sinon.stub(),
            http: {postForm: sinon.mock()},
            hydrate: sinon.mock()
        };
        cancellable = new PseudoPromise();

        createForm = makeCreateFormWithFormItems(url, rest, ['a', 'b']);
        domainObject = new RestDomain(LinkedRepresentation.makeLinksFrom(url), rest);
        domainObject.a = 11;
        domainObject.b = 202;

        response = {
            headers: {get: sinon.stub()}
        };
    });

    it('submitCreate() with target back', () => {
        rest.http.postForm
            .withArgs(url, 'a=11&b=202', cancellable)
            .returns(new PseudoPromise(response));
        response.headers.get
            .withArgs('Location')
            .returns(newUrl);
        rest.hydrate
            .withArgs(domainObject, {reloadResource: true, cancellable: cancellable})
            .returns(new PseudoPromise(domainObject));

        // When/Then
        createForm
            .submitCreate(domainObject, cancellable)
            .thenExpect(newUrl);
    });

    it('submitCreate() without target back', () => {
        rest.http.postForm
            .withArgs(url, 'a=11&b=202', cancellable)
            .returns(new PseudoPromise(response));
        response.headers.get
            .withArgs('Location')
            .returns(undefined);
        rest.hydrate
            .withArgs(domainObject, {reloadResource: true, cancellable: cancellable})
            .returns(new PseudoPromise(domainObject));

        // When/Then
        createForm
            .submitCreate(domainObject, cancellable)
            .thenExpect('no.targetUrl');
    });
});
