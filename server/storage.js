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
 * @param {string} key
 * @param {any} value
 * @returns {any}
 */
const jsonParseReviverFunc = (key, value) => {
  if (
    typeof value === 'string' &&
    value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/)
  ) {
    return new Date(value)
  }
  return value
}

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
      return JSON.parse(data, jsonParseReviverFunc)
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
    return JSON.parse(data, jsonParseReviverFunc)
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
