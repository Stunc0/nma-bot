const colors = require('./colors.js');

const greenText = (message) => {
  console.log(colors.FgGreen, message, colors.Reset);
}

const redText = (message) => {
  console.log(colors.FgRed, message, colors.Reset);
}

const cyanText = (message) => {
  console.log(colors.FgCyan, message, colors.Reset);
}

const magentaText = (message) => {
  console.log(colors.FgMagenta, message, colors.Reset);
}

const backWhite = (message) => {
  console.log(colors.FgBlack + colors.BgWhite, message, colors.Reset);
}

const backRed = (message) => {
  console.log(colors.FgWhite + colors.BgRed, message, colors.Reset);
}

const backGreen = (message) => {
  console.log(colors.FgBlack + colors.BgGreen, message, colors.Reset);
}

const backYellow = (message) => {
  console.log(colors.FgBlack + colors.BgYellow, message, colors.Reset);
}

const backBlue = (message) => {
  console.log(colors.FgWhite + colors.BgBlue, message, colors.Reset);
}

const underscore = (message) => {
  console.log(colors.Underscore, message, colors.Reset);
}


module.exports = {
  greenText,
  redText,
  backWhite,
  cyanText,
  magentaText,
  backWhite,
  backRed,
  backGreen,
  backYellow,
  backBlue,
  underscore,
}
