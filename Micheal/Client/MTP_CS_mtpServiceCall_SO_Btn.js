/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */

define(['N/log', 'N/currentRecord', 'N/record', 'N/url', 'N/search'], function (log, currentRecord, record, url, search) {

    function pageInit(context) { }

    function onClickSalesOrderBtn() {
        try {
            var rec = currentRecord.get();
            log.debug({
                title: 'rec',
                details: rec
            });
            var mtpServerCallObj = record.load({
                type: rec.type,
                id: rec.id
            });
            var internalId = mtpServerCallObj.getValue({ fieldId: 'custrecord21' });
            log.debug({
                title: 'internalId',
                details: internalId
            });
            var currRec = record.load({
                type: 'job',
                id: internalId
            });

            var customerId = currRec.getValue('parent');
            var projectManager = currRec.getValue('projectmanager');
            log.debug('customer', customerId);
            log.debug('project Manager', projectManager);

            var salesOrderURL = url.resolveRecord({
                recordType: record.Type.SALES_ORDER,
                isEditMode: true,
                params: {
                    entity: customerId,
                    'record.job': internalId,
                    'record.custbody6': projectManager,
                    'record.custbody_service_mtp_callfield': parseInt(rec.id)
                }
            });

            window.open(salesOrderURL, '_blank');

        } catch (error) {
            log.error('Error:', error.message);
        }
    }
    function workOrderBtn() {
        try {
            var rec = currentRecord.get();
            log.debug({
                title: 'rec',
                details: rec
            });
            var mtpServerCallObj = record.load({
                type: rec.type,
                id: rec.id
            });
            var partner = mtpServerCallObj.getValue({ fieldId: 'custrecord_mtp_partner_field' });
            var mtpProject = mtpServerCallObj.getValue('custrecord21');
            var custAddress = mtpServerCallObj.getValue({ fieldId: 'custrecord_mtp_cust_address' });

            // var customerId = currRec.getValue('parent');

            // log.debug('customer', customerId);
            // log.debug('project Manager', projectManager);

            var purchaseOrderURL = url.resolveRecord({
                recordType: record.Type.PURCHASE_ORDER,
                isEditMode: true,
                params: {
                    entity: partner,
                    cf: 238,//MTP Work Order 
                    'record.custbody10': mtpProject,
                    'record.custbody9': custAddress
                }
            });

            window.open(purchaseOrderURL, '_blank');

        } catch (error) {
            log.error('Error:', error.message);
        }
    }
    function purchaseOrderBtn() {
        try {
            var rec = currentRecord.get();
            log.debug({
                title: 'rec',
                details: rec
            });
            var mtpServerCallObj = record.load({
                type: rec.type,
                id: rec.id
            });
            var partner = mtpServerCallObj.getValue({ fieldId: 'custrecord_mtp_partner_field' });
            var mtpProjectID = mtpServerCallObj.getValue('custrecord21');
            //projectmanager
            var projectmanagerArray = search.lookupFields({
                type: 'job',
                id: mtpProjectID,
                columns: ['projectmanager']
            }).projectmanager;
            log.debug({
                title: 'projectmanagerArray',
                details: projectmanagerArray
            });
            var projectmanagerId = projectmanagerArray[0].value;
            log.debug({
                title: 'projectmanagerId',
                details: projectmanagerId
            });

            var purchaseOrderURL = url.resolveRecord({
                recordType: record.Type.PURCHASE_ORDER,
                isEditMode: true,
                params: {
                    entity: partner,
                    cf: 237,//MTP Purchase Order 
                    'record.custbody6': projectmanagerId,
                    'record.custbody10': mtpProjectID
                }
            });

            window.open(purchaseOrderURL, '_blank');

        } catch (error) {
            log.error('Error:', error.message);
        }
    }

    return {
        pageInit: pageInit,
        onClickSalesOrderBtn: onClickSalesOrderBtn,
        workOrderBtn: workOrderBtn,
        purchaseOrderBtn: purchaseOrderBtn
    };

});
