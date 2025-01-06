import chalk from 'chalk';

const logger = {
    log: (level, message, value = '') => {
        const now = new Date().toISOString();

        const colors = {
            info: chalk.magenta,
            warn: chalk.yellow,
            error: chalk.red,
            success: chalk.cyan,
            debug: chalk.magenta,
        };

        const color = colors[level] || chalk.blue;
        const levelTag = `[ ${level.toUpperCase()} ]`;
        const timestamp = now.split('T')[0] + 'T' + now.split('T')[1].split('.')[0]; // Hanya ambil tanggal dan waktu

        // Format pesan log
        const formattedMessage = `${chalk.magenta("=> MYGATE-NODE")}`;
        const formattedTimestamp = `${chalk.cyanBright("=> TIME\t\t: " + timestamp)}`;
        const formattedLevel = `${color("=> " + level.toUpperCase() + "\t: " + message)}`;

        let formattedValue = '';
        
        // Jika value adalah token, tampilkan 5 angka terakhir
        if (typeof value === 'string' && value.includes('Bearer')) {
            const tokenMatch = value.match(/Bearer (.*)/);
            if (tokenMatch) {
                const token = tokenMatch[1];
                const shortenedToken = token.slice(-5); // Ambil 5 angka terakhir
                formattedValue = `Token (shortened): ${chalk.green("Bearer " + shortenedToken)}`;
            }
        }

        // Jika value adalah objek, tampilkan properti objek tanpa tanda kurung kurawal
        if (typeof value === 'object') {
            formattedValue = 'Details: ';
            Object.keys(value).forEach((key, index) => {
                formattedValue += `${key}: ${chalk.green(value[key])}`;
                if (index < Object.keys(value).length - 1) {
                    formattedValue += ', '; // Pemisah antar properti
                }
            });
        } else if (value) {
            formattedValue = `Details: ${chalk.green(value)}`;
        }

        // Jika level adalah error, tampilkan pesan error dengan warna merah
        if (level === 'error') {
            formattedValue = `Error Details: ${chalk.red(value)}`;
        }

        // Menampilkan pesan log dengan format yang lebih terstruktur
        console.log(formattedMessage);
        console.log(formattedTimestamp);
        console.log(formattedLevel);
        if (formattedValue) {
            console.log(formattedValue);
        }
    },

    info: (message, value = '') => logger.log('info', message, value),
    warn: (message, value = '') => logger.log('warn', message, value),
    error: (message, value = '') => logger.log('error', message, value),
    success: (message, value = '') => logger.log('success', message, value),
    debug: (message, value = '') => logger.log('debug', message, value),
};

export default logger;
