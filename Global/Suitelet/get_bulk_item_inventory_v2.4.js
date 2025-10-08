/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */

/**
 * Get Item inventory, support single or more than 1 items
 * location
 * location based rules
 * item type: inventory part (matrix item), kit/pakcage
 * item internal or item sku
 * ONLY ALLOW EXTRA FIELDS ON REQUEST BODY
 * as string only fields on working on kit (strange)
 */

define(['N/search', '/SuiteScripts/Lib-NS/lodash-4.13.1.min', 'N/record'],

    function (search, _, record) {

        /**
         * Definition of the Suitelet script trigger point.
         *
         * @param {Object} context
         * @param {ServerRequest} context.request - Encapsulation of the incoming request
         * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
         * @Since 2015.2
         */
        function onRequest(context) {
            context.response.setHeader('Content-Type', 'text/javascript'); //Set response for jsonp
            var inventoryResult = {
                inventory: new Array(),
                error: new Array()
            };

            var paramErrorArray = new Array();
            var searchErrorArray = new Array();

            var contextRequest = context.request;
            var itemKeysBody = '';
            var extraColumnFields = [];
            if (contextRequest.body) {
                var requestBody = JSON.parse(contextRequest.body);
                if (requestBody.item_keys) {
                    itemKeysBody = requestBody.item_keys;
                }
                if (requestBody.fields) {
                    // better with formula fields, full option {name:, join:, summary:, formula:, label:}
                    extraColumnFields = requestBody.fields;
                }
            }
            // log.audit('extraColumnFields MW', extraColumnFields);
            var source = contextRequest.parameters['source'];
            log.debug('source', source)
            var itemKeyType = contextRequest.parameters['item_key_type'] || '';
            log.debug('item key type', JSON.stringify(itemKeyType));
            var itemKeysString = contextRequest.parameters['item_keys'] || itemKeysBody;
            log.debug('item keys string', JSON.stringify(itemKeysString));

            var itemMatrixOption = contextRequest.parameters['matrix_option'];

            // if (!_.isEmpty(contextRequest.parameters['fields'])) {
            //     // for regular fields, field names only
            //     extraColumnFields = _.concat(extraColumnFields, _.compact(contextRequest.parameters['fields'].split(',')));
            // }
            var departmentSelected = contextRequest.parameters['dept'];
            if (departmentSelected == 'true') {
                var searchPreFilters = gflb2bBrandFilter(contextRequest.parameters['filters']);
                searchPreFilters.push(["isinactive","is","F"]);
                log.debug('searchPreFilters IN', searchPreFilters);
                
            } else {
                var searchPreFilters = getPreSearchFilters(contextRequest.parameters['filters']);
            }
            log.debug('searchPreFilters', searchPreFilters);

            // if (_.isEmpty(itemKeyType) && _.isEmpty(itemKeysString) && _.isEmpty(searchPreFilters)) {
            //     paramErrorArray.push('Missing "filters" or missing "item_key_type" and "item_keys"');
            // }
            if (_.isEmpty(searchPreFilters) && (_.isEmpty(itemKeyType) || _.isEmpty(itemKeysString))) {
                var errMsg = 'Missing "filters" or missing "item_key_type" and "item_keys"';
                log.audit('source: ' + source, errMsg)
                paramErrorArray.push(errMsg);
            }
            // log.debug('param error length', paramErrorArray.length);
            if (paramErrorArray.length > 0) {
                // handle missing required parameters
                inventoryResult.error = paramErrorArray;

            } else {
                itemKeyType = itemKeyType.toLowerCase();
                var itemArrayRules = parseKeyValuePair(_.compact(itemKeysString.split(',')));
                var itemArray = itemArrayRules.keys;
                var itemRules = itemArrayRules.rules;
                log.debug('item array', (itemArrayRules));

                var itemIDTypeObject = getItemIDType(itemKeyType, itemArray, searchPreFilters);
                log.debug('itemIDTypeObject', itemIDTypeObject)

                var inventoryPartInternalidArray = _.map(itemIDTypeObject.inventory_part, 'internalid');
                var kitInternalidArray = _.map(itemIDTypeObject.kit_package, 'internalid');

                /**
                 * location internalid
                 * 1 Campbellfield VIC
                 * 8 Canning Vale WA
                 * 9 Parkinson QLD
                 * 10 Wetherill Park NSW
                 * 15 broadmeadows VIC
                 */
                var locationString = contextRequest.parameters['location'] || '10,15';
                var locationArrayRules = parseKeyValuePair(locationString.split(','));
                var locationArray = locationArrayRules.keys;
                var locationRules = locationArrayRules.rules;
                log.debug('lcoation array', (locationArrayRules));
                var itemInventoryArray = new Array();

                // get inventory for normal inventory items including matrix items
                if (inventoryPartInternalidArray.length > 0) {
                    itemInventoryArray = _.concat(itemInventoryArray, getInventoryItemInventory(inventoryPartInternalidArray, locationArray, itemMatrixOption, extraColumnFields));
                    log.debug('itemInventoryArray', itemInventoryArray);
                }
                if(extraColumnFields.length != 0){
                    log.audit('extraColumnFields', extraColumnFields);
                }
                // get inventory for kit items
                if (kitInternalidArray.length > 0) {

                    var kitInventoryArray = getKitsInventory(kitInternalidArray, locationArray, extraColumnFields);
                    log.debug('kit inventory Array', JSON.stringify(kitInventoryArray));
                    itemInventoryArray = _.concat(itemInventoryArray, kitInventoryArray);
                }

                // log.debug('item inventory array', itemInventoryArray);

                /**
                 * apply location rules first, 
                 * then work out total quantity, 
                 * and item rules apply to total quantity
                 */
                _.map(itemInventoryArray, function (item) {
                    // log.debug('current item before location', JSON.stringify(item));
                    item.location_quantity_available_original = item.location_quantity_available;

                    if (locationRules.length > 0 && item.enforce_stock_buffer) {
                        // find rules
                        var findLocationRule = _.find(locationRules, { key: item.inventory_location_id });

                        // apply rule
                        if (findLocationRule && findLocationRule.rule) {
                            item.location_quantity_available = applyQtyRule(item.location_quantity_available, findLocationRule.rule)
                        }
                    }

                    // log.debug('current item after', JSON.stringify(item));
                    if (item.stock_override) {
                        item.location_quantity_available = 0;
                    }
                });

                // group same item and calc total quantity
                var itemInventoryGroupArray = _.groupBy(itemInventoryArray, 'internalid');
                // log.debug('item inventory group', itemInventoryGroupArray);

                var itemInventorySortedArray = new Array();
                _.forIn(itemInventoryGroupArray, function (value, key) {
                    // log.debug('for in values', JSON.stringify(value));

                    var totalQty = _.sumBy(value, 'location_quantity_available');
                    // log.debug('total qty', totalQty);

                    var totalQtyOriginal = _.sumBy(value, 'location_quantity_available_original');

                    var inventoryArray = new Array();
                    var inventoryOriginalArray = new Array();
                    _.map(value, function (v) {
                        inventoryArray.push({
                            inventory_location_id: v.inventory_location_id,
                            inventory_location_name: v.inventory_location_name,
                            location_quantity_available: v.location_quantity_available
                        });
                        inventoryOriginalArray.push({
                            inventory_location_id: v.inventory_location_id,
                            inventory_location_name: v.inventory_location_name,
                            location_quantity_available_original: v.location_quantity_available_original
                        })
                    });

                    var newItemInventoryObj = _.omit(value[0], ['inventory_location_id', 'inventory_location_name', 'location_quantity_available', 'location_quantity_available_original']);
                    newItemInventoryObj.quantity_available = totalQty;
                    newItemInventoryObj.quantity_available_original = totalQtyOriginal;
                    newItemInventoryObj.inventory = inventoryArray;
                    newItemInventoryObj.inventory_original = inventoryOriginalArray;

                    // log.debug('new item inventory obj', JSON.stringify(newItemInventoryObj));
                    itemInventorySortedArray.push(newItemInventoryObj);
                });

                // log.debug('item inventory sorted', JSON.stringify(itemInventorySortedArray));

                //apply item rules, and only apply to total quantity
                if (itemRules.length > 0 && item.enforce_stock_buffer) {

                    _.map(itemInventorySortedArray, function (iisa) {

                        var rule = _.find(itemRules, function (ir) {

                            return (_.has(iisa, itemKeyType) // for noraml inventory item and kit
                                && iisa[itemKeyType] == ir.key
                            ) || (
                                    _.has(iisa, itemKeyType) // for matrix child
                                    && _.has(iisa, 'matrix_parent_sku')
                                    && iisa[itemKeyType].indexOf(ir.key) == 0
                                    && iisa['matrix_parent_sku'] == ir.key
                                    && iisa.matrix_child
                                )
                        });

                        if (rule) {
                            iisa.quantity_available = applyQtyRule(iisa.quantity_available, rule)
                        }
                    });
                }

                //include sum of matrix parent depends on parameter "matrix_parent"
                // var includeMatrixParent = contextRequest.parameters['matrix_parent'] || 'no';
                // if (includeMatrixParent == 'yes') {
                //     var parentMatrixGroup = _.groupBy(itemInventorySortedArray, 'matrix_parent_sku');

                //     _.forIn(parentMatrixGroup, function(pmg, pm) {
                //         log.debug('parent matrix Group ' + pm, JSON.stringify(pmg));
                //     })
                // }

                inventoryResult.inventory = itemInventorySortedArray;
            }

            // write final results
            var isJSONP = context.request.parameters['jsonp'];
            var jsonCallback = context.request.parameters['callback'];

            if (isJSONP && jsonCallback && isJSONP == 'y') {
                context.response.write({ output: jsonCallback + '(' + JSON.stringify(inventoryResult) + ')' });
            } else {
                context.response.write({ output: JSON.stringify(inventoryResult) });
            }
        }

        function getInventoryItemInventory(inventoryPartInternalidArray, locationArray, itemMatrixOption, extraColumnFields) {
            var itemInventoryArray = [];
            var matrixInternalidArray = new Array();

            extraColumnFields = getExtraColumns(extraColumnFields);

            //build search fileters
            var filtersArray = new Array();
            filtersArray.push(['inventorylocation.internalid', 'anyof', locationArray]);
            filtersArray.push('AND');
            filtersArray.push(['internalid', 'anyof', inventoryPartInternalidArray]);
            filtersArray.push('AND');
            filtersArray.push(['isinactive', 'is', "F"]);
            // log.debug('filters Array', JSON.stringify(filtersArray));
            // getInventory(filtersArray);

            // if (!_.isEmpty(searchPreFilters)) {
            //     util.each(searchPreFilters, function(spf) {
            //         filtersArray.push('AND');
            //         filtersArray.push(spf);
            //     });
            // }

            var inventoryColumns = [
                'type',
                'itemid',
                'internalid',
                'matrix',
                'locationquantityavailable',
                'inventorylocation',
                'custitem_cubic_charge_weight',
                'custitem_ps_disable_sd_delivery',
                'custitem_cubic_carrier',
                'custitem_cubic_carrier_express',
                'custitem_cubic_charge_weight',
                'custitem_avt_total_length',
                'custitem_avt_total_width',
                'custitem_avt_total_height',
                'weight',
                'custitem_avt_total_packages',
                'custitem_avt_ifs_cubic_volume',
                'custitem_stockoverride',
                'custitem_enforce_stock_buffer',
                'custitem_assemblyhours',
                'custitem_website_free_shipping',
                'custitem_fs_hnol_metro',
                'custitem_fs_hnol_rural',
                'custitem_fs_hnol_remote',
                'custitem_fs_hnol_zone4',
                'custitem_6zone_5',
                'custitem_6zone_6',
                { 'name': 'matrix', join: 'parent' },
                'custitem_multi_qty_carrier_override'
            ]
            var inventorySearch = search.create({
                type: search.Type.ITEM,
                filters: filtersArray,
                // columns: _.compact(_.concat(inventoryColumns, extraColumnFields))
                columns: addExtraColumns(inventoryColumns, extraColumnFields)//is ko comment keya h
            });

            var inventorySearchPageData = inventorySearch.runPaged({
                pageSize: 1000
            });
            // log.debug('page data count', inventorySearchPageData.count);

            if (inventorySearchPageData.count > 0) {
                var inventorySearchPageRanges = inventorySearchPageData.pageRanges;

                for (var i = 0; i < inventorySearchPageRanges.length; i++) {
                    var currentPage = inventorySearchPageData.fetch(i);
                    currentPage.data.forEach(function (result) {

                        // log.debug('internal result', JSON.stringify(result));
                        var itemType = result.getValue('type');
                        var itemInternalid = result.getValue('internalid');
                        var itemSKU = getItemSKU(result.getValue('itemid'));
                        var inventoryLocationId = result.getValue('inventorylocation');
                        var locationQuantityAvailable = parseFloat(result.getValue('locationquantityavailable'));
                        var quantity = _.isNaN(locationQuantityAvailable) ? 0 : locationQuantityAvailable;
                        var itemWeight = parseFloat(result.getValue('weight')); // dead weight (weight)
                        var disableSameDay = result.getValue('custitem_ps_disable_sd_delivery');
                        var carrierId = result.getValue('custitem_cubic_carrier');
                        var carrier = result.getText('custitem_cubic_carrier');
                        var expressCarrierId = result.getValue('custitem_cubic_carrier_express');
                        var expressCarrier = result.getText('custitem_cubic_carrier_express');
                        var cubicWeight = parseFloat(result.getValue('custitem_cubic_charge_weight'));
                        var maxLength = result.getValue('custitem_avt_total_length');
                        var maxWidth = result.getValue('custitem_avt_total_width');
                        var maxHeight = result.getValue('custitem_avt_total_height');
                        var maxWeight = result.getValue('weight');
                        var package = result.getValue('custitem_avt_total_packages');
                        var totalCubic = result.getValue('custitem_avt_ifs_cubic_volume');
                        var stockOverride = result.getValue('custitem_stockoverride');
                        var enforceStockBuffer = result.getValue('custitem_enforce_stock_buffer');
                        var assemblyHours = result.getValue('custitem_assemblyhours');
                        var fmsWebsiteStatus = result.getValue('custitem_website_free_shipping');
                        var fmsZonePrices = {
                                zone1: result.getValue('custitem_fs_hnol_metro'),
                                zone2: result.getValue('custitem_fs_hnol_rural'),
                                zone3: result.getValue('custitem_fs_hnol_remote'),
                                zone4: result.getValue('custitem_fs_hnol_zone4'),
                                zone5: result.getValue('custitem_6zone_5'),
                                zone6: result.getValue('custitem_6zone_6')
                            }
                        

                        if (itemType == 'InvtPart') {

                            if (result.getValue('matrix')) {
                                matrixInternalidArray.push(itemInternalid);
                            } else {
                                var itemInventoryResult = {
                                    internalid: itemInternalid,
                                    sku: itemSKU,
                                    type: itemType,
                                    matrix_child: false,
                                    location_quantity_available: quantity,
                                    inventory_location_id: inventoryLocationId,
                                    inventory_location_name: result.getText('inventorylocation'),
                                    weight: itemWeight,
                                    disable_same_day: disableSameDay,
                                    carrier_id: carrierId,
                                    carrier: carrier,
                                    express_carrier_id: expressCarrierId,
                                    express_carrier: expressCarrier,
                                    cubic_weight: cubicWeight,
                                    max_length: maxLength,
                                    max_width: maxWidth,
                                    max_height: maxHeight,
                                    max_weight: maxWeight,
                                    package: package,
                                    total_cubic: totalCubic,
                                    stock_override: stockOverride,
                                    enforce_stock_buffer: enforceStockBuffer,
                                    assembly_hours: assemblyHours,
                                    fms_Website_Status: fmsWebsiteStatus,
                                    fms_Zone_Prices: fmsZonePrices,
                                    multi_qty_carrier_override: result.getValue('custitem_multi_qty_carrier_override')
                                };
                                util.each(extraColumnFields, function (ecf) {
                                    itemInventoryResult[ecf.label || ecf.name] = result.getValue(ecf);
                                });
                                itemInventoryArray.push(itemInventoryResult);
                            }
                        }
                    });
                }

                // log.debug('item inventory array before', JSON.stringify(itemInventoryArray));

                // log.debug('matrix array', matrixInternalidArray);
                if (matrixInternalidArray.length > 0) {
                    var matrixChildInventoryArray = getMatrixChildrenInventory(
                        _.uniq(matrixInternalidArray),
                        locationArray,
                        itemMatrixOption,
                        extraColumnFields
                    );

                    // log.debug('matrix child inventory array', (matrixChildInventoryArray));
                    // itemInventoryArray =  _.concat(itemInventoryArray, matrixChildInventoryArray);
                    util.each(itemInventoryArray, function (itemInventory) {
                        var found = _.find(matrixChildInventoryArray, { 'internalid': itemInventory.internalid, 'inventory_location_id': itemInventory.inventory_location_id });
                        if (found) {
                            itemInventory = _.merge(itemInventory, found);
                        }
                    });

                    // log.debug('itemInventoryArray', itemInventoryArray)
                }

            } else {
                //empty search results
            }

            return itemInventoryArray;
        }

        function getKitsInventory(kitInternalidArray, locationArray, extraColumnFields) {
            log.audit('kitInternalidArray', kitInternalidArray)
            var kitInventoryArray = new Array();
            var searchFilters = [
                ['internalid', 'anyof', kitInternalidArray],
                'AND',
                ['memberitem.inventorylocation', 'anyof', locationArray],
                'AND',
                ['isinactive', 'is', "F"]
            ];
            log.audit('searchFilters', searchFilters)
            var searchColumns = [
                // 0
                search.createColumn({
                    name: 'internalid',
                    summary: search.Summary.GROUP
                }),
                // 1
                search.createColumn({
                    name: 'itemid',
                    summary: search.Summary.GROUP
                }),
                // 2
                search.createColumn({
                    name: 'type',
                    summary: search.Summary.GROUP
                }),
                // 3
                search.createColumn({
                    name: 'formulanumeric',
                    formula: 'NVL({memberitem.locationquantityavailable}/{memberquantity}, 0)',
                    summary: search.Summary.MIN
                }),
                // 4
                search.createColumn({
                    name: 'inventorylocation',
                    join: 'memberitem',
                    summary: search.Summary.GROUP
                }),
                // 5
                search.createColumn({
                    name: 'custitem_cubic_charge_weight',
                    summary: search.Summary.GROUP
                }),
                // 6
                search.createColumn({
                    name: 'custitem_ps_disable_sd_delivery',
                    summary: search.Summary.GROUP
                }),
                // 7
                search.createColumn({
                    name: 'custitem_cubic_carrier',
                    summary: search.Summary.GROUP
                }),
                // 8
                search.createColumn({
                    name: 'custitem_cubic_charge_weight',
                    summary: search.Summary.GROUP
                }),
                // 9, as placeholder
                search.createColumn({
                    // name: 'custitem_cubic_carrier',
                    name: 'formulatext',
                    formula: 'placeholder',
                    summary: search.Summary.GROUP
                }),
                // 10
                search.createColumn({
                    name: 'custitem_avt_total_length',
                    join: 'memberitem',
                    summary: search.Summary.MAX
                }),
                // 11
                search.createColumn({
                    name: 'custitem_avt_total_width',
                    join: 'memberitem',
                    summary: search.Summary.MAX
                }),
                // 12
                search.createColumn({
                    name: 'custitem_avt_total_height',
                    join: 'memberitem',
                    summary: search.Summary.MAX
                }),
                // 13
                search.createColumn({
                    name: 'weight',
                    join: 'memberitem',
                    summary: search.Summary.MAX
                }),
                // 14
                search.createColumn({
                    name: 'custitem_avt_total_packages',
                    summary: search.Summary.GROUP
                }),
                // 15
                search.createColumn({
                    name: 'custitem_avt_ifs_cubic_volume',
                    summary: search.Summary.GROUP
                }),
                // 16
                search.createColumn({
                    name: 'custitem_avt_ifs_cubic_volume',
                    join: 'memberitem',
                    summary: search.Summary.SUM
                }),
                // 17
                search.createColumn({
                    name: 'weight',
                    summary: search.Summary.GROUP
                }),
                // 18
                search.createColumn({
                    name: 'custitem_cubic_carrier_express',
                    summary: search.Summary.GROUP
                }),
                // 19
                search.createColumn({
                    name: 'custitem_stockoverride',
                    summary: search.Summary.GROUP
                }),
                // 20
                search.createColumn({
                    name: 'custitem_enforce_stock_buffer',
                    summary: search.Summary.GROUP
                }),
                // 21
                search.createColumn({
                    name: 'custitem_assemblyhours',
                    summary: search.Summary.MAX
                }),
                // 22
                search.createColumn({
                    name: 'custitem_multi_qty_carrier_override',
                    summary: search.Summary.GROUP
                }),
                // 23
                search.createColumn({
                    name: 'custitem_website_free_shipping',
                    summary: search.Summary.GROUP
                }),
                // 24
                search.createColumn({
                    name: 'custitem_fs_hnol_metro',
                    summary: search.Summary.GROUP
                }),
                // 25
                search.createColumn({
                    name: 'custitem_fs_hnol_rural',
                    summary: search.Summary.GROUP
                }),
                // 26
                search.createColumn({
                    name: 'custitem_fs_hnol_remote',
                    summary: search.Summary.GROUP
                }),
                // 27
                search.createColumn({
                    name: 'custitem_fs_hnol_zone4',
                    summary: search.Summary.GROUP
                }),
                //28
                search.createColumn({
                    name: 'custitem_6zone_5',
                    summary: search.Summary.GROUP
                }),
                //29
                search.createColumn({
                    name: 'custitem_6zone_6',
                    summary: search.Summary.GROUP
                })
            ];
            // util.each(extraColumnFields, function(ecf) {
            //     searchColumns.push(search.createColumn({
            //         name: ecf,
            //         summary: search.Summary.GROUP
            //     }));
            // })
            var kitSearch = search.create({
                type: search.Type.ITEM,
                filters: searchFilters,
                columns: addExtraColumns(searchColumns, getExtraColumns(extraColumnFields, true)),
            });

            // log.debug('kitSearch columns', kitSearch.columns);
            var kitSearchPageData = kitSearch.runPaged({ pageSize: 1000 });

            if (kitSearchPageData.count > 0) {
                var kitSearchPageRanges = kitSearchPageData.pageRanges;

                for (var i = 0; i < kitSearchPageRanges.length; i++) {
                    var currentPage = kitSearchPageData.fetch(i);
                    currentPage.data.forEach(function (result) {
                        log.debug('kit result', result.getValue(kitSearch.columns[3]));
                        var locationQuantityAvailable = parseFloat(result.getValue(kitSearch.columns[3]));
                        var quantity = _.isNaN(locationQuantityAvailable) ? 0 : _.floor(locationQuantityAvailable);
                        var kitInventoryObj = {
                            internalid: result.getValue(kitSearch.columns[0]),
                            sku: getItemSKU(result.getValue(kitSearch.columns[1])),
                            type: result.getValue(kitSearch.columns[2]),
                            matrix_child: false,
                            location_quantity_available: quantity,
                            inventory_location_id: result.getValue(kitSearch.columns[4]),
                            inventory_location_name: result.getText(kitSearch.columns[4]),
                            weight: parseFloat(result.getValue(kitSearch.columns[17])), // dead weight total
                            disable_same_day: result.getValue(kitSearch.columns[6]),
                            carrier_id: result.getValue(kitSearch.columns[7]),
                            carrier: result.getText(kitSearch.columns[7]),
                            express_carrier_id: result.getValue(kitSearch.columns[18]),
                            express_carrier: result.getText(kitSearch.columns[18]),
                            cubic_weight: parseFloat(result.getValue(kitSearch.columns[8])),
                            max_length: result.getValue(kitSearch.columns[10]),
                            max_width: result.getValue(kitSearch.columns[11]),
                            max_height: result.getValue(kitSearch.columns[12]),
                            max_weight: result.getValue(kitSearch.columns[13]), // max member weight
                            package: result.getValue(kitSearch.columns[14]),
                            total_cubic: result.getValue(kitSearch.columns[15]) || result.getValue(kitSearch.columns[16]),
                            // total_deadWeight: result.getValue(kitSearch.columns[17]),
                            stock_override: result.getValue(kitSearch.columns[19]),
                            enforce_stock_buffer: result.getValue(kitSearch.columns[20]),
                            assembly_hours: result.getValue(kitSearch.columns[21]),
                            fms_Website_Status: result.getValue(kitSearch.columns[23]),
                            fms_Zone_Prices: {
                                zone1: result.getValue(kitSearch.columns[24]),
                                zone2: result.getValue(kitSearch.columns[25]),
                                zone3: result.getValue(kitSearch.columns[26]),
                                zone4: result.getValue(kitSearch.columns[27]),
                                zone5: result.getValue(kitSearch.columns[28]),
                                zone6: result.getValue(kitSearch.columns[29])
                            },
                            multi_qty_carrier_override: result.getValue(kitSearch.columns[22])
                        }
                        util.each(extraColumnFields, function (ecf) {
                            kitInventoryObj[ecf.label || ecf.name] = result.getValue(ecf);
                        });
                        kitInventoryArray.push(kitInventoryObj)
                    });
                }
            }

            return kitInventoryArray;
        }

        function getMatrixChildrenInventory(matrixInternalidArray, locationArray, itemMatrixOption, extraColumnFields) {

            var itemMatrixOptionsArray = new Array();
            if (itemMatrixOption && itemMatrixOption == 'y') {
                itemMatrixOptionsArray = getMatrixOptions(matrixInternalidArray);
            }

            var searchFilters = [
                ['parent.internalid', 'anyof', matrixInternalidArray],
                'AND',
                ['matrixchild', 'is', true],
                'AND',
                ['inventorylocation', 'anyof', locationArray]
            ];

            var searchColumns = [
                'type',
                'itemid',
                'internalid',
                'parent',
                'locationquantityavailable',
                'inventorylocation',
                'custitem_cubic_charge_weight',
                'custitem_ps_disable_sd_delivery',
                'custitem_cubic_carrier',
                'custitem_cubic_carrier_express',
                'custitem_cubic_charge_weight',
                'custitem_avt_total_length',
                'custitem_avt_total_width',
                'custitem_avt_total_height',
                'weight',
                'custitem_avt_total_packages',
                'custitem_avt_ifs_cubic_volume',
                'custitem_stockoverride',
                'custitem_enforce_stock_buffer',
                'custitem_assemblyhours',
                'custitem_multi_qty_carrier_override'
            ];
            // searchColumns = _.concat(searchColumns, extraColumnFields);

            var matrixChildInventoryArray = new Array();

            var matrixSearch = search.create({
                type: search.Type.ITEM,
                filters: searchFilters,
                // columns: searchColumns
                columns: addExtraColumns(searchColumns, extraColumnFields),
            });

            var matrixSearchPageData = matrixSearch.runPaged({ pageSize: 1000 });

            if (matrixSearchPageData.count > 0) {
                var matrixSearchPageRanges = matrixSearchPageData.pageRanges;

                for (var i = 0; i < matrixSearchPageRanges.length; i++) {
                    var currentPage = matrixSearchPageData.fetch(i);
                    currentPage.data.forEach(function (result) {
                        // log.debug('matrix result', JSON.stringify(result));

                        var locationQuantityAvailable = parseFloat(result.getValue('locationquantityavailable'));
                        var quantity = _.isNaN(locationQuantityAvailable) ? 0 : locationQuantityAvailable;
                        // log.debug('item matrix options array', JSON.stringify(itemMatrixOptionsArray));
                        var matrixOption = _.find(itemMatrixOptionsArray, function (imo) {
                            return _.toString(imo.matrix_child_id) == _.toString(result.getValue('internalid'));
                        });
                        // log.debug('current matrix child options', JSON.stringify(matrixOption));

                        var currentMatrixChildInventoryObj = {
                            internalid: result.getValue('internalid'),
                            sku: getItemSKU(result.getValue('itemid')),
                            type: result.getValue('type'),
                            matrix_child: true,
                            matrix_parent_id: result.getValue('parent'),
                            matrix_parent_sku: getItemSKU(result.getText('parent')),
                            location_quantity_available: quantity,
                            inventory_location_id: result.getValue('inventorylocation'),
                            inventory_location_name: result.getText('inventorylocation'),
                            weight: parseFloat(result.getValue('weight')), // dead weight
                            disable_same_day: result.getValue('custitem_ps_disable_sd_delivery'),
                            carrier_id: result.getValue('custitem_cubic_carrier'),
                            carrier: result.getText('custitem_cubic_carrier'),
                            express_carrier_id: result.getValue('custitem_cubic_carrier_express'),
                            express_carrier: result.getText('custitem_cubic_carrier_express'),
                            cubic_weight: parseFloat(result.getValue('custitem_cubic_charge_weight')),
                            max_length: result.getValue('custitem_avt_total_length'),
                            max_width: result.getValue('custitem_avt_total_width'),
                            max_height: result.getValue('custitem_avt_total_height'),
                            max_weight: result.getValue('weight'),
                            pacakge: result.getValue('custitem_avt_total_packages'),
                            total_cubic: result.getValue('custitem_avt_ifs_cubic_volume'),
                            stock_override: result.getValue('custitem_stockoverride'),
                            enforce_stock_buffer: result.getValue('custitem_enforce_stock_buffer'),
                            assembly_hours: result.getValue('custitem_assemblyhours'),
                            multi_qty_carrier_override: result.getValue('custitem_multi_qty_carrier_override')
                        }

                        util.each(extraColumnFields, function (ecf) {
                            currentMatrixChildInventoryObj[ecf.label || ecf.name] = result.getValue(ecf);
                        })

                        if (itemMatrixOption && itemMatrixOption == 'y' && matrixOption) {
                            currentMatrixChildInventoryObj.matrix_options = matrixOption.options;
                        }

                        matrixChildInventoryArray.push(currentMatrixChildInventoryObj);
                    });
                }
            }
            log.debug('matrixChildInventoryArray', matrixChildInventoryArray)
            return matrixChildInventoryArray;
        }

        function getMatrixOptions(matrixInternalidArray) {
            var itemMatrixOptionsArray = new Array();

            _.map(matrixInternalidArray, function (matrixId) {

                var itemRecord = record.load({
                    type: record.Type.INVENTORY_ITEM,
                    id: matrixId
                });

                var itemRecordOptions = itemRecord.getText('itemoptions');
                // log.debug('matrix all fields', itemRecord.getSublistFields({sublistId: 'matrixmach'}));
                // log.debug('item record options', JSON.stringify(itemRecordOptions));

                var matrixLineCount = itemRecord.getLineCount({ sublistId: 'matrixmach' });
                // log.debug('matrix line count', matrixLineCount);
                for (var i = 0; i < matrixLineCount; i++) {

                    var matrixOptionsArray = new Array();
                    for (var j = 1; j <= itemRecordOptions.length; j++) {
                        var matrixValue = itemRecord.getSublistValue({
                            sublistId: 'matrixmach',
                            fieldId: 'mtrxoption' + j,
                            line: i
                        })

                        matrixOptionsArray.push({
                            matrix_option: itemRecordOptions[j - 1],
                            matrix_value: matrixValue
                        });
                    }
                    // log.debug('matrix options array', matrixOptionsArray);

                    var matrixChildID = itemRecord.getSublistValue({
                        sublistId: 'matrixmach',
                        fieldId: 'mtrxid',
                        line: i
                    });
                    var matrixChildInactive = itemRecord.getSublistValue({
                        sublistId: 'matrixmach',
                        fieldId: 'mtrxinactive',
                        line: i
                    });

                    if (matrixChildInactive != 'F') {
                        itemMatrixOptionsArray.push({
                            matrix_parent_id: matrixId,
                            matrix_child_id: matrixChildID,
                            options: matrixOptionsArray
                        })
                    }
                }
            });

            // log.debug('item record options', JSON.stringify(itemMatrixOptionsArray));
            return itemMatrixOptionsArray;
        }

        function getPreSearchFilters(filterStrings) {
            var filters = [];
            if (filterStrings) {
                var filtersArr = _.compact(filterStrings.split(','));
                filters = _.map(filtersArr, function (fa) {
                    return _.slice(fa.split(':'), 0, 3);
                });
            }
            return filters;
        }

        function addExtraColumns(originColumns, extraColumns) {
            util.each(extraColumns, function (column) {
                if (util.isObject(column)) {
                    originColumns.push(search.createColumn(column));
                }
            })
            log.audit('originColumns', originColumns)
            return originColumns;
        }

        function getExtraColumns(columnArr, group) {
            // return column options array
            // [isinactive,{name:formulacurrency, formula:{princelevel5}, summary: max, label:price}]
            log.debug('columnArr', columnArr);
            var columnOptionsArr = []
            columnOptionsArr = _.map(columnArr, function (col) {
                if (util.isString(col)) {
                    return group ? { name: col, summary: search.Summary.GROUP } : { name: col };
                } else if (util.isObject(col)) {
                    var newCol = util.extend({}, col);
                    if (group) {
                        if (_.isEmpty(newCol.summary)) {
                            newCol.summary = search.Summary.GROUP;
                        }
                        return newCol;
                    } else {
                        var mkCol = {}
                        util.each(newCol, function (cv, ck) {
                            if (ck != 'summary') {
                                mkCol[ck] = cv;
                            }
                        })
                        return mkCol;
                    }
                }
            });
            return _.compact(columnOptionsArr);
        }

        function getItemIDType(itemKeyType, itemArray, searchPreFilters) {
            log.debug('itemArray', itemArray);
            var kitArray = new Array();
            var inventoryPartArray = new Array();

            var filtersArray = new Array();
            if (itemKeyType == 'internalid' && !_.isEmpty(itemArray)) {
                filtersArray.push(['internalid', 'anyof', itemArray]);
            } else if (itemKeyType == 'sku' && !_.isEmpty(itemArray)) {
                // search with 'itemid', it is case insensitive
                var itemFilterArray = new Array();
                for (var i = 0; i < itemArray.length; i++) {
                    itemFilterArray.push(['itemid', 'is', itemArray[i].toUpperCase()]);
                    itemFilterArray.push('OR');
                }

                filtersArray.push(itemFilterArray.slice(0, itemFilterArray.length - 1));
            }
            if (!_.isEmpty(searchPreFilters)) {
                if (!_.isEmpty(filtersArray)) {
                    filtersArray.push('AND');
                }
                util.each(searchPreFilters, function (spf, index) {
                    filtersArray.push(spf);
                    if (index < searchPreFilters.length - 1) {
                        filtersArray.push('AND');
                    }
                });
            }
            var itemSearch = search.create({
                type: search.Type.ITEM,
                filters: filtersArray,
                columns: [
                    'internalid',
                    'itemid',
                    'type',
                    'isinactive'
                ]
            });
            var itemSearchPageData = itemSearch.runPaged({ pageSize: 1000 });
            log.audit('itemSearchPageData.count', itemSearchPageData.count);
            if (itemSearchPageData.count > 0) {
                var itemSearchPageRanges = itemSearchPageData.pageRanges;
                log.audit('itemSearchPageRanges.length', itemSearchPageRanges.length);
                for (var i = 0; i < itemSearchPageRanges.length; i++) {
                    var currentPage = itemSearchPageData.fetch(i);
                    currentPage.data.forEach(function (result) {
                        // log.debug('item search result', JSON.stringify(result));
                        var itemObj = {
                            internalid: result.getValue('internalid'),
                            sku: getItemSKU(result.getValue('itemid')),
                            type: result.getValue('type')
                        }

                        if (!_.isEmpty(itemArray) && itemArray.indexOf(itemObj[itemKeyType].toString().toUpperCase()) < 0) {
                            log.audit(itemObj[itemKeyType] + ' is not exist', itemArray)
                        } else {
                            if (itemObj.type == 'InvtPart') {
                                inventoryPartArray.push(itemObj);
                            } else if (itemObj.type == 'Kit') {
                                kitArray.push(itemObj);
                            }
                        }
                        // if (itemObj[itemKeyType] && itemArray.indexOf(itemObj[itemKeyType].toString().toUpperCase()) >= 0) {
                        //     if (itemObj.type == 'InvtPart') {
                        //         inventoryPartArray.push(itemObj);
                        //     } else if (itemObj.type == 'Kit') {
                        //         kitArray.push(itemObj);
                        //     }
                        // }
                    });
                }
            }

            return {
                inventory_part: inventoryPartArray,
                kit_package: kitArray
            }
        }

        function getItemSKU(itemFullName) {
            var itemFullNameArray = itemFullName.split(' : ');

            return itemFullNameArray[itemFullNameArray.length - 1];
        }

        function parseKeyValuePair(toParseArray) {

            var keyArray = new Array();
            var keyValueArray = new Array();

            //to parse [{SKU}:5:75p, ...] or [15:5:75p, 10:10:60p, 1] like
            for (var i = 0; i < toParseArray.length; i++) {
                var parsedArray = toParseArray[i].split(':'); // [15,5,75p]
                keyArray.push(_.trim(parsedArray[0]).replace(' ', '+').toUpperCase());

                if (parsedArray.length >= 2) {
                    var cutObj = {
                        'key': parsedArray[0].toUpperCase(),
                        'rule': '',
                    }
                    for (var l = 1; l < parsedArray.length; l++) {
                        var cutArr = parsedArray[l].toLowerCase().match(/^(\d+)(p{0,1})$/);
                        log.debug('cutArr', cutArr);
                        if (cutArr && cutArr.length == 3 && cutArr[1]) {
                            if (cutArr[2] == 'p') {
                                cutObj.rule += '_QTY_ *= ' + cutArr[1] + '/100;'
                            } else {
                                cutObj.rule += '_QTY_ -= ' + cutArr[1] + ';'
                            }
                        } else {
                            log.error('neglect, wrong rule format applied for ' + parsedArray[0], parsedArray);
                        }
                    }
                    keyValueArray.push(cutObj);
                }
            }

            return {
                keys: keyArray,
                rules: keyValueArray
            }
        }

        function applyQtyRule(_QTY_, rule) {
            eval(rule)
            return _QTY_ > 0 ? _.floor(_QTY_) : 0;
        }

        function getInventory(filtersArray) {

            var inventoryPartArray = new Array();
            var kitArray = new Array();

            var internalidSearch = search.create({
                type: search.Type.ITEM,
                // filters: [
                //     // ['itemid', 'is', 'TMSTRIDE'], //working                 
                //     // ['itemid', 'is', ['TMSTRIDE']], // working 
                //     // ['itemid', 'is', ['TMSTRIDE', 'TMSTRIDEM2']], //only get the first item           
                //     // ['itemid', 'anyof', ['TMSTRIDE']], // UNEXPECTED_ERROR
                //     // ['itemid', 'anyof', ['TMSTRIDE', 'TMSTRIDEM2']], // UNEXPECTED_ERROR
                //     // ['internalid', 'anyof', ['4612']] //working
                //     // ['internalid', 'anyof', ['4612', 16650]] //working
                //     [
                //         ['itemid', 'is', 'tmstride'],
                //         'OR',
                //         ['itemid', 'is', 'TMSTRIDEM2']
                //     ], // working
                //     'AND',
                //     ['inventorylocation.internalid', 'anyof', ['1', '8', '9', '10']]
                // ],
                filters: filtersArray,
                columns: [
                    'type',
                    'itemid',
                    'internalid',
                    'locationquantityavailable',
                    'inventorylocation',
                ]
            });

            var internalidPageData = internalidSearch.runPaged({
                pageSize: 1000
            });

            var internalidPageRanges = internalidPageData.pageRanges;
            for (var i = 0; i < internalidPageRanges.length; i++) {
                var currentPage = internalidPageData.fetch(i);
                currentPage.data.forEach(function (result) {
                    // log.debug('internal result', JSON.stringify(result));
                });
            }
        }

        function gflb2bBrandFilter(inputString) {
            // Split the input string by ','
            var parts = inputString.split(',');

            // Create a new array to hold the transformed values
            var transformed = ['custitem_b2bshopify_brand', 'anyof'];

            // Iterate over the parts and add them to the transformed array
            for (var i = 0; i < parts.length; i++) {
                transformed.push(parts[i]);
            }

            // Return the transformed array encapsulated in another array
            return [transformed];
        }

        return {
            onRequest: onRequest
        };

    });