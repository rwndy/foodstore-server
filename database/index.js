const mongoose = require('mongoose')
const { dbHost, dbName, dbPort, dbUser, dbPass } = require('../app/config');

const uri = `mongodb://${dbUser}:${dbPass}@${dbHost}:${dbPort}/${dbName}`

mongoose.connect(uri)

const db = mongoose.connection

module.exports = db