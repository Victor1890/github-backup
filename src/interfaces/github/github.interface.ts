export interface Repo {
    private: boolean
    full_name: string
    clone_url: string
    owner: {
        login: string
    }
    name: string
}

export interface IFormatRepo {
    fullName: string
    author: string
    name: string
    isPrivate: boolean
    url: string
}