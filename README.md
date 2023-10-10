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

### Update Node.js on Raspberry Pi Through Node Module

Install npm
```
sudo npm install -g n
```

Install latest version of Node.js
```
sudo n latest
```

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

Install dependencies
```
$ npm install
```

Start app (frontend and backend)
```
$ npm start
```

You can now browse app with browser on localhost or by accessing local network IP