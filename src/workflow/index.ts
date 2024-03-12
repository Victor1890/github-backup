import path from '../utils/path.util'
import config from '../config'
import { IFormatRepo } from '../interfaces/github'

const {
    encryptPrivateRepos,
    decryptPrivateRepos,
    getUserRepoList,
    getOrgAllRepoList,
    getOrgPublicRepoList,
    existsRepo,
    updateRepo,
    cloneRepo,
    getPrivacyLevel,
    ensureRepoFolder,
    storeReposLog
} = path
const { organizations, organizationsPublicOnly, users } = config

export class Workflow {

    private allData: IFormatRepo[] = []

    constructor() {
        console.log('Workflow constructor');
    }

    public async repoSync() {
        console.log('Repo sync has started...')
        let index = 0

        const userRepos = users.map(getUserRepoList)
        const orgRepos = organizations.map(getOrgAllRepoList)
        const orgPublicRepos = organizationsPublicOnly.map(getOrgPublicRepoList)
        const allRepos = await Promise.all([...userRepos, ...orgRepos, ...orgPublicRepos])

        const repos = allRepos.flat()
        console.log(`Total Repos in scope from all organizations and users: (${repos.length})`)

        if (!repos.length) return

        decryptPrivateRepos()

        for (const repo of repos) {

            console.log(`Current repo ${index + 1}/${repos.length} (${repo.fullName}) (${getPrivacyLevel(repo.isPrivate)})`)
            console.log(`Ensure owner folder exists for ${repo.author}`)

            ensureRepoFolder(repo)

            try {
                if (existsRepo(repo)) {
                    updateRepo(repo)
                } else {
                    cloneRepo(repo)
                }
            } catch (error) {
                console.error(`Error processing repo (${repo.fullName}): `, error)
            }

            console.log('--------------------------------------')
        }

        encryptPrivateRepos()
        storeReposLog(repos)
    }
}