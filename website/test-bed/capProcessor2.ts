import {PolygonType} from './ICAP';
import {Alert, Area, Info, Status, Category, Certainty, MsgType, ResponseType, Scope, Severity, Urgency} from './ICAP';
import {Feature, newGuid, Geometry} from 'csweb';
import {Logger} from 'node-test-bed-adapter';
import * as _ from 'underscore';
import {CAPProcessor} from './capProcessor';

export class CapProcessor2 {
    private log = Logger.instance;

    constructor() {}

    public handleIncomingCAP(capAlert: Alert) {
        this.log.info('Convert CAP to a feature');
        var fts: Feature[] = [];
        if (!capAlert.info) {
            this.log.info('No info field found in CAP message');
            return;
        }
        var capInfos: Info[];
        if (capAlert.info.hasOwnProperty('array')) {
            capInfos = capAlert.info['array'];
        } else if (capAlert.info.hasOwnProperty('eu.driver.model.cap.Info')) {
            capInfos = [capAlert.info['eu.driver.model.cap.Info']];
        } else {
            this.log.info('No valid info field found in CAP message');
            return;
        }
        capInfos.forEach((capInfo: Info) => {
            fts = fts.concat(this.parseInfo(capInfo, capAlert));
        });
        return fts;
    }

    private parseInfo(capInfo: Info, capAlert: Alert): Feature[] {
        var fts: Feature[] = [];
        var f = CapProcessor2.createFeature();
        f.id = capAlert.identifier;
        var capAreas: Area[];
        if (capInfo.hasOwnProperty('array')) {
            capAreas = capInfo.area['array'];
        } else if (capInfo.area.hasOwnProperty('eu.driver.model.cap.Area')) {
            capAreas = <Area[]>[capInfo.area['eu.driver.model.cap.Area']];
        } else {
            this.log.info('No valid info field found in CAP message');
            return;
        }
        capAreas.forEach((area: Area) => {
            if (area.polygon) {
                let polygon: string = area.polygon && area.polygon['string'] ? area.polygon['string'] : area.polygon['array'].shift();
                f.geometry = this.convertCAPGeometryToGeoJSON(polygon, 'polygon');
                f.properties.featureTypeId = 'AlertPolygon';
            } else if (area.circle) {
                let circle: string = area.circle && area.circle['string'] ? area.circle['string'] : area.circle['array'].shift();
                f.geometry = this.convertCAPGeometryToGeoJSON(circle, 'circle');
                f.properties.featureTypeId = 'AlertPoint';
            } else {
                this.log.warn('No valid CAP geometry found.');
                return;
            }
            f.properties = CapProcessor2.flattenCapProperties(f.properties, area);
            f.properties = CapProcessor2.flattenCapProperties(f.properties, capInfo);
            f.properties = CapProcessor2.flattenCapProperties(f.properties, capAlert);
            fts.push(f);
        });
        return fts;
    }

    static blacklistProps = ['info', 'area'];
    /** Flattens nested properties and extends them */
    private static flattenCapProperties(props: _.Dictionary<any>, capThing: Area | Info | Alert) {
        let capThingStringOnly = _.mapObject(capThing, (val, key) => {
            if (CapProcessor2.blacklistProps.indexOf(key) >= 0) return null;
            if (val === null) return null;
            if (typeof val === 'string') return val;
            if (typeof val === 'object') {
                if (val.hasOwnProperty('array')) {
                    return val['array'].join(';');
                } else if (val.hasOwnProperty('string')) {
                    return val['string'];
                } else {
                    return _.values(val).join(';');
                }
            }
            return val.toString();
        });
        return _.extend(props, capThingStringOnly);
    }

    private static createFeature(): Feature {
        return <Feature>{
            type: 'Feature',
            id: newGuid(),
            properties: {},
            geometry: null
        };
    }

