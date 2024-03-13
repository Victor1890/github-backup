import { Workflow } from './workflow'
import { CronJob } from 'cron';
import config from './config';

const {
    cronTime,
    cronTimezone
} = config;

(async () => {

    const workflow = new Workflow()

    if (!cronTime) {
        await workflow.repoSync()

        process.exit(1)
    }

    console.log(`Initialization trigger is programmed by Cron with pattern (${cronTime})`)

    const job = new CronJob(cronTime as string, async () => {
        console.log(`Cron has being triggered (${cronTime})`)

        await workflow.repoSync()

    }, null, true, cronTimezone)

    return job.start();
})()