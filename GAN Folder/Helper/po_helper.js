/**
 * @NApiVersion 2.1
 */
 define(['N/log', 'N/record', 'N/runtime', 'N/search', 'N/file'],
 /**
  * @param{log} log
  * @param{record} record
  * @param{runtime} runtime
  * @param{search} search
  * @param{file} file
  */
 (log, record, runtime, search, file,) => {

     let scriptParams = {};
     const CONSTANTS = {
         SCRIPT: {
             UE: {
                 SCRIPT_ID: 'customscript_key_ue_generate_file',
                 DEPLOYMENT_ID: 'customdeploy_key_ue_generate_file',
                 PARAMS: {
                     ROLES: 'custscript_ue_roles'
                 }
             },
             SUITELET: {
                 SCRIPT_ID: 'customscript_sl_generate_pdf_excel_file',
                 DEPLOYMENT_ID: 'customdeploy_sl_generate_pdf_excel_file',
                 PARAMS: {
                     SAVEDSEARCHID: 'custscript_po_saved_search'
                 }
             }   
         },
         BUTTON: {
             ID: 'custpage_csv_pdf',
             LABEL: 'Export CSV & PDF'
         },
         CLIENTMODULE: {
             FILEID: 65189
         },
         FILE: {
             FOLDERID: '12803'
         }
     }

     const HELPERS = {

         getParams: () => {
             if (!!scriptParams && Object.keys(scriptParams).length > 0) return scriptParams;
             let scriptId = runtime.getCurrentScript().id;
             let PARAMS = {};
             switch (scriptId) {
                 case CONSTANTS.SCRIPT.UE.SCRIPT_ID:
                     PARAMS = CONSTANTS.SCRIPT.UE.PARAMS;
                     break;
                 case CONSTANTS.SCRIPT.SUITELET.SCRIPT_ID:
                     PARAMS = CONSTANTS.SCRIPT.SUITELET.PARAMS;
                     break;
                 
             }

             Object.keys(PARAMS).forEach(key => {
                 scriptParams[key] = runtime.getCurrentScript().getParameter(PARAMS[key])
             });
             return scriptParams;
         },
         createCsvFile: (poId,savedSearchInternalId) => {
             let line = templateHelper.searchTemplateCsv(poId,savedSearchInternalId);
             let poNumber = templateHelper.getPoNumber(poId);
             let csvFile = file.create({
                 name: 'PO'+poNumber+'.csv',
                 fileType: file.Type.CSV,
                 contents: line,
                 folder: CONSTANTS.FILE.FOLDERID
             });
             csvFile.save();
         },
         createPdfFile: (poId,savedSearchInternalId) => {
         let poNumber = templateHelper.getPoNumber(poId);
         let savedSearchXmlTemp = templateHelper.searchTemplatePdf(poId,savedSearchInternalId);
         let pdfFileData = {
             tempData : savedSearchXmlTemp,
             poNumber : poNumber
         }
         return pdfFileData;
     }
     }


 const templateHelper = {
     searchTemplateCsv: (poId,savedSearchInternalId) => {
         let content = new Array();
         let csvColumns = new Array();
         let lineOne = '';
         let poSavedSearch = search.load({
             id: savedSearchInternalId
         });
         let poInternalId = search.createFilter({
             name: 'internalid',
             operator: 'anyof',
             values: [poId]
         });
         poSavedSearch.filters.push(poInternalId);
         let resultSet = poSavedSearch.run();
         log.debug('Results',resultSet);
         log.debug('poSavedSearch',poSavedSearch);
         resultSet.each(function (result) {
             let temp = '';
             for (let k = 0; k < poSavedSearch.columns.length; k++) {
                if(!poSavedSearch.columns[k].join){
                  searchResult = result.getText({
                     name: poSavedSearch.columns[k].name
                 });
               //  log.debug('searchResult1',searchResult);
                 if(!searchResult){
                    searchResult = result.getValue({
                        name: poSavedSearch.columns[k].name
                    });
                    
                 }
                 temp += searchResult + ',';
                }
                else if (poSavedSearch.columns[k].join){
                    searchResult = result.getText({
                        name: poSavedSearch.columns[k].name,
                        join: poSavedSearch.columns[k].join
                    });
                  //  log.debug('searchResult2',searchResult);
                    if(!searchResult){
                        searchResult = result.getValue({
                            name: poSavedSearch.columns[k].name,
                            join: poSavedSearch.columns[k].join
                        });
                    }
                    temp += searchResult + ',';
                }
             }
             content.push(temp);
             return true;
         });

         resultSet.columns.forEach(function (col) {
             csvColumns.push(col.label);
         });

         for (let i = 0; i < csvColumns.length; i++) {
             lineOne += csvColumns[i] + ',';
         }
         lineOne = lineOne + '\n';
         for (let j = 0; j < content.length; j++) {
             lineOne += content[j].toString() + '\n';
         }
         return lineOne;
     },
     searchTemplatePdf: (poId,savedSearchInternalId) => {
         let POsearchArray = [];
         let poSavedSearch = search.load({
             id: savedSearchInternalId
         });
         let InternalDFilterPO = search.createFilter({
             name: 'internalid',
             operator: 'anyof',
             values: [poId]
         });
         poSavedSearch.filters.push(InternalDFilterPO);
         poSavedSearch.run().each(function(result){
             let obj ={};
             obj.item = result.getValue({name: 'item'});
             obj.quantity = result.getValue({name: 'quantity'});
             obj.memo = result.getValue({name: 'memo'});
             obj.rate = result.getValue({name: 'rate'});
             obj.fxamount = result.getValue({name: 'fxamount'});
             obj.internalid = result.getValue({name: 'internalid'});
             obj.tranid = result.getValue({name: 'tranid'});
             obj.vendorname = result.getValue({name: 'vendorname', join: 'item'});
             POsearchArray.push(obj);
             return true;
         });
         let template = '<?xml version="1.0"?><!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">';
          template += "<pdfset>";
          template += "<pdf>";
          template += "<head>";
          template += '<link name="NotoSans" type="font" subtype="truetype" src="${nsfont.NotoSans_Regular}" src-bold="${nsfont.NotoSans_Bold}" src-italic="${nsfont.NotoSans_Italic}" src-bolditalic="${nsfont.NotoSans_BoldItalic}" bytes="2" />'
          template += "</head>";
          template += "<body header='nlheader' header-height='14%' padding='0.5in 0.5in 0.5in 0.5in' size='Letter'>";
          template += "<table style='width: 100%;'>\
          <thead>\
          <tr>\
          <th>Vender Part #</th>\
         <th>Vendor Name</th>\
         <th>Quantity</th>\
         <th>Description</th>\
         <th>Rate</th>\
         <th>Amount</th>\
         <th>Internal</th>\
         <th>PO #</th>\
          </tr>\
          </thead>";
         for(let i = 0; i<POsearchArray.length; i++){
             template += "<tr>\
             <td>"+POsearchArray[i].item+"</td>\
             <td>"+POsearchArray[i].vendorname+"</td>\
             <td>"+POsearchArray[i].quantity+"</td>\
             <td>"+POsearchArray[i].memo+"</td>\
             <td>"+POsearchArray[i].rate+"</td>\
             <td>"+POsearchArray[i].fxamount+"</td>\
             <td>"+POsearchArray[i].internalid+"</td>\
             <td>"+POsearchArray[i].tranid+"</td>\
             </tr>";
         }
          template += "</table>";
          template += "</body>";
          template += "</pdf>";
          template += "</pdfset>";
          return template;
     },
     getPoNumber: (poId) => {
         let poRecord = record.load({
             type : 'purchaseorder',
             id : poId
         });
         let poNumber = poRecord.getValue('tranid');
         if(poNumber){
             return poNumber
         }
     }
 }
     return { CONSTANTS, HELPERS, templateHelper }

 });