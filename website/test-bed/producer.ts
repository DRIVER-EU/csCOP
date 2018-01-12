import {
    ProduceRequest
} from 'kafka-node';
import * as earthquakeAlert from '../data/cap/examples/example_earthquake.json';
import {
    TestBedAdapter,
    Logger,
    LogLevel,
    ITestBedOptions
} from 'node-test-bed-adapter';
import { error } from 'winston';

export class Producer {
    private id = 'csCOPproducer';
    private adapter: TestBedAdapter;
    private log = Logger.instance;
    private errorCallback: Function;

    constructor(options: ITestBedOptions) {
        options.clientId = this.id;
        this.adapter = new TestBedAdapter(options);
        this.adapter.on('error', (e) => {
            console.error(e);
            if (this.errorCallback) {
                this.errorCallback(e);
                this.errorCallback = null;
            }
        });
        this.adapter.on('ready', () => {
            this.log.info('Producer is connected');
        });
        this.adapter.connect();
    }

    public sendcap(cb: Function) {
        this.errorCallback = cb;
        const payloads: ProduceRequest[] = [{
            key: this.id,
            topic: 'cap',
            messages: earthquakeAlert,
            attributes: 1 // Gzip
        }];
        this.adapter.send(payloads, (error, data) => {
           cb(error, data);
        });
    }
}