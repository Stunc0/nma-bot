require('dotenv').config();
const Gdax = require('gdax');

// Assign the environmental variables to constants
const key = process.env.API_KEY;
const b64secret = process.env.API_SECRET;
const passphrase = process.env.API_PASSPHRASE;
const apiURI = process.env.SANDBOX_MODE === 'false' ? 'https://api.gdax.com' : 'https://api-public.sandbox.gdax.com';
const authedClient = new Gdax.AuthenticatedClient(key, b64secret, passphrase, apiURI);

const startRate = process.env.START_RATE_BTC;

const btcInterval = process.env.INVESTMENT_INTERVAL_BTC;
const btcPublicClient = new Gdax.PublicClient(apiURI, 'BTC-EUR');

const ethInterval = process.env.INVESTMENT_INTERVAL_ETH;
const ethPublicClient = new Gdax.PublicClient(apiURI, 'ETH-EUR');

const ltcInterval = process.env.INVESTMENT_INTERVAL_LTC;
const ltcPublicClient = new Gdax.PublicClient(apiURI, 'LTC-EUR');

const sandboxMode = process.env.SANDBOX_MODE;
const fiatCurrency = process.env.FIAT_CURRENCY;

// Exports
module.exports = {
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
};
