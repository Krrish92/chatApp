var Ws = require('./wsConnect');


function init(server) {
    var ws = new Ws(server);
    ws.connect();
}
module.exports = {
    init
}
