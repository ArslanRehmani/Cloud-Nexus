/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/log', 'N/search', 'N/https', '../lib/dropship_request_lib.js', 'N/runtime'],
    /**
 * @param{log} log
 * @param{search} search
 * @param{https} https
 * @param{requestLib} requestLib
 */
    (log, search, https, requestLib, runtime) => {


        const getInputData = (inputContext) => {
            var title = 'getInputData[::]';
            try {
                var deployementId = runtime.getCurrentScript().deploymentId;
                var searchResults = '';
                if (deployementId == 'customdeploy_gfl_mr_update_sku_qty') {
                    searchResults = invSaveSearchResults();
                } else if (deployementId == 'customdeploy_gfl_mr_update_sku_qty_kit') {
                    searchResults = kitSaveSearchResults();
                }
            } catch (e) {
                log.error(title + e.name, e.message);
            }
            return searchResults || [];
        }



        const map = (mapContext) => {
            var title = 'map[::]';
            try {
                var data = JSON.parse(mapContext.value);
                log.debug({
                    title: 'data',
                    details: data
                });
                var obj = data.values;
                var deployementId = runtime.getCurrentScript().deploymentId;
                var SKU = '';
                var qtyAvailable = '';
                if (deployementId == 'customdeploy_gfl_mr_update_sku_qty') {
                    SKU = obj['GROUP(formulatext)'];
                    qtyAvailable = obj['SUM(locationquantityavailable)'];
                } else if (deployementId == 'customdeploy_gfl_mr_update_sku_qty_kit') {
                    SKU = obj['GROUP(formulatext)'];
                    qtyAvailable = obj['MIN(formulanumeric)'];
                }
                var token = requestLib.HELPERS.getToken();
                var headers = {};
                headers['Content-Type'] = 'application/json';
                headers['Authorization'] = 'jwt ' + token;
                var Body = {
                    "products": [
                        {
                            "sku": SKU,
                            "stock": parseInt(qtyAvailable)
                        }
                    ]
                };

                var response = https.put({
                    url: 'https://services.dropshipzone.com.au/admin/api/supplier/v1/products/stock',
                    body: JSON.stringify(Body),
                    headers: headers
                });
                log.debug({
                    title: 'response',
                    details: response
                });
                if (response.code == 200) {
                    log.debug({
                        title: 'YES',
                        details: 'Y'
                    });
                }
            } catch (e) {
                log.error(title + e.name, e.message);
            }
        }

        function invSaveSearchResults() {
            var title = 'invSaveSearchResults[::]';
            try {
                var inventoryitemSearchObj = search.create({
                    type: "inventoryitem",
                    filters:
                        [
                            ["type", "anyof", "InvtPart"],
                            "AND",
                            ["inventorylocation", "anyof", "15", "10"], //	Broadmeadows VIC , Wetherill Park NSW
                            "AND",
                            ["formulatext: SUBSTR({name}, LENGTH({name}) - INSTR(REVERSE({name}), ' : ') + 2)", "isnot", ""]
                        ],
                    columns:
                        [
                            search.createColumn({
                                name: "itemid",
                                summary: "GROUP",
                                label: "Name"
                            }),
                            search.createColumn({
                                name: "locationquantityavailable",
                                summary: "SUM",
                                label: "Location Available"
                            }),
                            search.createColumn({
                                name: "formulatext",
                                summary: "GROUP",
                                formula: "SUBSTR({name}, LENGTH({name}) - INSTR(REVERSE({name}), ' : ') + 2)",
                                label: "Formula (Text)"
                            })
                        ]
                });

            } catch (e) {
                log.error(title + e.name, e.message);
            }
            return inventoryitemSearchObj || {};
        }
        function kitSaveSearchResults() {
            var title = 'kitSaveSearchResults[::]';
            try {
                var kititemSearchObj = search.create({
                    type: "kititem",
                    filters:
                        [
                            ["type", "anyof", "Kit"],
                            "AND",
                            ["memberitem.inventorylocation", "anyof", "15"], // Broadmeadows VIC
                            "AND",
                            ["formulatext: SUBSTR({name}, LENGTH({name}) - INSTR(REVERSE({name}), ' : ') + 2)", "isnot", ""]
                        ],
                    columns:
                        [
                            search.createColumn({
                                name: "itemid",
                                summary: "GROUP",
                                label: "Name"
                            }),
                            search.createColumn({
                                name: "formulanumeric",
                                summary: "MIN",
                                formula: "NVL({memberitem.locationquantityavailable},0)/{memberquantity}",
                                label: "Formula (Numeric)"
                            }),
                            search.createColumn({
                                name: "formulatext",
                                summary: "GROUP",
                                formula: "SUBSTR({name}, LENGTH({name}) - INSTR(REVERSE({name}), ' : ') + 2)",
                                label: "Formula (Text)"
                            })
                        ]
                });
            } catch (e) {
                log.error(title + e.name, e.message);
            }
            return kititemSearchObj || {};
        }
        return { getInputData, map }

    });
