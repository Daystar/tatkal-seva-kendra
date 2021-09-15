const Train = require('../models/Train')
const stations = require('../models/stations')
const stationList = stations.stationsList

exports.searchtrains = function (req, res) {
    let train = new Train(req.body)
    train.getTrainSchedule().then(function (result) {
        
        // console.log('API call result', result)

        // console.log('Trains BTW Stations List: ', result.data.trainBtwnStnsList)
        // console.log('Trains BTW Stations List: ', result.data.trainBtwnStnsList.length)
        // console.log('ALT Trains BTW Stations List: ', result.data.alternateTrainBtwnStnsList)
        console.log('Quota List', result.data.quotaList)

        res.render('home-guest',
            {
                errors: [],
                regErrors: [],
                trainstations: stationList,
                stations: result,
                travelDate: req.body.date
            })

    }).catch(function (e) {
        console.log(e)
        // req.flash('errors', e)
        // req.session.save(function () {
        //     res.redirect('/')
        // })
    })
}

exports.getTicketPrice = (req, res) => {
    console.log(req.url);
    console.log(req.params);
    // res.json('roses')

    let train = new Train(req.params)
    train.getTicketPrice().then(function (result) {

        console.log('API call result', result)

        res.json('roses')
    })
}