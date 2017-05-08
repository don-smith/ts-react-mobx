import RestDomain from './RestDomain';
import Link from './representation/Link';
import Rest from './Rest';

interface LinkedFactory {
    (links: Array<Link>, rest: Rest): RestDomain
}

export default LinkedFactory