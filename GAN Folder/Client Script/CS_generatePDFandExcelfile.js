/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
 define(['N/currentRecord', 'SuiteScripts/Dev Folder/po_csv_helper.js', 'N/log', 'N/https', 'N/url'],
 /**
  * @param{currentRecord} currentRecord
  * @param{runtime} runtime
  */
 function (currentRecord, HELPER, log, https, url) {

     /**
      * Function to be executed after page is initialized.
      *
      * @param {Object} scriptContext
      * @param {Record} scriptContext.currentRecord - Current form record
      * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
      *
      * @since 2015.2
      */
     const pageInit = (scriptContext) => {

     }
     const createCsvPdf = () => {
         try {
             let id = currentRecord.get().id;
             let suiteUrl = url.resolveScript({
                 scriptId: HELPER.CONSTANTS.SCRIPT.SUITELET.SCRIPT_ID,
                 deploymentId: HELPER.CONSTANTS.SCRIPT.SUITELET.DEPLOYMENT_ID,
                 params: {
                     'id': id
                 }
             });
             let response = https.get({
                 url: suiteUrl
             });
         }
         catch (e) {
             log.debug('createCsvPdf Exception', e);
         }
     }
     return {
         pageInit,
         createCsvPdf
     };

 });