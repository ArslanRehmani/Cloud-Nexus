/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/record', 'N/search', 'N/runtime'],
    /**
     * @param{record} record
     * @param{search} search
     * @param{runtime} runtime
     */
    function (record, search, runtime) {
        function pageInit(context) {
            try {
                var currentRecord = context.currentRecord;
                if (context.mode == 'create') {

                    var currentDate = new Date();
                    var endDate = new Date('11/26/2022');
                    if (currentDate < endDate) {
                        currentRecord.setValue('custbody_project_name', 'Black Friday');
                    }
                    var terms = currentRecord.getValue('terms');
                    log.debug('terms', terms);
                    if (terms == 14) {
                        currentRecord.setValue('custbody_sp_deposit_percent', 100);
                    }
                    else if (terms == 7) {
                        currentRecord.setValue('custbody_sp_deposit_percent', 50);
                    }
                    else {
                        currentRecord.setValue('custbody_sp_deposit_percent', '');
                    }
                }
            }
            catch (e) {
                log.debug('Exception', e);
            }

        }
        function fieldChanged(context) {
            try {
                var currentRecord = context.currentRecord;
                var fieldId = context.fieldId;
                if (fieldId == 'terms') {
                    var terms = currentRecord.getValue('terms');
                    log.debug('terms', terms);
                    if (terms == 14) {
                        currentRecord.setValue('custbody_sp_deposit_percent', 100);
                    }
                    else if (terms == 7) {
                        currentRecord.setValue('custbody_sp_deposit_percent', 50);
                    }
                    else {
                        currentRecord.setValue('custbody_sp_deposit_percent', '');
                    }
                }
                if(fieldId == 'currency'){
                    var simplyPaidDeposite = currentRecord.getField({fieldId: 'custbody_sp_deposit_percent'});
                    var simplyPaidDepositeamt = currentRecord.getField({fieldId: 'custbody_sp_deposit_amount'});
                    var currency = currentRecord.getValue({fieldId: 'currency'});
                    if(currency == '2'){
                        currentRecord.setValue({fieldId: 'custbody_sp_deposit_percent',value: ''});
                        currentRecord.setValue({fieldId: 'custbody_sp_deposit_amount',value: ''});
                        simplyPaidDeposite.isDisabled = true;
                        simplyPaidDepositeamt.isDisabled = true;
                    }else{
                        simplyPaidDeposite.isDisabled = false;
                        simplyPaidDepositeamt.isDisabled = false;
                    }
                }
            }
            catch (e) {
                log.debug('Exception', e);
            }

        }
        function saveRecord(context) {
            try {
                var currentRecord = context.currentRecord;
                var keyCustomer = currentRecord.getValue('custbody_key_customer');
                log.debug('Key Customer', keyCustomer);
                var earlyDelivery = currentRecord.getValue('custbody_early_delivery');
                log.debug('earlyDelivery', earlyDelivery);
                var partShip = currentRecord.getValue('custbody_part_ship');
                log.debug('partShip', partShip);
                var notRequiredDate = currentRecord.getValue('custbody2');
                var leadTime = currentRecord.getValue('custbody_lead_time_quoted');
                log.debug('notRequiredDate', notRequiredDate);
                log.debug('leadTime', leadTime);
                var itemLineCount = currentRecord.getLineCount({
                    sublistId: 'item'
                });
                log.debug('itemLineCount', itemLineCount);
                for (var i = 0; i < itemLineCount; i++) {
                    var itemType = currentRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'itemtype',
                        line: i
                    });
                    if (itemType != 'EndGroup') {
                        currentRecord.selectLine({
                            sublistId: 'item',
                            line: i
                        });
                        if (!keyCustomer && !!earlyDelivery && !!partShip && !notRequiredDate) {
                            currentRecord.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'orderallocationstrategy',
                                value: '3',
                                line: i,
                                ignoreFieldChange: true
                            });
                        }
                        else if (!keyCustomer && !!earlyDelivery && !partShip && !notRequiredDate) {
                            currentRecord.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'orderallocationstrategy',
                                value: '6',
                                line: i,
                                ignoreFieldChange: true
                            });

                        }
                        else if (!keyCustomer && !earlyDelivery && !partShip && !!notRequiredDate) {
                            currentRecord.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'orderallocationstrategy',
                                value: '5',
                                line: i,
                                ignoreFieldChange: true
                            });
                        }
                        else if (!!keyCustomer) {
                            currentRecord.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'orderallocationstrategy',
                                value: '', //'8'
                                line: i,
                                ignoreFieldChange: true
                            });
                        }
                        if (!!notRequiredDate) {
                            currentRecord.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'requesteddate',
                                value: notRequiredDate,
                                line: i,
                                ignoreFieldChange: true
                            });
                        }
                        if (!!leadTime && !!notRequiredDate) {
                            if (notRequiredDate.getTime() > leadTime.getTime()) {
                                currentRecord.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'requesteddate',
                                    value: notRequiredDate,
                                    line: i,
                                    ignoreFieldChange: true
                                });
                            } else {
                                currentRecord.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'requesteddate',
                                    value: leadTime,
                                    line: i,
                                    ignoreFieldChange: true
                                });
                            }
                        }
                        if (!!notRequiredDate && !leadTime) {
                            currentRecord.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'requesteddate',
                                value: notRequiredDate,
                                line: i,
                                ignoreFieldChange: true
                            });
                        }
                        if (!notRequiredDate && !!leadTime) {
                            currentRecord.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'requesteddate',
                                value: leadTime,
                                line: i,
                                ignoreFieldChange: true
                            });
                        }
                        currentRecord.commitLine({
                            sublistId: 'item'
                        });
                    }
                }
                return true;
            }
            catch (e) {
                log.debug('Exception', e);
                return true;
            }

        }
        function lineInit(context) {
            var title = 'lineInit(::)';
            try {
                var currentRecord = context.currentRecord;
                var sublistId = context.sublistId;
                if (sublistId !== 'item') return;
                var paramRole = runtime.getCurrentScript().getParameter({name:'custscript_mcm_role'});
                var array = paramRole.split(',');
                var found = false;
            
                var customForm = currentRecord.getValue({ fieldId: 'customform' });//205
                var customFormInt = parseInt(customForm);
                var userRole = runtime.getCurrentUser();
                var role = JSON.stringify(userRole.role);
                for(var i=0; i<array.length; i++){
                    var roles = array[i];
                    if(roles == role){
                        found = true;
                    }
                }
                log.debug('found', found);
                // if(found == true && customFormInt == 205){
                    var field = currentRecord.getSublistField({
                        sublistId: 'item',
                        fieldId: 'price',
                        line: 0
                    });
                    field.isDisabled = true;
                // }
            } catch (e) {
                log.debug('Exception ' + title, e.message);
            }
        }
        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged,
            saveRecord: saveRecord
            // lineInit: lineInit
        };

    });
