const macIds = process.env.REACT_APP_RUUVITAG_MACS?.split(',')
const macNames = process.env.REACT_APP_RUUVITAG_NAMES?.split(',')
console.log(macIds, macNames)

const ruuviTags = macIds.map((mac, index) => {
    return {
        mac,
        name: macNames[index]
    }
})

const configs = {
    ruuviTags,
    mainIndoorMac: process.env.REACT_APP_MAIN_INDOOR_RUUVITAG_MAC,
    mainOutdoorMac: process.env.REACT_APP_MAIN_OUTDOOR_RUUVITAG_MAC
}

export default configs