const {
  existsSync,
  readFile,
  readFileSync,
  writeFile,
  writeFileSync,
} = require('fs')
const path = require('path')

const APP_STORAGE_FILE_NAME = 'appStorage.json'
// const appStorageFilePath = `./${APP_STORAGE_FILE_NAME}`
const appStorageFilePath = path.resolve(__dirname, APP_STORAGE_FILE_NAME)
console.log(appStorageFilePath)

/**
 * @returns {AppStorage}
 */
const loadOrDefault = async () => {
  if (existsSync(appStorageFilePath)) {
    await readFile(appStorageFilePath, (error, data) => {
      if (error) {
        // eslint-disable-next-line no-console
        console.error(error)
        return {}
      }
      console.log('loaded')
      return JSON.parse(data)
    })
  }

  console.log('file not found')
  return {}
}

/**
 * @returns {AppStorage}
 */
const loadOrDefaultSync = () => {
  if (existsSync(appStorageFilePath)) {
    const data = readFileSync(appStorageFilePath)
    console.log('loaded')
    return JSON.parse(data)
  }

  return {}
}

/**
 * @param {AppStorage} data
 */
const save = async (data) => {
  const json = JSON.stringify(data)
  // console.log('save: ', json)
  await writeFile(appStorageFilePath, json, (err) => {
    if (err) {
      console.error('Error writing file: ', err)
    } else {
      console.log('Saved')
    }
  })
}

/**
 * @param {AppStorage} data
 */
const saveSync = (data) => {
  const json = JSON.stringify(data)
  writeFileSync(appStorageFilePath, json)
  console.log('saved')
}

module.exports = {
  loadOrDefault,
  loadOrDefaultSync,
  save,
  saveSync,
}
