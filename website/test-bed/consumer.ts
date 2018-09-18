// UNCOMMENT IF YOU WANT TO ENHANCE THE LOG OUTPUT OF KAFKA
// import { consoleLoggerProvider } from './console-logger-provider';
// const kafkaLogging = require('kafka-node/logging');
// kafkaLogging.setLoggerProvider(consoleLoggerProvider);
import {Message, OffsetFetchRequest} from 'kafka-node';
import {TestBedAdapter, Logger, LogLevel, ITopicMetadataItem, ITestBedOptions, IAdapterMessage, IDefaultKey} from 'node-test-bed-adapter';
import {CapProcessor} from './capProcessor';
import {GeoJsonProcessor} from './geoJsonProcessor';
import * as _ from 'underscore';

export class Consumer {
    private id = 'csCOPconsumer';
    private adapter: TestBedAdapter;
    private log = Logger.instance;
    private callback: Function;
    private retries: number = 0;
    private capProcessor = new CapProcessor();
    private geoJsonProcessor = new GeoJsonProcessor();
    private consumeTopics: OffsetFetchRequest[] = [];

    constructor(options: ITestBedOptions, cb?: Function) {
        options.clientId = options.clientId || this.id;
        this.adapter = new TestBedAdapter(options);
        this.adapter.on('error', err => {
            this.log.error(`Consumer received an error: ${err}`);
        });
        this.adapter.on('ready', () => {
            this.subscribe()
                .then(() => {
                    this.log.info('Consumer is connected');
                })
                .then(() => {
                    this.getTopics();
                    return cb();
                })
                .catch(err => {
                    this.log.error(`Error subscribing to topics: ${err}`);
                });
        });
        this.connectAdapter(options);
    }

    private connectAdapter(options: ITestBedOptions) {
        this.adapter
            .connect()
            .then(() => {
                this.log.info(`Initialized test-bed-adapter correctly`);
            })
            .catch(err => {
                this.log.error(`Initializing test-bed-adapter failed: ${err}`);
                if (this.retries < options.maxConnectionRetries) {
                    this.retries += 1;
                    let timeout = options.retryTimeout;
                    this.log.info(`Retrying to connect in ${timeout} seconds (retry #${this.retries})`);
                    setTimeout(() => this.connectAdapter(options), timeout * 1000);
                }
            });
    }

    public setCallback(callback: Function) {
        this.callback = callback;
    }

    public async addConsumerTopics(topics: OffsetFetchRequest[], fromOffset?: boolean, cb?: (error: string, message: Message) => void): Promise<OffsetFetchRequest[]> {
        this.consumeTopics = topics;
        return this.adapter.addConsumerTopics(topics, fromOffset, cb);
    }

    private subscribe(): Promise<void | OffsetFetchRequest[]> {
        this.adapter.on('message', message => this.handleMessage(message));
        this.adapter.on('offsetOutOfRange', (err: any) => {
            this.log.error(`Consumer received an error in subscribe()`);
            this.log.error(err);
            this.log.debug(new Error().stack);
            this.adapter.addConsumerTopics(_.find(this.consumeTopics, a => a.topic === err.topic), false);
        });
        return this.adapter.addConsumerTopics().catch(err => {
            if (err) {
                this.log.error(`Consumer received an error: ${err}`);
            }
        });
    }

    private getTopics(): Promise<{}> {
        return new Promise<{}>((resolve, reject) => {
            this.adapter.loadMetadataForTopics([], (error, results) => {
                if (error) {
                    this.log.error(error);
                    reject(error);
                }
                if (results && results.length > 0) {
                    results.forEach(result => {
                        if (result.hasOwnProperty('metadata')) {
                            this.log.info('TOPICS');
                            const metadata = (result as {
                                [metadata: string]: {
                                    [topic: string]: ITopicMetadataItem;
                                };
                            }).metadata;
                            for (let key in metadata) {
                                const md = metadata[key];
                                this.log.info(`Topic: ${key}, partitions: ${Object.keys(md).length}`);
                            }
                        } else {
                            this.log.info('NODE');
                            this.log.info(result);
                        }
                    });
                    resolve();
                }
            });
        });
    }

    private handleMessage(message: IAdapterMessage) {
        switch (message.topic.toLowerCase()) {
            case 'system_heartbeat':
            case 'connect-status-heartbeat':
                this.log.info(`Received message on topic ${message.topic} with key ${message.key}: ${message.value}`);
                break;
            case 'system_configuration':
                this.log.info(`Received message on topic ${message.topic} with key ${message.key}: ${message.value}`);
                break;
            case 'cap':
                // this.log.info(`Received message on topic ${message.topic} with key ${message.key}: ${typeof message.value === 'string' ? message.value : '\n' + JSON.stringify(message.value, null, 2)}`);
                this.log.info(`Received message on topic ${message.topic} with key ${message.key}`);
                let capFeatures = this.capProcessor.handleIncomingCAP(<any>message.value);
                if (capFeatures && this.callback) this.callback(capFeatures, 'cap');
                break;
            case 'css-demo-geojson':
            case 'css-demo-geojson2':
            case 'standard_geojson_sim_station':
            case 'standard_geojson_sim_item':
            case 'standard_geojson_sim_unit':
            case 'standard_geojson_sim_unitgroup':
                this.log.info(`Received message on topic ${message.topic} with key ${message.key}`);
                this.convertMessageAndUpdateFeatures(message);
                break;
            case 'chain_power':
            case 'chain':
                this.log.info(`Received message on topic ${message.topic} with key ${message.key}`);
                this.convertChainMessageAndUpdateFeatures(message);
                break;
            case 'chain_waterheight':
                try {
                    const data = JSON.parse(<any>message.value).data;
                    this.callback(data, 'chain_waterheight');
                } catch (e) {
                    this.log.info(`Error parsing message on topic chain_waterheight`);
                }
                break;
            default:
                this.log.info(`Received message on topic ${message.topic}: ${JSON.stringify(message.value).substr(0, 200)}`);
                break;
        }
    }

    private convertChainMessageAndUpdateFeatures(message: IAdapterMessage) {
        if (!this.callback) {
            console.warn('Cannot send update');
            return;
        }
        let features = this.geoJsonProcessor.handleIncomingMessage(<any>message.value);
        if (features && features.length > 0) {
            switch ((<IDefaultKey>message.key).senderID) {
                case 'FloodSim':
                    this.callback(features, 'items');
                    break;
                case 'NAPConverter':
                    this.callback(features, 'chain_waterheight');
                    break;
                case 'ElectricitySim':
                    this.callback(features, 'chain_power');
                    break;
                case 'CareObjectSim':
                    this.callback(features, 'chain_care');
                    break;
            }
        }
    }

    private convertMessageAndUpdateFeatures(message: IAdapterMessage) {
        if (!this.callback) {
            console.warn('Cannot send update');
            return;
        }
        let features = this.geoJsonProcessor.handleIncomingMessage(<any>message.value);
        if (features && features.length > 0) {
            switch (message.topic) {
                case 'standard_geojson_sim_item':
                    this.callback(features, 'items');
                    break;
                case 'standard_geojson_sim_unit':
                    this.callback(features, 'units');
                    break;
                case 'standard_geojson_sim_unitgroup':
                    this.callback(features, 'unitgroups');
                    break;
                case 'standard_geojson_sim_station':
                    this.callback(features, 'stations');
                    break;
                default:
                    console.warn(`Unknown topic ${message.topic}`);
            }
        }
    }
}
