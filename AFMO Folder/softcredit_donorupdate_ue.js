/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/redirect', 'N/log'],

    function (record, redirect) {

        /**
         * Function definition to be triggered before record is loaded.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {string} scriptContext.type - Trigger type
         * @param {Form} scriptContext.form - Current form
         * @Since 2015.2
         */
        function beforeLoad(scriptContext) {

        }

        /**
         * Function definition to be triggered before record is loaded.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type
         * @Since 2015.2
         */
        function beforeSubmit(scriptContext) {

        }

        /**
         * Function definition to be triggered before record is loaded.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type
         * @Since 2015.2
         */
        function afterSubmit(scriptContext) {
          try{
            log.debug('checkiftriggered', 'triggered')
            var rec = scriptContext.newRecord
            var cust_id = rec.getValue({
                fieldId: 'custrecord_npo_sc_constituent'
            })

            redirect.toSuitelet({
                scriptId: 'customscript_soft_credit_donor_sync' ,
                deploymentId: 'customdeploy1',
                parameters: {
                    'donationRecord': scriptContext.newRecord.id, 
                    'recordType': scriptContext.newRecord.type,
                    'customerid': cust_id
                } 
          });
          }catch(e){
            log.error('ERROR', e);
          }


        }

        return {
            //        beforeLoad: beforeLoad,
            //        beforeSubmit: beforeSubmit,
            afterSubmit: afterSubmit
        };

    });