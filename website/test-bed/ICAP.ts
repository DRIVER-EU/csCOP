export enum Status {
    Actual = 'Actual',
    Exercise = 'Exercise',
    System = 'System',
    Test = 'Test',
    Draft = 'Draft'
}

export enum MsgType {
    Alert = 'Alert',
    Update = 'Update',
    Cancel = 'Cancel',
    Ack = 'Ack',
    Error = 'Error'
}

export enum Scope {
    Public = 'Public',
    Restricted = 'Restricted',
    Private = 'Private'
}

export enum Category {
    Geo = 'Geo',
    Met = 'Met',
    Safety = 'Safety',
    Security = 'Security',
    Rescue = 'Rescue',
    Fire = 'Fire',
    Health = 'Health',
    Env = 'Env',
    Transport = 'Transport',
    Infra = 'Infra',
    CBRNE = 'CBRNE',
    Other = 'Other'
}

export enum ResponseType {
    Shelter = 'Shelter',
    Evacuate = 'Evacuate',
    Prepare = 'Prepare',
    Execute = 'Execute',
    Avoid = 'Avoid',
    Monitor = 'Monitor',
    Assess = 'Assess',
    AllClear = 'AllClear',
    None = 'None'
}

export enum Urgency {
    Immediate = 'Immediate',
    Expected = 'Expected',
    Future = 'Future',
    Past = 'Past',
    Unknown = 'Unknown'
}

export enum Severity {
    Extreme = 'Extreme',
    Severe = 'Severe',
    Moderate = 'Moderate',
    Minor = 'Minor',
    Unknown = 'Unknown'
}

export enum Certainty {
    Observed = 'Observed',
    Likely = 'Likely',
    Possible = 'Possible',
    Unlikely = 'Unlikely',
    Unknown = 'Unknown'
}

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

export type PolygonType = null | undefined | string | string[];
export type CircleType = null | undefined | string | string[];

export interface Area {
    areaDesc: string;
    polygon?: PolygonType;
    circle?: CircleType;
    geocode?: null | undefined | ValueNamePair | ValueNamePair[];
    altitude?: null | undefined | number;
    ceiling?: null | undefined | number;
}

export interface Info {
    language: string | null | undefined;
    category: string | Category | Category[] | Record<'array', Category[]> | Record<'eu.driver.model.cap.Category', Category>;
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
    area?: null | undefined | Area | Area[] | Record<'array', Area[]> | Record<'eu.driver.model.cap.Area', Area>;
}

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
    info?: null | undefined | Info | Info[] | Record<'array', Info[]> | Record<'eu.driver.model.cap.Info', Info>;
}
