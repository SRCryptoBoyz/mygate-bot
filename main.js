import WebSocket from 'ws';
import fetch from 'node-fetch';
import chalk from 'chalk';
import moment from 'moment';
import { HttpsProxyAgent } from 'https-proxy-agent';
import fs from 'fs';
import log from './utils/logger.js';
import banner from './utils/banner.js';

function readFile(pathFile) {
    try {
        return fs.readFileSync(pathFile, 'utf8')
            .split('\n')
            .map(data => data.trim())
            .filter(data => data.length > 0);
    } catch (error) {
        log.error(`Error reading file: ${error.message}`);
        return [];
    }
}

async function fetchIPDetails(proxy) {
    if (!proxy) return { ip: 'No Proxy', country: 'No Proxy' };
    try {
        const response = await fetch(`https://ipinfo.io/json`, { agent: new HttpsProxyAgent(proxy) });
        const data = await response.json();
        return { ip: data.ip || 'Unknown', country: data.country || 'Unknown' };
    } catch {
        return { ip: 'Failed', country: 'Failed' };
    }
}

async function getUserInfo(token, proxy = null) {
    const agent = proxy ? new HttpsProxyAgent(proxy) : null;
    try {
        const response = await fetch('https://api.mygate.network/api/front/users/me', {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` },
            agent,
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        return data.data;
    } catch (error) {
        throw new Error(`Error fetching user info: ${error.message}`);
    }
}

async function main() {
    console.log(chalk.blueBright(banner));
    const tokens = readFile('accounts.txt');
    const proxies = readFile('proxy.txt');
    let proxyIndex = 0;

    for (const token of tokens) {
        const proxy = proxies.length > 0 ? proxies[proxyIndex] : null;
        proxyIndex = (proxyIndex + 1) % proxies.length;

        const { ip, country } = await fetchIPDetails(proxy);
        console.log(chalk.green(`[INFO] Proxy: ${ip} (${country})`));

        try {
            const userInfo = await getUserInfo(token, proxy);
            console.log(
                chalk.greenBright(`[SUCCESS] Login success for user: ${userInfo.name}`),
                chalk.cyan(`[Points Now: ${userInfo.currentPoint}]`)
            );

            setInterval(async () => {
                const updatedInfo = await getUserInfo(token, proxy);
                console.log(
                    chalk.yellow(`[${moment().format()}] Farming Update:`),
                    chalk.magenta(`[Current Points: ${updatedInfo.currentPoint}]`)
                );
            }, 10 * 60 * 1000); // Update every 10 minutes
        } catch (error) {
            if (error.message.includes('HTTP 401')) {
                console.log(chalk.red(`[ERROR] Token expired for: ${token}`));
            } else if (error.message.includes('proxy')) {
                console.log(chalk.red(`[ERROR] Proxy failed: ${proxy}`));
            } else {
                console.log(chalk.red(`[ERROR] ${error.message}`));
            }
        }
    }
}

main();
