/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/log'],

    function (log) {

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
                var recType = rec.type;
                if (recType == 'invoice') {
                    var subsidiary = rec.getValue({
                        fieldId: 'subsidiary'
                    });
                    if (subsidiary == 7) {//Global China Co
                        var form = rec.getValue({ fieldId: 'customform' });
                        if (form == 172 || form == 173) {
                            return true;
                        }
                        if (form != 171) {
                            rec.setValue({
                                fieldId: 'customform',
                                value: 171 //CGC Invoice
                            });
                            return true;
                        }

                    }
                }
                if (recType == 'creditmemo') {
                    var subsidiary = rec.getValue({
                        fieldId: 'subsidiary'
                    });
                    if (subsidiary == 7) {//Global China Co
                        var form = rec.getValue({ fieldId: 'customform' });
                        if (form == 177 || form == 178) {
                            return true;
                        }
                        if (form != 175) {
                            rec.setValue({
                                fieldId: 'customform',
                                value: 175 //CGC Credit Memo
                            });
                            return true;
                        }
                    }
                    return true;
                }
                if (recType == 'purchaseorder') {
                    var subsidiary = rec.getValue({
                        fieldId: 'subsidiary'
                    });
                    if (subsidiary == 7) {//Global China Co
                        var form = rec.getValue({ fieldId: 'customform' });
                        if (form != 176) {
                            rec.setValue({
                                fieldId: 'customform',
                                value: 176 //CGC Purchase Order
                            });
                            return true;
                        }
                    }
                    return true;
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
                var recType = rec.type;
                if (recType == 'salesorder') {
                    if (field == 'entity') {
                        var subsidiary = rec.getValue({
                            fieldId: 'subsidiary'
                        });
                        if (subsidiary == 7) {//Global China Co
                            rec.setValue({
                                fieldId: 'customform',
                                value: 168 //CGC Sales Order - Invoice
                            });
                        }
                    }
                }
                if (recType == 'invoice') {
                    if (field == 'entity') {
                        var subsidiary = rec.getValue({
                            fieldId: 'subsidiary'
                        });
                        if (subsidiary == 7) {//Global China Co
                            if (form == 172 || form == 173) {
                                return true;
                            }
                            if (form != 171) {
                                rec.setValue({
                                    fieldId: 'customform',
                                    value: 171 //CGC Invoice
                                });
                                return true;
                            }
                        }
                    }
                }
                if (recType == 'purchaseorder') {
                    if (field == 'entity') {
                        var subsidiary = rec.getValue({
                            fieldId: 'subsidiary'
                        });
                        if (subsidiary == 7) {//Global China Co
                            if (form != 176) {
                                rec.setValue({
                                    fieldId: 'customform',
                                    value: 176 //CGC Purchase Order
                                });
                                return true;
                            }
                        }
                    }
                }
                if (recType == 'creditmemo') {
                    if (field == 'entity') {
                        var subsidiary = rec.getValue({
                            fieldId: 'subsidiary'
                        });
                        if (subsidiary == 7) {//Global China Co
                            if (form == 177 || form == 178) {
                                return true;
                            }
                            if (form != 175) {
                                rec.setValue({
                                    fieldId: 'customform',
                                    value: 175 //CGC Credit Memo
                                });
                                return true;
                            }
                        }
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
                var recType = rec.type;
                log.debug({
                    title: 'recType',
                    details: recType
                });
                if (recType == 'invoice') {
                    var amountPaybale = rec.getText({ fieldId: 'custbody_gfl_amount_payable' });
                    log.debug({
                        title: 'amountPaybale',
                        details: amountPaybale
                    });
                    var amtPayable = amountPaybale.replace('%', '');
                    log.debug({
                        title: 'amtPayable',
                        details: amtPayable
                    });
                    log.debug({
                        title: 'type amtPayable',
                        details: typeof parseInt(amtPayable)
                    });
                    var total = rec.getValue({ fieldId: 'total' });
                    log.debug({
                        title: 'total',
                        details: total
                    });
                    var balanceDue = (total * parseInt(amtPayable)) / 100;
                    log.debug({
                        title: 'balanceDue',
                        details: balanceDue
                    });
                    if (!isNaN(balanceDue)) {
                        rec.setValue({ fieldId: 'custbody_balance_due', value: balanceDue });
                        rec.setValue({ fieldId: 'custbody_deafult_checkbox_check', value: false});
                    } else {
                        rec.setValue({ fieldId: 'custbody_deafult_checkbox_check', value: true});
                        log.debug({
                            title: 'not a number',
                            details: 'YES'
                        });
                    }
                    return true;
                }
                return true;
            } catch (e) {
                log.error(title + e.name, e.message);
            }
        }
        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged,
            saveRecord: saveRecord
        };

    });
