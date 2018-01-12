module crowdtasker {
    export class CrowdtaskerWidgetData {
        title: string;
        layerId: string;
    }

    export interface ICrowdtaskerWidgetScope extends ng.IScope {
        vm: CrowdtaskerWidgetCtrl;
        data: CrowdtaskerWidgetData;
        minimized: boolean;
        test: string;
        eventFilter: csComp.Services.GroupFilter;
        taskFilter: csComp.Services.GroupFilter;
        stepFilter: csComp.Services.GroupFilter;
        filter: csComp.Services.GroupFilter;
    }

    export class CrowdtaskerWidgetCtrl {
        private scope: ICrowdtaskerWidgetScope;
        private widget: csComp.Services.IWidget;
        private parentWidget: JQuery;
        private isHidden: boolean;
        private layer: csComp.Services.ProjectLayer;
        private allEvents: { [id: string]: IFeature } = {};
        private allTasks: { [id: string]: IFeature } = {};
        private tasks: { [id: string]: IFeature } = {};
        private allSteps: { [id: string]: IFeature } = {};
        private steps: { [id: string]: IFeature } = {};
        private allFeedbacks: { [id: string]: IFeature } = {};
        private feedbacks: { [id: string]: IFeature } = {};
        private selectedEvent: string;
        private selectedTask: string;
        private selectedStep: string;
        private selectedFeedback: string;
        private isInitialized: boolean;
        private msgBusSubscription: csComp.Services.MessageBusHandle;

        public static $inject = [
            '$scope',
            '$timeout',
            '$uibModal',
            'layerService',
            'messageBusService',
            'mapService'
        ];

        constructor(
            private $scope: ICrowdtaskerWidgetScope,
            private $timeout: ng.ITimeoutService,
            private $modal: any,
            private $layerService: csComp.Services.LayerService,
            private $messageBus: csComp.Services.MessageBusService,
            private $mapService: csComp.Services.MapService
        ) {
            $scope.vm = this;
            var par = <any>$scope.$parent;
            this.widget = par.widget;
            this.isInitialized = false;

            $scope.data = <CrowdtaskerWidgetData>this.widget.data;

            this.parentWidget = $('#' + this.widget.elementId).parent();

            this.init();

            this.msgBusSubscription = this.$messageBus.subscribe('layer', (action: string, layer: csComp.Services.ProjectLayer) => {
                if (layer && (layer.id === $scope.data.layerId)) {
                    switch (action) {
                        case 'deactivate':
                            this.reset();
                            this.isHidden = true;
                            break;
                        case 'activated':
                            this.initCrowdtasker(layer);
                            this.isHidden = false;
                            break;
                        case 'updated':
                            this.updateCrowdtasker(layer);
                            this.isHidden = false;
                            break;
                        default:
                            break;
                    }
                }
            });
        }

        private init() {
            this.isHidden = true;
            var l = this.$layerService.findLoadedLayer(this.$scope.data.layerId);
            if (l) this.initCrowdtasker(l);
        }
        
        public stop() {
            if (this.msgBusSubscription) {
                this.$messageBus.unsubscribe(this.msgBusSubscription);
            }
        }

        private reset() {
            this.isInitialized = false;
            this.allEvents = {};
            this.allTasks = {};
            this.allSteps = {};
            this.allFeedbacks = {};
            this.clear();
        }

        private clear() {
            this.tasks = {};
            this.steps = {};
            this.feedbacks = {};
            this.selectedEvent = null;
            this.selectedTask = null;
            this.selectedStep = null;
            this.selectedFeedback = null;
        }

        private initCrowdtasker(l: csComp.Services.ProjectLayer) {
            if (this.isInitialized) return;
            this.layer = l;
            if (!l || !l.data || !l.data.features) return;
            l.data.features.forEach((f) => {
                switch (f.properties.featureTypeId.toLowerCase()) {
                    case 'event':
                        this.allEvents[f.id] = f;
                        break;
                    case 'task':
                        this.allTasks[f.id] = f;
                        break;
                    case 'step':
                        this.allSteps[f.id] = f;
                        break;
                    case 'feedback':
                        this.setFeedbackDataType(f);
                        this.allFeedbacks[f.id] = f;
                        break;
                    default:
                        break;
                }
            });
            this.isInitialized = true;
            if (this.$scope.$root.$$phase !== '$apply' && this.$scope.$root.$$phase !== '$digest') {
                this.$scope.$apply();
            }
            console.log('Init crowdtasker widget')
        }

        private updateCrowdtasker(l: csComp.Services.ProjectLayer) {
            if (!this.isInitialized) this.initCrowdtasker(l);
            if (!l || !l.data || !l.data.features) return;
            console.log('Crowdtasker widget diff: ' + (l.data.features.length - this.layer.data.features.length))
            this.layer = l;
            l.data.features.forEach((f) => {
                switch (f.properties.featureTypeId.toLowerCase()) {
                    case 'event':
                        if (!this.allEvents.hasOwnProperty(f.id)) this.allEvents[f.id] = f;
                        break;
                    case 'task':
                        if (!this.allTasks.hasOwnProperty(f.id)) this.allTasks[f.id] = f;
                        break;
                    case 'step':
                        if (!this.allSteps.hasOwnProperty(f.id)) this.allSteps[f.id] = f;
                        break;
                    case 'feedback':
                        if (!this.allFeedbacks.hasOwnProperty(f.id)) {
                            this.setFeedbackDataType(f);
                            this.allFeedbacks[f.id] = f;
                        }
                        break;
                    default:
                        break;
                }
            });
            if (this.$scope.$root.$$phase !== '$apply' && this.$scope.$root.$$phase !== '$digest') {
                this.$scope.$apply();
            }
        }

        private selectEvent() {
            if (!this.selectedEvent) return;
            // this.resetFilters();
            this.tasks = _.indexBy(_.filter(this.allTasks, (t: IFeature) => { return t.properties['event_id'] === this.selectedEvent; }), 'id');
            this.selectedTask = null;
            this.selectedStep = null;
            this.selectedFeedback = null;
            // var gf = new csComp.Services.GroupFilter();
            // gf.id = 'crowdtasker-event-chart';
            // gf.group = this.layer.group;
            // gf.filterType = 'row';
            // gf.property = 'event_id';
            // gf.filterLabel = this.selectedEvent;
            // gf.title = this.allEvents[this.selectedEvent].properties['Name'];
            // this.$scope.eventFilter = gf;
        }

        private selectTask() {
            if (!this.selectedTask) return;
            this.steps = _.indexBy(_.filter(this.allSteps, (s: IFeature) => { return s.properties['task_id_step'] === this.selectedTask; }), 'id');
            this.selectedStep = null;
            this.selectedFeedback = null;
        }

        private selectStep() {
            if (!this.selectedStep) return;
            this.feedbacks = _.indexBy(_.filter(this.allFeedbacks, (f: IFeature) => { return f.properties['step_id'] === this.selectedStep; }), 'id');
            this.selectedFeedback = null;
            this.createFeedbackChart();
        }

        private selectFeedback() {
            if (!this.selectedFeedback) return;
            this.$layerService.selectFeature(this.allFeedbacks[this.selectedFeedback]);
        }

        private createFeedbackChart() {
            var gf = new csComp.Services.GroupFilter();
            switch (this.allSteps[this.selectedStep].properties['template'].toLowerCase()) {
                case 'free_text':
                case 'choice_single':
                case 'choice_multiple':
                    gf.property = "data_string";
                    break;
                case 'number':
                    gf.property = "data_number";
                    break;
                default:
                    gf.property = "data";
                    break;
            }
            gf.id = 'crowdtasker-feedback-chart';
            gf.group = this.layer.group;
            gf.group.ndx = crossfilter([]);
            gf.group.ndx.add(_.values(this.feedbacks));
            gf.title = this.allSteps[this.selectedStep].properties['Name'];
            gf.filterLabel = null;
            gf.filterType = 'row';
            gf.group.filters = [];
            gf.group.filters.push(gf);
            this.$timeout(() => {
                this.$scope.filter = gf;
                this.$scope.filter.showInWidget = true;
                this.updateRowFilterScope(gf);
            });
            var propType = this.$layerService.findPropertyTypeById(this.layer.typeUrl + '#' + gf.property);
            this.$layerService.setGroupStyle(this.layer.group, propType);
        }

        private setFeedbackDataType(f: IFeature) {
            if (f.properties && f.properties['step_id']) {
                if (this.allSteps.hasOwnProperty(f.properties['step_id'])) {
                    var step = this.allSteps[f.properties['step_id']];
                    switch (step.properties['template'].toLowerCase()) {
                        case 'free_text':
                        case 'choice_single':
                        case 'choice_multiple':
                            f.properties['data_string'] = f.properties['data'];
                            break;
                        case 'number':
                            f.properties['data_number'] = f.properties['data'];
                            break;
                        default:
                            break;
                    }
                }
            }
        }

        private resetFilters() {
            if (this.layer) {
                delete this.$scope.eventFilter;
                delete this.$scope.filter;
                // this.$layerService.refreshLayer(this.layer.id);
            }
        }

        private updateRowFilterScope(gf: csComp.Services.GroupFilter) {
            var rowFilterElm = angular.element($("#filter_crowdtasker-feedback-chart"));
            if (!rowFilterElm) {
                console.log('rowFilterElm not found.');
                return;
            }
            var rowFilterScope = <Filters.IRowFilterScope>rowFilterElm.scope();
            if (!rowFilterScope) {
                console.log('rowFilterScope not found.');
                return;
            } else {
                rowFilterScope.filter = gf;
                rowFilterScope.vm.initRowFilter();
                return;
            }
        }

        private zoomToFeedbacks() {
            var data = { features: _.values(this.feedbacks) };
            var bb = csComp.Helpers.GeoExtensions.getBoundingBox(data);
            this.$mapService.map.fitBounds(new L.LatLngBounds(bb.southWest, bb.northEast), { paddingTopLeft: new L.Point(500, 50), paddingBottomRight: new L.Point(100, 75), maxZoom: 18 });
        }

        private getFeedbackLength() {
            return Object.keys(this.feedbacks).length;
        }

        private getKeysAndValuesOfEnum(e: any): { [key: string]: any } {
            let result = {};
            let keys = Object.keys(e)
                .filter(v => isNaN(parseInt(v, 10)));
            let vals = Object.keys(e)
                .map(v => parseInt(v, 10))
                .filter(v => !isNaN(v));
            if (keys.length === vals.length) {
                keys.forEach((k, index) => {
                    result[k] = vals[index];
                });
            }
            return result;
        }
    }


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
}