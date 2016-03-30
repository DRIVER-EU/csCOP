import Winston = require('winston');
import * as csweb from "csweb";

Winston.remove(Winston.transports.Console);
Winston.add(Winston.transports.Console, <Winston.ConsoleTransportOptions>{
    colorize: true,
    label: 'csWeb',
    prettyPrint: true
});

var startDatabaseConnection = false;

var cs = new csweb.csServer(__dirname, <csweb.csServerOptions>{
    port: 3003,
    swagger : false,
    //connectors: { mqtt: { server: 'localhost', port: 1883 }, mongo: { server : '127.0.0.1', port: 27017} }
});
cs.start(() => {

    if (startDatabaseConnection) {
        this.config = new csweb.ConfigurationService('./configuration.json');
        this.config.add('server', 'http://localhost:' + cs.options.port);
        var bagDatabase = new csweb.BagDatabase(this.config);
        var mapLayerFactory = new csweb.MapLayerFactory(<any>bagDatabase, cs.messageBus, cs.api);
        cs.server.post('/bagcontours', (req, res) => {
            mapLayerFactory.processBagContours(req, res);
        });

        cs.server.post('/bagsearchaddress', (req, res) => {
            mapLayerFactory.processBagSearchQuery(req, res);
        });

        cs.server.post('/bagbuurten', (req, res) => {
            mapLayerFactory.processBagBuurten(req, res);
        });
    }

    console.log('really started');
    //    //{ key: "imb", s: new ImbAPI.ImbAPI("app-usdebug01.tsn.tno.nl", 4000),options: {} }
    //    var ml = new MobileLayer.MobileLayer(api, "mobilelayer", "/api/resources/SGBO", server, messageBus, cm);
});
