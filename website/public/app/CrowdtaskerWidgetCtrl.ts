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

            $scope.data = <CrowdtaskerWidgetData>this.widget.data;

            this.parentWidget = $('#' + this.widget.elementId).parent();

            this.init();

            this.$messageBus.subscribe('layer', (action: string, layer: csComp.Services.ProjectLayer) => {
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
                        default:
                            break;
                    }
                }
            });
        }

        private init() {
            this.isHidden = true;
        }
        
        private reset() {
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
            this.layer = l;
            if (!l.data || !l.data.features) return;
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
                        this.allFeedbacks[f.id] = f;
                        break;
                    default:
                        break;
                }
            });
            if (this.$scope.$root.$$phase !== '$apply' && this.$scope.$root.$$phase !== '$digest') {
                this.$scope.$apply();
            }
            console.log('Init crowdtasker widget')
        }
        
        private selectEvent() {
            if (!this.selectedEvent) return;
            this.tasks = _.indexBy(_.filter(this.allTasks, (t: IFeature) => {return t.properties['event_id'] === this.selectedEvent;}), 'id');
            this.selectedTask = null;
            this.selectedStep = null;
            this.selectedFeedback = null;
        }
        
        private selectTask() {
            if (!this.selectedTask) return;
            this.steps = _.indexBy(_.filter(this.allSteps, (s: IFeature) => {return s.properties['task_id_step'] === this.selectedTask;}), 'id');
            this.selectedStep = null;
            this.selectedFeedback = null;
        }
        
        private selectStep() {
            if (!this.selectedStep) return;
            this.feedbacks = _.indexBy(_.filter(this.allFeedbacks, (f: IFeature) => {return f.properties['step_id'] === this.selectedStep;}), 'id');
            this.selectedFeedback = null;            
        }
        
        private selectFeedback() {
            if (!this.selectedFeedback) return;
            this.$layerService.selectFeature(this.allFeedbacks[this.selectedFeedback]);           
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