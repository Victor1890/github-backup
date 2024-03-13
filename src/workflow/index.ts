import { Github } from './github'

export class Workflow {

    private readonly github: Github

    constructor() {
        this.github = new Github()
    }

    public async repoSync() {
        console.log('Repo sync has started...')
        let index = 0

        const repos = await this.github.getAllRepos()

        console.log(`Total Repos in scope from all organizations and users: (${repos.length})`)

        if (!repos.length) return

        await this.github.decryptPrivateRepos()

        for (const repo of repos) {

            console.log(`Current repo ${index + 1}/${repos.length} (${repo.fullName}) (${repo.isPrivate ? 'private' : 'public'})`)
            console.log(`Ensure owner folder exists for ${repo.author}`)

            this.github.ensureRepoFolder(repo)

            try {

                if (this.github.existsRepo(repo)) this.github.updateRepo(repo)
                else this.github.cloneRepo(repo)

            } catch (error) {
                console.error(`Error processing repo (${repo.fullName}): `, error)
            }

            console.log('--------------------------------------')
        }

        this.github.encryptPrivateRepos()
        this.github.storeReposLog(repos)
    }
}