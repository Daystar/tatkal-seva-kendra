const axios = require('axios');

module.exports = axios.create({
    baseURL: 'https://www.irctc.co.in/eticketing/protected/mapps1',
    headers: {
        greq: '1561193916088'
    }
});