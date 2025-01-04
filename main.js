import WebSocket from 'ws';
import fetch from 'node-fetch';
import { randomUUID } from 'crypto';
import { HttpsProxyAgent } from 'https-proxy-agent';
import fs from 'fs';
import log from './utils/logger.js';
import bedduSalama from './utils/banner.js';

function readFile(pathFile) {
    try {
        const datas = fs.readFileSync(pathFile, 'utf8')
            .split('\n')
            .map(data => data.trim())
            .filter(data => data.length > 0);
        return datas;
    } catch (error) {
        log.error(`Error reading file: ${error.message}`);
        return [];
    }
}

class WebSocketClient {
    constructor(token, proxy = null, uuid, reconnectInterval = 5000) {
        this.token = token;
        this.proxy = proxy;
        this.socket = null;
        this.reconnectInterval = reconnectInterval;
        this.shouldReconnect = true;
        this.agent = this.proxy ? new HttpsProxyAgent(this.proxy) : null;
        this.uuid = uuid;
        this.url = `wss://api.mygate.network/socket.io/?nodeId=${this.uuid}&EIO=4&transport=websocket`;
        this.regNode = `40{ "token":"Bearer ${this.token}"}`;
    }

    connect() {
        if (!this.uuid || !this.url) {
            log.error("Cannot connect: Node is not registered.");
            return;
        }

        log.info("Attempting to connect :", this.uuid);
        this.socket = new WebSocket(this.url, { agent: this.agent });

        this.socket.onopen = async () => {
            log.info("WebSocket connection established for node:", this.uuid);
            await new Promise(resolve => setTimeout(resolve, 3000));
            this.reply(this.regNode);
        };

        this.socket.onmessage = (event) => {
            if (event.data === "2" || event.data === "41") this.socket.send("3");
            else log.info(`node ${this.uuid} received message:`, event.data);
        };

        this.socket.onclose = () => {
            log.warn("WebSocket connection closed for node:", this.uuid);
            if (this.shouldReconnect) {
                log.warn(`Reconnecting in ${this.reconnectInterval / 1000} seconds for node:`, this.uuid);
                setTimeout(() => this.connect(), this.reconnectInterval);
            }
        };

        this.socket.onerror = (error) => {
            log.error(`WebSocket error for node ${this.uuid}:`, error.message);
            this.socket.close();
        };
    }

    reply(message) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(String(message));
            log.info("Replied with:", message);
        } else {
            log.error("Cannot send message; WebSocket is not open.");
        }
    }

    disconnect() {
        this.shouldReconnect = false;
        if (this.socket) {
            this.socket.close();
        }
        log.info("WebSocket connection manually closed.");
    }
}

async function registerNode(token, proxy = null) {
    const agent = proxy ? new HttpsProxyAgent(proxy) : null;
    const maxRetries = 3;
    let retries = 0;
    const uuid = randomUUID();
    const activationDate = new Date().toISOString();
    const payload = {
        id: uuid,
        status: "Good",
        activationDate: activationDate,
    };

    try {
        const response = await fetch("https://api.mygate.network/api/front/nodes", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
            agent: agent,
        });

        if (!response.ok) {
            throw new Error(`Registration failed with status ${response.status}`);
        }
        const data = await response.json();

        log.info("Node registered successfully:", data);
        return uuid;

    } catch (error) {
        log.error("Error registering node:", error.message);
        if (retries < maxRetries) {
            log.info(`Retrying in 10 seconds...`);
            await new Promise(resolve => setTimeout(resolve, 10000));
            retries++;
            await registerNode();
        } else {
            log.error("Max retries exceeded; giving up on registration.");
            return null;
        }
    }
}

async function confirmUser(token) {
    const confirm = await fetch("https://api.mygate.network/api/front/referrals/referral/LfBWAQ?", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({})
    });
    const confirmData = await confirm.json();
    log.info("Confirm user response:", confirmData);
}

async function getUserInfo(token, proxy = null) {
    const agent = proxy ? new HttpsProxyAgent(proxy) : null;
    try {
        const response = await fetch("https://api.mygate.network/api/front/users/me", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
            },
            agent: agent,
        });
        if (!response.ok) {
            log.error(`Failed to get user info with status ${response.status}`);
            return;
        }
        const data = await response.json();
        const { name, status, _id, levels, currentPoint } = data.data;
        log.info("User info:", { name, status, _id, levels, currentPoint });
    } catch (error) {
        log.error("Error getting user info:", error.message);
        return { error: error.message };
    }
}

async function main() {
    log.info(bedduSalama);

    const tokens = readFile("tokens.txt");
    const proxies = readFile("proxy.txt");
    let proxyIndex = 0;

    try {
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            const proxy = proxies.length > 0 ? proxies[proxyIndex] : null;
            proxyIndex = (proxyIndex + 1) % proxies.length;

            await confirmUser(token)
            setInterval(async () => {
                await getUserInfo(token);
            }, 10 * 60 * 1000);

            log.info("Trying to open new connection using proxy:", proxy || "No Proxy");
            const uuid = await registerNode(token, proxy);
            if (!uuid) {
                log.error("Failed to register node; skipping WebSocket connection.");
                continue;
            }

            const client = new WebSocketClient(token, proxy, uuid);
            client.connect();
            await getUserInfo(token);
        }
        log.info("All accounts connections established. just leave it running.");
    } catch (error) {
        log.error("Error in WebSocket connections:", error.message);
    }
}

main();
