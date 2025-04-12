/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/search', 'N/ui/serverWidget'],

	function (search, serverWidget) {

		/**
		 * Definition of the Suitelet script trigger point.
		 *
		 * @param {Object} context
		 * @param {ServerRequest} context.request - Encapsulation of the incoming request
		 * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
		 * @Since 2015.2
		 */
		function onRequest(context) {

			if (context.request.method === 'GET') {
				try {

					// create form

					var param = context.request.parameters;


					var type = param.type;
					var item = param.item;
					// var itemText = param.itemText;
					var itemText = itemDisplayName(item);;
					var cust = param.cust;
					var base = param.base;
					var band = param.band;
					var currency = param.currency;
					var title = 'error';
					var searchId = '';

					if (type == 'sales_hist') {

						title = 'Sales Historyz';
						searchId = 'customsearch3219';

					} else if (type == 'open_quotes') {

						title = 'Open Quotes';
						searchId = 'customsearch_atlas_items_on_quote_2_3';

					} else if (type == 'all_quotes') {

						title = 'All Quotes';
						searchId = 'customsearch_atlas_items_on_quote';

					} else if (type == 'purchase_orders') {

						title = 'Purchase Orders';
						searchId = 'customsearch3594';

					} else if (type == 'beltavialbaletocut') {

						title = 'Belt Available to Cut';
						searchId = '';

					}

					var form = serverWidget.createForm({
						title: title
					});
					form.clientScriptFileId = 451048;

					if (type == 'sales_hist') {

						var itemField = form.addField({
							id: 'custpage_item',
							type: serverWidget.FieldType.SELECT,
							label: 'Item',
							source: 'item'
						})

						var custField = form.addField({
							id: 'custpage_customer',
							type: serverWidget.FieldType.SELECT,
							label: 'Customer',
							source: 'customer'
						})

						itemField.defaultValue = item
						custField.defaultValue = cust

						itemField.updateDisplayType({
							displayType: serverWidget.FieldDisplayType.INLINE
						});
						custField.updateDisplayType({
							displayType: serverWidget.FieldDisplayType.INLINE
						});

					}

					var sublist = form.addSublist({
						id: 'item',
						type: serverWidget.SublistType.STATICLIST,
						label: title
					})

					var mySearch;
					if (type != 'beltavialbaletocut') {
						var mySearch = search.load({
							id: searchId
						});
					}

					if (type == 'sales_hist') {

						mySearch.filters.push(search.createFilter({ name: 'name', operator: search.Operator.IS, values: cust }))
						mySearch.filters.push(search.createFilter({ name: 'item', operator: search.Operator.IS, values: item }))

					}
					if (type == 'purchase_orders') {

						//mySearch.filters.push(search.createFilter({name: 'name',operator: search.Operator.IS,values: cust}))
						mySearch.filters.push(search.createFilter({ name: 'item', operator: search.Operator.IS, values: item }))

					}
					if (type == 'beltavialbaletocut') {
						var itemField = form.addField({
							id: 'custpage_item',
							type: serverWidget.FieldType.SELECT,
							label: 'Item',
							source: 'item'
						})

						itemField.defaultValue = item

						itemField.updateDisplayType({
							displayType: serverWidget.FieldDisplayType.INLINE
						});
                     

						var beltCutSearch = beltCutSearchResult(item, base, band);
						
							mySearch = beltCutSearch;
							
						var beltCutSearchTotal = beltCutSearchResultTotal(item, base, band);

						//var base =
							
							//mySearchTotal = beltCutSearchTotal;
							var searchDataTotal = largeSavedSearch(beltCutSearchTotal)
							var columnsTotal = beltCutSearchTotal.run().columns
					}

					// log.debug('mySearch', mySearch)

					var searchData = largeSavedSearch(mySearch)
					// log.debug('columns', mySearch.run().columns)

					var columns = mySearch.run().columns

					if (type == 'purchase_orders') {

						//Show Fields on PO btn
						var itemField = form.addField({
							id: 'custpage_item',
							type: serverWidget.FieldType.SELECT,
							label: 'Item',
							source: 'item'
						});
						itemField.defaultValue = item;
						itemField.updateDisplayType({
							displayType: serverWidget.FieldDisplayType.INLINE
						});


						//search Item contains Amcan or D&D initials
						var AmcanOrDDItem = amcanDDItemSearch(item);

						//add Country of Origin field
						var CountryofOrigin = form.addField({
							id: 'custpage_countryoforigin',
							type: serverWidget.FieldType.SELECT,
							label: 'Country of Origin',
							source: 'customlist_countryof_origin'
						});

						//add Country of Origin Duty field
						var CountryofOriginDuty = form.addField({
							id: 'custpage_countryoforiginduty',
							type: serverWidget.FieldType.TEXT,
							label: 'Country of Origin Duty'
						});
						if (AmcanOrDDItem != 0) {
							CountryofOrigin.defaultValue = 1;
							CountryofOriginDuty.defaultValue = '25%';
						} else {
							CountryofOrigin.defaultValue = 2;
							CountryofOriginDuty.defaultValue = '0%';
						}
						CountryofOriginDuty.updateDisplayType({
							displayType: serverWidget.FieldDisplayType.INLINE
						});


						//get US Custom Duty from Item

						var amcanUsCustomDuty = search.lookupFields({
							type: 'item',
							id: item,
							columns: ['custitem_amcanuscustomduty']
						}).custitem_amcanuscustomduty;

						var amcanUsCustomDutyField = form.addField({
							id: 'custpage_amcanuscustomduty',
							type: serverWidget.FieldType.TEXT,
							label: 'US Custom Duty'
						});

						amcanUsCustomDutyField.defaultValue = parseFloat((amcanUsCustomDuty.replace(/%/g, '') * 100)).toFixed(2) + '' + '%';
						amcanUsCustomDutyField.updateDisplayType({
							displayType: serverWidget.FieldDisplayType.INLINE
						});
						// add Freight field
						var freightRateField = form.addField({
							id: 'custpage_freightrate',
							type: serverWidget.FieldType.SELECT,
							label: 'Freight 2 USA %',
							source: 'customlist_freightrate_2_usa_list'
						});
						if (itemText.indexOf('FSQ') === 0 || itemText.indexOf('AMCAN') === 0) {
							freightRateField.defaultValue = 3;
						}else{
							freightRateField.defaultValue = 1;
						}

						var custField = form.addField({
							id: 'custpage_customer',
							type: serverWidget.FieldType.SELECT,
							label: 'Customer',
							source: 'customer'
						});
						custField.defaultValue = cust;
						custField.updateDisplayType({
							displayType: serverWidget.FieldDisplayType.INLINE
						});

						//add highest PO rate Currency field
						var highestPORateCurrencyField = form.addField({
							id: 'custpage_highestporatecurrency',
							type: serverWidget.FieldType.TEXT,
							label: 'Highest PO Rate Currency'
						});
						var highestPoRate = getHighestPoRate(searchId, item);

						highestPORateCurrencyField.defaultValue = highestPoRate.currencyForMaxUnitCost;
						highestPORateCurrencyField.updateDisplayType({
							displayType: serverWidget.FieldDisplayType.INLINE
						});

						// add field Highest PO Rate for other currency
						var highestPORateFieldCurrencySelected = form.addField({
							id: 'custpage_highestporateselectcurrency',
							type: serverWidget.FieldType.TEXT,
							label: 'Highest Currency Rate'
						});
						highestPORateFieldCurrencySelected.updateDisplayType({
							displayType: serverWidget.FieldDisplayType.HIDDEN
						});

						//add highest PO rate field HIDE
						var highestPORateField = form.addField({
							id: 'custpage_highestporate',
							type: serverWidget.FieldType.TEXT,
							label: 'Highest PO Rate'
						});

						if (highestPoRate.currencyForMaxUnitCostId != '') {
							//find Exchange Rate for respective Currency
							var exchamgeRateSearchResults = exchangeRate(highestPoRate.currencyForMaxUnitCostId);
							if (exchamgeRateSearchResults == 0) {
								var highestPoRate = getHighestPoRate(searchId, item);

								highestPORateField.defaultValue = highestPoRate.maxUnitCost;
							} else {
								var nonUSDollarCurrency = getHighestPoRateforNotUSDollar(searchId, item);

								highestPORateField.defaultValue = nonUSDollarCurrency.maxUnitCost;
								highestPORateCurrencyField.defaultValue = nonUSDollarCurrency.currency;

								highestPORateFieldCurrencySelected.defaultValue = nonUSDollarCurrency.originalRate;
								highestPORateFieldCurrencySelected.updateDisplayType({
									displayType: serverWidget.FieldDisplayType.NORMAL
								});
							}

						} else {
							highestPORateField.defaultValue = 0;
						}



						//add Calculated USA Landed Cost field
						var calculatedUSALandedCostField = form.addField({
							id: 'custpage_usalandedcost',
							type: serverWidget.FieldType.TEXT,
							label: 'Calculated USA Landed Cost'
						});

						//add Profit list Field   customlist_so_detailsprofitlist
						var profitListField = form.addField({
							id: 'custpage_profitlist',
							type: serverWidget.FieldType.SELECT,
							label: 'Profit Margin %',
							source: 'customlist_so_detailsprofitlist'
						});


						//add USA Landed Cost field
						var finalUsaPriceField = form.addField({
							id: 'custpage_finalusapricefield',
							type: serverWidget.FieldType.TEXT,
							label: 'Final Offer Price'
						});

						// Load last sales by Customer Search
						var lastCustSalesSearch = search.load({
							id: 'customsearch_atlas_items_on_quote_2_3'
						});
						lastCustSalesSearch.filters.push(search.createFilter({ name: 'item', operator: search.Operator.IS, values: item }));
						var lastSalesByCustSearchData = largeSavedSearch(lastCustSalesSearch);

						var lastSalesCol = lastCustSalesSearch.run().columns
						var lastSalesByCustsublist = form.addSublist({
							id: 'lastsalesbycust',
							type: serverWidget.SublistType.STATICLIST,
							label: "Last Sales by Customer"
						});

						//Load All Quotes 

						var quoteSearch = search.load({
							id: 'customsearch_atlas_items_on_quote'
						});
						quoteSearch.filters.push(search.createFilter({ name: 'item', operator: search.Operator.IS, values: item }));
						var quotesSearchData = largeSavedSearch(quoteSearch);

						var quotesCol = quoteSearch.run().columns;
						var allQuotessublist = form.addSublist({
							id: 'allquotessublist',
							type: serverWidget.SublistType.STATICLIST,
							label: "All Quotes by Customer"
						});

						showDataOnTab(columns, searchData, sublist);
						showDataOnTab(lastSalesCol, lastSalesByCustSearchData, lastSalesByCustsublist);
						showDataOnTab(quotesCol, quotesSearchData, allQuotessublist);
					}
					else if (type == 'beltavialbaletocut') {
						var sublistTotal = form.addSublist({
						id: 'itemtotal',
						type: serverWidget.SublistType.STATICLIST,
						label: 'Belt Totals'
						});
						showDataOnTabBelt(columns, searchData, sublist);
						showDataOnTabBeltTotal(columnsTotal, searchDataTotal, sublistTotal);
					}
					else {
						showDataOnTab(columns, searchData, sublist);
					}

					context.response.writePage(form);

				} catch (error) {

					log.error('error', error)
				}
			}
		}



		function largeSavedSearch(recSearch)//20 approx gov units each time
		{

			try {
				var recSearch = recSearch
				var recSearchResults = recSearch.run();
				var recResultIndex = 0;
				var recResultStep = 1000;
				var recResultSet;
				var maxLength = 1000
				var recArray = new Array();
				do {
					recResultSet = recSearchResults.getRange({ start: recResultIndex, end: (recResultIndex + recResultStep) });
					recResultIndex = recResultIndex + recResultStep;
					if (recResultSet.length > 0)
						recArray = recArray.concat(recResultSet);
				} while (recResultSet.length == 1000 && recArray.length < maxLength);

				return recArray;

			} catch (error) {
				log.error('error', error)
			}
		}

		function getHighestPoRate(id, item)//20 approx gov units each time
		{
			var title = 'getHighestPoRate[::]';
			try {
				var poSearch = search.load({
					id: id
				});
				poSearch.filters.push(search.createFilter({ name: 'item', operator: search.Operator.IS, values: item }))
				var searchResult = poSearch.run().getRange({
					start: 0,
					end: 5
				});

				var maxUnitCost = 0;
				var currencyForMaxUnitCost = '';
				var currencyForMaxUnitCostId = '';
				for (var k = 0; k < searchResult.length; k++) {
					var unitCost = searchResult[k].getValue({
						name: 'formulanumeric'
					});
					var currency = searchResult[k].getText({
						name: 'currency'
					});
					var currencyID = searchResult[k].getValue({
						name: 'currency'
					});
					if (parseFloat(unitCost) > maxUnitCost) {
						maxUnitCost = parseFloat(unitCost);
						currencyForMaxUnitCost = currency;
						currencyForMaxUnitCostId = currencyID
					}
				}
				var obj = {
					'maxUnitCost': maxUnitCost,
					'currencyForMaxUnitCost': currencyForMaxUnitCost,
					'currencyForMaxUnitCostId': currencyForMaxUnitCostId
				};
				return obj;
			} catch (e) {
				log.error(title + e.name, e.message);
			}
		}
		function getHighestPoRateforNotUSDollar(id, item)//20 approx gov units each time
		{
			var title = 'getHighestPoRateforNotUSDollar[::]';
			try {
				var obj;
				var array = [];
				var poSearch = search.load({
					id: id
				});
				poSearch.filters.push(search.createFilter({ name: 'item', operator: search.Operator.IS, values: item }))
				var searchResult = poSearch.run().getRange({
					start: 0,
					end: 5
				});
				for (var k = 0; k < searchResult.length; k++) {
					obj = {};
					obj.unitCost = searchResult[k].getValue({
						name: 'formulanumeric'
					});
					obj.currency = searchResult[k].getText({
						name: 'currency'
					});
					obj.currencyID = searchResult[k].getValue({
						name: 'currency'
					});
					array.push(obj);
				}
				var dailyExchangeRate = dailyExchangeRateSearch();

				if (array && array.length > 0) {
					var maxUnitCost = 0;
					var currencyForMaxUnitCost = '';
					var currencyForMaxUnitCostId = '';
					var originalRate = '';
					for (var m = 0; m < array.length; m++) {
						var data = array[m];
						var unitCost = data['unitCost'] * dailyExchangeRate[data['currencyID']]['exchangerate'];

						if (parseFloat(unitCost) > maxUnitCost) {
							maxUnitCost = parseFloat(unitCost);
							currencyForMaxUnitCost = data['currency'];
							currencyForMaxUnitCostId = data['currencyID'];
							originalRate = data['unitCost']
						}
						var conversionRatesObj = {
							'maxUnitCost': maxUnitCost,
							'currency': currencyForMaxUnitCost,
							'currencyId': currencyForMaxUnitCostId,
							'originalRate': originalRate
						}

					}
				}
				return conversionRatesObj;
			} catch (e) {
				log.error(title + e.name, e.message);
			}
		}
		function showDataOnTabBeltTotal(columns, searchData, sublist) {
			var title = 'showDataOnTabwTotal[::]';
			try {
				for (var i = 0; i < columns.length; i++) {
					// log.debug('columns', columns[i])

					var colName = columns[i].name
					var colLabel = columns[i].label

					var colId = colName.search(/formula/i) > -1 ? colLabel.toLowerCase().replace(' ', '_').substring(0, 15) : colName.substring(0, 15)
					//log.debug('columns_id',colId)

					sublist.addField({
						id: 'custpage_' + colId,
						label: columns[i].label,
						type: serverWidget.FieldType.TEXT
					})
				}

				for (var k = 0; k < searchData.length; k++) {
					//log.debug('searchData[k]',searchData[k])
					for (var i = 0; i < columns.length; i++) {
						var colName = columns[i].name
						var colLabel = columns[i].label
						var colId = colName.search(/formula/i) > -1 ? colLabel.toLowerCase().replace(' ', '_').substring(0, 15) : colName.substring(0, 15)
						sublist.setSublistValue({
							id: 'custpage_' + colId,
							line: k,
							value: searchData[k].getText(columns[i]) || searchData[k].getValue(columns[i]) || ' '
						})
					}
				}
			} catch (e) {
				log.error(title + e.name, e.message);
			}
		}
		
		function showDataOnTabBelt(columns, searchData, sublist) {
			var title = 'showDataOnTabBelt[::]';
			try {
				for (var i = 0; i < columns.length; i++) {
					// log.debug('columns', columns[i])

					var colName = columns[i].name
					var colLabel = columns[i].label

					var colId = colName.search(/formula/i) > -1 ? colLabel.toLowerCase().replace(' ', '_').substring(0, 15) : colName.substring(0, 15)
					//log.debug('columns_id',colId)

					sublist.addField({
						id: 'custpage_' + colId,
						label: columns[i].label,
						type: serverWidget.FieldType.TEXT
					})
				}

				for (var k = 0; k < searchData.length; k++) {
					//log.debug('searchData[k]',searchData[k])
					for (var i = 0; i < columns.length; i++) {
						var colName = columns[i].name
						var colLabel = columns[i].label
						var colId = colName.search(/formula/i) > -1 ? colLabel.toLowerCase().replace(' ', '_').substring(0, 15) : colName.substring(0, 15)
						sublist.setSublistValue({
							id: 'custpage_' + colId,
							line: k,
							value: searchData[k].getText(columns[i]) || searchData[k].getValue(columns[i]) || ' '
						})
					}
				}
			} catch (e) {
				log.error(title + e.name, e.message);
			}
		}
		
		function showDataOnTab(columns, searchData, sublist) {
			var title = 'showDataOnTab[::]';
			try {
				for (var i = 0; i < columns.length; i++) {
					// log.debug('columns', columns[i])

					var colName = columns[i].name
					var colLabel = columns[i].label

					var colId = colName.search(/formula/i) > -1 ? colLabel.toLowerCase().replace(' ', '_').substring(0, 15) : colName.substring(0, 15)
					//log.debug('columns_id',colId)

					sublist.addField({
						id: 'custpage_' + colId,
						label: columns[i].label,
						type: serverWidget.FieldType.TEXT
					})
				}

				for (var k = 0; k < searchData.length; k++) {
					//log.debug('searchData[k]',searchData[k])
					for (var i = 0; i < columns.length; i++) {
						var colName = columns[i].name
						var colLabel = columns[i].label
						var colId = colName.search(/formula/i) > -1 ? colLabel.toLowerCase().replace(' ', '_').substring(0, 15) : colName.substring(0, 15)
						sublist.setSublistValue({
							id: 'custpage_' + colId,
							line: k,
							value: searchData[k].getText(columns[i]) || searchData[k].getValue(columns[i]) || ' '
						})
					}
				}
			} catch (e) {
				log.error(title + e.name, e.message);
			}
		}

		function amcanDDItemSearch(id) {
			var title = 'amcanDDItemSearch[::]';
			try {
				var itemId;
				var itemSearchObj = search.create({
					type: "item",
					filters:
						[
							[["name", "startswith", "D&D"], "OR", ["name", "startswith", "Amcan"]],
							"AND",
							["internalid", "anyof", id]
						],
					columns:
						[
							search.createColumn({ name: "displayname", label: "Display Name" })
						]
				});
				itemSearchObj.run().each(function (result) {
					itemId = result.id;
					return true;
				});
				return itemId || 0;
			} catch (e) {
				log.error(title + e.name, e.message);
			}
		}
		function exchangeRate(currency) {
			var title = 'exchangeRate[::]';
			try {
				var rate;
				var currencyrateSearchObj = search.create({
					type: "currencyrate",
					filters:
						[
							["basecurrency", "anyof", "2"],
							"AND",
							["effectivedate", "within", "yesterday"],
							"AND",
							["transactioncurrency", "anyof", currency]
						],
					columns:
						[
							search.createColumn({ name: "transactioncurrency", label: "Transaction Currency (convert from)" }),
							search.createColumn({ name: "exchangerate", label: "Exchange Rate" }),
							search.createColumn({ name: "basecurrency", label: "Base currency (convert to)" }),
							search.createColumn({ name: "effectivedate", label: "Effective Date" })
						]
				});
				currencyrateSearchObj.run().each(function (result) {
					rate = result.getValue({ name: 'exchangerate' });
					return true;
				});
				return rate || 0;
			} catch (e) {
				log.error(title + e.name, e.message);
			}
		}
		function dailyExchangeRateSearch() {
			var title = 'dailyExchangeRateSearch[::]';
			try {
				var obj;
				var array = [];
				var currencyrateSearchObj = search.create({
					type: "currencyrate",
					filters:
						[
							["effectivedate", "within", "yesterday"],
							"AND",
							["basecurrency", "anyof", "2"]
						],
					columns:
						[
							search.createColumn({ name: "transactioncurrency", label: "Transaction Currency (convert from)" }),
							search.createColumn({ name: "exchangerate", label: "Exchange Rate" }),
							search.createColumn({ name: "basecurrency", label: "Base currency (convert to)" }),
							search.createColumn({ name: "effectivedate", label: "Effective Date" })
						]
				});
				currencyrateSearchObj.run().each(function (result) {
					obj = {};
					obj.currencyID = result.getValue({ name: 'transactioncurrency' });
					obj.exchangerate = result.getValue({ name: 'exchangerate' });
					array.push(obj);
					return true;
				});
				array.push({ "currencyID": "2", "exchangerate": "1" });
				var objectOfObjects = {};

				array.forEach(function (item) {
					objectOfObjects[item.currencyID] = {
						exchangerate: item.exchangerate
					};
				});

				return objectOfObjects;
			} catch (e) {
				log.error(title + e.name, e.message);
			}
		}
		function beltCutSearchResult(item, base, band) {
			var title = 'beltCutSearchResult[::]';
			try {
				var lotnumberedinventoryitemSearchObj = search.create({
					type: "lotnumberedinventoryitem",
					filters:
						[
							["type", "anyof", "InvtPart"],
							"AND",
							["islotitem", "is", "T"],
							"AND",
							["custitem_ddg_base", "is", base],
							"AND",
							["inventorynumber.quantityonhand", "greaterthan", "0"],
							"AND",
							[["custitem_ddg_bands_rids", "greaterthanorequalto", band], "OR", [["custitem_ddg_bands_rids", "equalto", "1"], "AND", ["quantityavailable", "greaterthanorequalto", band]]]
						],
					columns:
						[
							/*search.createColumn({
								name: "formulanumeric",
								formula: "CASE WHEN NVL({custitem_ddg_bands_rids},0)>1 THEN FLOOR({custitem_ddg_bands_rids}/"+band+")*{inventorynumber.quantityavailable} ELSE FLOOR({inventorynumber.quantityavailable}/"+band+") END",
								summary: "SUM",
								label: "Cuttable"
							}),
							search.createColumn({
								name: "location",
								join: "inventoryNumber",
								summary: "GROUP",
								label: "Location"
							})*/ 
							search.createColumn({
								name: "location",
								join: "inventoryNumber",
								//summary: "GROUP",
								label: "Location",
                                sort: search.Sort.ASC
							}),
                            search.createColumn({
                                name: "itemid",
                                label: "Name"}),
                            search.createColumn({
                                name: "custitem_ddg_bands_rids",
                                label: "Band Ribs",
                                sort: search.Sort.ASC
                            }),
							search.createColumn({
								name: "formulanumeric",
								//summary: "SUM",
								formula: "CASE {internalid} WHEN " + item + " THEN CASE WHEN NVL({custitem_ddg_bands_rids},0)>1 THEN FLOOR({custitem_ddg_bands_rids}/" + band + ")*{inventorynumber.quantityavailable} ELSE FLOOR({inventorynumber.quantityavailable}/" + band + ") END  ELSE 0 END",
								label: "Pre Cut"
							}),
							search.createColumn({
								name: "formulanumeric",
								//summary: "SUM",
								formula: "CASE {internalid} WHEN " + item + " THEN 0 ELSE CASE WHEN NVL({custitem_ddg_bands_rids},0)>1 THEN FLOOR({custitem_ddg_bands_rids}/" + band + ")*{inventorynumber.quantityavailable} ELSE FLOOR({inventorynumber.quantityavailable}/" + band + ") END END",
								label: "Cuttable"
							}),
							search.createColumn({
								name: "formulanumeric",
								//summary: "SUM",
								formula: "CASE WHEN NVL({custitem_ddg_bands_rids},0)>1 THEN FLOOR({custitem_ddg_bands_rids}/" + band + ")*{inventorynumber.quantityavailable} ELSE FLOOR({inventorynumber.quantityavailable}/" + band + ") END",
								label: "Max Sellable"
							})
						]
				});
				//  lotnumberedinventoryitemSearchObj.run().each(function(result){
				// 	// .run().each has a limit of 4,000 results
				// 	return true;
				//  });
			} catch (e) {
				log.error(title + e.name, e.message);
			}
			return lotnumberedinventoryitemSearchObj;
		}
		function beltCutSearchResultTotal(item, base, band) {
			var title = 'beltCutSearchResult[::]';
			try {
				var lotnumberedinventoryitemSearchObj = search.create({
					type: "lotnumberedinventoryitem",
					filters:
						[
							["type", "anyof", "InvtPart"],
							"AND",
							["islotitem", "is", "T"],
							"AND",
							["custitem_ddg_base", "is", base],
							"AND",
							["inventorynumber.quantityonhand", "greaterthan", "0"],
							"AND",
							[["custitem_ddg_bands_rids", "greaterthanorequalto", band], "OR", [["custitem_ddg_bands_rids", "equalto", "1"], "AND", ["quantityavailable", "greaterthanorequalto", band]]]
						],
					columns:
						[
							/*search.createColumn({
								name: "formulanumeric",
								formula: "CASE WHEN NVL({custitem_ddg_bands_rids},0)>1 THEN FLOOR({custitem_ddg_bands_rids}/"+band+")*{inventorynumber.quantityavailable} ELSE FLOOR({inventorynumber.quantityavailable}/"+band+") END",
								summary: "SUM",
								label: "Cuttable"
							}),
							search.createColumn({
								name: "location",
								join: "inventoryNumber",
								summary: "GROUP",
								label: "Location"
							})
                            search.createColumn({
                                name: "itemid",
                                label: "Name"}),
                            search.createColumn({
                                name: "custitem_ddg_bands_rids",
                                label: "Band Ribs",
                                sort: search.Sort.ASC
                            }),*/ 
							search.createColumn({
								name: "formulanumeric",
								summary: "SUM",
								formula: "CASE {internalid} WHEN " + item + " THEN CASE WHEN NVL({custitem_ddg_bands_rids},0)>1 THEN FLOOR({custitem_ddg_bands_rids}/" + band + ")*{inventorynumber.quantityavailable} ELSE FLOOR({inventorynumber.quantityavailable}/" + band + ") END  ELSE 0 END",
								label: "Pre Cut"
							}),
							search.createColumn({
								name: "formulanumeric",
								summary: "SUM",
								formula: "CASE {internalid} WHEN " + item + " THEN 0 ELSE CASE WHEN NVL({custitem_ddg_bands_rids},0)>1 THEN FLOOR({custitem_ddg_bands_rids}/" + band + ")*{inventorynumber.quantityavailable} ELSE FLOOR({inventorynumber.quantityavailable}/" + band + ") END END",
								label: "Cuttable"
							}),
							search.createColumn({
								name: "formulanumeric",
								summary: "SUM",
								formula: "CASE WHEN NVL({custitem_ddg_bands_rids},0)>1 THEN FLOOR({custitem_ddg_bands_rids}/" + band + ")*{inventorynumber.quantityavailable} ELSE FLOOR({inventorynumber.quantityavailable}/" + band + ") END",
								label: "Max Sellable"
							}),
							search.createColumn({
								name: "location",
								join: "inventoryNumber",
								summary: "GROUP",
								label: "Location",
                                sort: search.Sort.ASC
							})
						]
				});
				//  lotnumberedinventoryitemSearchObj.run().each(function(result){
				// 	// .run().each has a limit of 4,000 results
				// 	return true;
				//  });
			} catch (e) {
				log.error(title + e.name, e.message);
			}
			return lotnumberedinventoryitemSearchObj;
		}
      function itemDisplayName(item) {
			var title = 'itemDisplayName[::]';
			var displayName;
			try {
				var itemSearch = search.create({
					type: "item",
					filters:
					[
					   ["internalid","anyof",item]
					],
					columns:
					[
					   search.createColumn({name: "itemid", label: "Name"}),
					   search.createColumn({name: "displayname", label: "Display Name"})
					]
				 });
				  var searchResult = itemSearch.run().getRange({ start: 0, end: 1 });

                    if (searchResult.length > 0) {

                        var displayName = searchResult[0].getValue({
                            name: "itemid",
                            }) || '';
                      log.debug('Display Name', displayName);
                    }
			} catch (e) {
				log.error(title + e.name, e.message);
			}
			return displayName;
		}
		return {
			onRequest: onRequest
		};

	});
