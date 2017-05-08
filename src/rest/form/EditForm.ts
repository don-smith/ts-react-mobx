import Rest from '../Rest';
import Form from './Form';
import RestDomain from '../RestDomain';
import Link from '../representation/Link';
import HttpResponse from '../http/HttpResponse';

export default class EditForm extends Form {
    constructor(links: Array<Link>, rest: Rest) {
        super(links, rest);
    }

    /**
     *  Submit the state of the object
     * @param {RestDomain} domainObject
     * @param {Promise} cancellable
     * @returns {Promise.<string>} of targetUrl
     */
    submitEdit(domainObject: RestDomain, cancellable): Promise<string|HttpResponse<string>> {
        return super.submit(domainObject.dataToPutOrPost(this.formItemIds()), {cancellable: cancellable});
    }

    static make(links: Array<Link>, rest: Rest): EditForm {
        return new EditForm(links, rest);
    }
}