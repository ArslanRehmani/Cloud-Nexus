/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/log', 'N/record', 'N/runtime', 'N/search', 'N/https', '../lib/dropship_request_lib.js'],
    /**
 * @param{log} log
 * @param{record} record
 * @param{runtime} runtime
 * @param{search} search
 * @param{https} https
 * @param{requestLib} requestLib
 */
    (log, record, runtime, search, https, requestLib) => {

        /**
         * Defines the function definition that is executed after record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const afterSubmit = (scriptContext) => {
            var title = 'afterSubmit[::]';
            try {
                var newRec = scriptContext.newRecord;
                var recId = newRec.id;
                var recType = newRec.type;
                var rec = record.load({
                    type: recType,
                    id: recId
                });
                var createdFromSalesOrder = rec.getText({
                    fieldId: 'createdfrom'
                });
                if (createdFromSalesOrder.includes('Sales Order')) {
                    var createdFromSalesOrderID = rec.getValue({
                        fieldId: 'createdfrom'
                    });
                    var dropShipOrderNum = search.lookupFields({
                        type: search.Type.SALES_ORDER,
                        id: createdFromSalesOrderID,
                        columns: ['custbody_gfl_dropship_order_no']
                    }).custbody_gfl_dropship_order_no;
                    if (dropShipOrderNum) {
                        var carrier = rec.getText({ fieldId: 'shipmethod' });
                        var packageLineCount = rec.getLineCount({
                            sublistId: 'package'
                        });
                        if (packageLineCount > 0) {
                            var trackingNumObj;
                            var trackingNumArray = [];
                            for (var m = 0; m < packageLineCount; m++) {
                                trackingNumObj = {};
                                trackingNumObj.trackingNum = rec.getSublistValue({
                                    sublistId: 'package',
                                    fieldId: 'packagetrackingnumber',
                                    line: m
                                });
                                trackingNumArray.push(trackingNumObj);
                            }
                            if (carrier && trackingNumArray && trackingNumArray.length > 0 && trackingNumArray[0].trackingNum != '') {
                                var carrierObj = {
                                    'Bluestar': 'BSTR',
                                    'Allied Express': 'ALEX',
                                    'Australia Post': 'AUPT',
                                    'CTI': 'CTI',
                                    'Direct Freight': 'DFR',
                                    'Hunter Express': 'HEX',
                                    'Kwickaz': 'Kwickaz',
                                    'Northline': 'Northline',
                                    'TNT': 'TNTAU'
                                };
                                log.debug({
                                    title: "carrierObj['carrier']",
                                    details: carrierObj[carrier]
                                });
                                var token = requestLib.HELPERS.getToken();
                                var headers = {};
                                headers['Content-Type'] = 'application/json';
                                headers['Authorization'] = 'jwt ' + token;
                                for (var n = 0; n < trackingNumArray.length; n++) {
                                    var trackingObj = trackingNumArray[n];
                                    var Body = {
                                        "shipments": [
                                            {
                                                "order_id": dropShipOrderNum,
                                                "tracks": [
                                                    {
                                                        "carrier": carrierObj[carrier],
                                                        // "carrier": 'Northline',//hard code need to be change
                                                        "tracking_number": trackingObj.trackingNum
                                                    }
                                                ]
                                            }
                                        ]
                                    };
                                    var response = https.post({
                                        url: 'https://services.dropshipzone.com.au/admin/api/supplier/v1/shipments',
                                        body: JSON.stringify(Body),
                                        headers: headers
                                    });
                                    if(response.code != 200){
                                        rec.setValue({fieldId: 'custbody_dsz_shipment_error', value: response.body});
                                        rec.save();
                                    }else if(response.code == 200){
                                        rec.setValue({fieldId: 'custbody_dsz_shipment_error', value: ''});
                                        rec.save();
                                    }
                                    log.debug({
                                        title: 'Shipment response',
                                        details: response
                                    });
                                }
                            } else {
                                log.debug({
                                    title: 'No Tracking Num Available',
                                    details: 'YES'
                                });
                            }
                        } else {
                            log.debug({
                                title: 'No Data Available in Pacakage Tab',
                                details: 'YES'
                            });
                        }
                    } else {
                        log.debug({
                            title: 'NO sales Order Created against this Drop ship Order',
                            details: dropShipOrderNum
                        });
                    }
                } else {
                    log.debug({
                        title: 'Not Created from Sales Order',
                        details: 'YES'
                    });
                }
            } catch (e) {
                log.error(title + e.name, e.message);
            }
        }

        return { afterSubmit }

    });
