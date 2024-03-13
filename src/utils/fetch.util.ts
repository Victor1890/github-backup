import { IFetchOptions } from "@interfaces/common";
import axios from "axios";

export const fetch = <T extends Object>(options: IFetchOptions): Promise<T | null> => {
    const { headers, host, path } = options
    const api = `${host}${path}`

    return new Promise((resolve) => {
        axios.get(api, {
            headers
        }).then(res => resolve(res.data)).catch((e) => {
            console.error('Error fetching data from API:', e)
            resolve(null)
        })
    });
}