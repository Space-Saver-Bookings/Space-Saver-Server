const mongoose = require("mongoose");

async function databaseConnector(databaseURL) {
    await mongoose.connect(databaseURL);
}

async function databaseDisconnector() {
    await mongoose.connection.close();
}

function getDatabaseURL(environment) {
  switch (environment.toLowerCase()) {
    case 'test':
    case 'development':
      return process.env.DEV_DB_URL;
    case 'production':
      return process.env.PROD_DB_URL;
    default:
      console.error(
        'Incorrect JS environment specified, using a default database URL.'
      );
      return process.env.DEFAULT_DB_URL || '';
  }
}

module.exports = {
    databaseConnector,
    databaseDisconnector,
    getDatabaseURL
};