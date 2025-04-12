/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define([],

    function () {

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
                var recType = rec.type;
                if (recType == 'invoice') {
                    var amountPaybale = rec.getText({ fieldId: 'custbody_gfl_amount_payable' });
                    if (amountPaybale) {
                        var amtPayable = amountPaybale.replace('%', '');
                        var total = rec.getValue({ fieldId: 'total' });
                        var balanceDue = (total * parseInt(amtPayable)) / 100;
                        if (!isNaN(balanceDue)) {
                            rec.setValue({ fieldId: 'custbody_balance_due', value: balanceDue });
                            rec.setValue({ fieldId: 'custbody_deafult_checkbox_check', value: false });
                        } else {
                            rec.setValue({ fieldId: 'custbody_deafult_checkbox_check', value: true });
                        }
                    } else {
                        rec.setValue({ fieldId: 'custbody_balance_due', value: 0.00 });
                        rec.setValue({ fieldId: 'custbody_deafult_checkbox_check', value: false });
                    }
                    return true;
                }
                return true;
            } catch (e) {
                log.error(title + e.name, e.message);
            }
        }

        return {
            saveRecord: saveRecord
        };

    });
