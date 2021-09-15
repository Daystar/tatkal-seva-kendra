const dotenv = require('dotenv')
dotenv.config()

const mongodb = require('mongodb')

mongodb.connect(process.env.CONNECTIONSTRING, { useNewUrlParser: true, useUnifiedTopology: true }, function (err, client) {
    module.exports = client
    console.log("Database connected")
    const expressApp = require('./app')
    expressApp.listen(process.env.PORT)
})