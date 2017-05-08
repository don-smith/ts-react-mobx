import Rest from '../Rest';
import Form from './Form';
import RestDomain from '../RestDomain';
import Link from '../representation/Link';
import HttpResponse from '../http/HttpResponse';

export default class CreateForm extends Form {
    constructor(links: Array<Link>, rest: Rest) {
        super(links, rest);
    }

    /**
     *  Submit the state of the object: POST and immediately GET the domainObject (for extra links, etc)
     * @param {RestDomain} domainObject that will be added and hydrated with the latest from server
     * @param {Promise} cancellable
     * @returns {Promise.<string>} of targetUrl
     */
    submitCreate(domainObject: RestDomain, cancellable): Promise<string|HttpResponse<string>> {
        return super.submit(domainObject.dataToPutOrPost(this.formItemIds()),
            {loadTarget: domainObject, cancellable: cancellable});
    }

    static make(links: Array<Link>, rest: Rest): CreateForm {
        return new CreateForm(links, rest);
    }
}