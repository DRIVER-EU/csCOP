// UNCOMMENT IF YOU WANT TO ENHANCE THE LOG OUTPUT OF KAFKA
// import { consoleLoggerProvider } from './console-logger-provider';
// const kafkaLogging = require('kafka-node/logging');
// kafkaLogging.setLoggerProvider(consoleLoggerProvider);
import {
    Message
} from 'kafka-node';
import {
    TestBedAdapter,
    Logger,
    LogLevel,
    ITopicMetadataItem,
    ITestBedOptions
} from 'node-test-bed-adapter';
import {CAPProcessor} from './capProcessor';

export class Consumer {
    private id = 'csCOPconsumer';
    private adapter: TestBedAdapter;
    private log = Logger.instance;
    private callback: Function;

    constructor(options: ITestBedOptions) {
        options.clientId = this.id;
        this.adapter = new TestBedAdapter(options);
        this.adapter.on('ready', () => {
            this.subscribe();
            this.log.info('Consumer is connected');
            this.getTopics();
        });
        this.adapter.connect();
    }

    public setCallback(callback: Function) {
        this.callback = callback;
    }

    private subscribe() {
        this.adapter.on('message', message => this.handleMessage(message));
        this.adapter.on('error', err => this.log.error(`Consumer received an error: ${err}`));
        this.adapter.on('offsetOutOfRange', err => this.log.error(`Consumer received an error: ${err}`));
        this.adapter.addConsumerTopics({
            topic: TestBedAdapter.HeartbeatTopic
        }).catch(err => {
            if (err) {
                this.log.error(`Consumer received an error: ${err}`);
            }
        });
    }

    private getTopics() {
        this.adapter.loadMetadataForTopics([], (error, results) => {
            if (error) {
                return this.log.error(error);
            }
            if (results && results.length > 0) {
                results.forEach(result => {
                    if (result.hasOwnProperty('metadata')) {
                        console.log('TOPICS');
                        const metadata = (result as {
                            [metadata: string]: {
                                [topic: string]: ITopicMetadataItem
                            }
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
            }
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
                var fts = CAPProcessor.handleIncomingCAP(message.value);
                if (fts && this.callback) this.callback(fts);
                break;
            default:
                this.log.info(`Received message on topic ${message.topic}: ${message.value}`);
                break;
        }
    }
}