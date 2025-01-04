import chalk from 'chalk';

const log = {
    info: (...args) => console.log(chalk.blueBright('[INFO]'), ...args),
    success: (...args) => console.log(chalk.greenBright('[SUCCESS]'), ...args),
    warn: (...args) => console.log(chalk.yellow('[WARN]'), ...args),
    error: (...args) => console.log(chalk.red('[ERROR]'), ...args),
};

export default log;
