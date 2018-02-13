import {Info, Alert} from './ICAP';
import {ProduceRequest} from 'kafka-node';
import {TestBedAdapter, Logger, LogLevel, ITestBedOptions} from 'node-test-bed-adapter';
import {setTimeout} from 'timers';
import {Feature, Geometry} from 'csweb';
import {CapProcessor} from './capProcessor';

export class Producer {
    private id = 'csCOPProducer';
    private adapter: TestBedAdapter;
    private log = Logger.instance;
    private retries: number = 0;
    private capProcessor: CapProcessor = new CapProcessor();

    constructor(options: ITestBedOptions) {
        this.adapter = new TestBedAdapter(options);
        this.adapter.on('error', e => console.error(e));
        this.adapter.on('ready', () => {
            this.log.info('Producer is connected');
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

    private addFeatureGeometryToCAP(capAlert: Alert, geo: Geometry) {
        var capGeometry = this.capProcessor.convertGeoJSONToCAPGeometry(geo);
        var capInfo = capAlert.info as Info;
        capInfo.area[capGeometry.key] = capGeometry.val;
    }

    public sendCap(capAlertFeature: Feature, cb: Function) {
        var capAlert: Alert = CapProcessor.createDefaultAlertMessage();
        this.addFeatureGeometryToCAP(capAlert, capAlertFeature.geometry);
        capAlert.identifier = capAlertFeature.id;
        const payloads: ProduceRequest[] = [
            {
                key: {id: this.id},
                topic: 'cap',
                messages: capAlert,
                attributes: 1 // Gzip
            }
        ];
        this.adapter.send(payloads, (error, data) => {
            if (error) {
                console.error(error);
            }
            if (data) {
                console.log(data);
            }
            cb(error, data);
        });
    }
}
