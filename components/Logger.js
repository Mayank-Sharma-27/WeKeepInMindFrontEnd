export default class Logger {
  static log(message) {
    console.log(`[INFO]: ${message}`);
  }

  static warn(message) {
    console.warn(`[WARN]: ${message}`);
  }

  static error(message) {
    console.error(`[ERROR]: ${message}`);
  }

  // You can add more methods if needed
}
