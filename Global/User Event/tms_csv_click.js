/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       11 Aug 2016     G
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 *   
 * @param {String} type Operation types: create, edit, view, copy, print, email
 * @param {nlobjForm} form Current form
 * @param {nlobjRequest} request Request object
 * @returns {Void}
 */
function tmsClick(type, form, request){

	if (type == 'view') {
		//add a custom button on the form
		//log('form', JSON.stringify(form));

		form.addButton('custpage_tms_csv_button', 'TMS CSV', "tmsExport();");

		form.setScript('customscript_tms_csv_export');
	}
}

