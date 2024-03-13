import { AxiosHeaders, RawAxiosRequestHeaders } from "axios";

export interface IFetchOptions {
    host: string;
    path: string;
    headers: Record<string, string | number> | RawAxiosRequestHeaders | AxiosHeaders;
}