/**
 * @param {Date} [new Date()] date  Defaults to current date
 * @returns {Date}
 */
const addOneDay = (date = new Date()) => {
  date.setDate(date.getDate() + 1)
  return date
}

/**
 * @param {Date=} date1
 * @param {Date=} date2
 * @returns
 */
const isSameDate = (date1, date2) =>
  date1?.getFullYear() === date2?.getFullYear() &&
  date1?.getMonth() === date2?.getMonth() &&
  date1?.getDate() === date2?.getDate()

module.exports = {
  addOneDay,
  isSameDate,
}
