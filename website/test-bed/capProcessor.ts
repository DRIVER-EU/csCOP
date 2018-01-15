import { Logger } from "node-test-bed-adapter";
import { Exception } from "winston";
import * as _ from "underscore";

export interface CAPObject {
  properties: _.Dictionary<any>;
  area: any;
}

export class CAPProcessor {
  private log = Logger.instance;

  public static handleIncomingCAP(data: string) {
    // console.log(data);
    var capArr;
    try {
      capArr = JSON.parse(data);
    } catch (err) {
      console.error(`Error parsing CAP data: ${err}`);
    }
    if (!capArr) {
      return;
    }
    return CAPProcessor.capToAreas(capArr);
  }

  private static capToAreas(capArr: any) {
    var result = [];
    CAPProcessor.findObjectsByKey(capArr, "eu.driver.model.cap.Area", result);
    return CAPProcessor.capToGeojson(capArr, result);
  }

  private static capToGeojson(cap: any, areas: any[]) {
    if (!areas || !_.isArray(areas) || areas.length === 0) {
      return;
    }
    var features = [];
    areas.forEach(area => {
      if (area.hasOwnProperty("circle")) {
        if (area["circle"]) {
          features.push(CAPProcessor.createCircleFeature(area));
        }
      }
      if (area.hasOwnProperty("polygon")) {
        if (area["polygon"]) {
          features.push(CAPProcessor.createPolygonFeature(area));
        }
      }
    });
    var properties = {};
    if (cap && cap.info && cap.info) {
      if (cap.info["eu.driver.model.cap.Info"]) {
        var info = cap.info["eu.driver.model.cap.Info"];
        if (info.senderName) {
          properties["senderName"] = info.senderName;
        }
        if (info.certainty) {
          properties["certainty"] = info.certainty;
        }
        if (info.description) {
          properties["description"] = info.description;
        }
        if (info.event) {
          properties["event"] = info.event;
        }
      }
    }
    _.each(features, f => {
      _.extend(f.properties, properties);
      f.properties["Name"] = properties['headline']  || properties['event'];
    });
    return features;
  }

  private static createCircleFeature(area: any) {
    var circle = area["circle"];
    if (_.isObject(circle)) circle = circle["string"];
    var circleCoords = circle
      .split(" ")
      .shift()
      .split(",");
    var circleRadius = circle.split(" ").pop();
    var coordinates = _.map(circleCoords, c => {
      return +c;
    }).reverse();
    var properties = {
      Name: "Point",
      description: area["areaDesc"],
      featureTypeId: "Point"
    };
    var ft = {
      id: circle,
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: coordinates
      },
      properties: properties
    };
    return ft;
  }

  private static createPolygonFeature(area: any) {
    var polygon = area["polygon"];
    if (_.isObject(polygon)) polygon = polygon["string"];
    var circleCoords = polygon.split(" ");
    var coordinates = _.map(circleCoords, (val: string) => {
      let vals = val.toString().split(",");
      return _.map(vals, v => {
        return +v;
      }).reverse();
    });
    var properties = {
      description: area["areaDesc"],
      featureTypeId: "Polygon",
      Name: "Polygon"
    };
    var ft = {
      id: polygon,
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [coordinates]
      },
      properties: properties
    };
    return ft;
  }

  private static findObjectsByKey(obj: any, key: string, result?: any[]) {
    if (_.isString(obj)) {
      return;
    }
    if (_.isArray(obj)) {
      obj.forEach(arrObj => {
        return CAPProcessor.findObjectsByKey(arrObj, key, result);
      });
    }
    if (_.isObject(obj)) {
      if (obj.hasOwnProperty(key)) {
        result.push(obj[key]);
      } else {
        Object.keys(obj).forEach(k => {
          return CAPProcessor.findObjectsByKey(obj[k], key, result);
        });
      }
    }
  }
}
