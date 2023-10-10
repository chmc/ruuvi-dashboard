const express = require('express');
const { exec } = require('child_process');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 3001;

app.use(express.json())

// This displays message that the server running and listening to specified port
app.listen(port, () => console.log(`Listening on port ${port}`));

// create a GET route
app.get('/api/express_backend', (req, res) => {
    console.log('api call received')
    res.send({ express: 'YOUR EXPRESS BACKEND IS CONNECTED TO REACT' }); //Line 10
});

app.post('/api/ruuvi', (req, res) => {
    console.log('post call received')
    const data = req.body
    console.log(data)
})

const macs = process.env.RUUVITAG_MACS
console.log('macs: ', macs)
const ruuviScript = '../scripts/ruuvi.py'
const command = `python3 ${ruuviScript} --macs "${macs}"`
console.log('command: ', command)

function execRuuviScript() {
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error: ${error.message}`)
            return;
        }
        console.log(`Python script output:\n${stdout}`)
    })
}

console.log('Wait 3sec before first ruuvi script run')
setTimeout(() => {
    console.log('Call ruuvi script')
    execRuuviScript();
}, 3000);

// Run every 10sec
console.log('Run ruuvi script every 35sec')
const interval = setInterval(execRuuviScript, 35000)