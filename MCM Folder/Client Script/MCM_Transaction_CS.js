/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/runtime', 'N/record', "N/currentRecord", "N/url", "N/search", "N/https", "N/query"], function (runtime, record, currentRecord, nsUrl, search, https, query) {

    var STOCK_STATUS_QUIT = 2;
    var STOCK_STATUS_DISCONTINUED = 3;

    // var PRICE_LEVEL_FAMILY_FRIENDS_15 = 19;
    var PRICE_LEVEL_FAMILY_FRIENDS_30 = 13;
    var PRICE_LEVEL_TRADE_PRICE = 11;

    var LOCATION_WAREHOUSE_D3 = 5;
    var SHIPMETHOD_SHOWROOM_PICKUP = 6976;

    var TRIGGER_EVENTS = {
        FIELD_CHANGED: 1,
        VALIDATE_FIELD : 2,
        VALIDATE_LINE : 3
    };

    var DESPATCH_LOCATION = {
        "Warehouse D3": 1,
        "Showroom": 2 
    }

    var SHIPMETHODS = {
        'TNT Standard': 16630,
        'TOLL IPEC': 24059
    }

    var shipmethodsForWarehouse = [
        SHIPMETHODS['TNT Standard'],
        SHIPMETHODS['TOLL IPEC'],
    ];

    
    function pageInit(scriptContext) {
        try {
            console.log('Record Type', scriptContext.currentRecord.type);
            console.log('Type', scriptContext.mode);
            if(scriptContext.currentRecord.type == 'salesorder' && scriptContext.mode == 'create') {
                defaultFieldsForSO(scriptContext);            
            }

            if(scriptContext.currentRecord.type == 'salesorder' && scriptContext.mode != 'create' && scriptContext.mode != 'copy') {
                setPaymentLink(scriptContext);

                if(hasItemFulfillment(scriptContext.currentRecord)) {
                    console.debug('hasItemFulfillment');
                    // nlapiDisableLineItemField('item', 'isclosed', true);
                }
            }

            if((scriptContext.currentRecord.type == 'salesorder' || scriptContext.currentRecord.type == 'estimate') && scriptContext.mode == 'create') {            
                scriptContext.currentRecord.setValue('custbody_desp_loc', DESPATCH_LOCATION['Showroom']);            
            }

        } catch (e) {
            log.error('ERROR', e);
            console.debug(e.toString());
            alert(e.toString());            
        }
    }
    
    function fieldChanged(scriptContext) {   
        // console.debug('fieldChanged', scriptContext);  
        if(scriptContext.currentRecord.type == 'salesorder') {
            defaultShowroomLocation(scriptContext)      
        } 
        if(scriptContext.currentRecord.type == 'salesorder' || scriptContext.currentRecord.type == 'estimate') {
            // defaultDespatchLocation(scriptContext);
        }
        var title = 'fieldChanged(::)';
        try{
            var rec = scriptContext.currentRecord;
            var fieldId = scriptContext.fieldId;
            if(fieldId == 'custbody_mcm_term_drop_down'){
                var termsVal = rec.getText({fieldId: 'custbody_mcm_term_drop_down'});
                log.debug({
                    title: 'termsVal',
                    details: termsVal
                });
                rec.setValue({
                    fieldId: 'custbody_sp_deposit_percent',
                    value: parseInt(termsVal)
                });
                log.debug({
                    title: 'working',
                    details: 'YES'
                });
            }
        } catch(e) {
            log.debug('Exception ' +title, e.message);
        }
        
    }
    
    function postSourcing(scriptContext) {        
        if(scriptContext.currentRecord.type == 'salesorder' || scriptContext.currentRecord.type == 'estimate') {
            // Highlight lines
            hightlightLines(scriptContext);            
        }
    }
    
    function sublistChanged(scriptContext) {
       
    }
    
    function lineInit(scriptContext) {        
    }

    
    function validateField(context) {
		// console.debug('validateField', context); 
        var currentRecord = context.currentRecord;
        var sublistName = context.sublistId;
        var sublistFieldName = context.fieldId;
        var line = context.line;   
        if(scriptContext.currentRecord.type == 'salesorder') {
            if(context.sublistId == 'item' && context.fieldId == 'isclosed') {
                // console.debug('isclosed', context.currentRecord.getCurrentSublistValue('item', 'isclosed'));
                // if(context.currentRecord.getCurrentSublistValue('item', 'isclosed')) {
                //     alert('It is disabled to close the order because it has been already fulfilled.');
                //     return false;
                // }
            }
        }
        return true; 
    }
    
    function validateLine(scriptContext) {
        if(scriptContext.currentRecord.type == 'salesorder') {
    		if(scriptContext.sublistId == 'item') {
                console.debug('validateLine', scriptContext.fieldId);
                defaultShowroomLocation(scriptContext, TRIGGER_EVENTS.VALIDATE_LINE);
            }
        }
        return true; 
    }
    
    function validateInsert(scriptContext) {
		
    }

    
    function validateDelete(scriptContext) {

    }
    
    function saveRecord(scriptContext) {

    }

    /////////////////////////////////////////////////    

    function hightlightLines(scriptContext) {        
        console.log('Record Type', scriptContext.currentRecord.type);        
        if(scriptContext.currentRecord.type == 'estimate') {
            if(scriptContext.sublistId === 'item' && scriptContext.fieldId === 'item') {
                var stockStatus = scriptContext.currentRecord.getCurrentSublistValue('item', 'custcol7');
                console.log('Stock Status', stockStatus);
                if(stockStatus == STOCK_STATUS_QUIT || stockStatus == STOCK_STATUS_DISCONTINUED) {
                    jQuery('table#item_splits tr.uir-machine-row-focused td').css('cssText', 'background-color: #f3bfbf !important');    
                }
            }
        }       
        if(scriptContext.sublistId === 'item' && scriptContext.fieldId == 'price') {                        
            console.log("Value", scriptContext.currentRecord.getCurrentSublistValue('item', 'price'));
            var priceLevel = scriptContext.currentRecord.getCurrentSublistValue('item', 'price');
            if(priceLevel == PRICE_LEVEL_FAMILY_FRIENDS_30 || priceLevel == PRICE_LEVEL_TRADE_PRICE) {
                jQuery('table#item_splits tr.uir-machine-row-focused td').css('cssText', 'background-color: #00aa00 !important');    
            } else {
                jQuery('table#item_splits tr.uir-machine-row-focused td').css('cssText', 'background-color: unset');    
            }
        }
    }

    function defaultFieldsForSO(scriptContext) {
        console.log('defaultFieldsForSO');
        var today = new Date();
        var currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());                
        var endDate = new Date(today.getFullYear(), 6 , 4);   // July 4th
        if(currentDate.getTime() <= endDate.getTime()) {
            console.log('Set fields');
            var currentRecord = scriptContext.currentRecord;
            currentRecord.setValue('terms', 14);    // 100% Payment Required
            // currentRecord.setValue('custbody_project_name', 'Supreme Sale');               
        }
    }    

    function setPaymentLink(scriptContext) {        
        var currentRecord = scriptContext.currentRecord;

        var payment_link = currentRecord.getValue('custbody_sp_endpoint') + 
        '?tkn=' + currentRecord.getValue('custbody_sp_token') + 
        '&cstnm=' + encodeURIComponent(currentRecord.getText('entity')) + 
        '&pymntamnt=' + currentRecord.getValue('custbody_sp_deposit_amount') + 
        '&trt=Invoices+' + currentRecord.getValue('tranid') + 
        '&td=NS[internalid=' + currentRecord.getValue('id') + 
        '+and+location=' + currentRecord.getValue('location') + '+and+type=salesorder]';

        console.debug('payment_link', payment_link);        
        if(currentRecord.getValue('custbody_sp_endpoint')) currentRecord.setValue('custbody_payment_link', payment_link);            
    }

    function hasItemFulfillment(currentRecord) {
        if(!currentRecord.id) return false;
        var rec = record.load({
            type: currentRecord.type,
            id: currentRecord.id
        });
        var lineCount = rec.getLineCount('links');                
        for(index = 0; index < lineCount; index++) {             
            console.debug('links', rec.getSublistValue('links', 'type', index));                   
            if(rec.getSublistValue('links', 'type', index) == "Item Fulfillment") {
                return true;
            }                         
        }
        return false;
    }


    function findInboundShipments(poId) {        
        var searchObj = search.create({
           type: "inboundshipment",
           filters:
           [
              ["purchaseorder.internalid","anyof", poId]
           ],
           columns:
           [
              search.createColumn({
                 name: "shipmentnumber",
                 sort: search.Sort.ASC,
                 label: "Shipment Number"
              }),
              search.createColumn({name: "status", label: "Status"}),
              search.createColumn({name: "createddate", label: "Date Created"}),
              search.createColumn({name: "item", label: "Items - Item"})
           ]
        });

        var inboundShipments = [];            
        searchObj.run().each(function(result) {                
            var _line = {};
            _line.inboundshipment = result.id;
            _line.item = result.getValue('item');
            _line.shipmentstatus = result.getValue('status');
            inboundShipments.push(_line);
            return true;
        });
        return inboundShipments;
    }

    function findVendorCredit(poNum) {        
        var searchObj = search.create({
            type: "vendorcredit",
            filters: [
                ['custbody_createdfrom', 'is', poNum]
            ],
            columns: ['internalid']
        });

        var entityID = null;            
        searchObj.run().each(function(result) {                
            entityID = result.getValue('internalid');
            return false;
        });
        log.debug('findVendorCredit', entityID);
        return entityID;
    }

    function onclickCreateTO(currentRec) {

        try {
            var recType;
            var recId;

            if(currentRec.type != 'salesorder') return;

            var oldId = findTransferOrderByRef(currentRec.id);
            if(oldId) {        
                alert('Transfer Order already exists.');
                window.location.href = nsUrl.resolveRecord({
                     recordType: 'transferorder',
                     recordId: oldId,
                     isEditMode: false
                });
                return;
            }

            var suiteletUrl = nsUrl.resolveScript({
                 scriptId: 'customscript_mcm_transaction_sl',
                 deploymentId: 'customdeploy_mcm_transaction_sl'
            });

            suiteletUrl += '&action=createTO&soId=' + currentRec.id;

            var output = https.get({ url: suiteletUrl});
            console.debug('output', output);
            if(output.code == 200 && output.body) {                
                var res = JSON.parse(output.body);
                console.debug('res', res);
                if(res.success) {
                    var toId = res.data;
                    alert('Transfer Order has been created successfully.');
                    window.location.href = nsUrl.resolveRecord({
                         recordType: 'transferorder',
                         recordId: toId,
                         isEditMode: false
                    });        
                } else {
                    alert(res.error);
                }
            } else {
                alert('Something is wrong.');
            }
        } catch (e) {
            log.error('ERROR', e);
            console.debug(e.toString());
            alert(e.toString());            
        }
    }

    function findTransferOrderByRef(refId) {            
        var searchObj = search.create({
            type: "transferorder",
            filters: [
                ['custbody_createdfrom', 'is', refId],
            ],
            columns: ['internalid']
        });

        var entityID = null;            
        searchObj.run().each(function(result) {                
            entityID = result.getValue('internalid');
            return false;
        });
        log.debug('findTransferOrderByRef', entityID);
        return entityID;
    }

    function defaultDespatchLocation(context, eventFrom) {
        console.debug('Func_defaultDespatchLocation');        
        var currentRecord = context.currentRecord;
        var sublistName = context.sublistId;
        var sublistFieldName = context.fieldId;
        var _shipmethod = +currentRecord.getValue('shipmethod');
        console.debug('shipmethod', currentRecord.getValue('shipmethod'));
        console.debug('custbody_desp_loc', currentRecord.getValue('custbody_desp_loc'));        


        if(sublistName == null && (context.fieldId == 'custbody_desp_loc' || context.fieldId == 'location')) {
            var _despatchLocation = currentRecord.getValue('custbody_desp_loc');
            var _location = currentRecord.getValue('location');
            if(_despatchLocation == DESPATCH_LOCATION['Showroom']) {
                if(_location) {
                    var addressObj = getLocationAddress(_location); 
                    if(addressObj) {
                        currentRecord.setValue('custbody_desp_sub', addressObj.city);
                        currentRecord.setValue('custbody_desp_pc', addressObj.zip);                    
                    }
                }                
            } else if(_despatchLocation == DESPATCH_LOCATION['Warehouse D3']) {
                currentRecord.setValue('custbody_desp_sub', 'Villawood');
                currentRecord.setValue('custbody_desp_pc', '2163');                
            }
        } else if(sublistName == null && context.fieldId == 'shipmethod') {
            var shipmethodsForWarehouse = runtime.getCurrentScript().getParameter('custscript_shipmethods_for_despatch_d3');
            shipmethodsForWarehouse = (shipmethodsForWarehouse || '').split(',');
            console.debug('shipmethodsForWarehouse', shipmethodsForWarehouse);

            if(shipmethodsForWarehouse.indexOf(String(_shipmethod)) != -1) {
                currentRecord.setValue('custbody_desp_loc', DESPATCH_LOCATION['Warehouse D3']);
            } else {
                currentRecord.setValue('custbody_desp_loc', DESPATCH_LOCATION['Showroom']);
            }
        }
    }

    function getLocationAddress(locationId) {
        var recLOC = record.load({type: 'location', id: locationId}); 
        var mainAddressSubrec = recLOC.getSubrecord({
            fieldId: 'mainaddress'
        });
        var addressData = {};
        addressData.country = mainAddressSubrec.getValue('country');
        addressData.address1 = mainAddressSubrec.getValue('addr1');
        addressData.address2 = mainAddressSubrec.getValue('addr2');
        addressData.city = mainAddressSubrec.getValue('city');
        addressData.state = mainAddressSubrec.getValue('state');
        addressData.zip = mainAddressSubrec.getValue('zip');
        return addressData;
    }

    function defaultShowroomLocation(context, eventFrom) {                
        var currentRecord = context.currentRecord;
        var sublistName = context.sublistId;
        var sublistFieldName = context.fieldId;        
        
        if(currentRecord.getValue('shipmethod') == SHIPMETHOD_SHOWROOM_PICKUP) {
            console.debug('defaultShowroomLocation', context.sublistId + ',' + context.fieldId);
            console.debug('shipmethod', currentRecord.getValue('shipmethod'));
            console.debug('location', currentRecord.getValue('location'));
            
            var _location = currentRecord.getValue('location');
            if(sublistName == 'item' && (context.fieldId == 'item' || eventFrom === TRIGGER_EVENTS.VALIDATE_LINE)) {
                console.debug('AAA');
                currentRecord.setCurrentSublistValue('item', 'location', _location);
            } else if(sublistName == null && (context.fieldId == 'shipmethod' || context.fieldId == 'location')) {
                console.debug('BBB');
                var lineCount = currentRecord.getLineCount('item');                
                for(index = 0; index < lineCount; index++) {             
                    currentRecord.selectLine('item', index);                                                
                    currentRecord.setCurrentSublistValue('item', 'location', _location);                                        
                    currentRecord.commitLine('item', index);       
                }
            } 
        }        
    }

    function automateOrderForShowroomPickup(currentRec) {
        try {
            var recType;
            var recId;

            if(currentRec.type != 'salesorder') return;

            var status = currentRec.getValue('status');
            log.debug('status', status);
            console.debug('status', status);

            var suiteletUrl = nsUrl.resolveScript({
                 scriptId: 'customscript_mcm_transaction_sl',
                 deploymentId: 'customdeploy_mcm_transaction_sl'
            });

            suiteletUrl += '&action=automate-showroom-pickup-order&soId=' + currentRec.id;

            var output = https.get({ url: suiteletUrl});
            console.debug('output', output);
            if(output.code == 200 && output.body) {                
                var res = JSON.parse(output.body);
                console.debug('res', res);
                if(res.success) {
                    var toId = res.data;
                    alert('Order has been successfully processed.'); 
                    window.location.reload();                        
                } else {
                    if(res.error) {
                        alert(res.error);    
                    }
                }
            } else {
                alert('Something is wrong.');
            }
        } catch (e) {
            log.error('ERROR', e);
            console.debug(e.toString());
            alert(e.toString());            
        }
    }

    function calcOrderCBM(currentRec) {
        try {
            console.debug('Func_', 'calcOrderCBM');
            var recType;
            var recId;
            var lineCount = currentRec.getLineCount('item');
            var item_ids = [];
            for(var i=0; i < lineCount; i++) {            
                if(currentRec.getSublistValue('item', 'itemtype', i) !== "InvtPart") continue;  
                item_ids.push(currentRec.getSublistValue('item', 'item', i));
            }

            var itemObjList = getItemsData(item_ids);
            console.debug('getItemsData', itemObjList);

            var totalOrderCBM = 0;
            for(var i=0; i < lineCount; i++) {            
                if(currentRec.getSublistValue('item', 'itemtype', i) !== "InvtPart") continue;              
                var _item = currentRec.getSublistValue('item', 'item', i);
                var _quantity = currentRec.getSublistValue('item', 'quantity', i);  
                var itemCBM = forceFloat(itemObjList[_item] && itemObjList[_item].weight); 
                console.debug('_item', _item);
                console.debug('itemCBM', itemCBM);
                var lineCBM = itemCBM * _quantity;
                console.debug('lineCBM', lineCBM);
                totalOrderCBM += lineCBM;

                currentRec.selectLine("item", i); 
                var hasLineUpdated = false;
                if(currentRec.getCurrentSublistValue('item', 'custcol_item_cbm') != itemCBM) {
                   currentRec.setCurrentSublistValue('item', 'custcol_item_cbm', itemCBM);
                   hasLineUpdated = true;
                }
                if(itemCBM == 0) {
                    currentRec.setCurrentSublistValue('item', 'custcol_item_cbm', '');
                    hasLineUpdated = true;
                }
                if(hasLineUpdated) currentRec.commitLine("item"); 
            }

            console.debug('totalOrderCBM', totalOrderCBM);
            totalOrderCBM = totalOrderCBM.toFixed(1);
            currentRec.setValue('custbody_order_cbm_stored', totalOrderCBM);
        } catch (e) {
            log.error('ERROR', e);
            console.debug(e.toString());
            alert(e.toString());            
        }
    }

    function getItemsData(item_ids) {
        if(item_ids.length == 0) return {};

        var _sql = " SELECT " +        
                " id," +                              
                " itemid," + 
                " weight," + 
                " FROM item" +                                
                " WHERE item.id IN (" + item_ids.join(',') + ")";

        var queryResultSet = query.runSuiteQL({ query: _sql });
        var results = queryResultSet.asMappedResults();
        var itemObjList = {};
        for(var x in results) {
            itemObjList[results[x].id] = results[x];
        }

        return itemObjList;
    }

    function isValid(val) {
        if(!_logValidation(val)) return false;
        var value = parseFloat(val);
        if (isNaN(value) || val == Infinity) {
            return false;
        }
        return true;
    }

    function forceFloat(str) {
        var value = parseFloat(str);
        if (isNaN(value)) {
            return 0;
        }
        return value;
    }

    function forceInt(str) {
        var value = parseInt(str);
        if (isNaN(value) || str == Infinity) {
            return 0;
        }
        return value;
    }

    function _logValidation(value) {
        if (value != null && value !== '' && value != undefined && value.toString() != 'NaN' && value != NaN) {
            return true;
        } else {
            return false;
        }
    }


    return {
        pageInit: pageInit,
		fieldChanged: fieldChanged,
   //      validateLine: validateLine,
   //       validateInsert: validateInsert,
		 // lineInit: lineInit,
		 // sublistChanged: sublistChanged,		 
        postSourcing: postSourcing,
		// validateField: validateField,
         // validateDelete: validateDelete,
         // saveRecord: saveRecord
        calcOrderCBM: function () {
            calcOrderCBM(currentRecord.get());
        }, 
        onclickCreateTO: function () {
            onclickCreateTO(currentRecord.get());
        },
        automateOrderForShowroomPickup: function () {
            automateOrderForShowroomPickup(currentRecord.get());
        }
    };

});
