import FormRepresentation from '../representation/FormRepresentation';
import LinkedRepresentation from '../representation/LinkedRepresentation';
import Link from '../representation/Link';
import Rest from '../Rest';
import HttpResponse from '../http/HttpResponse';

declare type UriString = string

export default class Form extends FormRepresentation {
    constructor(links: Array<Link>, public rest: Rest) {
        super(links);
    }

    asPostStringUriEncoded(data: Object): string {
        const encode = (s) => s ? encodeURIComponent(s.toString()).replace(/%20/g, '+') : '';
        return Object.keys(data).map(key => `${key}=${encode(data[key])}`).join('&');
    }

    /*
     * Where loadTarget is domainObjectNeedingToBeHydratedFromTargetUrl
     * todo consider whether the hydrate in here should actually force a reload
     */
    submit(data: Object,
           options: {loadTarget?: LinkedRepresentation, cancellable?: any} = undefined): Promise<UriString> {
        const loadTarget = options && options.loadTarget || undefined;
        const cancellable = options && options.cancellable || undefined;
        var url = this.getUrl();
        return this.rest.http
            .postForm(url, this.asPostStringUriEncoded(data), cancellable)
            .then((response: HttpResponse<string>) => {
                let targetUrl: string = response.headers ? response.headers.get('Location') : undefined;
                if (targetUrl) {
                    if (loadTarget) {
                        loadTarget.links = LinkedRepresentation.makeLinksFrom(targetUrl);
                        return this.rest
                            .hydrate(loadTarget, {reloadResource: true, cancellable: cancellable}) // Rehydrates it with the latest from server, including full links
                            .then(() => targetUrl);
                    } else {
                        return targetUrl;
                    }
                } else {
                    // console.log("Form.submit() no targetUrl");
                    return "no.targetUrl";
                }
            });
    }
}
