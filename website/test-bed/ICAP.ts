import { Polygon } from "leaflet";

export enum Status { Actual, Exercise, System, Test, Draft };

export enum MsgType { Alert, Update, Cancel, Ack, Error };

export enum Scope { Public, Restricted, Private };

export enum Category { Geo, Met, Safety, Security, Rescue, Fire, Health, Env, Transport, Infra, CBRNE, Other };

export enum ResponseType { Shelter, Evacuate, Prepare, Execute, Avoid, Monitor, Assess, AllClear, None };

export enum Urgency { Immediate, Expected, Future, Past, Unknown };

export enum Severity { Extreme, Severe, Moderate, Minor, Unknown };

export enum Certainty { Observed, Likely, Possible, Unlikely, Unknown };

export interface ValueNamePair {
	valueName: string;
	value: string;
}

export interface Resource {
	resourceDesc: string;
	size?: null | undefined | number;
	uri?: null | undefined | string;
	deferUri?: null | undefined | string;
	digest?: null | undefined | string;
}

export type PolygonType = null | undefined | Record<'string', string> | Record<'array', string[]>;
export type CircleType = null | undefined | Record<'string', string> | Record<'array', string[]>;

export interface Area {
	areaDesc: string;
	polygon?: PolygonType;
	circle?: CircleType;
	geocode?: null | undefined | ValueNamePair | ValueNamePair[];
	altitude?: null | undefined | number;
	ceiling?: null | undefined | number;
}

export type AreaKey = 'eu.driver.model.cap.Area' | 'array';

export interface Info {
	language: string | null | undefined;
	category: Category | Category[];
	event: string;
	responseType?: null | undefined | ResponseType | ResponseType[];
	urgency: Urgency;
	severity: Severity;
	certainty: Certainty;
	audience?: null | undefined | string;
	eventCode?: null | undefined | ValueNamePair | ValueNamePair[];
	effective?: null | undefined | string;
	onset?: null | undefined | string;
	expires?: null | undefined | string;
	senderName?: null | undefined | string;
	headline?: null | undefined | string;
	description?: null | undefined | string;
	instruction?: null | undefined | string;
	web?: null | undefined | string;
	contact?: null | undefined | string;
	parameter?: null | undefined | ValueNamePair | ValueNamePair[];
	resource?: null | undefined | Resource | Resource[];
	area?: null | undefined |  Record<'array', Area[]> | Record<'eu.driver.model.cap.Area', Area>;
}

export type InfoKey = 'eu.driver.model.cap.Info' | 'array';

export interface Alert {
	identifier: string;
	sender: string;
	sent: string;
	status: Status;
	msgType: MsgType;
	source?: null | undefined | string;
	scope: Scope;
	restriction?: null | undefined | string;
	addresses?: null | undefined | string;
	code?: null | undefined | string | string[];
	note?: null | undefined | string;
	references?: null | undefined | string;
	incidents?: null | undefined | string;
	info?: null | undefined | Record<'array', Info[]> | Record<'eu.driver.model.cap.Info', Info>;
}
