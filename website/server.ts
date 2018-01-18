import Winston = require('winston');
import express = require('express');
import path = require('path');
import * as _ from 'underscore';
import {Consumer} from './test-bed/consumer';
import {Producer} from './test-bed/producer';
import {ITestBedOptions, LogLevel} from 'node-test-bed-adapter';
//import cors = require('cors');
import * as csweb from 'csweb';
import TestBedConfig = require('./config/config.json');

Winston.remove(Winston.transports.Console);
Winston.add(Winston.transports.Console, <Winston.ConsoleTransportOptions>{
    colorize: true,
    label: 'csCOP',
    prettyPrint: true
});

const SEND_CAP_ENDPOINT = '/send-cap-alert';

var startDatabaseConnection = false;
var capLayerId: string = 'cap';
var port = process.env.CSCOP_PORT || 8003;

var cs = new csweb.csServer(__dirname, <csweb.csServerOptions>{
    port: port,
    swagger: false
    //connectors: { mqtt: { server: 'localhost', port: 1883 }, mongo: { server : '127.0.0.1', port: 27017} }
});

//cs.server.use(cors());

cs.start(() => {
    var testBedOptions: ITestBedOptions = <any>TestBedConfig;
    testBedOptions.logging = {
        logToConsole: LogLevel.Info,
        logToFile: LogLevel.Debug,
        logToKafka: LogLevel.Error,
        logFile: 'log.txt'
    };
    var consumer = new Consumer(testBedOptions);
    consumer.setCallback((fts: any[]) => {
        if (fts && _.isArray(fts) && fts.length > 0) {
            var featuresUpdates = _.map(fts, f => {
                console.log(f.properties);
                return <csweb.IChangeEvent>{
                    value: f,
                    type: csweb.ChangeType.Create,
                    id: f.id
                };
            });
            cs.api.addUpdateFeatureBatch(capLayerId, featuresUpdates, {}, r => {});
            console.log(`Updated ${fts.length} features`);
        }
    });
    var producer = new Producer(testBedOptions);

    cs.server.post(SEND_CAP_ENDPOINT, (req, res) => {
        if (!req.body || _.isEmpty(req.body)) {
            console.warn(`No valid CAP message found in body`);
            res.sendStatus(404);
        }
        console.log(`Calling producer to send cap message`);
        producer.sendCap(req.body, (error, data) => {
            if (error) {
                res.sendStatus(404);
                console.error(error);
            } else {
                res.sendStatus(200);
                console.log(data);
            }
        });
    });

    console.log('really started');
});
