/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(['N/https', 'N/record', 'N/search', 'N/ui/serverWidget', 'N/ui/message', 'N/render', 'N/file','N/email','N/runtime'],
 function(https, record, search, serverWidget, message, render, file,email,runtime) {    
    var SHIPMETHOD_SHOWROOM_PICKUP = 6976;
    var EMAIL_AUTHOR_ID = 2760;
    var PO_APPROVAL_STATUS = {
        PENDING_APPROVAL: 1,        
        APPROVED: 2
    };

    var LOCATION_STOCK_DISCREPANCIES = 29;    
	function beforeLoad(context) {
		try {			
			log.audit('Running', context.newRecord.id);			
		 	var form = context.form;
            form.clientScriptModulePath = './MCM_Transaction_CS.js';

            if (context.type == context.UserEventType.VIEW) { 
                if(context.newRecord.type == 'salesorder') {
                    var rec = record.load({
                        type: context.newRecord.type,
                        id: context.newRecord.id
                    });                           
                    if(hasItemFulfillment(rec)) {
                        log.debug('hasItemFulfillment');
                        form.removeButton('closeremaining');    
                    }
                    
                    var status = context.newRecord.getValue('status');
                    log.debug('status', status);
                    if(context.newRecord.getValue('shipmethod') == SHIPMETHOD_SHOWROOM_PICKUP && status != 'Pending Approval' && status != "Pending Billing" && status != "Closed" && status != "Cancelled" && status != "Billed") {
                        if(!findTransferOrderByRef(context.newRecord.id)) {
                            var buttonOptions = {
                                id: "custpage_create_TO",
                                label: 'Create TO',
                                functionName: "onclickCreateTO"
                            };
                            form.addButton(buttonOptions);
                        }
                    }
                    
                }

                if(context.newRecord.type == 'purchaseorder') {                    
                    var status = context.newRecord.getValue('status');
                    log.debug('status', status);
                    if(status != 'Pending Approval' && status != "Pending Billing" && status != "Cancelled" && status != "Billed") {
                        
                    }
                }
                if(context.newRecord.type == 'vendorcredit') {
                    log.debug('inbound ref', context.newRecord.getValue('custbody_ref_inboundshipment')[0]);                    
                    var refInboundShipments = context.newRecord.getValue('custbody_ref_inboundshipment');
                    if(refInboundShipments && refInboundShipments.length > 0) {
                        form.addPageInitMessage({
                            type: message.Type.INFORMATION, 
                            message: 'These items were short supplied in a recent shipment and payment for these will be deducted from the next order'
                        });    
                    }

                }

            }            
			

		} catch (e) {
			log.error('ERROR', e);
		}
		
 	}

    function beforeSubmit(context) {  
        log.debug('Befor SUBMIT', context);        
        var type = context.type;
        var newRecord  = context.newRecord;
        var oldRecord  = context.oldRecord;        
        var stCustomForm = newRecord.getValue('customform');    

        // log.audit('executionContext - ' + newRecord.type, runtime.executionContext);
        try {
            if(newRecord.type == 'returnauthorization') {            
                if(context.type == 'create') {
                    
                }
            } else if(newRecord.type == 'itemreceipt') {            
                if(runtime.executionContext == 'MAPREDUCE' || runtime.executionContext == 'USEREVENT') {
                    try {                           
                    } catch (e) {
                        log.error('ERROR', e);
                    }
                }
            } else if(newRecord.type == 'purchaseorder') {
                if(context.type == 'create' || context.type == 'dropship') {                
                }
            }
        }
        catch (error) {
            log.error("beforeSubmit error", error);
        }
    }    

 	function afterSubmit(context) {
        log.debug('AFTER SUBMIT', context);        
        var newRecord  = context.newRecord;
        var oldRecord  = context.oldRecord;
        log.debug('id', newRecord.id);   
        try {
            if(newRecord.type == 'returnauthorization') {            
                if(context.type == 'create') {                
                }
            } else if(newRecord.type == 'itemreceipt') {

            } else if(newRecord.type == 'salesorder') {
                var status = context.newRecord.getValue('status');
                if(status != 'Pending Supervisor Approval' && status != "Pending Bill" && status != "Closed" && status != "Planned" && status != "Fully Billed" && status != "Rejected by Supervisor") {
                    var rec = record.load({
                        type: context.newRecord.type,
                        id: context.newRecord.id
                    }); 
                    checkIfFullyCommitted(rec);
                }
            } else if(newRecord.type == 'purchaseorder') {
                if(context.type == 'create' || context.type == 'dropship') {
                    removeApprovalIfDropshipSupplier(newRecord);    
                }
            }

        
            log.debug("data", { event: context.type });            
            log.debug('Order ID', context.newRecord.id);

            // var rec = record.load({type: search.Type.ITEM_FULFILLMENT, id: context.newRecord.id});

            
        }
        catch (error) {
            log.error("afterSubmit error", error);
        }
    }

    function checkIfFullyCommitted(currentRecord) {        
        var line_nums = currentRecord.getLineCount('item');

        var fullyCommitted = null;
        for (var t = 0; t < line_nums; t++) {            
            var line_item = currentRecord.getSublistValue('item', 'item', t);            
            var quantity = currentRecord.getSublistValue('item', 'quantity', t);            
            var quantity_committed = currentRecord.getSublistValue('item', 'quantitycommitted', t);
            var quantity_pickpackship = currentRecord.getSublistValue('item', 'quantitypickpackship', t);                        
            var fulfillable = currentRecord.getSublistValue('item', 'fulfillable',t);

            if(fulfillable) {
                if(quantity_pickpackship == 0 && quantity == quantity_committed) {
                    if(fullyCommitted === null) fullyCommitted = true;    
                } else {
                    fullyCommitted = false;
                }
            }
        }   

        if(fullyCommitted) {
            currentRecord.setValue('custbody13', true);            
            var soId = currentRecord.save({ ignoreMandatoryFields: true, enableSourcing: false });  
            log.audit('fullyCommitted', soId);
        }

    }

    function hasItemFulfillment(currentRecord) { 
        var lineCount = currentRecord.getLineCount('links');                
        for(index = 0; index < lineCount; index++) {    
            log.debug('links', currentRecord.getSublistValue('links', 'type', index));                 

            if(currentRecord.getSublistValue('links', 'type', index) == "Item Fulfillment") {
                return true;
            }                         
        }
        return false;
    }

    function findLineItem(rec, item_id) {
        var lines = rec.getLineCount({
            sublistId: 'item'
        });

        for (var t = 0; t < lines; t++) {
            var line_itemid = rec.getSublistValue({
                sublistId: 'item',
                fieldId: 'item',
                line: t 
            });
            if(line_itemid == item_id) return t;
        }

        return null;
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
    
    function removeApprovalIfDropshipSupplier(currentRecord) {
        log.debug('removeApprovalIfDropshipSupplier');        
        var emailTemplateId = runtime.envType == 'SANDBOX' ? 152 : 168;
        var vendorId = currentRecord.getValue('entity');
        var fieldsLookup = search.lookupFields({type: 'vendor', id: vendorId, columns: ['custentitydrop_ship', 'email']});    
        log.debug('fieldsLookup', fieldsLookup);
        var vendorEmail = fieldsLookup.email;
        var isDropshipSupplier = fieldsLookup.custentitydrop_ship == true;
        if(isDropshipSupplier) {
            log.debug('current approval status', currentRecord.getValue('approvalstatus'));
            if(currentRecord.getValue('approvalstatus') == PO_APPROVAL_STATUS.PENDING_APPROVAL) {
                log.debug('Remove Appoval');
                var rec = record.load({
                    type: currentRecord.type,
                    id: currentRecord.id
                });
                rec.setValue('approvalstatus', PO_APPROVAL_STATUS.APPROVED);
                rec.save({ ignoreMandatoryFields: true, enableSourcing: false }); 
            }
        
            if(vendorEmail) {
                var recipients = [vendorEmail];
                var transactionId = currentRecord.id;
                var template = render.mergeEmail({
                    templateId: emailTemplateId,
                    entity: record.load({
                        type: 'vendor',
                        id: vendorId
                    }),
                    transactionId: +(transactionId)
                });

                var emailContent = template.body;
                log.debug('email template', template);

                var tranPDF = render.transaction({
                    entityId: +(transactionId),
                    printMode: render.PrintMode.PDF,
                });

                email.send({
                    author: EMAIL_AUTHOR_ID,
                    recipients: recipients,
                    subject: template.subject,
                    body: emailContent,      
                    attachments: [tranPDF],              
                    relatedRecords: {
                        entityId: vendorId,
                        transactionId: transactionId
                    }
                });

                log.debug('sent PO email');
            }
            
        }
    }

	function _logValidation(value) {
      	if (value != null && value !== '' && value != undefined && value.toString() != 'NaN' && value != NaN) {
            return true;
      	} else {
            return false;
      	}
    }

	return {
		beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
	};
});