# ruuvionpi
Collect RuuviTag info, React app and Raspberry pi

Inspired of this article  
https://teuvovaisanen.fi/2019/09/09/ruuvitag-raspberry-pi-ja-telegram-bot/  

Raspberry Pi installation guide  
https://github.com/ttu/ruuvitag-sensor/blob/master/install_guide_pi.md  

Example how to run React web app on Raspberry Pi and start it when machine starts  
https://blog.cloudboost.io/how-to-run-a-nodejs-web-server-on-a-raspberry-pi-for-development-3ef9ac0fc02c


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

### Add backend and Express server
Browse to root directory
```
$ mkdir server
$ touch server/index.js
```
Run to generate `package.json` file
```
$ npm init -y
```

Install Express
```
$npm install express --save
```

Add `server.js` file to root folder  
Add following code to `server.js`
``` 
const express = require('express'); //Line 1
const app = express(); //Line 2
const port = process.env.PORT || 5000; //Line 3

// This displays message that the server running and listening to specified port
app.listen(port, () => console.log(`Listening on port ${port}`)); //Line 6

// create a GET route
app.get('/express_backend', (req, res) => { //Line 9
  res.send({ express: 'YOUR EXPRESS BACKEND IS CONNECTED TO REACT' }); //Line 10
}); //Line 11
```

### Clone React app repo to Raspberry Pi

Install dependencies
```
$ npm install
```

Start app
```
$ ./client/npm start
```

You can now browse app with browser on localhost or by accessing local network IP