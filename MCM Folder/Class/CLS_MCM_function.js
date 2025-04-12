define(['N/search', 'N/log', 'N/record'], function (search, log, record) {
    return {
        createSalesOrder: function (cid) {
            var title = 'createSalesOrder(::)';
            try {
                var currentRecord = record.load({
                    type: 'itemfulfillment',
                    id: cid
                });
                var storageStartDate = currentRecord.getValue({
                    fieldId: 'custbody_storage_start'
                });
                log.debug('storageStartDate', storageStartDate);
                var storageEndDate = currentRecord.getValue({
                    fieldId: 'custbody_stoarge_end'
                });
                log.debug('storageEndDate', storageEndDate);

                var orderCBM = currentRecord.getValue({
                    fieldId: 'custbody_order_cbm'
                });
                log.debug('orderCBM', orderCBM);

                var salesOrderId = currentRecord.getValue({
                    fieldId: 'createdfrom'
                });
                log.debug('salesOrderId', salesOrderId);
                if (!!storageStartDate && !!storageEndDate && !!orderCBM) {
                    storageStartDate = new Date(storageStartDate);
                    storageEndDate = new Date(storageEndDate);
                    var difference = storageEndDate.getTime() - storageStartDate.getTime();
                    var TotalDays = Math.ceil(difference / (1000 * 3600 * 24));
                    var totalStorage = TotalDays * orderCBM * 2.85;
                    log.debug('totalStorage', totalStorage);
                }
                if (!!salesOrderId && !!totalStorage) {
                    var SalesOrderObj = search.lookupFields({
                        type: search.Type.SALES_ORDER,
                        id: salesOrderId,
                        columns: ['entity']
                    });
                    log.debug('SalesOrderObj.entity[0].value', SalesOrderObj.entity[0].value);
                    // var salesOrderRecord = record.load({
                    //     type : 'salesorder',
                    //     id : salesOrderId
                    // });
                    // var customer = salesOrderRecord.getValue('entity');
                    var salesOrderRecord = record.create({
                        type: 'salesorder',
                        isDynamic: true
                    });
                    salesOrderRecord.setValue('entity', SalesOrderObj.entity[0].value);
                    salesOrderRecord.setValue('department', 5);
                    salesOrderRecord.setValue('location', 33);
                    salesOrderRecord.setValue('custbody14', new Date());
                    salesOrderRecord.selectNewLine({
                        sublistId: 'item'
                    });
                    // salesOrderRecord.setCurrentSublistValue({
                    //     sublistId: 'item',
                    //     fieldId: 'item',
                    //     value: 24677,
                    //     // line : 0,
                    //     ignoreFieldChange: true
                    // });
                    salesOrderRecord.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'item',
                        value: 24677,
                        // line : 0,
                        ignoreFieldChange: true
                    });
                    salesOrderRecord.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'amount',
                        value: totalStorage,
                        // line : 0
                        ignoreFieldChange: true
                    });
                    salesOrderRecord.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'itemfulfillmentchoice',
                        value: '1',
                        // line : 0
                        ignoreFieldChange: true
                    });
                    salesOrderRecord.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'taxcode',
                        value: 7,
                        // line : 0
                        ignoreFieldChange: true
                    });
                    salesOrderRecord.commitLine({
                        sublistId: 'item'
                    });
                    var soCreated = salesOrderRecord.save({
                        enableSourcing: true,
                        ignoreMandatoryFields: true
                    });
                    log.debug('soCreted', soCreated);
                    //     currentRecord.setValue('custbody_so_created',soCreated);
                    //     currentRecord.save({
                    //         enableSourcing: false,
                    //         ignoreMandatoryFields: true
                    //     });
                    //   location.reload();
                }
            } catch (e) {
                log.debug('Exception ' + title, e.message);
            }
        }
    };
});