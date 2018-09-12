import * as _ from 'underscore';
import * as csweb from 'csweb';
import {Logger} from 'node-test-bed-adapter';
import {Feature} from 'csweb';

export class FeatureCacher {
    private id = 'csCOPconsumer';
    private apiFunction: (fts: any[], layerId: string) => void;
    private log = Logger.instance;

    private cache: {[layerId: string]: Feature[]} = {};

    constructor(apiFunction: (fts: any[], layerId: string) => void) {
        this.apiFunction = apiFunction;
        this.log.info(`Created FeatureCacher with cs apiManager ${this.apiFunction}`);
    }

    public sendFeatureUpdates(fts: any[], layerId: string) {
        this.addToCache(fts, layerId);
        this.apiFunction(fts, layerId);
    }

    public sendAllFeatures(layerId: string) {
        if (!this.cache || !this.cache.hasOwnProperty(layerId)) return;
        this.apiFunction(this.cache[layerId], layerId);
    }

    private addToCache(fts: any[], layerId: string) {
        if (!this.cache || !this.cache.hasOwnProperty(layerId)) this.cache[layerId] = [];
        var layerCache = this.cache[layerId];
        layerCache = layerCache.concat(fts);
        layerCache = _.uniq(layerCache, f => f.id);
        this.log.info(`FeatureCacher: cache ${layerId} contains ${layerCache.length} features`);
    }
}
