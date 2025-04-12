/*
 ***********************************************************************
 * Author:		Muhammad Waqas
 * File:		CNL_CS_LineFieldMandatory.js
 * Date:		07 Feb 2024
 ************************************************************************/
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
                if (scriptContext.mode == 'copy') {
                    var cr = scriptContext.currentRecord;
                    var subListId = scriptContext.sublistId;
                    var fieldId = scriptContext.fieldId;
                    var lineCount = cr.getLineCount({ sublistId: 'line' });
                    if (lineCount > -1) {
                        cr.selectLine({ sublistId: 'line', line: lineCount - 1 });
                        if (subListId == 'line' && fieldId == 'account') {
                            var sublistName = cr.getSublist({ sublistId: subListId });
                            var locationColumn = sublistName.getColumn({ fieldId: "location" });
                            locationColumn.isMandatory = true;
                        }
                    }
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
         *
         * @since 2015.2
         */
        function fieldChanged(scriptContext) {
            var title = 'fieldChanged[*_*]'
            try {
                var cr = scriptContext.currentRecord;
                var subListId = scriptContext.sublistId;
                var fieldId = scriptContext.fieldId;
                if (subListId == 'line' && fieldId == 'account') {
                    var sublistName = cr.getSublist({ sublistId: subListId });
                    var locationColumn = sublistName.getColumn({ fieldId: "location" });
                    locationColumn.isMandatory = true;
                }
            } catch (e) {
                log.error({ title: title + ' ' + e.name, details: e.message });
            }
        }
        /**
         * Function to be executed after line is selected.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         *
         * @since 2015.2
         */
        function lineInit(scriptContext) {
            var title = 'lineInit[*_*]'
            try {
                var cr = scriptContext.currentRecord;
                var subListId = scriptContext.sublistId;
                var sublistName = cr.getSublist({ sublistId: subListId });
                var locationColumn = sublistName.getColumn({ fieldId: "location" });
                locationColumn.isMandatory = true;
            } catch (e) {
                log.error({ title: title + ' ' + e.name, details: e.message });
            }
        }

        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged,
            lineInit: lineInit
        };

    });
