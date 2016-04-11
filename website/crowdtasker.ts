var _converterOptions;
var fTemplate: IFeature = {
    id: null,
    type: 'Feature',
    properties: {},
    geometry: {
        type: null,
        coordinates: null
    }
};
export function getData(request: any, dataParameters: any, converterOptions: any, cb: Function) {
    if (typeof dataParameters !== 'object') return cb(null);
    _converterOptions = converterOptions;
    _converterOptions.request = request;
    _converterOptions.dataParameters = dataParameters;
    var options = {
        json: true
    };
    Object.keys(dataParameters).forEach(key => {
        options[key] = dataParameters[key];
    });
    if (options.hasOwnProperty('url')) {
        options['baseUrl'] = JSON.parse(JSON.stringify(options['url']));
    }
    _converterOptions.options = options;

    //Get events
    options['uri'] = '/events?api_key=' + options['api_key'];
    requestEvents(request, options, (eventFeatures) => {
        if (typeof eventFeatures === 'number') {
            cb(eventFeatures); // If http statuscode received, pass it through
            return;
        }
        var processedEvents = 0;
        eventFeatures.forEach((f: IFeature, fIndex) => {
            // Get event stats
            options['uri'] = ('/stats/activations/' + f['id'] + '?api_key=' + options['api_key']);
            console.log(options['uri']);
            requestEventStats(request, options, (eventStats: AStats) => {
                processedEvents += 1;
                var keys = Object.keys(eventStats);
                for (var keyIndex = 0; keyIndex < keys.length; keyIndex++) {
                    var key = keys[keyIndex];
                    f.properties['stat_' + key] = eventStats[key];
                }
                if (processedEvents >= eventFeatures.length) {
                    processTasks(request, options, eventFeatures, cb);
                    // cb(eventFeatures);
                }
            });
        });
        if (eventFeatures.length === 0) {
            cb(eventFeatures);
        }
    });
}

// Get event tasks
function processTasks(request, options, eventFeatures, cb) {
    var processedEvents = 0;
    var allTaskFeatures = [];
    eventFeatures.forEach((ef: IFeature, efIndex) => {
        options['uri'] = `/tasks?event=${ef.id}&api_key=${options['api_key']}`;
        console.log(options['uri']);
        requestTasks(request, options, (taskFeatures: IFeature[]) => {
            if (typeof taskFeatures === 'number') {
                console.log('Error requesting tasks: ' + taskFeatures);
            } else {
                for (let i = 0; i < taskFeatures.length; i++) {
                    let task = taskFeatures[i];
                    if (task.properties.hasOwnProperty('category') && task.properties['category'] !== '') {
                        task.properties['icon'] = ''.concat('ocha/', task.properties['category'].replace(/[/]/g, '_'), '_32px_icon');
                    } else {
                        task.properties['icon'] = 'ocha/unknown';
                    }
                    // Get task stats
                    options['uri'] = ('/stats/feedbacks/' + task['id'] + '?api_key=' + options['api_key']);
                    console.log(options['uri']);
                    requestTaskStats(request, options, (taskStats: FStats) => {
                        let keys = Object.keys(taskStats);
                        for (let keyIndex = 0; keyIndex < keys.length; keyIndex++) {
                            let key = keys[keyIndex];
                            task.properties['stat_' + key] = taskStats[key];
                        }
                    });
                }
                allTaskFeatures = allTaskFeatures.concat(taskFeatures);
            }
            processedEvents += 1;
            if (processedEvents >= eventFeatures.length) {
                processFeedbacks(request, options, eventFeatures, allTaskFeatures, cb)
            }
        });
    });
}

// Get task feedbacks
function processFeedbacks(request, options, eventFeatures, taskFeatures, cb) {
    var processedTasks = 0;
    var allFeedbacks = [];
    taskFeatures.forEach((t: IFeature, tIndex) => {
        if (t.properties['featureTypeId'] && t.properties['featureTypeId'] !== 'Task') {
            processedTasks += 1;
            return;
        }
        options['uri'] = `/tasks/feedbacks?task=${t.id}&api_key=${options['api_key']}`;
        console.log(options['uri']);
        requestFeedbacks(request, options, (feedbackFeatures: IFeature[]) => {
            if (typeof feedbackFeatures === 'number') {
                console.log('Error requesting tasks: ' + feedbackFeatures);
            } else {
                for (var i = 0; i < feedbackFeatures.length; i++) { 
                    feedbackFeatures[i].properties['icon'] = t.properties['icon'] || 'ocha/unknown';
                }
                allFeedbacks = allFeedbacks.concat(feedbackFeatures);
            }
            processedTasks += 1;
            if (processedTasks === taskFeatures.length) {
                cb(eventFeatures.concat(taskFeatures, allFeedbacks));
            }
        });
    });
    if (taskFeatures.length === 0) {
        cb(eventFeatures);
    }
}

