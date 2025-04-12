
/**
 *@NApiVersion 2.0
 *@NScriptType ClientScript
 *

 */

 define(['N/url', 'N/currentRecord'], function (nsUrl, currentRecord) {


	function pageInit(context) {
        console.log('pageInit Work','pageWork');
	}

	function printItem(redId) {
        console.log('printItem ->',redId.toString());
		var scriptURL = nsUrl.resolveScript({
			scriptId: 'customscript_mcm_sl_print_group_item',
			deploymentId: 'customdeploy_mcm_sl_print_group_item',
			params: {
				id: redId
			},
			returnExternalUrl: false
		});
		newWindow = window.open(scriptURL);
	}


	return {
		pageInit: pageInit,
		printItem: printItem
	};
});