import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { execSync } from 'child_process'
import config from '@config'
import { IFormatRepo, Repo } from '../interfaces/github'
import { fetch } from '../utils/fetch.util'

const {
    githubToken,
    passphrase,
    paths,
    organizations,
    organizationsPublicOnly,
    users
} = config

export class Github {

    private readonly USERS: string[];
    private readonly ORGANIZATIONS: string[];
    private readonly ORGANIZATIONS_PUBLIC_ONLY: string[];

    constructor() {
        this.USERS = users
        this.ORGANIZATIONS = organizations
        this.ORGANIZATIONS_PUBLIC_ONLY = organizationsPublicOnly
    }

    public getPrivacyLevel(isPrivate: boolean): string {
        return isPrivate ? 'private' : 'public'
    }

    public async decryptPrivateRepos() {
        console.log('Decrypting has started...')
        if (!existsSync(paths.privateReposEncryptFile)) {
            console.log('Nothing to decrypt. Aborting the decrypting process...')
            return
        }
        mkdirSync(paths.privateRepos)
        execSync(`gpgtar --decrypt  --gpg-args "--passphrase=${passphrase} --batch" --directory ${process.cwd()} ${paths.privateReposEncryptFile}`)
        execSync(`rm -rf ${paths.privateReposEncryptFile}`)
    }

    public encryptPrivateRepos(): void {
        if (!existsSync(paths.privateRepos)) {
            console.log('Nothing to encrypt. Aborting encryption...')
            return
        }
        execSync(`gpgtar --encrypt --symmetric --output ${paths.privateReposEncryptFile} --gpg-args="--passphrase=${passphrase} --batch" repos/private_repos`)
        execSync(`rm -rf ${paths.privateRepos}`)
    }

    public ensureRepoFolder(repo: IFormatRepo): void {
        const dir = `${paths[this.getPrivacyLevel(repo.isPrivate) + 'Repos']}/${repo.author}`
        console.log('target dir:', dir)
        if (!existsSync(dir)) {
            console.log(`Creating folder ${dir}`)
            mkdirSync(dir, { recursive: true })
        }
    }

    public storeReposLog(repos: IFormatRepo[]): void {
        console.log('Storing Repos logs in disk...')

        const filePath = `${paths.logs}/repos.json`

        if (!existsSync(paths.logs)) {
            mkdirSync(paths.logs, { recursive: true })
            writeFileSync(filePath, "[]")
        }

        writeFileSync(filePath, JSON.stringify(repos, null, 4))
    }

    public existsRepo(repo: IFormatRepo): boolean {
        return existsSync(`${paths[this.getPrivacyLevel(repo.isPrivate) + 'Repos']}/${repo.fullName}.git`)
    }

    public cloneRepo(repo: IFormatRepo): Buffer {
        console.log('Cloning the repo for the first time...')
        if (repo.isPrivate) {
            return execSync(`cd ${paths.privateRepos}/${repo.author} && git clone https://${githubToken}@github.com/${repo.fullName}`, { stdio: 'inherit' })
        }
        return execSync(`cd ${paths.publicRepos}/${repo.author} && git clone ${repo.url}`, { stdio: 'inherit' })
    }

    public updateRepo(repo: IFormatRepo): Buffer {
        console.log('Updating the repo...')
        return execSync(`cd ${paths[this.getPrivacyLevel(repo.isPrivate) + 'Repos']}/${repo.fullName}.git && git remote update --prune`, { stdio: 'inherit' })
    }

    private getRepoList(entityType: string, repoType = 'all') {
        return async (username: string) => {
            console.log(`Generating the repos list in scope for (${username}) (${entityType})`)
            let pendingPages = true
            let currentPage = 1
            let allData: IFormatRepo[] = []

            while (pendingPages) {
                const data = await fetch<Repo[]>({
                    host: 'https://api.github.com',
                    path: `/${entityType}/${username}/repos?per_page=100&page=${currentPage}&type=${repoType}`,
                    headers: {
                        Authorization: `token ${githubToken}`,
                        'User-Agent': 'testing'
                    }
                })
                if (!data || !data.length) {
                    pendingPages = false
                    break
                }

                const formatted = data.map(item => ({
                    fullName: item.full_name,
                    author: item.owner.login,
                    name: item.name,
                    isPrivate: item.private,
                    url: item.clone_url
                }))

                allData = [...allData, ...formatted]

                currentPage++
            }
            console.log(`Total Repos (${allData.length}) in scope for (${username})`)
            return allData
        }
    }

    public async getAllRepos(): Promise<IFormatRepo[]> {
        const userRepos = this.USERS.map(item => this.getRepoList('users')(item))
        const orgRepos = this.ORGANIZATIONS.map(item => this.getRepoList('orgs', 'all')(item))
        const orgPublicRepos = this.ORGANIZATIONS_PUBLIC_ONLY.map(item => this.getRepoList('orgs', 'public')(item))
        return await Promise.all([...userRepos, ...orgRepos, ...orgPublicRepos]).then(data => data.flat())
    }

}