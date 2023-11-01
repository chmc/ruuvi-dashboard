# ruuvi-dashboard

Collect RuuviTag data, run system on Raspberry Pi and visualize using React app.  
App integrates to other services like weather forecast.  
Key points:

- Collect RuuviTag data
- Daily min/max outdoor weather
- Weather forecast
- Sunrise / sunset
- Energy prices today and tomorrow
- Beautiful layout
- No database requirement

![Ruuvi dashboard UI](assets/ruuvi-dashboard.png)

Inspired of this article  
https://teuvovaisanen.fi/2019/09/09/ruuvitag-raspberry-pi-ja-telegram-bot/

Raspberry Pi installation guide  
https://github.com/ttu/ruuvitag-sensor/blob/master/install_guide_pi.md

Example how to run React web app on Raspberry Pi and start it when machine starts  
https://blog.cloudboost.io/how-to-run-a-nodejs-web-server-on-a-raspberry-pi-for-development-3ef9ac0fc02c

Example to connect React and Express backend  
https://blog.logrocket.com/running-react-express-concurrently/

Note to my self: Ruuvi

- High battery level: 3193
- Low battery level: 1897

# Roadmap

#### Codebase

- Add tests to code `(in progress)`
- System wide JSDoc typing `(in progress)`
- Refactor code `(in progress)`
- Apply web socket instead of API polling

#### UX

- Refine and polish overall UI, add more icons etc
- Visualize current hour energy price
- Today hourly weather forecast
- Outdoor temperature trend, rise/lower/stay same
- System monitor: Raspberry pi temp (safe under +70c), memory %, cpu %
- Integrate with Philips Hue
- Ruuvi battery level indicator
- Mobile friendly UI, now it works best on pad size

#### System

- pm2 logs to daily instead of one big, delete old files
- Automate deployment using script
- PWA support

# Steps to install and run app

### Enable Raspberry Pi remote access

In GUI OS

- Press Raspberry Button -> Preferences -> Raspberry Pi Configuration
- Select Interfaces tab
- Enable `VNC` for RealVNC Viewer connection
- Enable `SSH` for terminal connection

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

### Useful Ubuntu commands

Shutdown raspberry pi

```
$ sudo shutdown -h now
```

Reboot raspberry pi

```
$ sudo reboot --force
```

Get raspberry pi temperature

```
$ vcgencmd measure_temp
--> temp=60.7'C
```

### Clone React app repo to Raspberry Pi

Clone repository

```
$ git clone https://github.com/chmc/ruuvi-dashboard.git
```

Go to root folder of app and execute following commands in that path

```
$ cd ./ruuvi-dashboard
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

Set pm2 configurations `pm2.config.js`

```
$ cp pm2.config.js.template pm2.config.js
$ nano pm2.config.js
```

Run the following command in your project directory to start your app with pm2:

```
$ pm2 start pm2.config.js
```

To grant execute permission to the directory, run:

```
chmod +x /home/your-name/repos/ruuvi-dashboard
```

To grant execute permission to the pm2.config.js file, run:

```
chmod +x /home/your-name/repos/ruuvi-dashboard/pm2.config.js
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
WorkingDirectory=/repos/ruuvi-dashboard
ExecStart=/usr/local/bin/pm2 start /home/[user-name]/repos/ruuvi-dashboard/pm2.config.js
ExecReload=/usr/local/bin/pm2 reload /home/[user-name]/repos/ruuvi-dashboard/pm2.config.js
ExecStop=/usr/local/bin/pm2 stop /home/[user-name]/repos/ruuvi-dashboard/pm2.config.js
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

`Note!` If automatic start doesn't work, you can start it manually

```
$ /home/your-name/repos/ruuvionpi/start.sh
```

To watch live logs use command

```
$ pm2 logs
```

To check monitor status incl. logs, memory/cpu usage etc use command

```
$ pm2 monit
```

To find jammed processes

```
$ ps aux | grep 'D'
```

If the ruuvi.py script gets stuck, use this command to kill them

```
$ pkill -f "python3 ./scripts/ruuvi.py"
```

### Troubleshooting

If you get this error

```
Python Ruuvi script ERROR: Can't init device hci0: Connection timed out (110)
```

Try to resolve that error by resetting BLE

```
$ sudo hciconfig hci0 reset
```

If resetting BLE does not work Try running ruuvitag_sensor script

```
$ python3 -m ruuvitag_sensor -f
```

If none of these helps to enable bluetooth, `reboot raspberry pi` and try again

## How the app (frontend and backend) was created

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
