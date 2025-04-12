/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
 define(['N/log', 'N/record', 'N/runtime', 'SuiteScripts/Dev Folder/po_csv_helper.js'],
 /**
* @param{log} log
* @param{record} record
*/
 (log, record, runtime, HELPER) => {
	 /**
	  * @param {Object} context
	  */
	 const beforeLoad = (context) => {
		 try {
			 let currentUserRole = (runtime.getCurrentUser().roleId);
			 let allowedRoles = HELPER.HELPERS.getParams();
			 let allowedRolesArray = !!(allowedRoles.ROLES).split(',') ? (allowedRoles.ROLES).split(',') : allowedRoles.ROLES ;
			 if ((allowedRolesArray.indexOf(currentUserRole)) > -1 && context.type === context.UserEventType.VIEW) {
					 context.form.addButton({
						 id: HELPER.CONSTANTS.BUTTON.ID,
						 label: HELPER.CONSTANTS.BUTTON.LABEL,
						 functionName: 'createCsvPdf()'
					 });
					 context.form.clientScriptFileId = HELPER.CONSTANTS.CLIENTMODULE.FILEID;
				 }
			 else{
				 return true;
			 }
		 }
		 catch (e) {
			 log.debug('beforeLoad Exception', e);
		 }
	 }
	 return { beforeLoad }
 });