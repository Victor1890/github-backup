interface FetchOptions {
    host: string;
    path: string;
    headers: HeadersInit | undefined
}

export const httpRequest = <T extends Object>(
    options: FetchOptions
) => new Promise<T>((resolve, reject) => {

    const { headers, host, path } = options
    const api = `${host}${path}`

    console.log('API:', api)

    fetch(api, {
        headers: headers
    }).then(res => res.json()).then(resolve).catch(reject)
})