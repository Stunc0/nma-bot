const {
  authedClient,
  startRate,
  btcInterval,
  btcPublicClient,
  ethInterval,
  ethPublicClient,
  ltcInterval,
  ltcPublicClient,
  fiatCurrency,
  sandboxMode,
} = require('./constants.js');

const show = require('./show.js');
const fs = require('fs');
const schedule = require('node-schedule');

var btcStartRateVar = startRate;
var amountpositions = 0;
var currentPrice = 0;
var lastPrice = 0;
var balance = 1000.00;
var positions = [];
var volumeToBuy = 0;
var tendance = 1;
var tendanceCumul = 1;
var tendanceSinceLastBuy = null;
var lastUp = 0;
var lastDown = 0;
var lastBuy = 0;
var precon = 'neutral';
var upSince = 0;
var neutralSince = 0;

const writeLog = (message) => {
  positionsText = '';
  positions.map((p) => {
    positionsText = p.volume + ' @ ' + p.rate + "\n";
  });
  fs.appendFile(
    './logs/bot.log',
    "Date: " + new Date().toISOString() + "\n"
    + message + "\n"
    + "Balance: " + balance + "\n"
    + "Positions : " + positions.length + "\n"
    + positionsText + "\n\n"
    , function (err) {
      if (err) throw err;
    }
  );
}

const trade = (coinSymbol, publicClient) => {

  publicClient.getProductTicker(coinSymbol+'-'+fiatCurrency , (error, response, data) => {
    if(data) {

      currentPrice = data.price;

      if(lastPrice >= currentPrice){
        upSince++;
      } else {
        upSince = 0;
      }

      if(lastPrice == currentPrice){
        neutralSince++;
      } else {
        neutralSince = 0;
      }

      show.cyanText("upSince: " + upSince);
      show.cyanText("neutralSince: " + neutralSince);

      tendance = currentPrice / lastPrice;
      tendanceCumul *= tendance;

      if(tendanceSinceLastBuy != null){
        tendanceSinceLastBuy *= tendance;
      }

      show.magentaText("tendance: " + tendance);
      show.magentaText("tendanceCumul: " + tendanceCumul);
      if(tendanceSinceLastBuy != null){
        show.magentaText("tendanceSinceLastBuy: " + tendanceSinceLastBuy);
      }


      if(tendanceCumul > 1.001){
        precon = 'buy';
        tendanceCumul = 1;
      }

      //à tester avec un marge moins haute
      //TODO: voir pour ordonner le sell si trop de neutral que si on a une position
      if(tendanceCumul < 0.9992 || neutralSince > 10){
        precon = 'sell';
        tendanceCumul = 1;
      }

      //cas dangereux
      if(tendance > 1.001 || tendance < 0.0005){
        show.redText('========= CAS DANGEREUX =========');
        precon = 'sell';

        //pas sûre de devoir le mettre
        tendanceCumul = 1;
      }

      //palier tous les 0,4% de gain
      if(tendanceSinceLastBuy > 1.004){
        show.backGreen('palier');
        precon = 'sell';
      }

      show.underscore("precon: " + precon);

      volumeToBuy = parseFloat(balance / currentPrice).toFixed(8);

      show.greenText('Current price: ' + data.price);

      if(precon == 'buy' && volumeToBuy > 0){
        buy(coinSymbol, volumeToBuy, currentPrice);
      }

      if(precon == 'sell' && positions.length > 0){
        sell(coinSymbol, currentPrice);
      }

      lastPrice = currentPrice;
    } else {
      show.backRed("Problème d'API");
    }

  });

};

const buy = (coinSymbol, volume, rate) => {
  let buyParams = {
    type: 'limit',
    price: parseFloat(rate).toFixed(2),
    size:  parseFloat(rate/volume).toFixed(8),
    product_id: `${coinSymbol}-${fiatCurrency}`,
  };
  //authedClient.buy(buyParams, (error, response, data) => {
  //  if (sandboxMode) {
  //    console.log(data);
  //  }

    process.stderr.write("\007");
    //Peut être voir pour augmenter prix pour être sur de remplir l'ordre. Mais attention aux marges
    let message = 'BUY: ' + volume + coinSymbol + ' @ ' + rate + fiatCurrency + ' ( ' + parseFloat(volume*rate).toFixed(2) + fiatCurrency+ ' )';
    show.backYellow(message);
    positions.push({volume : volume, rate : rate });
    balance = parseFloat(balance) - parseFloat(volume*rate);
    writeLog(message);
    show.cyanText(positions);
    tendanceSinceLastBuy = 1;
  //}
}

const sell = (coinSymbol, rate) => {

    positions.map((ts, index) => {
      let txGain = parseFloat(rate/ts.rate);
      //garde-fou
      if(txGain > 0.999){
        const sellParams = {
          type: 'limit',
          price: parseFloat(ts.rate).toFixed(2),
          size:  parseFloat(ts.volume).toFixed(8),
          product_id: `${coinSymbol}-${fiatCurrency}`,
        };
        //authedClient.sell(sellParams, (error, response, data) => {
        //  if (sandboxMode) {
        //    console.log(data);
        //  }
          process.stderr.write("\007");
          //Vendre a moins du current price pour être sûr de vendre
          let message = 'SELL: ' + ts.volume + coinSymbol + ' @ ' + rate + fiatCurrency + ' ( ' + txGain + '%)';
          show.backBlue(message);
          balance = parseFloat(balance) + parseFloat(ts.volume * rate);
          positions.splice(index, 1);
          writeLog(message);
        //  });
      } else {
        show.redText('Pertes trop importantes.');
      }

      console.log(positions);
      tendanceSinceLastBuy = null;
    });
};


// Convert text based intervals to raw intervals
const rawInterval = interval =>
    interval === 'sec' ? '* * * * * *'
  //: interval === 'fivesec' ? '*/5 * * * * *'
  //: interval === 'min' ? '0-59/1 * * * *'
  //: interval === 'tenmins' ? '0-59/10 * * * *'
  //: interval === 'hour' ? '0 0-23/1 * * *'
  //: interval === 'sixhours' ? '0 0-23/6 * * *'
  //: interval === 'day' ? '0 0 1-31/1 * *'
  : console.log('Scheduling failed: Invalid investment interval (check your .env file to make sure the investment intervals are correct)')


const coinOn = (coinSymbol, interval, publicClient) => {
  schedule.scheduleJob(rawInterval(interval), () => {
    setTimeout(() => {
      trade(coinSymbol, publicClient);
    }, 100);
  });
};


const botOn = (crypto) => {
  writeLog('Start trading on ' + crypto);

  if (crypto == 'BTC') {
    btcPublicClient.getProductTicker('BTC-'+fiatCurrency , (error, response, data) => {
      if(data) {
        lastPrice = data.price;
        coinOn('BTC', btcInterval, btcPublicClient);
      }
    });
  }
  if (crypto == 'ETH') {
    ethPublicClient.getProductTicker('ETH-'+fiatCurrency , (error, response, data) => {
      if(data) {
        lastPrice = data.price;
        coinOn('ETH', ethInterval, ethPublicClient);
      }
    });
  }
  if (crypto == 'LTC') {
    ltcPublicClient.getProductTicker('LTC-'+fiatCurrency , (error, response, data) => {
      if(data) {
        lastPrice = data.price;
        coinOn('LTC', ltcInterval, ltcPublicClient);
      }
    });
  }
};

// Export
module.exports = botOn;
