
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
      var currentRecord = context.newRecord;
      var recid = currentRecord.id;

		try {
			log.debug('context.type', context.type);
			if (context.type == context.UserEventType.VIEW || context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT) {
				addbutton(context,recid)
			}
		}
		catch (e) {
			log.error('ERROR in addButton', e.message)
		}

	}

	function addbutton(context,recid) {
		try {
            log.debug('recID userEevnt',recid);
				var form = context.form;
				form.clientScriptFileId = '12831';
				form.addButton({id: "custpage_printWorkOrder", label: "Print Work Order", functionName: "printWorkOrder(' " + recid + "')"});

		}
		catch (e) {
			log.error('Error::addbutton', e.message);
		}
	}

	return {
		beforeLoad: beforeLoad,
	}

});