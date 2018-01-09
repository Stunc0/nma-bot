const {
  authedClient,
  btcStartRate,
  btcAmt,
  btcInterval,
  btcAccountId,
  btcPublicClient,
  ethAmt,
  ethInterval,
  ltcAmt,
  ltcInterval,
  fiatCurrency,
  sandboxMode,
} = require('./constants.js');

var fs = require('fs');
const schedule = require('node-schedule');

var btcStartRateVar = btcStartRate;
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

// Place a market order for the interval investment amount
const buy = (coinSymbol, amt) => {


  btcPublicClient.getProductTicker((error, response, data) => {
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

      console.log("upSince: " + upSince);
      console.log("neutralSince: " + neutralSince);

      tendance = currentPrice / lastPrice;
      tendanceCumul *= tendance;

      if(tendanceSinceLastBuy != null){
        tendanceSinceLastBuy *= tendance;
      }

      console.log("tendance: " + tendance);
      console.log("tendanceCumul: " + tendanceCumul);
      if(tendanceSinceLastBuy != null){
        console.log("tendanceSinceLastBuy: " + tendanceSinceLastBuy);
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
        console.log('========= CAS DANGEREUX =========');
        precon = 'sell';

        //pas sûre de devoir le mettre
        tendanceCumul = 1;
      }

      //palier tous les 0,4% de gain
      if(tendanceSinceLastBuy > 1.004){
        console.log('palier');
        precon = 'sell';
      }

      console.log("precon: " + precon);

      volumeToBuy = parseFloat(balance / currentPrice).toFixed(8);

      if(precon == 'buy' && volumeToBuy > 0){
          console.log('Current price: ' + data.price);
          process.stderr.write("\007");

          //Peut être voir pour augmenter prix pour être sur de remplir l'ordre. Mais attention aux marges
          message = 'BUY: ' + volumeToBuy + 'BTC @ ' + currentPrice + 'EUR ( ' + parseFloat(volumeToBuy*currentPrice).toFixed(2) + ' EUR )';
          console.log(message);
          positions.push({volume : volumeToBuy, rate : currentPrice });
          balance = parseFloat(balance) - parseFloat(volumeToBuy*currentPrice);
          lastBuy = data.price;
          writeLog(message);
          console.log(positions);
          tendanceSinceLastBuy = 1;
      }

      if(precon == 'sell' && positions.length > 0){
        console.log('Current price: ' + data.price);
        positions.map((ts, index) => {
            txGain = parseFloat(currentPrice/ts.rate);
            //garde-fou
            if(txGain > 0.999){
              process.stderr.write("\007");
              //Vendre a moins du current price pour être sûr de vendre
              message = 'SELL: ' + ts.volume + 'BTC @ ' + currentPrice + 'EUR ( ' + txGain + '%)';
              console.log(message);
              balance = parseFloat(balance) + parseFloat(ts.volume * currentPrice);
              positions.splice(index, 1);
              writeLog(message);
            } else {
              console.log('Pertes trop importantes.');
            }
        });
        console.log(positions);
        tendanceSinceLastBuy = null;
      }

      lastPrice = currentPrice;
    }

  });


  /*
  const buyParams = {
    type: 'limit',
    price: parseFloat(btcStartRateVar).toFixed(2),
    size:  parseFloat(amt/btcStartRateVar).toFixed(8),
    product_id: `${coinSymbol}-${fiatCurrency}`,
  };
  authedClient.buy(buyParams, (error, response, data) => {
    amountpositions = amountpositions + data.size;
    console.log('Achat');
    if (sandboxMode) {
      console.log(data);
    }

    btcStartRateVar = btcStartRateVar * 0.998

    if(data.message == 'Insufficient funds'){
      //sell(coinSymbol, amountpositions);
      authedClient.buy(buyParams, (error, response, data) => {
        amountpositions = amountpositions + data.size;
        console.log('Achat');
        if (sandboxMode) {
          console.log(data);
        }

        btcStartRateVar = btcStartRateVar * 0.998

        if(data.message == 'Insufficient funds'){

          authedClient.cancelOrders((error, response, data) => {
            console.log('Suppression des ordres')
          });

          //sell(coinSymbol, amountpositions);
        }
      });
    }
  });
  */


};
/*
const sell = (coinSymbol, amt) => {
  const sellParams = {
    type: 'limit',
    price: parseFloat(btcStartRate * 1.01).toFixed(2),
    size:  parseFloat(amt).toFixed(8),
    product_id: `${coinSymbol}-${fiatCurrency}`,
  };
  authedClient.sell(sellParams, (error, response, data) => {
    console.log('Vente');
    if (sandboxMode) {
      console.log(data);
    }
  });
};
*/

// Convert text based intervals to raw intervals
const rawInterval = interval =>
    interval === 'sec' ? '* * * * * *'
  : interval === 'fivesec' ? '*/5 * * * * *'
  : interval === 'min' ? '0-59/1 * * * *'
  : interval === 'tenmins' ? '0-59/10 * * * *'
  : interval === 'hour' ? '0 0-23/1 * * *'
  : interval === 'sixhours' ? '0 0-23/6 * * *'
  : interval === 'day' ? '0 0 1-31/1 * *'
  : console.log('Scheduling failed: Invalid investment interval (check your .env file to make sure the investment intervals are correct)')


// Schedule buys and tack on a randomized, artificial delay lasting up to 1 minute
const coinOn = (coinSymbol, amt, interval) => {
  schedule.scheduleJob(rawInterval(interval), () => {
    //const randomDelay = Math.floor(Math.random() * 60) + 1;
    const randomDelay = 1; //overide pour test
    setTimeout(() => {
      buy(coinSymbol, amt);
    }, randomDelay * 1000);
  });
};


// Turn coins on if their interval investment amounts meet the GDAX trade rules minimum
const botOn = () => {
  writeLog('Start trading');
  btcPublicClient.getProductTicker((error, response, data) => {
    if(data) {
      lastPrice = data.price;
    }
  });
  if (btcAmt >= 1.00) {
    coinOn('BTC', btcAmt, btcInterval);
  }
  if (ethAmt >= 1.00) {
    coinOn('ETH', ethAmt, ethInterval);
  }
  if (ltcAmt >= 1.00) {
    coinOn('LTC', ltcAmt, ltcInterval);
  }
};

// Export
module.exports = botOn;
