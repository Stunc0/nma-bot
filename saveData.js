require('dotenv').config();

const NodeCouchDb = require('node-couchdb');

// node-couchdb instance with default options
const couch = new NodeCouchDb();


const Gdax = require('gdax');
const schedule = require('node-schedule');
const show = require('./show.js');
const apiURI = 'https://api.gdax.com';


let cryptoWanted = process.argv[2]
if(cryptoWanted == 'BTC' || cryptoWanted == 'ETH' || cryptoWanted == 'LTC'){

  var publicClient = new Gdax.PublicClient(apiURI, cryptoWanted+'-EUR');

  show.backWhite("Start saving data - " + cryptoWanted);



  schedule.scheduleJob('* * * * * *', () => {
    job(cryptoWanted, publicClient, couch);
  });


} else {
  show.backRed('crypto non reconnu, try BTC, ETH or LTC');
}


const job = (crypto, pClient, db) => {
  pClient.getProductTicker(crypto+'-EUR' , (error, response, data) => {
    if(data) {
      show.greenText(data);

      couch.get("btc", data.trade_id.toString()).then(({data, headers, status}) => {
          show.backYellow('trade deja existant');
      }, err => {
        couch.insert("btc", {
              _id: data.trade_id.toString(),
              field: data
          }).then(({data, headers, status}) => {
              show.greenText('trade inséré');
          }, err => {
              show.redText(err);
          });

      });

    }
  });
};
