const macIds = process.env.REACT_APP_RUUVITAG_MACS?.split(',')
const macNames = process.env.REACT_APP_RUUVITAG_NAMES?.split(',')
console.log(macIds, macNames)

const macs = macIds.map((mac, index) => {
    return {
        mac,
        name: macNames[index]
    }
})

const configs = {
    macs: macs
}

export default configs