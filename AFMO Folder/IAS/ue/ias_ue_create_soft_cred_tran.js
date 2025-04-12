/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/runtime', 'N/search', 'N/format'],
    /**
 * @param{record} record
 */
    (record, runtime, search, format) => {
        /**
         * Defines the function definition that is executed before record is loaded.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @param {Form} scriptContext.form - Current form
         * @param {ServletRequest} scriptContext.request - HTTP request information sent from the browser for a client action only.
         * @since 2015.2
         */
        const beforeLoad = (scriptContext) => {

        }

        /**
         * Defines the function definition that is executed before record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const beforeSubmit = (scriptContext) => {

        }

        /**
         * Defines the function definition that is executed after record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const afterSubmit = (scriptContext) => {
            try{
                let objRecord = scriptContext.newRecord;
                let softCredit = objRecord.id;
                let customForm = runtime.getCurrentScript().getParameter('custscript_ias_soft_cred_form');
                let entityId = objRecord.getValue('custrecord2');
                let account =  runtime.getCurrentScript().getParameter('custscript_ias_soft_cred_account');
                let donation = objRecord.getValue('custrecord_npo_sc_btid');
                if(isEmpty(donation)) {
                    //If date is empty on Soft Credit, log it and exit script
                    log.audit("Warninig", 'The following Soft Credit does not have a donation, exit script: '+softCredit);
                    return;
                }
                let salesRep = '';
                if(!isEmpty(donation)) {
                    let donationSalesRep = search.lookupFields({
                        type: 'cashsale',
                        id: donation,
                        columns: 'salesrep'
                    }).salesrep;

                    if(!isEmpty(donationSalesRep) && isEmployeeInactive(donationSalesRep[0].value) == false){
                        salesRep = donationSalesRep[0].value;
                    }
                }
                log.debug('salesRep', salesRep);

                let softCreditItem = runtime.getCurrentScript().getParameter('custscript_ias_soft_cred_item');
                let amount = objRecord.getValue('custrecord_npo_sc_amount');
                let date = objRecord.getValue('custrecord1');
                log.debug('date', date);
                if(isEmpty(date)) {
                    //If date is empty on Soft Credit, log it and exit script
                    log.audit("Warninig", 'The following Soft Credit does not have a date, exit script: '+softCredit);
                    return;
                }

                let fundProgram = objRecord.getValue('custrecord_44_cseg_npo_program');

                let objSoftCreditTransaction = record.create({
                    type: 'customsale_soft_credit_trans',
                    isDynamic: true
                });
                objSoftCreditTransaction.setValue('customform', customForm);
                objSoftCreditTransaction.setValue('entity', entityId);
                objSoftCreditTransaction.setValue('trandate', stringToDate(date));
                objSoftCreditTransaction.setValue('salesrep', salesRep);
                objSoftCreditTransaction.setValue('account', account);
                objSoftCreditTransaction.setValue('custbody_donation_link', donation);
                objSoftCreditTransaction.setValue('custbody_ias_soft_credit_link', softCredit);

                objSoftCreditTransaction.setValue('custbody_atlas_fundprg_purchase', fundProgram);
                objSoftCreditTransaction.setValue('custbody_cseg_npo_program', fundProgram);

                objSoftCreditTransaction.selectNewLine('item');
                objSoftCreditTransaction.setCurrentSublistValue('item', 'item', softCreditItem);
                objSoftCreditTransaction.setCurrentSublistValue('item', 'quantity', 1);
                objSoftCreditTransaction.setCurrentSublistValue('item', 'amount', amount);

                objSoftCreditTransaction.commitLine('item');

                let softCreditTranId = objSoftCreditTransaction.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                });

                log.debug('softCreditTranId', softCreditTranId);

                record.submitFields({
                    type: 'customrecord_npo_soft_credit',
                    id: softCredit,
                    values: {
                        'custrecord_ias_soft_credit_tran_link': softCreditTranId
                    }
                });

                /*record.submitFields({
                    type: 'customsale_soft_credit_trans',
                    id: softCreditTranId,
                    values: {
                        'trandate': date
                    }
                });*/

            }catch (e) {
                log.error('ERROR', e);
            }
        }

        function isEmpty(stValue) {
            return ((stValue === '' || stValue == null || stValue == undefined) || (stValue.constructor === Array && stValue.length == 0) || (stValue.constructor === Object && (function(v) {
                for (var k in v)
                    return false;
                return true;
            })(stValue)));
        };

        function stringToDate(date){
            return format.parse({
                value: date,
                type: format.Type.DATE
            });
        }

        function isEmployeeInactive(employeeId){
            var employeeSearchObj = search.create({
                type: "employee",
                filters:
                    [
                        ["isinactive","is","T"],
                        "AND",
                        ["internalid","anyof",employeeId]
                    ],
                columns:
                    [
                        search.createColumn({
                            name: "entityid",
                            sort: search.Sort.ASC,
                            label: "Name"
                        }),
                        search.createColumn({name: "email", label: "Email"}),
                        search.createColumn({name: "phone", label: "Phone"}),
                        search.createColumn({name: "altphone", label: "Office Phone"}),
                        search.createColumn({name: "fax", label: "Fax"}),
                        search.createColumn({name: "supervisor", label: "Supervisor"}),
                        search.createColumn({name: "title", label: "Job Title"}),
                        search.createColumn({name: "altemail", label: "Alt. Email"}),
                        search.createColumn({name: "custentity_cseg_npo_program", label: "Fund/Program"})
                    ]
            });
            var searchResultCount = employeeSearchObj.runPaged().count;

            if(searchResultCount == 0){
                return false;
            }

            return true;
        }

        return {afterSubmit}

    });
