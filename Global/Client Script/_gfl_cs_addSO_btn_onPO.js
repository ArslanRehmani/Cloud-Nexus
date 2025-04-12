
/**
 *@NApiVersion 2.0
 *@NScriptType ClientScript
 *

 */

define(['N/record', 'N/log', 'N/url', 'N/search'], function (record, log, url, search) {


    function pageInit(context) {
        var title = 'pageInit[::]';
        try {
            var rec = context.currentRecord;
            // var convertedFromPO = rec.getValue({ fieldId: 'custbody_gfl_conertedfrompo' });
            // log.debug({
            //     title: 'convertedFromPO',
            //     details: convertedFromPO
            // });
            if (rec.id) {
                return;
            } else {
                var url = window.location.href;

                var data = getItemArrayFromURL(url)
                var itemArray = JSON.parse(data);
                log.debug({
                    title: 'itemArray',
                    details: itemArray
                });

                var poId = rec.getValue({ fieldId: 'custbody_gfl_purchase_order_list' });
                log.debug({
                    title: 'poId',
                    details: poId
                });
                if (poId) {
                    var customer = search.lookupFields({
                        type: search.Type.PURCHASE_ORDER,
                        id: poId,
                        columns: ['custbody_gfl_po_customer']
                    }).custbody_gfl_po_customer;
                    log.debug({
                        title: 'customer',
                        details: customer
                    });
                    log.debug({
                        title: 'customer[0].value',
                        details: customer[0].value
                    });

                    if (customer) {
                        rec.setValue({ fieldId: 'entity', value: parseInt(customer[0].value), ignoreFieldChange: false });
                        var cust1 = rec.getValue({ fieldId: 'entity'});
                        var subsidiary = rec.getValue({ fieldId: 'subsidiary'});
                        log.debug({
                            title: 'cust1',
                            details: cust1
                        });
                        log.debug({
                            title: 'subsidiary',
                            details: subsidiary
                        });
                        if(cust1 && subsidiary){
                            if (itemArray && itemArray.length > 0) {
                                for (var c = 0; c < itemArray.length; c++) {
                                    var data = itemArray[c];
                                    rec.selectNewLine({
                                        sublistId: 'item'
                                    });
                                    // var field = rec.getCurrentSublistField({
                                    //     sublistId: 'item',
                                    //     fieldId: 'taxcode',
                                    // });
                                    // log.debug({
                                    //     title: 'field=====',
                                    //     details: field
                                    // });
                                    // field.isMandatory = false;
                                    // // field.isDisabled = true;
                                    rec.setCurrentSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'item',
                                        // line: c,
                                        value: parseInt(data.item),
                                        forceSyncSourcing: true,
    
                                    });
                                    rec.setCurrentSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'amount',
                                        // line: c,
                                        value: parseInt(data.amount),
                                        ignoreFieldChange: true
                                    });
                                    rec.setCurrentSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'taxcode',
                                        // line: c,
                                        // value: parseInt(data.taxcode),
                                        value: 63148,
                                        ignoreFieldChange: true
                                    });
                                    rec.setCurrentSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'custcol_sales_tax_code',
                                        // line: c,
                                        value: parseInt(data.taxcode),
                                        // value: 63148
                                        ignoreFieldChange: true
                                    });
                                    rec.commitLine({
                                        sublistId: 'item'
                                    });
                                }
                            }
                        }
                        
                    }
                }
            }
        } catch (e) {
            log.error(title + e.name, e.message);
        }
    }

    function saveRecord(context) {
        var title = 'saveRecord[::]';
        try {
            var rec = context.currentRecord;
            rec.setValue({ fieldId: 'custbody_gfl_conertedfrompo', value: true });
            return true;
        } catch (e) {
            log.error(title + e.name, e.message);
        }
    }

    function gotosorecord(redId, arr) {
        var title = 'gotosorecord[::]';
        try {
            log.debug('arr', JSON.parse(arr));
            newWindow = window.open('https://1117015-sb1.app.netsuite.com/app/accounting/transactions/salesord.nl?&cf=185&record.custbody_gfl_purchase_order_list=' + Number(redId) + '&arr = ' + JSON.stringify(arr) + '');
        } catch (e) {
            log.error(title + e.name, e.message);
        }

    }
    function getItemArrayFromURL(url) {
        var title = 'getItemArrayFromURL[::]';
        try {
            // Decode the URL to properly handle spaces and special characters
            var decodedURL = decodeURIComponent(url);

            // Create a URL object
            var url = new URL(decodedURL);

            // Create a URLSearchParams object
            var params = new URLSearchParams(url.search);

            // Extract the 'arr' parameter (note the space in the original URL parameter name)
            var arr = params.get('arr ');
            var data = JSON.parse(arr);
        } catch (e) {
            log.error(title + e.name, e.message);
        }
        return data || 0;
    }

    return {
        pageInit: pageInit,
        gotosorecord: gotosorecord
        // saveRecord: saveRecord
    };
});