function requestEvents(request, options, cb) {
    request.get(options, (err, response, data) => {
        if (err || response.statusCode !== 200) {
            cb([]);
            return;
        }
        parseEventData(data, (features) => {
            cb(features);
        });
    });
}

function requestTasks(request, options, cb) {
    request.get(options, (err, response, data) => {
        if (err || response.statusCode !== 200) {
            cb([]);
            return;
        }
        parseTaskData(data, (features) => {
            cb(features);
        });
    });
}

function requestFeedbacks(request, options, cb) {
    request.get(options, (err, response, data) => {
        if (err || response.statusCode !== 200) {
            cb([]);
            return;
        }
        parseFeedbackData(data, (features) => {
            cb(features);
        });
    });
}

function requestEventStats(request, options, cb) {
    request.get(options, (err, response, data) => {
        if (err || response.statusCode !== 200) {
            cb(response.statusCode);
            return;
        }
        if (!data || typeof data !== 'object') data = {};
        cb(<AStats>data);
    });
}

function requestTaskStats(request, options, cb) {
    request.get(options, (err, response, data) => {
        if (err || response.statusCode !== 200) {
            cb(response.statusCode);
            return;
        }
        if (!data || typeof data !== 'object') data = {};
        cb(<FStats>data);
    });
}

function parseEventData(data: any, callback: Function) {
    if (!data || !data.forEach) {
        callback([]);
        return;
    }
    var processedEvents = 0;
    var eventFeatures = [];
    data.forEach((e: Event, eventIndex) => {
        var f = JSON.parse(JSON.stringify(fTemplate));
        var keys = Object.keys(e);
        for (var keyIndex = 0; keyIndex < keys.length; keyIndex++) {
            var key = keys[keyIndex];
            if (key === 'area') {
                var area: Area = e[key];
                f.properties['area_description'] = area.description;
                f.geometry = area.region;
                f.geometry['type'] = 'MultiLineString';
                delete f.geometry['crs']; // Should be an object according to GeoJSON specification
            } else if (key === 'id') {
                f.id = e[key];
            } else {
                f.properties[key] = e[key];
            }
        }
        f.properties['featureTypeId'] = 'Event';
        processedEvents += 1;
        eventFeatures.push(f);
        if (processedEvents >= data.length) {
            callback(eventFeatures);
        }
    });
}

function parseTaskData(data: any, callback: Function) {
    if (!data || !data.forEach) {
        callback([]);
        return;
    }
    var processedFeatures = 0;
    var taskFeatures = [];
    var stepFeatures = [];
    data.forEach((t: Task, eventIndex) => {
        var f = JSON.parse(JSON.stringify(fTemplate));
        var keys = Object.keys(t);
        for (var keyIndex = 0; keyIndex < keys.length; keyIndex++) {
            var key = keys[keyIndex];
            if (key === 'area') {
                var area: Area = t[key];
                f.properties['area_description'] = area.description;
                f.geometry = area.region;
                f.geometry['type'] = 'MultiLineString';
                delete f.geometry['crs']; // Should be an object according to GeoJSON specification
            } else if (key === 'steps') {
                for (var c = 0; c < t['steps'].length; c++) {
                    var fStep = JSON.parse(JSON.stringify(fTemplate));
                    var step = t['steps'][c];
                    var stepKeys = Object.keys(step);
                    for (var propInd = 0; propInd < stepKeys.length; propInd++) {
                        var stepKey = stepKeys[propInd];
                        if (stepKey === 'choices') {
                            fStep.properties[stepKey] = JSON.stringify(step[stepKey], null, 2);
                        } else if (stepKey === 'id') {
                            fStep.id = step[stepKey];
                        } else {
                            fStep.properties[stepKey] = step[stepKey];
                        }
                    }
                    delete fStep.geometry;
                    fStep.properties['task_id_step'] = t['id'];
                    fStep.properties['featureTypeId'] = 'Step';
                    stepFeatures.push(fStep);
                }
            } else if (key === 'id') {
                f.id = t[key];
            } else {
                f.properties[key] = t[key];
            }
        }
        f.properties['featureTypeId'] = 'Task';
        taskFeatures.push(f);
        processedFeatures += 1;
        if (processedFeatures >= data.length) {
            callback(taskFeatures.concat(stepFeatures));
        }
    });
    if (data.length === 0) {
        callback(taskFeatures.concat(stepFeatures));
    }
}

