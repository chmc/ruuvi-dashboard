# ruuvionpi

Collect RuuviTag info, React app and Raspberry pi

Inspired of this article  
https://teuvovaisanen.fi/2019/09/09/ruuvitag-raspberry-pi-ja-telegram-bot/

Raspberry Pi installation guide  
https://github.com/ttu/ruuvitag-sensor/blob/master/install_guide_pi.md

Example how to run React web app on Raspberry Pi and start it when machine starts  
https://blog.cloudboost.io/how-to-run-a-nodejs-web-server-on-a-raspberry-pi-for-development-3ef9ac0fc02c

Example to connect React and Express backend
https://blog.logrocket.com/running-react-express-concurrently/

# Steps

### Enable Raspberry Pi remote access

In GUI OS

- Press Raspberry Button -> Preferences -> Raspberry Pi Configuration
- Select Interfaces tab
- Enable `VNC` for RealVNC Viewer connection
- Enable `SSH` for terminal connection

Tip. If you need to shutdown raspberry pi

```
$ sudo shutdown -h now
```

### Update Node.js on Raspberry Pi Through Node Module

Install npm

```
sudo npm install -g n
```

Install latest version of Node.js

```
sudo n latest
```

### Install Python and ruuvitag-sensor

Follow the instructions from here  
https://github.com/ttu/ruuvitag-sensor/blob/master/install_guide_pi.md

### Create react app

App will be created inside `ruuvionpi` folder

```
$ npx create-react-app ruuvionpi
```

Tip. If you have troubles running npx command, make install npm globally

```
$ npm install -g npm
```

### Setting up the Express.js backend

Browse to root directory

```
$ mkdir server
$ touch server/index.js
```

Next install the `express` and `nodemon` packages

```
$ npm install express --save
$ npm install nodemon --save-dev
```

Update `server/index.js` file

### Integrate the React with API

Update `package.json` file

```
{
    ...
    "scripts": {
        ...
        "start:frontend": "react-scripts start",
        "start:backend": "nodemon server/index.js"
    },
    "proxy": "http://localhost:3001"
}
```

The `proxy` field specifies the proxy server that will be used in development. It is set to http://localhost:3001, meaning any API requests made from the React frontend to endpoints starting with `/api` will be automatically proxied to the Express backend server running on port 3001.

### Install and configure concurrently

With concurrently it is possible to start frontend and backend at the same time

```
$ npm install concurrently
```

Update `package.json`

```
"scripts": {
    ...
    "start:frontend": ...,
    "start:backend": ...,
    "start": "concurrently \"npm run start:frontend\" \"npm run start:backend\""
}
```

### Clone React app repo to Raspberry Pi

Clone repository

```
$ git clone https://github.com/chmc/ruuvionpi.git
```

Go to root folder of app and execute following commands in that path

```
$ cd ./ruuvionpi
```

Run ruuvitag_sensor to find all sensors and their MACs

```
$ python3 -m ruuvitag_sensor -f
```

Set configurations `.env`

```
$ cp .env.template .env
$ nano .env
```

Install dependencies

```
$ npm install
```

Start app (frontend and backend)

```
$ npm start
```

You can now browse app with browser on localhost or by accessing local network IP

### To automatically run app on Raspberry Pi

Install pm2

```
$ sudo npm install pm2 -g
```

Run the following command in your project directory to start your app with pm2:

```
$ pm2 start pm2.config.js
```

To grant execute permission to the directory, run:

```
chmod +x /home/your-name/repos/ruuvionpi
```

To grant execute permission to the pm2.config.js file, run:

```
chmod +x /home/your-name/repos/ruuvionpi/pm2.config.js
```

Create a systemd service unit file to manage the pm2 process

```
$ sudo nano /etc/systemd/system/ruuvi-dashboard.service
```

Paste the following content into the file, adjusting the ExecStart and WorkingDirectory to match your project:

```
[Unit]
Description=ruuvi-dashboard

[Service]
Type=simple
WorkingDirectory=/repos/ruuvionpi
ExecStart=/usr/local/bin/pm2 start /home/[user-name]/repos/ruuvionpi/pm2.config.js
ExecReload=/usr/local/bin/pm2 reload /home/[user-name]/repos/ruuvionpi/pm2.config.js
ExecStop=/usr/local/bin/pm2 stop /home/[user-name]/repos/ruuvionpi/pm2.config.js
User=your-username

[Install]
WantedBy=multi-user.target
```

Run the following commands to enable and start new systemd service:

```
$ sudo systemctl enable ruuvi-dashboard
$ sudo systemctl start ruuvi-dashboard
```

Check if service is running by using the following command:

```
$ systemctl status ruuvi-dashboard
```

If automatic start doesn't work, you can start it manually

```
 /home/your-name/repos/ruuvionpi/start.sh
```
