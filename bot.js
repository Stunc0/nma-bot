const botOn = require('./work.js');
const show = require('./show.js');
const fs = require('fs');

let cryptoWanted = process.argv[2]
if(cryptoWanted == 'BTC' || cryptoWanted == 'ETH' || cryptoWanted == 'LTC'){

  fs.writeFile(
    './logs/bot.log',
    ' '
    , function (err) {
      if (err) throw err;
    }
  );
  
  show.backWhite("Bot Starts on : " + cryptoWanted);
  botOn(cryptoWanted);
} else {
  show.backRed('crypto non reconnu, try BTC, ETH or LTC');
}
