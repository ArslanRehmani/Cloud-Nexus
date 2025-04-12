
/**
 *@NApiVersion 2.0
 *@NScriptType ClientScript
 *

 */

 define(['N/url', 'N/currentRecord'], function (nsUrl, currentRecord) {


	function pageInit(context) {
        console.log('pageInit Work','pageWork');
	}

	function printSalesOrder(redId) {
        console.log('printWorkOrder ->',redId.toString());
		var currentRec = currentRecord.get();
		var scriptURL = nsUrl.resolveScript({
			scriptId: 'customscript_gan_sl_wo_template',
			deploymentId: 'customdeploy_gan_sl_wo_template',
			params: {
				id: redId,
				rectype: currentRec.type
			},
			returnExternalUrl: false
		});
		newWindow = window.open(scriptURL);
	}


	return {
		pageInit: pageInit,
		printSalesOrder: printSalesOrder
	};
});