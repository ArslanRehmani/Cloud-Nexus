/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/search', 'N/record', 'N/runtime'],
    function (search, record, runtime) {

        function getInputData() {
            try {

                let savedSearchId = runtime.getCurrentScript().getParameter({
                    name: 'custscript_saved_search'
                });


                if (savedSearchId) {

                    let searchObj = search.load({ id: savedSearchId });

                    // searchObj.filters.push(search.createFilter({
                    //     name: "internalid",
                    //     operator: 'anyof',
                    //     values: 38997525
                    // }));


                    searchObj.columns.push(search.createColumn({
                        name: 'internalid',
                        summary: 'GROUP'
                    }));
                    return searchObj || [];

                }

            }
            catch (e) {

                log.error('getInputData Exception', e.message);
            }

            return [];
        }

        function map(context) {
            try {

                var searchResult = JSON.parse(context.value);

                log.debug('searchResult', searchResult);

                var internalId = searchResult.values["GROUP(internalid)"].value || '';

                if (internalId) {

                    transformIntoCashSalesInvoice(internalId);
                }


            }
            catch (e) {

                log.error('map Exception', e.message);
            }
        }

        function reduce(context) {
            try { }
            catch (e) {

                log.error('reduce Exception', e.message);
            }
        }

        function transformIntoCashSalesInvoice(internalId) {
            var title = 'transformIntoCashSalesInvoice[::]';
            try {

                log.debug({
                    title: 'internalId==',
                    details: internalId
                });

                var transform = false;
                var soObj = record.load({
                    type: 'salesorder',
                    id: internalId
                });

                var shipMethod = soObj.getText({ fieldId: 'shipmethod' });

                var state = soObj.getValue({ fieldId: 'shipstate' });

                var customForm = soObj.getValue({ fieldId: 'customform' });

                //set Order Type
                var orderType = setOrderTypeFunction(soObj, shipMethod, state) || '';

                if (customForm == '117' || customForm == '118') {

                    if (customForm == '117') {//Cash Sales Form
                        log.debug({
                            title: 'GFL Sales Order - Cash Sale',
                            details: 'YES'
                        });
                        var cashSalesRecord = record.transform({
                            fromType: record.Type.SALES_ORDER,
                            fromId: parseInt(internalId),
                            toType: record.Type.CASH_SALE,
                            isDynamic: true
                        });

                        if (cashSalesRecord) {
                            // If dynamic mode is enabled, use setValue or setText
                            cashSalesRecord.setValue({
                                fieldId: 'otherrefnum',
                                value: 'Auto Biller'
                            });
                        }

                        var cashSalesRecordId = cashSalesRecord.save({
                            enableSourcing: false,
                            ignoreMandatoryFields: true
                        });
                        // var cashSalesRecordId = cashSalesRecord.save();
                        log.debug('cashSalesRecordId', cashSalesRecordId);
                        if (cashSalesRecordId) {

                            transform = true;
                        }
                    } else if (customForm == '118') {//Invoice Form
                        log.debug({
                            title: 'GFL Sales Order - invoice',
                            details: 'YES'
                        });
                        var invoiceRecord = record.transform({
                            fromType: record.Type.SALES_ORDER,
                            fromId: parseInt(internalId),
                            toType: record.Type.INVOICE,
                            isDynamic: true
                            // defaultValues: {
                            //     'otherrefnum': 'Auto Biller'
                            // }
                        });
                        if(invoiceRecord){
                            invoiceRecord.setValue({
                                fieldId: 'otherrefnum',
                                value: 'Auto Biller'
                            });
                        }

                        var invoiceId = invoiceRecord.save({
                            enableSourcing: false,
                            ignoreMandatoryFields: true
                        });
                        log.debug('invoiceId', invoiceId);
                        if (invoiceId) {

                            transform = true;
                        }
                    }
                }

                var soId = record.submitFields({
                    type: 'salesorder',
                    id: parseInt(internalId),
                    values: {
                        'custbody_gfl_transform_via_script': transform,
                        'ordertype': orderType
                    },
                    options: {
                        ignoreMandatoryFields: true
                    }
                })
                log.debug('SO ID', soId);

            } catch (e) {
                log.error(title + e.name, e.message);
                var soId = soObj.save({ ignoreMandatoryFields: true });
                log.debug('SO ID Catch', soId);
            }
        }

        function setOrderTypeFunction(salesOrderObj, shipViaNewText, state) {
            var title = 'setOrderTypeFunction[::]';
            log.debug('shipViaNewText123', shipViaNewText);
            try {

                /*
                Sub of parents ID

                9080 WEBSITE == 1443

                28 ACCOUNTS GENERAL == 90
                36 ACCOUNTS INDUSTRY == 98
                571236 WEBSITE ARCHIVE 1 == 11543703
                6580 ONSELLER == 861
                21 ONSELLER ARCHIVE 1 == 83
                8869 LSG WEBSITE == 10119
                9080 WEBSITE == 1443

                8869 LSG WEBSITE == 10119
                9080 WEBSITE == 1443
                36 ACCOUNTS INDUSTRY == 98

                9083 ACCOUNTS IBD == 60

                25 AMAZON == 87
                1025 ACCOUNTS MARKETPLACE : 531056 BUNNINGS MARKETPLACE == 10797417
                1025 ACCOUNTS MARKETPLACE : 629279 DECATHLON MARKETPLACE == 12704180
                1025 ACCOUNTS MARKETPLACE : 605097 BABY BUNTING MARKETPLACE == 12185970
                */

                //start
                var reference = salesOrderObj.getValue('custbody1') || '';
                var overDue = salesOrderObj.getValue('custbody_overdue_balance') ;
                var balance = salesOrderObj.getValue('balance');
                var creditlimit = salesOrderObj.getValue('custbody10');
                var customer = salesOrderObj.getValue('entity') || '';
                var lineItemsCount = salesOrderObj.getLineCount({ sublistId: 'item' });
                var parentCustomerId = '';
                if (customer) {
                    parentCustomerId = setOrderType(customer);
                    log.debug({
                        title: 'parentCustomerId',
                        details: parentCustomerId
                    });
                    log.debug({
                        title: 'parentCustomerId TYPEOF',
                        details: typeof parentCustomerId
                    });
                }
               if ((parentCustomerId == '10119' || parentCustomerId == '1443' || parentCustomerId == '98')  && (areAllLineItemsAvailable(salesOrderObj) && overDue <= 0 && balance < creditlimit)){
                    if(shipViaNewText == 'Pickup - Broadmeadows, VIC' && state == 'VIC'){

                        salesOrderObj.setValue({ fieldId: 'ordertype', value: 4 });//AFD: General

                    }else if(shipViaNewText == 'Pickup - Wetherill Park, NSW' && state == 'NSW'){

                        salesOrderObj.setValue({ fieldId: 'ordertype', value: 4 });//AFD: General

                    }else if(shipViaNewText == 'Same Day - VIC [Civic]' && state == 'VIC'){

                        salesOrderObj.setValue({ fieldId: 'ordertype', value: 4 });//AFD: General

                    }else if(shipViaNewText == 'Same Day - NSW [Capital]' && state == 'NSW'){

                        salesOrderObj.setValue({ fieldId: 'ordertype', value: 4 });//AFD: General

                    }else if(shipViaNewText == 'Click and Collect with Assembly' && state != ''){

                        salesOrderObj.setValue({ fieldId: 'ordertype', value: 4 });//AFD: General

                    }else if(shipViaNewText == 'Diverse Delivery and Installation' && state != ''){

                        salesOrderObj.setValue({ fieldId: 'ordertype', value: 4 });//AFD: General

                    }else if(shipViaNewText == 'Diverse Door to Door' && state != ''){

                        salesOrderObj.setValue({ fieldId: 'ordertype', value: 4 });//AFD: General

                    }else if(shipViaNewText == 'Diverse Specialised Delivery' && state != ''){

                        salesOrderObj.setValue({ fieldId: 'ordertype', value: 4 });//AFD: General

                    }

                }
              
               if (parentCustomerId == '1443' && (reference.startsWith("#TFO") && overDue <= 0 && balance < creditlimit)) {                    

                    salesOrderObj.setValue({ fieldId: 'ordertype', value: 14 });//AFD: Assembled Items      

                } else if ((parentCustomerId == '90' || parentCustomerId == '98'|| parentCustomerId == '11543703' || parentCustomerId == '861' || parentCustomerId == '83' || parentCustomerId == '10119' || parentCustomerId == '1443') && (overDue <= 0 && balance < creditlimit)) {

                    if((shipViaNewText == 'Allied Express' || shipViaNewText == 'Australia Post' || shipViaNewText == 'AirRoad') && (state == 'VIC')){

                        salesOrderObj.setValue({ fieldId: 'ordertype', value: 10 });//AFD: AX/HX/AP(VIC)

                    }else if((shipViaNewText == 'Allied Express' || shipViaNewText == 'AirRoad Specialised') && (state == 'NSW') ){

                        salesOrderObj.setValue({ fieldId: 'ordertype', value: 6 });//AFD: AX/HX (NSW)

                    }else if((shipViaNewText == 'Allied Express' || shipViaNewText == 'AirRoad') && (state == 'QLD')){

                        salesOrderObj.setValue({ fieldId: 'ordertype', value: 7 });//AFD: AX/HX (QLD)

                    }else if((shipViaNewText == 'Allied Express' || shipViaNewText == 'AirRoad') && (state == 'SA')){

                        salesOrderObj.setValue({ fieldId: 'ordertype', value: 8 });//AFD: AX/HX (SA)

                    }else if((shipViaNewText == 'Allied Express' || shipViaNewText == 'AirRoad') && (state == 'WA')){

                        salesOrderObj.setValue({ fieldId: 'ordertype', value: 9 });//AFD: AX/HX (WA)

                    }else if((shipViaNewText == 'Allied Express' || shipViaNewText == 'AirRoad') && (state != '')){

                        salesOrderObj.setValue({ fieldId: 'ordertype', value: 5 });//AFD: AX/HX (ACT/TAS/NT)

                    }else if((shipViaNewText == 'Direct Freight') && (state != '')){

                        salesOrderObj.setValue({ fieldId: 'ordertype', value: 4 });//AFD: General

                    }else if(shipViaNewText == 'Australia Post' && state != 'VIC'){

                        salesOrderObj.setValue({ fieldId: 'ordertype', value: 4 });//AFD: General

                    }
                  
                } 
                // else if (parentCustomerId == '60' && (overDue <= 0 && balance < creditlimit)) {

                //     salesOrderObj.setValue({ fieldId: 'ordertype', value: 11 });//AFD: IBD

                // } 
                else if (parentCustomerId == '87' || parentCustomerId == '10797417' || parentCustomerId == '12704180' || parentCustomerId == '12185970') {

                    salesOrderObj.setValue({ fieldId: 'ordertype', value: 4 });//AFD: General

                }

                //end

            } catch (e) {
                log.error(title + e.name, e.message);
            }
        }
        function setOrderType(customer) {

            var subOf = '';

            try {

                var customerSearch = search.create({
                    type: "customer",
                    filters:
                        [
                            ["parent", "anyof", "1443", "90", "98", "11543703", "861", "83", "10119", "60", "87", "10797417", "12704180", "12185970"],
                            "AND",
                            ["internalid", "anyof", customer]
                        ],
                    columns:
                        [
                            search.createColumn({
                                name: "altname",
                                join: "parentCustomer",
                                label: "Name"
                            }),
                            search.createColumn({
                                name: "internalid",
                                join: "parentCustomer",
                                label: "Internal ID"
                            })
                        ]
                });

                var searchResult = customerSearch.run().getRange({ start: 0, end: 1 });

                if (searchResult.length > 0) {

                    subOf = searchResult[0].getValue({ name: 'internalid', join: 'parentCustomer' });

                }

            }
            catch (e) {
                log.error('setOrderType Exception', e.message);
            }

            return subOf || '';
        }

        return {
            getInputData: getInputData,
            map: map,
            reduce: reduce
        };
    });