    public static createDefaultAlertMessage(): Alert {
        var alertMsg: any = {
            identifier: 'CSWEB',
            sender: 'csCOP',
            sent: CapProcessor2.convertDateToCAPDate(new Date()), //'2016-03-31T11:33:00+02:00',//(new Date().toISOString()).replace('Z','+02:00'),
            status: Status.Test,
            msgType: MsgType.Alert,
            scope: Scope.Public,
            addresses: '',
            info: {
                language: 'EN',
                category: Category.Met,
                event: 'Monitor',
                urgency: Urgency.Immediate,
                severity: Severity.Severe,
                certainty: Certainty.Observed,
                headline: 'Headline',
                area: {
                    areaDesc: 'Testarea'
                }
            }
        };
        return alertMsg;
    }

    /**
     * Takes a date object, outputs a CAP date string
     */
    private static convertDateToCAPDate(date: Date): string {
        if (!date) return;
        var tdiff = date.getTimezoneOffset();
        var tdiffh = Math.floor(Math.abs(tdiff / 60));
        var tdiffm = tdiff % 60;
        var tdiffpm = tdiff <= 0 ? '-' : '+';
        var iso = date
            .toISOString()
            .split('.')
            .shift();
        iso = ''.concat(iso, tdiffpm, tdiffh < 10 ? '0' : '', tdiffh.toFixed(0), ':', tdiffm < 10 ? '0' : '', tdiffm.toFixed(0));
        return iso;
    }

    /**
     * Takes a a GeoJSON Polygon or Point {type, coordinates: [[y,x],[y,x]]} (WGS84)
     * Outputs a CAP Polygon in the format: "x,y x,y x,y" or Circle in the format "x,y r" (r in km)
     * Optionally provide a circle radius in km, in case a point is provided (default: 10km)
     */
    public convertGeoJSONToCAPGeometry(
        geo: Geometry,
        radiusKM: number = 10
    ): {
        key: string;
        val: string;
    } {
        if (!geo || !geo.type || !geo.coordinates) return;
        var capCoords = '';
        var coords = geo.coordinates;
        if (geo.type.toLowerCase() === 'polygon') {
            for (let i = 0; i < coords[0].length; i++) {
                let cc = coords[0][i];
                capCoords += cc[1] + ',' + cc[0] + ' ';
            }
            capCoords = capCoords.substr(0, capCoords.length - 1); //Remove last space
        } else if (geo.type.toLowerCase() === 'point') {
            capCoords = coords[1] + ',' + coords[0] + ' ' + radiusKM;
        } else {
            this.log.warn('Could not convert GeoJSON geometry to CAP');
        }
        this.log.info(`Converted ${JSON.stringify(geo)} to ${capCoords}`);
        var type = geo.type.toLowerCase() === 'polygon' ? 'polygon' : 'circle';
        return {
            key: type,
            val: capCoords
        };
    }

    /**
     * Takes a CAP Polygon in the format: "x,y x,y x,y". (WGS84)
     * Outputs a GeoJSON geometry {type, coordinates: [[y,x],[y,x]]}.
     */
    private convertCAPGeometryToGeoJSON(capPoly: string, cisType: string) {
        if (!capPoly) return;
        var result;
        var cisCoords = capPoly.split(' ');
        switch (cisType) {
            case 'polygon':
                result = {
                    type: 'Polygon',
                    coordinates: [[]]
                };
                for (let i = 0; i < cisCoords.length; i++) {
                    let cc = cisCoords[i];
                    let xy = cc.split(',');
                    result.coordinates[0].push([+xy[1], +xy[0]]);
                }
                break;
            case 'circle':
                let xy = cisCoords[0]
                    .split(' ')
                    .shift()
                    .split(',');
                result = {
                    type: 'Point',
                    coordinates: [+xy[1], +xy[0]]
                };
                break;
            default:
                this.log.warn('Could not convert CAP geometry');
                break;
        }
        this.log.info(`Converted ${capPoly} to ${JSON.stringify(result)}`);
        return result;
    }
}
