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

export class Producer {
    private id = 'csCOPproducer';
    private adapter: TestBedAdapter;
    private log = Logger.instance;

    constructor(options: ITestBedOptions) {
        options.clientId = this.id;
        this.adapter = new TestBedAdapter(options);
        this.adapter.on('error', e => console.error(e));
        this.adapter.on('ready', () => {
            this.log.info('Producer is connected');
        });
        this.adapter.connect();
    }

    public sendcap(cb: Function) {
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