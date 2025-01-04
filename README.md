# MyGate Network Bot


## Features

- **Auto Generate Node ID**
- **Auto Connect/ping Node**
- **Auto Reconnect Node**

- **Support multiple accounts**
- **Support Proxy usage**
- **For Now Its Not Supported Creating Multiple Nodes for one account**

## Prerequisites

- Node.js installed on your machine
- `tokens.txt` file containing token my-gate platform follow instruction below to get:
- Open my-gate platform [https://mygate.network/](https://app.mygate.network/login?code=k5sAfH)
- Login With your gmail
- inspect or just F12, and find Network, search me and copy youre berear token
- copy the token and save it in `tokens.txt` 


## Installation

1. Clone the repository:
    ```sh
   git clone https://github.com/SRCryptoBoyz/mygate-bot.git

   cd mygate-bot
    ```

3. Install the required dependencies:
    ```sh
    npm install
    ```
4. Input your token in `tokens.txt` file, one user per line;
    ```sh
    nano tokens.txt
    ```
5. optionally you can use proxy: 
- paste proxy in `proxy.txt` format `http://username:password@ip:port` 
    ```sh
    nano proxy.txt
    ```
5. Run the script:
    ```sh
    npm run start
    ```
