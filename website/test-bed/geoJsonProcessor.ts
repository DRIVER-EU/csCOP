import {IGeoJson} from 'csweb';
import {Logger} from 'node-test-bed-adapter';
import * as _ from 'underscore';

export class GeoJsonProcessor {
    private log = Logger.instance;

    constructor() {}

    public handleIncomingMessage(geojsonMessage: any) {
        this.log.info('Convert geojson to a feature');
        var ftCollection: IGeoJson;
        if (_.isObject(geojsonMessage) && geojsonMessage.hasOwnProperty('features')) {
            ftCollection = geojsonMessage as IGeoJson;
        } else if (typeof geojsonMessage === 'string') {
            try {
                ftCollection = JSON.parse(geojsonMessage) as IGeoJson;
            } catch (error) {
                this.log.error(`Error parsing geojson message: ${error}`);
                return [];
            }
        }
        //TODO: parse better
        if (ftCollection && ftCollection.features && ftCollection.features.hasOwnProperty('array')) {
            ftCollection.features = ftCollection.features['array'];
        }
        if (_.isArray(ftCollection.features)) {
            ftCollection.features.forEach((f) => {
                if (f.geometry.hasOwnProperty('eu.driver.model.geojson.Point')) {
                    f.geometry = f.geometry['eu.driver.model.geojson.Point'];
                } else if (f.geometry.hasOwnProperty('eu.driver.model.geojson.sim.Point')) {
                    f.geometry = f.geometry['eu.driver.model.geojson.sim.Point'];
                }
                if (f.properties && f.properties['guid']) {
                    f.id = f.properties['guid'];
                }
            });
        }
        return ftCollection.features;
    }
}
