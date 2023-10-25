const { spawn } = require('child_process')

const resetBluetoothInterface = () => {
  const command = 'sudo'
  const args = ['hciconfig', 'hci0', 'reset']

  const childProcess = spawn(command, args)

  const timeoutInSec = 10000
  const killChildProcessTimeoutId = setTimeout(() => {
    console.log(
      'Reset bluetooth interface execution timeout. Terminating process.'
    )
    childProcess.kill('SIGKILL')
  }, timeoutInSec)

  childProcess.stdout.on('data', (data) => {
    console.log(`resetBluetoothInterface stdout: ${data}`)
  })

  childProcess.stderr.on('data', (data) => {
    console.error(`resetBluetoothInterface ERROR stderr: ${data}`)
  })

  childProcess.on('error', (error) => {
    console.error(`resetBluetoothInterface Error: ${error.message}`)
  })

  childProcess.on('close', (code) => {
    clearTimeout(killChildProcessTimeoutId)
    if (code === 0) {
      console.log('resetBluetoothInterface Command executed successfully')
    } else {
      console.error(
        `resetBluetoothInterface ERROR Command exited with code ${code}`
      )
    }
  })

  childProcess.stdin.end()
  childProcess.stdout.end()
  childProcess.stderr.end()
}

module.exports = {
  resetBluetoothInterface,
}
