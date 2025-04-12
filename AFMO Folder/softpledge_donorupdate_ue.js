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
            log.debug('checkiftriggered', 'triggered')
            var rec = scriptContext.newRecord
            var cust_id = rec.getValue({
                fieldId: 'entity'
            })

            var cust_rec = record.load({
                type: record.Type.CUSTOMER,
                id: cust_id,
                isDynamic: true,
            });

            var donor_id = cust_rec.save({
                enableSourcing: true,
                ignoreMandatoryFields: true
            });

            log.debug('donor id', donor_id)


        }

        return {
            //        beforeLoad: beforeLoad,
            //        beforeSubmit: beforeSubmit,
            afterSubmit: afterSubmit
        };

    });