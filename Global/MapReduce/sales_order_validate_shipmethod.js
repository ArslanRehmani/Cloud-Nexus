/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 * 
 * daily check shipment if match carrier from line items
 * 
 */
 define(['N/search', 'N/record', './sales_order_plugins', 'N/email'],

    function(search, record, plugins, email) {
       
        /**
         * Marks the beginning of the Map/Reduce process and generates input data.
         *
         * @typedef {Object} ObjectRef
         * @property {number} id - Internal ID of the record instance
         * @property {string} type - Record type id
         *
         * @return {Array|Object|Search|RecordRef} inputSummary
         * @since 2015.1
         */
        function getInputData() {
            //return search.load({id: 'customsearchvalidate_shipmethod_test'})
            return search.load({id: 'customsearch2183'})
        }
    
        /**
         * Executes when the map entry point is triggered and applies to each key/value pair.
         *
         * @param {MapSummary} context - Data collection containing the key/value pairs to process through the map stage
         * @since 2015.1
         */
        function map(context) {
            log.debug(`map ${context.key}`, context.value)
            // {
            //     "recordType": "salesorder",
            //     "id": "23909348",
            //     "values": {
            //         "ordertype": "",
            //         "trandate": "12/1/2022",
            //         "type": {
            //             "value": "SalesOrd",
            //             "text": "Sales Order"
            //         },
            //         "tranid": "SO530924",
            //         "entity": {
            //             "value": "10008752",
            //             "text": "501301 WEBSITE : Keenan Allen"
            //         },
            //         "account": {
            //             "value": "132",
            //             "text": "Sales Orders"
            //         },
            //         "memo": "Braintree payment: 0g4z7nsy",
            //         "shipmethod": {
            //             "value": "34247",
            //             "text": "Allied Express"
            //         },
            //         "custitem_cubic_carrier.item": "",
            //         "custcol22": "",
            //         "formulanumeric": "1"
            //     }
            // }

            const {recordType, id, ...obj} = JSON.parse(context.value)
            log.debug('obj', obj)
            const {shipitem, freightitem, checkLog} = plugins.getShipitem({type: recordType, id})
            log.debug('getShipitem', {shipitem, freightitem})
            if(checkLog){
                checkLog.script = 'sales_order_validate_shipmethod.js'
                log.debug('checkLog', checkLog)
            }
            // default shipitem from plugins.getShipitem: {"value":"53878","text":"Outside Rec. Carrier Zone"}

            const currKeys = search.lookupFields({
                type: recordType,
                id,
                columns: ['tranid', 'custbody_auto_carrier_control', 'custbody_rp_waves']
            })
            log.debug('currKeys', currKeys)

            // auto carrier control is not disabled 
            if (currKeys.custbody_auto_carrier_control[0]?.value == 1 || currKeys.custbody_rp_waves) {
                log.audit(`${currKeys.tranid} status`, {auto_carrier_control: 'disabled', waves_release_pending: true})
            } else {
                try {
                    record.submitFields({
                        type: recordType,
                        id,
                        values: {
                            custbody_auto_carrier_control: 2, // auto update
                        },
                        options: {
                            enablesourcing: true,
                            ignoreMandatoryFields: true
                        }
                    })
                } catch (error) {
                    log.audit('check error', 'control: '+currKeys.custbody_auto_carrier_control[0]?.value+', waves: '+currKeys.custbody_rp_waves)
                    throw new Error(`[Map stage] Failed to update {AUTO CARRIER CONTROL} field for sales order ${obj.values.tranid} due to ${error.name} ${error.message}`)
                }
                
                if (shipitem != obj.values.shipmethod.value) {
                    const result = search.lookupFields({
                        type: 'shipitem',
                        id: shipitem,
                        columns: ['itemid', 'isinactive']
                    })
                    log.debug('result', result)
                    if (!result.isinactive) {
                        context.write({
                            key: `${obj.values.tranid}`,
                            value: {
                                recordType,
                                id,
                                currShipmethod: obj.values.shipmethod,
                                newShipmethod: {
                                    value: shipitem,
                                    text: result.itemid
                                },
                                checkLog: JSON.stringify(checkLog)
                            }
                        });
                    }
                    if (shipitem == '53878') {
                        log.audit('shipitem 53878 '+currKeys.tranid, 'Shipitem default and applied to ship via')
                    }
                } else {
                    log.audit('shipitem not updated', 'shipitem is '+shipitem+' and obj shipitem is '+obj.values.shipmethod.value);
                    // log.audit(`shipitem 53878`, `shipitem is 53878 as maybe due to all items in order has been fulfilled`);
                }
            }
        }
    
        /**
         * Executes when the reduce entry point is triggered and applies to each group.
         *
         * @param {ReduceSummary} context - Data collection containing the groups to process through the reduce stage
         * @since 2015.1
         */
        function reduce(context) {
            log.debug(`reduce ${context.key}`, context.values)
            const {recordType, id, currShipmethod, newShipmethod, checkLog} = JSON.parse(context.values[0])

            const currKeys = search.lookupFields({
                type: recordType,
                id,
                columns: ['tranid', 'custbody_auto_carrier_control', 'custbody_rp_waves']
            })
            log.debug('currKeys', currKeys)

            // auto carrier control is not disabled
            if (currKeys.custbody_auto_carrier_control[0]?.value == 1 || currKeys.custbody_rp_waves) {
                log.audit(`${currKeys.tranid} status`, {auto_carrier_control: 'disabled', waves_release_pending: true})
            } else {
                try {
                    record.submitFields({
                        type: recordType,
                        id,
                        values: {
                            shipmethod: newShipmethod.value,
                            custbody_avt_ifs_shipcarrier: '',
                            custbody_ship_via_log: checkLog,
                            custbody_auto_carrier_control: newShipmethod.value == '53878' ? 1 : '' // Disable when ship via outside rec...
                        },
                        options: {
                            enablesourcing: true,
                            ignoreMandatoryFields: true
                        }
                    })
                    context.write(context.key, {recordType, id, currShipmethod, newShipmethod})
                } catch (error) {
                    const errMsg = `Failed to change shipitem ${currShipmethod.text} to ${newShipmethod.text} for ${recordType} ${context.key} ${id}
                    due to ${error.message}`;
    
                    email.send({
                        author: 16,
                        recipients: ['george.y@gflgroup.com.au', 'sugito.r@gflgroup.com.au'],
                        body: `${errMsg}
    
                        details: ${JSON.stringify(error)}
                        `,
                        subject: `Failure on change shipitem for ${recordType} ${context.key} ${id}`
                    })
    
                    throw new Error(errMsg)
                }
            }
        }
    
    
        /**
         * Executes when the summarize entry point is triggered and applies to the result set.
         *
         * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
         * @since 2015.1
         */
        function summarize(summary) {
            const errArr = [];
            log.debug('summary input', summary.inputSummary);
    
            var mapSum = summary.mapSummary;
            mapSum.errors.iterator().each(function(key, value) {
                log.error('error in map stage ' + key + typeof value, value);
                errArr.push(value)
                return true;
            });
    
            var reduSum = summary.reduceSummary;
            reduSum.errors.iterator().each(function(key, value) {
                log.error('error in reduce stage ' + key, value);
                errArr.push(value)
                return true;
            });
    
            const errMsg = []
            errArr.filter(Boolean).forEach(err => {
                try {
                    errMsg.push(JSON.parse(err).message)
                } catch (error) {
                    errMsg.push(err)
                }
            })
            if (errMsg.length > 0) {
                email.send({
                    author: 16,
                    recipients: ['george.y@gflgroup.com.au', 'reece@gflgroup.com.au', 'sugito.r@gflgroup.com.au'],
                    body: `Error when udpate the following shipmethod of sales orders

                    ${errMsg.join('\n\n')}
                    `,
                    subject: `[Notification] Error when validate and update Sales order shipment`
                })
            }

            const message = []
            summary.output.iterator().each( (key, value) => {
                const valueObj = JSON.parse(value)
                log.debug('valueObj', valueObj)
                message.push(`${key} has successfully changed shipmethod from ${valueObj.currShipmethod.text}[${valueObj.currShipmethod.value}] to ${valueObj.newShipmethod.text}[${valueObj.newShipmethod.value}]`)

                return true;
            })
            if (message.length > 0) {
                email.send({
                    author: 16,
                    recipients: ['george.y@gflgroup.com.au', 'reece@gflgroup.com.au', 'sugito.r@gflgroup.com.au'],
                    body: `the following shipmethod of sales order have been changed

                    ${message.join('\n\n')}
                    `,
                    subject: `[Notification] Sales order shipment that has been validated and updated`
                })
            }
        }
    
        return {
            getInputData: getInputData,
            map: map,
            reduce: reduce,
            summarize: summarize
        };
        
    });
    