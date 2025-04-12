/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/log', 'N/search', 'N/currentRecord'],

    function (log, search, currentRecord) {

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
                console.log('TEST','YES');
            } catch (e) {
                console.log(title + e.name, e.message);
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
                var fieldid = scriptContext.fieldId;
                var sublisid = scriptContext.sublistId;
                if (sublisid && fieldid == 'custpage_absent') {
                    var absent = rec.getCurrentSublistValue({
                        sublistId: 'custpage_employee_list',
                        fieldId: 'custpage_absent'
                    });
                    if (absent == 'T' || absent == true) {
                        rec.setCurrentSublistValue({
                            sublistId: 'custpage_employee_list',
                            fieldId: 'custpage_present',
                            value: false
                        });
                        rec.setCurrentSublistValue({
                            sublistId: 'custpage_employee_list',
                            fieldId: 'custpage_wfh',
                            value: false
                        });
                        rec.setCurrentSublistValue({
                            sublistId: 'custpage_employee_list',
                            fieldId: 'custpage_onroad',
                            value: false
                        });
                    }
                }
                else if (sublisid && fieldid == 'custpage_wfh') {
                    var wfh = rec.getCurrentSublistValue({
                        sublistId: 'custpage_employee_list',
                        fieldId: 'custpage_wfh'
                    });
                    if (wfh == 'T' || wfh == true) {
                        rec.setCurrentSublistValue({
                            sublistId: 'custpage_employee_list',
                            fieldId: 'custpage_absent',
                            value: false
                        });
                        rec.setCurrentSublistValue({
                            sublistId: 'custpage_employee_list',
                            fieldId: 'custpage_present',
                            value: false
                        });
                        rec.setCurrentSublistValue({
                            sublistId: 'custpage_employee_list',
                            fieldId: 'custpage_onroad',
                            value: false
                        });
                    }
                }
                else if (sublisid && fieldid == 'custpage_present') {
                    var present = rec.getCurrentSublistValue({
                        sublistId: 'custpage_employee_list',
                        fieldId: 'custpage_present'
                    });
                    if (present == 'T' || present == true) {
                        rec.setCurrentSublistValue({
                            sublistId: 'custpage_employee_list',
                            fieldId: 'custpage_absent',
                            value: false
                        });
                        rec.setCurrentSublistValue({
                            sublistId: 'custpage_employee_list',
                            fieldId: 'custpage_wfh',
                            value: false
                        });
                        rec.setCurrentSublistValue({
                            sublistId: 'custpage_employee_list',
                            fieldId: 'custpage_onroad',
                            value: false
                        });
                    }
                }
                else if (sublisid && fieldid == 'custpage_onroad') {
                    var onRoad = rec.getCurrentSublistValue({
                        sublistId: 'custpage_employee_list',
                        fieldId: 'custpage_onroad'
                    });
                    if (onRoad == 'T' || onRoad == true) {
                        rec.setCurrentSublistValue({
                            sublistId: 'custpage_employee_list',
                            fieldId: 'custpage_present',
                            value: false
                        });
                        rec.setCurrentSublistValue({
                            sublistId: 'custpage_employee_list',
                            fieldId: 'custpage_absent',
                            value: false
                        });
                        rec.setCurrentSublistValue({
                            sublistId: 'custpage_employee_list',
                            fieldId: 'custpage_wfh',
                            value: false
                        });
                    }
                }
            } catch (e) {
                console.log(title + e.name, e.message);
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
                var unSelectedLines = [];
                var lineCount = rec.getLineCount({
                    sublistId: 'custpage_employee_list'
                });
                for (var p = 0; p < lineCount; p++){
                    var present = rec.getSublistValue({
                        sublistId: 'custpage_employee_list',
                        fieldId: 'custpage_present',
                        line: p
                    });
                    var absent = rec.getSublistValue({
                        sublistId: 'custpage_employee_list',
                        fieldId: 'custpage_absent',
                        line: p
                    });
                    var wfh = rec.getSublistValue({
                        sublistId: 'custpage_employee_list',
                        fieldId: 'custpage_wfh',
                        line: p
                    });
                    var onRoad = rec.getSublistValue({
                        sublistId: 'custpage_employee_list',
                        fieldId: 'custpage_onroad',
                        line: p
                    });
                    if(present == false && absent == false && wfh == false && onRoad == false){
                        unSelectedLines.push(p + 1);
                    }
                }
                if(unSelectedLines.length > 0){
                    alert('You have not selected any Value for the following Lines' + '\n' + unSelectedLines.join('\n'));
                    return false;
                }else{
                    return true;
                }
            } catch (e) {
                log.error(title + e.name, e.message);
            }
        }
        function allPresent() {
            var title = 'allPresent[::]';
            try {
                var cRecord = currentRecord.get();
                var lineCount = cRecord.getLineCount({
                    sublistId: 'custpage_employee_list'
                });
                if (lineCount && lineCount > 0) {
                    for (var j = 0; j < lineCount; j++) {
                        cRecord.selectLine({
                            sublistId: 'custpage_employee_list',
                            line: j
                        });
                        cRecord.setCurrentSublistValue({
                            sublistId: 'custpage_employee_list',
                            fieldId: 'custpage_present',
                            value: true
                        });
                    }
                }
            } catch (e) {
                console.log(title + e.name, e.message);
            }
        }
        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged,
            saveRecord: saveRecord,
            allPresent: allPresent
        };

    });
