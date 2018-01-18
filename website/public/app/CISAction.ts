module CISAction {
    export interface ICISActionSettings {
        url: string;
    }

    import IFeature = csComp.Services.IFeature;
    import IProjectLayer = csComp.Services.IProjectLayer;
    import IActionOption = csComp.Services.IActionOption;
  
    export class CISAction implements csComp.Services.IActionService {
        public id: string = 'CISAction';
        private layerService: csComp.Services.LayerService;

        stop() { }
        addFeature(feature: IFeature) { }
        removeFeature(feature: IFeature) { }
        selectFeature(feature: IFeature) { }
        addLayer(layer : csComp.Services.IProjectLayer) {}
        removeLayer(layer : csComp.Services.IProjectLayer) {}

        getFeatureActions(feature: IFeature): IActionOption[] {
            if (!feature) return [];
            var sendCISMessageOption = <IActionOption>{
                title: 'Send CIS message'
            };
            sendCISMessageOption.callback = this.sendCISMessage;
            return [sendCISMessageOption];
        }

        getFeatureHoverActions(feature: IFeature): IActionOption[] {
            return [];
        }

        deselectFeature(feature: IFeature) { }

        updateFeature(feuture: IFeature) { }
        
        getLayerActions(layer: IProjectLayer) { 
            return [];
        }

        private sendCISMessage(feature: IFeature, layerService: csComp.Services.LayerService) {
            var url = '/send-cap-alert';
            console.log('Send CIS message to ' + url);
            $.ajax({
                contentType: 'application/json',
                data: JSON.stringify(csComp.Services.Feature.serialize(feature)),
                url: url,
                dataType: 'json',
                crossDomain: true,
                type: 'POST',
                success: (data, status, jqxhr) => {
                    console.log('Sent CIS successfully');
                },
                error: (err) => {
                    console.log('Error sending CIS');
                }
            });
        }

        public init(layerService: csComp.Services.LayerService) {
            console.log(`Init CISActionService`);
        }
    }
}