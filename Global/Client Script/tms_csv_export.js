/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       10 Aug 2016     G
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType 
 * 
 * @param {String} type Access mode: create, copy, edit
 * @returns {Void}
 */
function clientPageInit(type){
   
}

function tmsExport() {

    var generateTMSCSVURL = nlapiResolveURL('SUITELET', 'customscript_tms_csv_generate', 'customdeploy1', false);

    generateTMSCSVURL += '&id=' + nlapiGetRecordId() + '&type=' + nlapiGetRecordType();
    console.log(generateTMSCSVURL);
    newWindow = window.open(generateTMSCSVURL);
}

