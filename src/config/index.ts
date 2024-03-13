import 'dotenv/config'

import { getFullPath, stringToArray } from '@utils/string.util'

const paths: Record<string, string> = {
    publicRepos: getFullPath('repos/public_repos'),
    privateRepos: getFullPath('repos/private_repos'),
    public: getFullPath('repos/public_repos'),
    private: getFullPath('repos/private_repos'),
    privateReposEncryptFile: getFullPath('repos/private_repos.gpg'),
    logs: getFullPath('logs')
}

const config = {
    githubToken: process.env.GITHUB_TOKEN as string,
    passphrase: process.env.PASSPHRASE as string,
    organizations: stringToArray(process.env.TARGET_ORGANIZATIONS),
    organizationsPublicOnly: stringToArray(process.env.TARGET_PUBLIC_ORGANIZATIONS),
    users: stringToArray(process.env.TARGET_USERS),
    paths,
    cronTime: process.env.CRON_TIME || false,
    cronTimezone: process.env.CRON_TIMEZONE || 'Atlantic Standard Time'
}

export default config