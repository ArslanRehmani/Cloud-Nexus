
/**
 *@NApiVersion 2.0
 *@NScriptType UserEventScript
 *
 */
define(['N/log'], function (log) {


	/**
	 * Entry point function
	 * @param context
	 */
	function beforeLoad(context) {
		var title = 'beforeLoad[::]';
		var currentRecord = context.newRecord;
		var recid = currentRecord.id;

		try {
			if (context.type == context.UserEventType.VIEW) {
				var subsidiary = currentRecord.getValue({fieldId: 'subsidiary'});
				log.debug({
					title: 'subsidiary',
					details: subsidiary
				});
				if(subsidiary == 7){
					var arrayOfItems = arrayOfItemFun(currentRecord);
					addbutton(context, recid, arrayOfItems);
				}
			}
		}
		catch (e) {
			log.error(title + e.name, e.message);
		}

	}

	function addbutton(context, recid, arr) {
		var title = 'addbutton[::]';
		try {
			log.debug('recID userEevnt', recid);
			var form = context.form;
			form.clientScriptFileId = '20134875';
			form.addButton({ id: "custpage_gotosorecord", label: "Sales Order", functionName: "gotosorecord(' " + recid + "' , ' " + JSON.stringify(arr) + "')" });
		}
		catch (e) {
			log.error(title + e.name, e.message);
		}
	}
	function arrayOfItemFun(rec) {
		var title = 'arrayOfItemFun[::]';
		try {
			var lineCount = rec.getLineCount({
				sublistId: 'item'
			});
			var array = [];
			var obj;
			if(lineCount && lineCount > 0){
				for(var m = 0; m < lineCount; m++){
					obj = {};
					obj.item = rec.getSublistValue({
						sublistId: 'item',
						fieldId: 'item',
						line: m
					});
					obj.amount = rec.getSublistValue({
						sublistId: 'item',
						fieldId: 'amount',
						line: m
					});
					obj.taxcode = rec.getSublistValue({
						sublistId: 'item',
						fieldId: 'custcol_sales_tax_code',
						line: m
					});
					array.push(obj);
				}
			}
			return array || [];
		} catch (e) {
			log.error(title + e.name, e.message);
		}
	}

	return {
		beforeLoad: beforeLoad,
	}

});