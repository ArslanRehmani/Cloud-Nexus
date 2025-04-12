/**
 *@NApiVersion 2.0
 *@NScriptType MapReduceScript
 */
 define(['N/log', 'N/search', 'N/record'], function (log, search, record) {

    function getInputData() {
        var title = 'getInputData[::]';
        try {
            var autoBillSalesOrderSearch = search.load({
                id: 'customsearch3927'
            });
        } catch (e) {
            log.error(title + e.name, e.message);
        }
        return autoBillSalesOrderSearch || [];
        // return [{"recordType":null,"id":"194","values":{"GROUP(internalid)":{"value":"27327999","text":"27327999"},"GROUP(datecreated)":"9/10/2022 8:56 PM","GROUP(tranid)":"SO577589","GROUP(formulatext)":"1025 ACCOUNTS MARKETPLACE","GROUP(customform)":{"value":"118","text":"GFL Job Card - Sales Order"},"GROUP(entity)":{"value":"824166","text":"78290 ACCOUNTS MARKETPLACE : MYDEAL MARKETPLACE : MyDeal.com.au Pty Ltd"},"GROUP(location)":{"value":"10","text":"AU : Wetherill Park NSW"},"GROUP(shipmethod)":{"value":"34256","text":"Same Day - NSW [Capital]"},"GROUP(shipstate)":"NSW","GROUP(ordertype)":{"value":"6","text":"AFD: AX/HX (NSW)"},"GROUP(custbody_pickup_date)":"","GROUP(custbody1)":"419827700","GROUP(memomain)":"419827700","GROUP(custbody_dkd_special_instructions)":"- None -","GROUP(custbody_fraud_analysis_result)":"- None -","GROUP(applyingtransaction)":"","GROUP(appliedtotransaction)":""}}];
    }

    function map(context) {
        var title = 'map[::]';
        try {
            var data = JSON.parse(context.value);
            log.debug({
                title: 'data===',
                details: data
            });

            var internalId = data.values['GROUP(internalid)'].value;

            var customForm = data.values['GROUP(customform)'].value;

            var shipVia = data.values['GROUP(shipmethod)'].text;
            // log.debug({
            //     title: 'shipVia',
            //     details: shipVia
            // });

            var shippingState = data.values['GROUP(shipstate)'];
            // log.debug({
            //     title: 'shippingState',
            //     details: shippingState
            // });

            //Load SO to check ShipVia and Ship State value to set Order Type
            var soObj = record.load({
                type: record.Type.SALES_ORDER,
                id: internalId
            });

            if ((shipVia == 'Allied Express' || shipVia == 'Australia Post' || shipVia == 'AirRoad') && (shippingState == 'VIC')) {
                log.debug({
                    title: 'This Condition===0',
                    details: 'YES'
                });
                soObj.setValue({ fieldId: 'ordertype', value: 10 });//AFD: AX/AP/AR (VIC)

            } else if ((shipVia == 'Allied Express' || shipVia == 'AirRoad Specialised') && (shippingState == 'NSW')) {
                log.debug({
                    title: 'This Condition===1',
                    details: 'YES'
                });

                soObj.setValue({ fieldId: 'ordertype', value: 6 });//AFD: AX/AR (NSW)

            } else if ((shipVia == 'Allied Express' || shipVia == 'AirRoad') && (shippingState == 'QLD')) {
                log.debug({
                    title: 'This Condition===2',
                    details: 'YES'
                });

                soObj.setValue({ fieldId: 'ordertype', value: 7 });//AFD: AX/AR (QLD)

            } else if ((shipVia == 'Allied Express' || shipVia == 'AirRoad') && (shippingState == 'SA')) {

                soObj.setValue({ fieldId: 'ordertype', value: 8 });//AFD: AX/AR (SA)

            } else if ((shipVia == 'Allied Express' || shipVia == 'AirRoad') && (shippingState == 'WA')) {
              
              log.debug({
                    title: 'This Condition===2',
                    details: 'YES'
                });

                soObj.setValue({ fieldId: 'ordertype', value: 9 });//AFD: AX/AR (WA)

            } else if ((shipVia == 'Direct Freight') && (shippingState == 'All States')) {

                soObj.setValue({ fieldId: 'ordertype', value: 4 });//AFD: General

            } else if ((shipVia == 'Australia Post') && (shippingState == 'All States ex VIC')) {

                soObj.setValue({ fieldId: 'ordertype', value: 4 });//AFD: General

            } else {
                soObj.setValue({ fieldId: 'ordertype', value: 14 });//AFD: Assembled Items
            }

            soObj.save({
                enableSourcing: true,
                ignoreMandatoryFields: true
            });

            if (customForm == '117' || customForm == '118') {

                if (customForm == '117') {//Cash Sales Form
                    log.debug({
                        title: 'GFL Sales Order - Cash Sale',
                        details: 'YES'
                    });
                    var cashSalesRecord = record.transform({
                        fromType: record.Type.SALES_ORDER,
                        fromId: internalId,
                        toType: record.Type.CASH_SALE
                    });

                    var cashSalesRecordId = cashSalesRecord.save({
                        enableSourcing: true,
                        ignoreMandatoryFields: true
                    });
                    log.debug('cashSalesRecordId', cashSalesRecordId);
                    // if (cashSalesRecordId) {
                    //     record.submitFields({
                    //         type: record.Type.SALES_ORDER,
                    //         id: internalId,
                    //         values: {
                    //             'custbody_gfl_transform_via_script': true
                    //         }
                    //     });
                    // }
                } else if (customForm == '118') {//Invoice Form
                    log.debug({
                        title: 'GFL Sales Order - invoice',
                        details: 'YES'
                    });
                    var invoiceRecord = record.transform({
                        fromType: record.Type.SALES_ORDER,
                        fromId: internalId,
                        toType: record.Type.INVOICE
                    });

                    var invoiceId = invoiceRecord.save({
                        enableSourcing: true,
                        ignoreMandatoryFields: true
                    });
                    log.debug('invoiceId', invoiceId);
                    // if (invoiceId) {
                    //     record.submitFields({
                    //         type: record.Type.SALES_ORDER,
                    //         id: internalId,
                    //         values: {
                    //             'custbody_gfl_transform_via_script': true
                    //         }
                    //     });
                    // }
                }
            }
        } catch (e) {
            log.error(title + e.name, e.message);
        }
    }


    return {
        getInputData: getInputData,
        map: map
    }
});
