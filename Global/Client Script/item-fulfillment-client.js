/**
 * @NApiVersion 2.x
 * 
 * @NModuleScope SameAccount
 */
define(['N/log', 'N/url', 'N/currentRecord'],

function(log, url, currentRecord) {
    
    // function shippingLabel(recordId) {
    function shippingLabel() {
        // alert('shipping label function');
        var rec = currentRecord.get();
        var currentShipStatus = rec.getValue('shipstatus');
        log.debug('created from', rec.getValue('createdfrom'));
        log.debug('currentshipstatus', currentShipStatus);
        log.debug('internalid', rec.id + ' ' + rec.isDynamic + ' ' + rec.type);

        // won't work as current context is in view model
        // if (currentShipStatus != 'C') {
        //     try {
        //         rec.setValue({
        //             fieldId: 'shipstatus',
        //             value: 'C',
        //             ignoreFieldChange: false,
        //             forceSyncSourcing: true,
        //         });
        //     } catch (error) {
        //         log.error('change ship status error', error)
        //     }
        // }

        var link = url.resolveScript({
            scriptId: 'customscript_item_fulfillment_sl',
            deploymentId: 'customdeploy1',
            returnExternalUrl: true,
            params: {
                record_id: rec.id
            }
        });

        log.debug('link', link);

        window.open(link, '_blank');
    }

    return {
        shippingLabel: shippingLabel
    };
    
});
