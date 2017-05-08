declare type UriString = string

interface Link {
    rel: string,
    href: UriString,
    type?: string,
    title?: string
}

export default Link