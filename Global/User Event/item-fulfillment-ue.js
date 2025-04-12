/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/runtime', 'N/search', 'N/record'],

function(runtime, search, record) {
   
    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {string} scriptContext.type - Trigger type
     * @param {Form} scriptContext.form - Current form
     * @Since 2015.2
     */
    function beforeLoad(scriptContext) {

        // scriptContext.form.clientScriptModulePath = './item-fulfillment-client.js';
        scriptContext.form.clientScriptFileId = '4258657';

        if (scriptContext.type == 'view') {
            scriptContext.form.addButton({
                id: 'custpage_shipping_labal',
                label: 'Shipping Label',
                // functionName: 'shippingLabel(' + scriptContext.newRecord.id + ')'
                functionName: 'shippingLabel'
            });
        }
    }

    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type
     * @Since 2015.2
     */
    function beforeSubmit(scriptContext) {

    }

    /**
     * Function definition to be triggered before record is loaded.
     * 
     * when trigger type is delete, new record would be like below
     * {"id":"22291065","type":"itemfulfillment","isDynamic":false,"fields":{"sys_id":"1415619771339350","id":"22291065"}}
     * 
     * when trigger type is create, old record is undefined
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type
     * @Since 2015.2
     */
    function afterSubmit(scriptContext) {
        log.audit('trigger type', scriptContext.type)
        log.audit('new record', scriptContext.newRecord)
        log.debug('old record', scriptContext.oldRecord)
        // log.debug('runtime', runtime)
        log.debug('runtime.executionContext', runtime.executionContext)

        try {
                // var status = scriptContext.newRecord.getValue('status')
                // log.debug('status', status)
                // var shipstatus = scriptContext.newRecord.getValue('shipstatus')
                // log.debug('shipstatus', shipstatus)
                // var statusRef = scriptContext.newRecord.getValue('statusRef') // note: not statusref
                // log.debug('statusRef', statusRef)

                if (scriptContext.type != 'delete') {
                    // use search to get real status, get value from record is kind of delay
                    var cols = search.lookupFields({
                        type: scriptContext.newRecord.type,
                        id: scriptContext.newRecord.id,
                        columns: ['statusref']
                    })
                    log.debug('cols', cols)
                    var waveNames = [];
                    if (cols.statusref[0] && cols.statusref[0].value == 'packed') {
                        search.create({
                            type: 'picktask',
                            filters: [
                                ['lineitemtransactionnumber', 'anyof', scriptContext.newRecord.id],
                                // 'AND',
                                // ['status', 'is', 'COMPLETED'],
                            ],
                            columns: [
                                {name: 'name', summary: 'group'},
                                {name: 'wavename', summary: 'group'}
                            ]
                        }).run().each(function(result) {
                            log.debug('result', result)
                            var waveName = result.getText({name: 'wavename', summary: 'group'});
                            if (waveNames.indexOf(waveName) < 0) {
                                waveNames.push(waveName)
                            }
                        })
                        log.audit('waveNames', waveNames)
                        if (waveNames.length > 0) {
                            record.submitFields({
                                type: scriptContext.newRecord.type,
                                id: scriptContext.newRecord.id,
                                values: {
                                    custbody_avt_ifs_shipping_batch: waveNames.join(',')
                                },
                                options: {
                                    enableSourcing: false,
                                    ignoreMandatoryFields: true
                                }
                            })
                        }
                    }
                }
                
        } catch (error) {
            
        }
    }

    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    };
    
});
