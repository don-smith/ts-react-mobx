import LinkedRepresentation from './representation/LinkedRepresentation';
import Link from './representation/Link';
import Rest  from './Rest';
import LinkedFactory  from './LinkedFactory';

interface Relationship {
    name: string,
    relationship?: string,
    toOne?: boolean,
    toMany?: boolean,
    upToOne?: boolean,
    optional?: boolean,
    make: () => LinkedFactory
}

export default  Relationship
