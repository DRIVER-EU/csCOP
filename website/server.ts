import Winston = require('winston');
import express = require('express');
import path = require('path');
import {
    Consumer
} from './test-bed/consumer';
import {
    Producer
} from './test-bed/producer';
import {
    ITestBedOptions,
    LogLevel
} from 'node-test-bed-adapter';
//import cors = require('cors');
import * as csweb from 'csweb';
import TestBedConfig = require('./config.json');

Winston.remove(Winston.transports.Console);
Winston.add(Winston.transports.Console, < Winston.ConsoleTransportOptions > {
    colorize: true,
    label: 'csCOP',
    prettyPrint: true
});

var startDatabaseConnection = false;

var cs = new csweb.csServer(__dirname, < csweb.csServerOptions > {
    port: 8003,
    swagger: false
    //connectors: { mqtt: { server: 'localhost', port: 1883 }, mongo: { server : '127.0.0.1', port: 27017} }
});

//cs.server.use(cors());

cs.start(() => {
    var testBedOptions: ITestBedOptions = < any > TestBedConfig;
    testBedOptions.logging = {
        logToConsole: LogLevel.Debug,
        logToFile: LogLevel.Debug,
        logToKafka: LogLevel.Debug,
        logFile: 'log.txt'
    };
    var consumer = new Consumer(testBedOptions);
    var producer = new Producer(testBedOptions);

    cs.server.get('/send-cap-endpoint', (req, res) => {
        console.log(`Calling producer to send cap message`);
        producer.sendcap((error, data) => {
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