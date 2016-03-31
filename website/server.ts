import Winston = require('winston');
import express = require('express');
import path = require('path');
//import cors = require('cors');
import * as csweb from 'csweb';

Winston.remove(Winston.transports.Console);
Winston.add(Winston.transports.Console, <Winston.ConsoleTransportOptions>{
    colorize: true,
    label: 'csWeb',
    prettyPrint: true
});

var startDatabaseConnection = false;

var cs = new csweb.csServer(__dirname, <csweb.csServerOptions>{
    port: 3003,
    swagger: false
    //connectors: { mqtt: { server: 'localhost', port: 1883 }, mongo: { server : '127.0.0.1', port: 27017} }
});

//cs.server.use(cors());

cs.start(() => {

    var cisOptions: csweb.ICISOptions = {
        cisNotifyUrl: 'http://localhost:9001/notify',
        cisMsgReceivedUrl: '/CISMsgReceived'
    }

    var cisSource = new csweb.CISDataSource(cs.server, cs.api, '/cis');
    cisSource.init(cisOptions, (msg: string) => {
        Winston.info('CISDataSource: ' + msg);
    });

    var restSourceOptions: csweb.IRestDataSourceSettings = {
        converterFile: path.join(__dirname, './crowdtasker.js'),
        pollIntervalSeconds: 60,
        pruneIntervalSeconds: 300,
        diffIgnoreGeometry: false,
        diffPropertiesBlacklist: [],
        url: 'http://crowdtasker.ait.ac.at/be/api/',
        urlParams: {
            api_key: '9319559c3102d1b0205a6f52e854707da076e7de',
            attachmentPath: 'public\\data\\api\\attachments',
            baseUrl: 'http://localhost:4567'
        }
    }

    setTimeout(() => {
        var restSource = new csweb.RestDataSource(cs.server, cs.api, 'crowdtasker', '/crowdtasker');
        restSource.init(restSourceOptions, (msg: string) => {
            Winston.info('RestDataSource: ' + msg);
        });
    }, 4000);

    console.log('really started');
    //    //{ key: 'imb', s: new ImbAPI.ImbAPI('app-usdebug01.tsn.tno.nl', 4000),options: {} }
    //    var ml = new MobileLayer.MobileLayer(api, 'mobilelayer', '/api/resources/SGBO', server, messageBus, cm);
});
