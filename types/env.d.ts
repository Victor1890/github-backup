namespace NodeJS {
    interface ProcessEnv {
        GITHUB_TOKEN?: string;

        PASSPHRASE?: string;
        TARGET_ORGANIZATIONS?: string;
        TARGET_PUBLIC_ORGANIZATIONS?: string;
        TARGET_USERS?: string;

        CRON_TIME?: string;
        CRON_TIMEZONE?: string;
    }
}