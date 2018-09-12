import Winston = require('winston');
import express = require('express');
import path = require('path');
import fs = require('fs');
import * as _ from 'underscore';
import {Consumer} from './test-bed/consumer';
import {Producer} from './test-bed/producer';
import {ITestBedOptions, LogLevel} from 'node-test-bed-adapter';
//import cors = require('cors');
import * as csweb from 'csweb';
import StaticTestBedConfig = require('./config/config.json');
import {FeatureCacher} from './FeatureCacher';

Winston.remove(Winston.transports.Console);
Winston.add(Winston.transports.Console, <Winston.ConsoleTransportOptions>{
    colorize: true,
    label: 'csCOP',
    prettyPrint: true
});

var DynamicTestBedConfig;
if (fs.existsSync('./config/dynamic-config.json')) {
    let configText = fs.readFileSync('./config/dynamic-config.json', {encoding: 'utf8'});
    DynamicTestBedConfig = JSON.parse(configText);
    console.warn('Using config/dynamic-config.json (overwrites default config)');
} else {
    console.log('Using default config.json');
}
const TestBedConfig = DynamicTestBedConfig || StaticTestBedConfig;

const SEND_CAP_ENDPOINT = '/send-cap-alert';
const SEND_GEOJSON_ENDPOINT = '/send-geojson';

var startDatabaseConnection = false;
var capLayerId: string = 'cap';
var host = process.env.CSCOP_SERVER || 'http://localhost';
var port = process.env.CSCOP_PORT || 8003;

var cs = new csweb.csServer(__dirname, <csweb.csServerOptions>{
    host: host,
    port: port,
    swagger: false
    //connectors: { mqtt: { server: 'localhost', port: 1883 }, mongo: { server : '127.0.0.1', port: 27017} }
});

//cs.server.use(cors());

function sendFeatureUpdates(fts: any[], layerId: string) {
    if (fts && _.isArray(fts) && fts.length > 0) {
        var featuresUpdates = _.map(fts, f => {
            console.log(f.properties);
            return <csweb.IChangeEvent>{
                value: f,
                type: csweb.ChangeType.Create,
                id: f.id
            };
        });
        cs.api.addUpdateFeatureBatch(layerId, featuresUpdates, {}, r => {});
        console.log(`Updated ${fts.length} features`);
    }
}

cs.start(() => {
    const featureCacher = new FeatureCacher(sendFeatureUpdates);

    var testBedOptions: ITestBedOptions = <any>TestBedConfig;
    testBedOptions.logging = {
        logToConsole: LogLevel.Info,
        logToFile: LogLevel.Debug,
        logToKafka: LogLevel.Error,
        logFile: 'log.txt'
    };
    var consumer = new Consumer(testBedOptions);
    consumer.setCallback((fts: any[], layerId: string) => featureCacher.sendFeatureUpdates(fts, layerId));
    // consumer.setCallback(sendFeatureUpdates);
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

    /**
     * Expects a body in JSON format, with interface:
     * {"topic": string,
     *  "data": IFeature
     * }
     */
    cs.server.post(SEND_GEOJSON_ENDPOINT, (req, res) => {
        if (!req.body || _.isEmpty(req.body)) {
            console.warn(`No valid geojson message found in body`);
            res.sendStatus(404);
            return;
        }
        if (!req.body.topic || !req.body.data) {
            console.warn(`No valid topic or data found in body`);
            res.sendStatus(404);
            return;
        }
        console.log(`Calling producer to send geojson message`);
        producer.sendGeojson(req.body.data, req.body.topic, (error, data) => {
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
