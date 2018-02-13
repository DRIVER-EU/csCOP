// UNCOMMENT IF YOU WANT TO ENHANCE THE LOG OUTPUT OF KAFKA
// import { consoleLoggerProvider } from './console-logger-provider';
// const kafkaLogging = require('kafka-node/logging');
// kafkaLogging.setLoggerProvider(consoleLoggerProvider);
import {Message, OffsetFetchRequest} from 'kafka-node';
import * as Promise from 'bluebird';
import {TestBedAdapter, Logger, LogLevel, ITopicMetadataItem, ITestBedOptions} from 'node-test-bed-adapter';
import {CapProcessor} from './capProcessor';
import * as _ from 'underscore';

export class Consumer {
    private id = 'csCOPconsumer';
    private adapter: TestBedAdapter;
    private log = Logger.instance;
    private callback: Function;
    private retries: number = 0;
    private capProcessor = new CapProcessor();

    constructor(options: ITestBedOptions) {
        options.clientId = this.id;
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
                    return this.getTopics();
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

    private subscribe(): Promise<void | OffsetFetchRequest[]> {
        this.adapter.on('message', message => this.handleMessage(message));
        this.adapter.on('offsetOutOfRange', err => this.log.error(`Consumer received an error: ${_.isObject(err) ? JSON.stringify(err) : err}`));
        return this.adapter
            .addConsumerTopics({
                topic: TestBedAdapter.HeartbeatTopic
            })
            .catch(err => {
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
                            console.log('TOPICS');
                            const metadata = (result as {
                                [metadata: string]: {
                                    [topic: string]: ITopicMetadataItem;
                                };
                            }).metadata;
                            for (let key in metadata) {
                                const md = metadata[key];
                                console.log(`Topic: ${key}, partitions: ${Object.keys(md).length}`);
                            }
                        } else {
                            console.log('NODE');
                            console.log(result);
                        }
                    });
                    resolve();
                }
            });
        });
    }

    private handleMessage(message: Message) {
        switch (message.topic.toLowerCase()) {
            case 'heartbeat':
            case 'connect-status-heartbeat':
                this.log.info(`Received message on topic ${message.topic} with key ${message.key}: ${message.value}`);
                break;
            case 'configuration':
                this.log.info(`Received message on topic ${message.topic} with key ${message.key}: ${message.value}`);
                break;
            case 'cap':
                // this.log.info(`Received message on topic ${message.topic} with key ${message.key}: ${typeof message.value === 'string' ? message.value : '\n' + JSON.stringify(message.value, null, 2)}`);
                this.log.info(`Received message on topic ${message.topic} with key ${message.key}`);
                var fts = this.capProcessor.handleIncomingCAP(<any>message.value);
                if (fts && this.callback) this.callback(fts);
                break;
            default:
                this.log.info(`Received message on topic ${message.topic}: ${message.value}`);
                break;
        }
    }
}
