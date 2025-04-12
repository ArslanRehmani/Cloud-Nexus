/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/url', 'N/http', 'N/currentRecord'],

	function (url, http, currentRecord) {
		/**
		 * Function to be executed after page is initialized.
		 *
		 * @param {Object} scriptContext
		 * @param {Record} scriptContext.currentRecord - Current form record
		 * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
		 *
		 * @since 2015.2
		 */
		function pageInit(scriptContext) {
			var title = 'pageInit[::]';
			try {
				var rec = currentRecord.get();
				rec.setValue({ fieldId: 'custpage_profitlist', value: 3 });
				var highestPoRate = rec.getValue({ fieldId: 'custpage_highestporate' });
				var freightRate = rec.getText({ fieldId: 'custpage_freightrate' });
				console.log({
					title: 'freightRate',
					details: freightRate
				});
				var amcanUsCustomDuty = rec.getValue({ fieldId: 'custpage_amcanuscustomduty' });
				var countryOfOrigin = rec.getValue({ fieldId: 'custpage_countryoforigin' });

				if (countryOfOrigin == '2') {// Non China Origin

					var percentage = (parseFloat(amcanUsCustomDuty.replace(/%/g, ''))) + parseInt(freightRate);// 10 is Freight 2 USA % which is fixed
					// var percentage = (parseFloat(amcanUsCustomDuty.replace(/%/g, ''))) + 10;// 10 is Freight 2 USA % which is fixed
					var newPercentage = (percentage * 0.01) + 1;
					var usaLandedCost = parseFloat(highestPoRate * newPercentage).toFixed(3);
					rec.setValue({ fieldId: 'custpage_usalandedcost', value: usaLandedCost });
				} else {//China Origin
					var percentage = (parseFloat(amcanUsCustomDuty.replace(/%/g, ''))) + parseInt(freightRate) +25;// 10 is Freight 2 USA % which is fixed + 25 for china Country Origin
					// var percentage = (parseFloat(amcanUsCustomDuty.replace(/%/g, ''))) + 10 +25;// 10 is Freight 2 USA % which is fixed + 25 for china Country Origin
					var newPercentage = (percentage * 0.01) + 1;
					var usaLandedCost = parseFloat(highestPoRate * newPercentage).toFixed(3);
					rec.setValue({ fieldId: 'custpage_usalandedcost', value: usaLandedCost });
				}

				var profit = 40; //ddeafult value is 40
				var usLandedCost = rec.getValue({ fieldId: 'custpage_usalandedcost' });
				var usLandedrate = usLandedCost;
				var result = ((parseFloat(usLandedrate) / (1 - parseInt(profit) / 100))).toFixed(3);
				rec.setValue({ fieldId: 'custpage_finalusapricefield', value: result });
			} catch (e) {
				log.error(title + e.name, e.message);
			}
		}

		/**
		 * Function to be executed when field is changed.
		 *
		 * @param {Object} scriptContext
		 * @param {Record} scriptContext.currentRecord - Current form record
		 * @param {string} scriptContext.sublistId - Sublist name
		 * @param {string} scriptContext.fieldId - Field name
		 * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
		 * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
		 *
		 * @since 2015.2
		 */
		function fieldChanged(scriptContext) {
			var title = 'fieldChanged[::]';
			try {
				var rec = currentRecord.get();
				var fieldId = scriptContext.fieldId;
				if (fieldId == 'custpage_profitlist') {
					var profit = rec.getText({ fieldId: 'custpage_profitlist' });
					if (profit) {
						var usLandedCost = rec.getValue({ fieldId: 'custpage_usalandedcost' });
						var usLandedrate = usLandedCost;
						//var result = ((parseFloat(usLandedrate) * (1+parseInt(profit)/100))).toFixed(2);
						var result = ((parseFloat(usLandedrate) / (1 - parseInt(profit) / 100))).toFixed(3);
						rec.setValue({ fieldId: 'custpage_finalusapricefield', value: result });
					} else {
						rec.setValue({ fieldId: 'custpage_finalusapricefield', value: '' });
					}

				}
				if (fieldId == 'custpage_countryoforigin' || fieldId == 'custpage_highestporate' || fieldId == 'custpage_freightrate') {
					var freightRate = rec.getText({ fieldId: 'custpage_freightrate' });
					var highestPoRate = rec.getValue({ fieldId: 'custpage_highestporate' });
					var amcanUsCustomDuty = rec.getValue({ fieldId: 'custpage_amcanuscustomduty' });
					var countryOfOrigin = rec.getValue({ fieldId: 'custpage_countryoforigin' });

					if (countryOfOrigin == '2') {// Non China Origin

						var percentage = (parseFloat(amcanUsCustomDuty.replace(/%/g, ''))) + parseInt(freightRate);// 10 is Freight 2 USA % which is fixed
						// var percentage = (parseFloat(amcanUsCustomDuty.replace(/%/g, ''))) + 10;// 10 is Freight 2 USA % which is fixed
						var newPercentage = (percentage * 0.01) + 1;
						var usaLandedCost = parseFloat(highestPoRate * newPercentage).toFixed(3);
						rec.setValue({ fieldId: 'custpage_usalandedcost', value: usaLandedCost });
						rec.setValue({ fieldId: 'custpage_countryoforiginduty', value: '0%' });
					} else if (countryOfOrigin == '1') {//China Origin
						var percentage = (parseFloat(amcanUsCustomDuty.replace(/%/g, ''))) + parseInt(freightRate) + 25;// 10 is Freight 2 USA % which is fixed + 25 for china Country Origin
						// var percentage = (parseFloat(amcanUsCustomDuty.replace(/%/g, ''))) + 10 + 25;// 10 is Freight 2 USA % which is fixed + 25 for china Country Origin
						var newPercentage = (percentage * 0.01) + 1;
						var usaLandedCost = parseFloat(highestPoRate * newPercentage).toFixed(3);
						rec.setValue({ fieldId: 'custpage_usalandedcost', value: usaLandedCost });
						rec.setValue({ fieldId: 'custpage_countryoforiginduty', value: '25%' });
					}

					var profit = rec.getText({ fieldId: 'custpage_profitlist' });
					var usLandedCost = rec.getValue({ fieldId: 'custpage_usalandedcost' });
					var usLandedrate = usLandedCost;
					var result = ((parseFloat(usLandedrate) / (1 - parseInt(profit) / 100))).toFixed(3);
					rec.setValue({ fieldId: 'custpage_finalusapricefield', value: result });
				}
			} catch (e) {
				log.error(title + e.name, e.message);
			}
		}

		/**
		 * Function to be executed when field is slaved.
		 *
		 * @param {Object} scriptContext
		 * @param {Record} scriptContext.currentRecord - Current form record
		 * @param {string} scriptContext.sublistId - Sublist name
		 * @param {string} scriptContext.fieldId - Field name
		 *
		 * @since 2015.2
		 */
		function postSourcing(scriptContext) {

		}

		/**
		 * Function to be executed after sublist is inserted, removed, or edited.
		 *
		 * @param {Object} scriptContext
		 * @param {Record} scriptContext.currentRecord - Current form record
		 * @param {string} scriptContext.sublistId - Sublist name
		 *
		 * @since 2015.2
		 */
		function sublistChanged(scriptContext) {

		}

		/**
		 * Function to be executed after line is selected.
		 *
		 * @param {Object} scriptContext
		 * @param {Record} scriptContext.currentRecord - Current form record
		 * @param {string} scriptContext.sublistId - Sublist name
		 *
		 * @since 2015.2
		 */
		function lineInit(scriptContext) {

		}

		/**
		 * Validation function to be executed when field is changed.
		 *
		 * @param {Object} scriptContext
		 * @param {Record} scriptContext.currentRecord - Current form record
		 * @param {string} scriptContext.sublistId - Sublist name
		 * @param {string} scriptContext.fieldId - Field name
		 * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
		 * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
		 *
		 * @returns {boolean} Return true if field is valid
		 *
		 * @since 2015.2
		 */
		function validateField(scriptContext) {

		}

		/**
		 * Validation function to be executed when sublist line is committed.
		 *
		 * @param {Object} scriptContext
		 * @param {Record} scriptContext.currentRecord - Current form record
		 * @param {string} scriptContext.sublistId - Sublist name
		 *
		 * @returns {boolean} Return true if sublist line is valid
		 *
		 * @since 2015.2
		 */
		function validateLine(scriptContext) {

		}

		/**
		 * Validation function to be executed when sublist line is inserted.
		 *
		 * @param {Object} scriptContext
		 * @param {Record} scriptContext.currentRecord - Current form record
		 * @param {string} scriptContext.sublistId - Sublist name
		 *
		 * @returns {boolean} Return true if sublist line is valid
		 *
		 * @since 2015.2
		 */
		function validateInsert(scriptContext) {

		}

		/**
		 * Validation function to be executed when record is deleted.
		 *
		 * @param {Object} scriptContext
		 * @param {Record} scriptContext.currentRecord - Current form record
		 * @param {string} scriptContext.sublistId - Sublist name
		 *
		 * @returns {boolean} Return true if sublist line is valid
		 *
		 * @since 2015.2
		 */
		function validateDelete(scriptContext) {

		}

		/**
		 * Validation function to be executed when record is saved.
		 *
		 * @param {Object} scriptContext
		 * @param {Record} scriptContext.currentRecord - Current form record
		 * @returns {boolean} Return true if record is valid
		 *
		 * @since 2015.2
		 */
		function saveRecord(scriptContext) {

		}

		function invokePopup(type) {

			//var URL='https://5486052-sb1.app.netsuite.com/app/site/hosting/scriptlet.nl?script=693&deploy=1'
			var URL = url.resolveScript({
				scriptId: 'customscript_abc_sl_so_details_popup',
				deploymentId: 'customdeploy_abc_sl_so_details_popup',
				returnExternalUrl: false
			});


			if (type == 'sales_hist') {
				var rec = currentRecord.get()
				var item = rec.getCurrentSublistValue({ 'sublistId': 'item', 'fieldId': 'item' })
				var cust = rec.getValue('entity')
				if (item && cust) {

					URL = URL + '&type=' + type + '&item=' + item + '&cust=' + cust

					nlExtOpenWindow(URL, type, 1000, 500, '', true, 'Sales History');
				} else {

					alert('Please select a line Item')
				}

			} else if (type == 'open_quotes') {
				URL = URL + '&type=' + type
				nlExtOpenWindow(URL, type, 1000, 500, '', true, 'Open Quotes');

			} else if (type == 'all_quotes') {
				URL = URL + '&type=' + type
				nlExtOpenWindow(URL, type, 1000, 500, '', true, 'All Quotes');
			} else if (type == 'purchase_orders') {
				var rec = currentRecord.get();
				var item = rec.getCurrentSublistValue({ 'sublistId': 'item', 'fieldId': 'item' });
				var cust = rec.getValue('entity');
				var currency = rec.getText('currency');
				URL = URL +'&type=' + type + '&item=' + item + '&cust=' + cust + '&currency=' + currency
				nlExtOpenWindow(URL, type, 1200, 800, '', true, 'Purchase Orders');
			} else if (type == 'beltavialbaletocut') {
				var rec = currentRecord.get()
				var item = rec.getCurrentSublistValue({ 'sublistId': 'item', 'fieldId': 'item' });
				var base = rec.getCurrentSublistValue({ 'sublistId': 'item', 'fieldId': 'custcol_ddg_item_base' });
				var band = rec.getCurrentSublistValue({ 'sublistId': 'item', 'fieldId': 'custcol_ddg_bands_ribs' });
				URL = URL + '&type=' + type + '&item=' + item + '&base=' + base + '&band=' + band
				nlExtOpenWindow(URL, type, 1200, 800, '', true, 'Belt Available to Cut');
			}
		}

		return {
			pageInit: pageInit,
			fieldChanged: fieldChanged,
			//postSourcing: postSourcing,
			//sublistChanged: sublistChanged,
			//lineInit: lineInit,
			//validateField: validateField,
			//validateLine: validateLine,
			//validateInsert: validateInsert,
			//validateDelete: validateDelete,
			//saveRecord: saveRecord
			invokePopup: invokePopup
		};

	});
