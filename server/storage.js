const {
  existsSync,
  readFileSync,
  writeFileSync,
  promises: fsPromises,
} = require('fs')
const path = require('path')
const { createLogger } = require('./utils/logger')

const log = createLogger('storage')

const APP_STORAGE_FILE_NAME = 'appStorage.json'
const appStorageFilePath = path.resolve(__dirname, APP_STORAGE_FILE_NAME)
log.debug({ path: appStorageFilePath }, 'Storage file path')

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
 * @returns {Promise<AppStorage>}
 */
const loadOrDefault = async () => {
  if (!existsSync(appStorageFilePath)) {
    log.debug('Storage file not found')
    return {}
  }

  try {
    const data = await fsPromises.readFile(appStorageFilePath, 'utf8')
    log.debug('Storage loaded')
    return JSON.parse(data, jsonParseReviverFunc)
  } catch (error) {
    log.error({ err: error }, 'loadOrDefault() failed')
    return {}
  }
}

/**
 * @returns {AppStorage}
 */
const loadOrDefaultSync = () => {
  if (existsSync(appStorageFilePath)) {
    const data = readFileSync(appStorageFilePath)
    log.debug('Storage loaded')
    try {
      return JSON.parse(data, jsonParseReviverFunc)
    } catch (error) {
      log.error({ err: error }, 'loadOrDefaultSync() Parse loaded data failed')
      return {}
    }
  }

  return {}
}

/**
 * @param {AppStorage} data
 * @returns {Promise<void>}
 */
const save = async (data) => {
  const json = JSON.stringify(data)
  try {
    await fsPromises.writeFile(appStorageFilePath, json)
    log.debug('Storage saved')
  } catch (err) {
    log.error({ err }, 'Error writing storage file')
  }
}

/**
 * @param {AppStorage} data
 */
const saveSync = (data) => {
  const json = JSON.stringify(data)
  writeFileSync(appStorageFilePath, json)
  log.debug('Storage saved')
}

module.exports = {
  loadOrDefault,
  loadOrDefaultSync,
  save,
  saveSync,
}
