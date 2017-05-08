import LinkedRepresentation from './LinkedRepresentation';
import FormItemRepresentation from './FormItemRepresentation';
import Link from './Link';

export default class FormRepresentation extends LinkedRepresentation {
    constructor(links: Array<Link> = [], public items: Array<FormItemRepresentation> = []) {
        super(links);
    }

    formItemIds(): Array<string> {
        return this.items.map(fir => fir.id);
    }
}