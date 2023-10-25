const { spawn } = require('child_process')

const resetBluetoothInterface = () => {
  const command = 'sudo'
  const args = ['hciconfig', 'hci0', 'reset']

  const child = spawn(command, args)

  child.stdout.on('data', (data) => {
    console.log(`resetBluetoothInterface stdout: ${data}`)
  })

  child.stderr.on('data', (data) => {
    console.error(`resetBluetoothInterface ERROR stderr: ${data}`)
  })

  child.on('error', (error) => {
    console.error(`resetBluetoothInterface Error: ${error.message}`)
  })

  child.on('close', (code) => {
    if (code === 0) {
      console.log('resetBluetoothInterface Command executed successfully')
    } else {
      console.error(
        `resetBluetoothInterface ERROR Command exited with code ${code}`
      )
    }
  })
}

module.exports = {
  resetBluetoothInterface,
}
