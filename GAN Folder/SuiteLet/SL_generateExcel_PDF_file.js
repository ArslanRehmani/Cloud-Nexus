/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
 define(['N/log', 'N/record', 'N/runtime', 'SuiteScripts/Dev Folder/po_csv_helper.js', 'N/render'],
 /**
* @param{log} log
* @param{record} record
*/
 (log, record, runtime, HELPER, render) => {
     const onRequest = (options) => {
             let poId = options.request.parameters.id;
             let params = HELPER.HELPERS.getParams();
             log.debug('savedSearchInternalId',params.SAVEDSEARCHID);
             if(params.SAVEDSEARCHID){
             let csvFile = HELPER.HELPERS.createCsvFile(poId,params.SAVEDSEARCHID);
             let pdfFile = HELPER.HELPERS.createPdfFile(poId,params.SAVEDSEARCHID);
             let convertToPdf = generatePDf.convertXmltoPdf(pdfFile.tempData,poId,pdfFile.poNumber);
             }
     }
     const generatePDf = {
         convertXmltoPdf: (pdfFile,poId,poNumber) => {
         let pdfFileCreated = render.xmlToPdf({
             xmlString : pdfFile
         });
         pdfFileCreated.name = 'PO'+poNumber+'.pdf';
         pdfFileCreated.folder = HELPER.CONSTANTS.FILE.FOLDERID;
         pdfFileCreated.save();
     }
 }
     return { onRequest };
 });