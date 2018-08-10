import {IGeoJson, Feature} from 'csweb';
import {Logger} from 'node-test-bed-adapter';
import * as _ from 'underscore';

const ID_PROPERTY: string = 'guid';
const SUBENTITIES_PROPERTY: string = 'subEntities';
const SUBENTITIES_FEATURE_PROPERTY: string = 'subEntitiesFeature';

export class GeoJsonProcessor {
    private log = Logger.instance;

    constructor() {}

    public handleIncomingMessage(geojsonMessage: any) {
        this.log.info('Convert geojson to a feature');
        var ftCollection: IGeoJson = this.parseMessage(geojsonMessage);
        ftCollection = this.fixAvroMessage(ftCollection);
        return ftCollection.features;
    }

    private parseMessage(geojsonMessage): IGeoJson {
        var ftCollection;
        if (_.isObject(geojsonMessage) && geojsonMessage.hasOwnProperty('features')) {
            ftCollection = geojsonMessage as IGeoJson;
        } else if (typeof geojsonMessage === 'string') {
            try {
                ftCollection = JSON.parse(geojsonMessage) as IGeoJson;
            } catch (error) {
                this.log.error(`Error parsing geojson message: ${error}`);
            }
        }
        return ftCollection || {features: []};
    }

    private fixAvroMessage(ftCollection: IGeoJson): IGeoJson {
        if (ftCollection.features.hasOwnProperty('array')) {
            ftCollection.features = ftCollection.features['array'];
        }
        if (_.isArray(ftCollection.features)) {
            ftCollection.features.forEach(f => {
                this.fixGeometry(f);
                this.addGuid(f);
                this.splitSubentities(f);
            });
        }
        return ftCollection;
    }

    private fixGeometry(f: Feature) {
        if (f.geometry.hasOwnProperty('eu.driver.model.geojson.Point')) {
            f.geometry = f.geometry['eu.driver.model.geojson.Point'];
        } else if (f.geometry.hasOwnProperty('eu.driver.model.geojson.sim.Point')) {
            f.geometry = f.geometry['eu.driver.model.geojson.sim.Point'];
        }
    }

    private addGuid(f: Feature) {
        if (f.properties && f.properties[ID_PROPERTY]) {
            f.id = f.properties[ID_PROPERTY];
        }
    }

    private splitSubentities(f: Feature) {
        if (!f.properties || !f.properties[SUBENTITIES_PROPERTY]) return;
        let subEntities = f.properties[SUBENTITIES_PROPERTY];
        if (!_.isArray(subEntities)) return;
        // subEntities.forEach(se => f.properties[SUBENTITIES_FEATURE_PROPERTY] = se);
        //TODO: show all subEntities
        f.properties[SUBENTITIES_FEATURE_PROPERTY] = subEntities;
    }
}
