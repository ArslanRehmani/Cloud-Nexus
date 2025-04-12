
/**
 *@NApiVersion 2.0
 *@NScriptType ClientScript
 *

 */

 define(['N/url', 'N/currentRecord'], function (nsUrl, currentRecord) {


	function pageInit(context) {
        console.log('pageInit Work','pageWork');
	}

	function printxlsx(redId) {
        console.log('printxlsx ->',redId.toString());
		var scriptURL = nsUrl.resolveScript({
			scriptId: 'customscript_gfl_sl_xlsx_pdf',
			deploymentId: 'customdeploy_gfl_sl_xlsx_pdf',
			params: {
				id: redId
			},
			returnExternalUrl: false
		});
		newWindow = window.open(scriptURL);
	}


	return {
		pageInit: pageInit,
		printxlsx: printxlsx
	};
});