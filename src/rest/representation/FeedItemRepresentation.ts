import LinkedRepresentation from './LinkedRepresentation';

export default class FeedItemRepresentation {
    constructor(public id: string, public title: string = undefined) {
    }

    /**
     *
     * @param {String} title - the name of the property
     * @param {LinkedRepresentation} defaultValues
     * @returns {LinkedRepresentation}
     */
    toLinkedRepresentation(title: string = 'title', defaultValues = {}): LinkedRepresentation {
        const linked = LinkedRepresentation.makeFrom(this.id, defaultValues);
        linked[title] = this.title;
        return linked;
    }
}