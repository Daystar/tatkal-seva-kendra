const trainAPI = require('../models/TrainsAPI')

let Train = function(data) {
        this.data = data,   // data -> from, to, date
        this.price = []
}

Train.prototype.getTrainSchedule = async function () {

    // console.log(this.data)
    // console.log(this.data.from)
    // console.log(this.data.to)
    // console.log(this.data.date)
    
    const source = this.data.from.substring(this.data.from.indexOf('-') + 2)
    const destination = this.data.to.substring(this.data.to.indexOf('-') + 2)
    const travelDate = this.data.date.replace(/-/g, '')

    // console.log(source)
    // console.log(destination)
    // console.log(travelDate)

    const response = await trainAPI.get(`/tbstns/${source}/${destination}/${travelDate}`, {
        params: {
            dateSpecific: 'Y',
            ftBooking: 'N',
            redemBooking: 'N',
            journeyType: 'GN',
            captcha: ''
        }
    })

    return response
}

Train.prototype.getTicketPrice = async function () {
    const { trainNo, travelDate, source, destination, cls } = this.data;

    console.log(trainNo)
    console.log(travelDate.replace(/-/g, ''))
    console.log(source)
    console.log(destination)
    console.log(cls)

    const response = await trainAPI.get(`/avlFareenquiry/${trainNo}/${travelDate.replace(/-/g, '')}/${source}/${destination}/${cls}/GN/N`, {
        data: {
            "moreThanOneDay": false
        }
    })

    return response
}

module.exports = Train