
/**
 *@NApiVersion 2.0
 *@NScriptType ClientScript
 *

 */

 define(['N/url', 'N/currentRecord'], function (nsUrl, currentRecord) {


	function pageInit(context) {
        console.log('pageInit Work','pageWork');
	}

	function printProFormaOrder(redId) {
        console.log('printProFormaOrder ->',redId.toString());
		var currentRec = currentRecord.get();
		var scriptURL = nsUrl.resolveScript({
			scriptId: 'customscript_gan_sl_print_pro_forma',
			deploymentId: 'customdeploy_gan_sl_print_pro_forma',
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
		printProFormaOrder: printProFormaOrder
	};
});