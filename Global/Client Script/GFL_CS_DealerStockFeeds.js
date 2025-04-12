/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/log', 'N/record'],

    function (log, record) {

        /**
         * Function to be executed after page is initialized.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
         *
         * @since 2015.2
         */
        function pageInit(scriptContext) {
            var title = 'pageInit[::]';
            try {
                var rec = scriptContext.currentRecord;
                var dealerCheckBoxIdVal = rec.getValue({ fieldId: 'custrecord_dealer_checkbox_id' });
                var dealerCheckBoxId = rec.getField({
                    fieldId: 'custrecord_dealer_checkbox_id'
                });
                var dealerInventoryVal = rec.getValue({ fieldId: 'custrecord_dealer_inventory_dept' });
                var dealerInventory = rec.getField({
                    fieldId: 'custrecord_dealer_inventory_dept'
                });
                if(!isEmpty(dealerCheckBoxIdVal)){
                    dealerInventory.isDisabled = true;
                }
                else if(dealerInventoryVal[0] !== ''){
                    dealerCheckBoxId.isDisabled = true;
                }
            } catch (e) {
                log.error(title + e.name, e.message);
            }
        }


        /**
         * Function to be executed when field is changed.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         * @param {string} scriptContext.fieldId - Field name
         * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
         * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
         *
         * @since 2015.2
         */
        function fieldChanged(scriptContext) {
            var title = 'fieldChanged[::]';
            try {
                var rec = scriptContext.currentRecord;
                var field = scriptContext.fieldId;
                if (field == 'custrecord_dealer_checkbox_id') {
                    var dealerCheckBoxIdVal = rec.getValue({ fieldId: 'custrecord_dealer_checkbox_id' });
                    var dealerCheckBoxId = rec.getField({
                        fieldId: 'custrecord_dealer_checkbox_id'
                    });
                    var dealerInventory = rec.getField({
                        fieldId: 'custrecord_dealer_inventory_dept'
                    });
                    if (!isEmpty(dealerCheckBoxIdVal)) {
                        dealerInventory.isDisabled = true;
                        // dealerCheckBoxId.isMandatory = true;
                        rec.setValue({ fieldId: 'custrecord_dealer_inventory_dept', value: '' });
                    } else {
                        dealerInventory.isDisabled = false;
                        // dealerCheckBoxId.isMandatory = false;
                    }
                }
                if (field == 'custrecord_dealer_inventory_dept') {
                    var dealerInventoryVal = rec.getValue({ fieldId: 'custrecord_dealer_inventory_dept' });
                    var dealerInventory = rec.getField({
                        fieldId: 'custrecord_dealer_inventory_dept'
                    });
                    var dealerCheckBoxId = rec.getField({
                        fieldId: 'custrecord_dealer_checkbox_id'
                    });
                    if (dealerInventoryVal[0] !== '') {
                        dealerCheckBoxId.isDisabled = true;
                        // dealerInventory.isMandatory = true;
                        rec.setValue({ fieldId: 'custrecord_dealer_checkbox_id', value: '' });
                    } else {
                        dealerCheckBoxId.isDisabled = false;
                        // dealerInventory.isMandatory = false;
                    }
                }

            } catch (e) {
                log.error(title + e.name, e.message);
            }
        }
        /**
        * Validation function to be executed when record is saved.
        *
        * @param {Object} scriptContext
        * @param {Record} scriptContext.currentRecord - Current form record
        * @returns {boolean} Return true if record is valid
        *
        * @since 2015.2
        */
        function saveRecord(scriptContext) {
            var title = 'saveRecord[::]';
            try {
                var rec = scriptContext.currentRecord;
                var dealerInventoryVal = rec.getValue({ fieldId: 'custrecord_dealer_inventory_dept' });
                var dealerCheckBoxIdVal = rec.getValue({ fieldId: 'custrecord_dealer_checkbox_id' });
                if(isEmpty(dealerCheckBoxIdVal) && dealerInventoryVal[0] == ''){
                    alert('Please Enter Value in Inventory Department OR in Dealer CheckBox ID');
                    return false;
                }else{
                    return true;
                }
            } catch (e) {
                log.error(title + e.name, e.message);
            }
        }
        function isEmpty(stValue) {

            if ((stValue === '') || (stValue == null) || (stValue == undefined) || (stValue.length == 0)) {
                return true;
            }
            return false;
        }
        return {
            fieldChanged: fieldChanged,
            pageInit: pageInit,
            saveRecord: saveRecord
        };

    });