function parseFeedbackData(data: any, callback: Function) {
    if (!data || !data.forEach) {
        callback([]);
        return;
    }
    var processedFeatures = 0;
    var feedbackFeatures = [];
    data.forEach((tf: TFeedback) => {
        if (tf.hasOwnProperty('feedbacks') && tf.feedbacks.length > 0) {
            for (var fbCount = 0; fbCount < tf.feedbacks.length; fbCount++) {
                var fb: FBContent = tf.feedbacks[fbCount];
                var f = JSON.parse(JSON.stringify(fTemplate));
                // Add feedback parameters
                var tfKeys = Object.keys(tf);
                for (var keyIndex = 0; keyIndex < tfKeys.length; keyIndex++) {
                    var key = tfKeys[keyIndex];
                    if (key === 'feedbacks') {
                        continue;
                    } else if (key === 'id') {
                        f.id = tf[key] + '-' + fbCount;
                    } else {
                        f.properties[key] = tf[key];
                    }
                }
                var fbKeys = Object.keys(fb);
                for (var keyIndex = 0; keyIndex < fbKeys.length; keyIndex++) {
                    var key = fbKeys[keyIndex];
                    if (key === 'position') {
                        f.geometry = fb[key];
                        delete f.geometry['crs']; // Should be an object according to GeoJSON specification
                    } else if (key === 'attachment_id') {
                        f.properties[key] = fb[key];
                        f.properties['attachment_url'] = `[url=${_converterOptions.dataParameters.baseUrl}/data/api/attachments/${fb[key]}.jpg]Link[/url]`;
                        f.properties['attachment_img'] = [`${_converterOptions.dataParameters.baseUrl}/data/api/attachments/${fb[key]}.jpg`];
                        getAttachment(fb[key]);
                    } else {
                        f.properties[key] = fb[key];
                    }
                }
                f.properties['featureTypeId'] = 'Feedback';
                if (!f.geometry.coordinates) {
                    delete f.geometry;
                }
                feedbackFeatures.push(f);
            }
        }
        processedFeatures += 1;
        if (processedFeatures >= data.length) {
            callback(feedbackFeatures);
        }
    });
    if (data.length === 0) {
        callback(feedbackFeatures);
    }
}

function getAttachment(id: string) {
    if (!_converterOptions.hasOwnProperty('apiManager')) return;
    if (!_converterOptions.hasOwnProperty('dataParameters')) return;
    if (!_converterOptions['dataParameters'].hasOwnProperty('attachmentPath')) return;
    var attachmentPath = _converterOptions['dataParameters']['attachmentPath'];
    var apiMan = _converterOptions['apiManager'];
    var options = JSON.parse(JSON.stringify(_converterOptions['options']));
    var request = _converterOptions['request'];
    var fs = _converterOptions['fs'];

    // Check if file exists
    var file = `${attachmentPath}\\${id}.jpg`;
    fs.access(file, (err) => {
        if (err) {
            fs.ensureFileSync(file);
            options['uri'] = `/tasks/feedbacks/attachments/${id}?api_key=${options['api_key']}`;
            request.get(options, (err, response, data) => {
                if (err || response.statusCode !== 200) {
                    console.log('Error getting attachment.' + err);
                    return;
                }
                var fStream = fs.createWriteStream(file);
                request(options).pipe(fStream).on('close', () => {
                    console.log('Written attachment.');
                    fStream.end();
                });
            });
        } else {
            console.log('Skipping attachment.');
        }
    });
}

interface IFeature {
    id: string;
    type: string;
    properties: {};
    geometry: {
        type: string;
        coordinates: any[];
    };
};

interface Event {
    id: string;
    name: string;
    status: string; //[]"ACTIVE", "CLOSED"]
    type: string; //['OTHER', 'CBRN', 'DROUGHT', 'EARTHQUAKE', 'FLOOD', 'HEAT', 'PANDEMIC']
    date_start: string;
    date_end: string;
    description: string;
    area: Area;
};

interface Area {
    description: string;
    region: PositionPolygon;
};

interface PositionPolygon {
    type: string;
    crs: string;
    coordinates: Object;
};

interface AStats {
    TOTAL: number;
    OPEN: number;
    ACCEPTED: number;
    DECLINED: number;
}

interface FStats {
    TOTAL: number;
    OPEN: number;
    ACCEPTED: number;
    EXECUTING: number;
    DECLINED: number;
    FINISHED: number;
}

interface Task {
    id: string;
    event_id: string;
    name: string;
    status: string;
    description: string;
    category: string;
    date_deadline: string;
    steps: Step[];
    area: Area;
}

interface Step {
    id: string;
    name: string;
    description: string;
    template: string;
    choices: string[];
}

interface TFeedback {
    id: string;
    task_id: string;
    status: string;
    publish_allowed: boolean;
    date_completed: string;
    feedbacks: FBContent[];
}

interface FBContent {
    step_id: string;
    position: PositionPolygon;
    data: string;
    attachment_id: string;
}
