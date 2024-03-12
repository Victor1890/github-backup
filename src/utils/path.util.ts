import {
    existsSync,
    mkdirSync,
    writeFileSync
} from 'fs'
import { execSync } from 'child_process'
import config from '../config'
import { IFormatRepo, Repo } from '../interfaces/github'
import { httpRequest } from './fetch.util'

const { githubToken, paths, passphrase } = config

const getPrivacyLevel = (isPrivacy: boolean) => isPrivacy ? 'private' : 'public'

const decryptPrivateRepos = () => {
    console.log('Decrypting has started...')
    if (!existsSync(paths.privateReposEncryptFile)) {
        console.log('Nothing to decrypt. Aborting the decrypting process...')
        return
    }
    mkdirSync(paths.privateRepos)
    execSync(`gpgtar --decrypt  --gpg-args "--passphrase=${passphrase} --batch" --directory ${process.cwd()} ${paths.privateReposEncryptFile}`)
    execSync(`rm -rf ${paths.privateReposEncryptFile}`)
}

const encryptPrivateRepos = () => {
    if (!existsSync(paths.privateRepos)) {
        console.log('Nothing to encrypt. Aborting encryption...')
        return
    }
    execSync(`gpgtar --encrypt --symmetric --output ${paths.privateReposEncryptFile} --gpg-args="--passphrase=${passphrase} --batch" repos/private_repos`)
    execSync(`rm -rf ${paths.privateRepos}`)
}

const ensureRepoFolder = (repo: IFormatRepo) => {
    const dir = `${paths[getPrivacyLevel(repo.isPrivate) + 'Repos']}/${repo.author}`
    console.log('target dir:', dir)
    if (!existsSync(dir)) {
        console.log(`Creating folder ${dir}`)
        mkdirSync(dir, { recursive: true })
    }
}

const getRepoList = (entityType: string, repoType = 'all') => async (username: string) => {
    console.log(`Generating the repos list in scope for (${username}) (${entityType})`)
    let pendingPages = true
    let currentPage = 1
    let allData: IFormatRepo[] = []

    while (pendingPages) {
        const data = await httpRequest<Repo[]>({
            host: 'https://api.github.com',
            path: `/${entityType}/${username}/repos?per_page=100&page=${currentPage}&type=${repoType}`,
            headers: {
                Authorization: `token ${githubToken}`,
                'User-Agent': 'testing'
            }
        })
        if (!data.length) {
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

const getUserRepoList = getRepoList('users')
const getOrgAllRepoList = getRepoList('orgs', 'all')
const getOrgPublicRepoList = getRepoList('orgs', 'public')

const storeReposLog = (repos: IFormatRepo[]) => {
    console.log('Storing Repos logs in disk...')

    const filePath = `${paths.logs}/repos.json`

    if (!existsSync(paths.logs)) {
        mkdirSync(paths.logs, { recursive: true })
        writeFileSync(filePath, "[]")
    }

    writeFileSync(filePath, JSON.stringify(repos, null, 4))
}

export default {
    getPrivacyLevel,
    getUserRepoList,
    getOrgPublicRepoList,
    getOrgAllRepoList,
    ensureRepoFolder,
    storeReposLog,
    encryptPrivateRepos,
    decryptPrivateRepos,
    existsRepo: (repo: IFormatRepo) => {
        return existsSync(`${paths[getPrivacyLevel(repo.isPrivate) + 'Repos']}/${repo.fullName}.git`)
    },
    cloneRepo: (repo: IFormatRepo) => {
        console.log('Cloning the repo for the first time...')
        if (repo.isPrivate) {
            return execSync(`cd ${paths.privateRepos}/${repo.author} && git clone --mirror https://${githubToken}@github.com/${repo.fullName}`, { stdio: 'inherit' })
        }
        return execSync(`cd ${paths.publicRepos}/${repo.author} && git clone --mirror ${repo.url}`, { stdio: 'inherit' })
    },
    updateRepo: (repo: IFormatRepo) => {
        console.log('Updating the repo...')
        return execSync(`cd ${paths[getPrivacyLevel(repo.isPrivate) + 'Repos']}/${repo.fullName}.git && git remote update --prune`, { stdio: 'inherit' })
    }

}
