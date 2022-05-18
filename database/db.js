const mongoose = require('mongoose');
require("dotenv").config();

const clientDB = mongoose
    .connect(process.env.URI)
    .then((m) => {
        console.log('Data Base conectada 💥');
        return m.connection.getClient();
    })
    .catch((e) => console.log('Fail to conect 😢 ' + e));

module.exports = clientDB;