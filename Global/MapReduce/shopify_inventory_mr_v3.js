/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 * @NAmdConfig /SuiteScripts/G 2.0/gconfig.json
 */
define(['N/runtime', 'N/search', 'libG', './ShopifyLib_v2', 'N/format', 'N/file'],

    function (runtime, search, libG, ShopifyLib, format, file) {

        var _ = libG.lodash();
        var now = new Date().getTime();
        var compareTime = now - 1000 * 60 * 60 * 6;

        /**
         * Marks the beginning of the Map/Reduce process and generates input data.
         *
         * @typedef {Object} ObjectRef
         * @property {number} id - Internal ID of the record instance
         * @property {string} type - Record type id
         *
         * @return {Array|Object|Search|RecordRef} inputSummary
         * @since 2015.1
         */
        function getInputData() {
            var shopifyConnId = runtime.getCurrentScript().getParameter('custscript_shopify_inventory_mr_v3_site');
            var updateAll = runtime.getCurrentScript().getParameter('custscript_shopify_inventory_mr_v3_upall');
            var shopifyConn = search.lookupFields({
                type: 'customrecord_shopify_conn_settings',
                id: shopifyConnId,
                columns: [
                    'name',
                    'custrecord_shopify_conn_auth',
                    'custrecord_shopify_conn_locations',
                    'custrecord_shopify_conn_preset',
                    'custrecord_shopify_conn_saved_search',
                    'custrecord_shopify_conn_auth_key',
                    'custrecord_shopify_conn_auth_password',
                    'custrecord_shopify_conn_auth_secret'
                ]
            });

            if (shopifyConn.custrecord_shopify_conn_saved_search.length != 1) {
                log.error('missing saved search', shopifyConn.name + ' shopify saved search is empty');
                return [];
            } else {
                var itemArray = [];
                var nsInternalIds = [];
                search.load(shopifyConn.custrecord_shopify_conn_saved_search[0].value).run().each(function (result) {
                    var columnArray = result.columns;
                    var itemData = {};

                    _.forEach(columnArray, function (col) {
                        // log.debug('col', col);
                        // {"name":"type","label":"recordtype","type":"select","sortdir":"NONE"}
                        var colString = JSON.stringify(col);
                        var colData = {
                            ns_field: col.name,
                            value: result.getValue(col),
                            type: JSON.parse(colString).type
                        };

                        if (col.label == 'ns_matrix' && result.getValue(col) == false) {
                            nsInternalIds.push(result.id);
                        }

                        itemData[col.label] = colData;
                    });

                    if (!updateAll && (_.has(itemData, 'last_modified_date') || _.has(itemData, 'last_quantity_available_change_date') || _.has(itemData, 'back_ordered'))) {
                        var lastModifiedDate = null;
                        var lastQtyModifiedDate = null;

                        if (itemData.last_modified_date.value) {
                            lastModifiedDate = format.parse({
                                value: itemData.last_modified_date.value,
                                type: format.Type.DATETIMETZ,
                                timezone: format.Timezone.AUSTRALIA_SYDNEY
                            });
                        }
                        if (itemData.last_quantity_available_change_date.value) {
                            lastQtyModifiedDate = format.parse({
                                value: itemData.last_quantity_available_change_date.value,
                                type: format.Type.DATETIMETZ,
                                timezone: format.Timezone.AUSTRALIA_SYDNEY
                            });
                        }

                        if (result.recordType == 'kititem') {
                            itemArray.push({
                                ns_internalid: result.id,
                                ns_recordtype: result.recordType,
                                item: itemData,
                                shopify_conn: shopifyConn
                            });
                        } else if (
                            itemData.requires_shipping && itemData.requires_shipping.value &&
                            ((lastModifiedDate && lastModifiedDate > compareTime) || (lastQtyModifiedDate && lastQtyModifiedDate > compareTime) || itemData.back_ordered.value)
                        ) {
                            itemArray.push({
                                ns_internalid: result.id,
                                ns_recordtype: result.recordType,
                                item: itemData,
                                shopify_conn: shopifyConn
                            });
                        }
                    } else {
                        itemArray.push({
                            ns_internalid: result.id,
                            ns_recordtype: result.recordType,
                            item: itemData,
                            shopify_conn: shopifyConn
                        })
                    }
                    return true;
                });
                log.debug('itemArray internalids ' + itemArray.length, _.map(itemArray, 'ns_internalid'))
                return itemArray;
            }
        }

        /**
         * Executes when the map entry point is triggered and applies to each key/value pair.
         *
         * @param {MapSummary} context - Data collection containing the key/value pairs to process through the map stage
         * @since 2015.1
         */
        function map(context) {
            // log.debug('map start datetime', new Date().toISOString());
            var fileContent = [{ context_value: context.value }];
            var item = JSON.parse(context.value);
            item.inventory = {};
            // log.debug('item', item);
            var itemData = item.item;
            var shopifyConn = item.shopify_conn;
            var slLocation = JSON.parse(shopifyConn.custrecord_shopify_conn_locations); // [{"ns_id": "1","shopify_id": "10750558266"}, {"ns_id": "15","shopify_id": "10750558266"}]
            var locations = _.join(_.map(slLocation, function (loc) {
                return loc.ns_id + (loc.rule || '');
            }), ',');
            fileContent.push(({ locations: locations }));
            var sl = new ShopifyLib(shopifyConn.name, shopifyConn.custrecord_shopify_conn_auth_key, shopifyConn.custrecord_shopify_conn_auth_password);

            // get Inventory
            var inventoryDetails = sl.getNSItemInventoryByInternalid(item.ns_internalid, locations);

            log.debug('inventory details', inventoryDetails);
            fileContent.push(({ inventory_details: inventoryDetails }));
            if (inventoryDetails && !_.isEmpty(inventoryDetails.inventory)) {
                item.inventory = inventoryDetails.inventory[0];
            }

            // log.debug('item inventory', item.inventory);
            if (!_.isEmpty(item.inventory) && !_.isEmpty(itemData.inventory_item_id.value)) {

                var inventory = [];
                var expressTags = [];

                var locationGroup = _.groupBy(slLocation, 'shopify_id');
                _.forIn(locationGroup, function (lg, shopifyLocationId) {
                    var nsLocationIds = _.map(lg, 'ns_id');
                    log.debug('nsLocationIds', nsLocationIds);
                    var inventoryFilted = _.filter(item.inventory.inventory, function (iii) {
                        if (!item.inventory.disable_same_day && iii.inventory_location_id == '10' && iii.location_quantity_available > 0) {
                            expressTags.push('ExpressNSW')
                        } else if (!item.inventory.disable_same_day && iii.inventory_location_id == '15' && iii.location_quantity_available > 0) {
                            expressTags.push('ExpressVIC')
                        }
                        return _.indexOf(nsLocationIds, iii.inventory_location_id) >= 0;
                    });
                    log.debug('inventoryFilted', inventoryFilted);
                    var locationQty = _.sumBy(inventoryFilted, 'location_quantity_available');

                    inventory.push({
                        ns_id: nsLocationIds,
                        shopify_id: shopifyLocationId,
                        available: locationQty,
                        sku: itemData.sku.value
                    })
                });

                log.debug(itemData.sku.value + ' inventory', inventory);
                fileContent.push(({ shopify_inventory: inventory }));
                // [{"ns_id":"1","shopify_id":"10750558266","available":1076,"sku":"SHAKEBOTTLE2P"},{"ns_id":"15","shopify_id":"10750558266","available":0,"sku":"SHAKEBOTTLE2P"}]
                _.forEach(inventory, function (ia) {
                    var inventoryLevelData = {
                        location_id: ia.shopify_id,
                        inventory_item_id: itemData.inventory_item_id.value,
                        available: ia.available >= 50 ? 50 : ia.available
                    }
                    log.debug('to set inventory ' + item.inventory.sku, inventoryLevelData);
                    fileContent.push(({ to_set_inventory: inventoryLevelData }));
                    if (runtime.envType == 'PRODUCTION') {
                        var inventoryResponse = sl.setInventoryLevel(inventoryLevelData);
                        if (!_.has(inventoryResponse, 'errors')) {
                            log.debug('set inventory level response' + item.inventory.sku, inventoryResponse);
                            fileContent.push(({ inventory_level_response: inventoryResponse }));
                        }
                    } else {
                        log.debug('runtime envType', runtime.envType)
                    }
                });

                log.debug(itemData.sku.value + ' expresstags', expressTags);
                fileContent.push({ express_tags: expressTags });
                if (runtime.envType == 'PRODUCTION' && (shopifyConn.name == 'lifespan-kids' || shopifyConn.name == 'lifespan-fitness')) {
                    var tags = _.concat(_.map(itemData.tags.value.split(','), _.trim), expressTags).join(',')
                    log.debug('tags', tags);
                    fileContent.push({ tags: tags })
                    var updateProductResp = sl.updateProduct({
                        product: {
                            id: itemData.product_id.value,
                            tags: tags
                        }
                    });
                    fileContent.push({ update_tags_response: JSON.stringify(updateProductResp) })
                    if (updateProductResp && updateProductResp.errors) {
                        log.error('update tags error', updateProductResp.errors)
                    }
                } else {
                    log.debug('runtime envType', runtime.envType)
                }

                // update requires_shipping on inventoryitem if last modified date is within the range
                if (itemData.last_modified_date && itemData.last_modified_date.value) {
                    var lastModifiedDate = format.parse({
                        value: itemData.last_modified_date.value,
                        type: format.Type.DATETIMETZ,
                        timezone: format.Timezone.AUSTRALIA_SYDNEY
                    });
                    if (lastModifiedDate > compareTime) {
                        var inventoryItemDetails = {
                            id: itemData.inventory_item_id.value,
                            tracked: true,
                            requires_shipping: true,
                        }
                        if (_.has(itemData, 'requires_shipping') && _.trim(itemData.requires_shipping.value, '*') == 'false') {
                            inventoryItemDetails.requires_shipping = false;
                        }
                        log.debug('to update inventory item', inventoryItemDetails);
                        fileContent.push(({ to_update_inventory_item_details: inventoryItemDetails }));
                        if (runtime.envType == 'PRODUCTION') {
                            var inventoryRes = sl.updateInventoryItem(inventoryItemDetails);
                            log.debug('inventory item response' + itemData.sku.value, inventoryRes);
                            fileContent.push(({ inventory_item_reponse: inventoryRes }));
                        } else {
                            log.debug('runtime envType', runtime.envType)
                        }
                    }
                }

                // update inventory_policy on vairant
                var variantData = {
                    id: itemData.id.value,
                    inventory_policy: 'deny',
                };

                if (!item.inventory.stock_override && itemData.auto_backorder && itemData.auto_backorder.value != '*ignore*') {
                    if (item.ns_recordtype == 'kititem') {
                        var ableBackOrder = true;
                        var kitSearch = search.create({
                            type: 'kititem',
                            filters: [['internalid', 'is', item.ns_internalid]],
                            columns: ['memberitem.quantityonorder', 'memberitem.quantitybackordered', 'memberitem.quantityavailable']
                        });
                        kitSearch.run().each(function (result) {
                            fileContent.push(({ kit_search_result: result }));
                            var quantityOnorder = result.getValue({ name: 'quantityonorder', join: 'memberitem' });
                            quantityOnorder = quantityOnorder ? parseFloat(quantityOnorder) : 0;
                            var quantityBackordered = result.getValue({ name: 'quantitybackordered', join: 'memberitem' });
                            quantityBackordered = quantityBackordered ? parseFloat(quantityBackordered) : 0;
                            log.debug(quantityOnorder, quantityBackordered);
                            var quantityAvailable = parseFloat(result.getValue({ name: 'quantityavailable', join: 'memberitem' })) || 0;
                            fileContent.push({ quantity_available: quantityAvailable })
                            fileContent.push(({ quantity_onorder: quantityOnorder }));
                            fileContent.push(({ quantity_backordered: quantityBackordered }));
                            var scriptObj = runtime.getCurrentScript();
                            if (scriptObj.deploymentId == 'customdeploy3') {
                                log.debug({
                                    title: 'kit Item log',
                                    details: scriptObj.deploymentId
                                });
                                if (quantityAvailable <= 0 && (quantityOnorder < 1 || quantityOnorder <= quantityBackordered)) {
                                    ableBackOrder = false;
                                }
                            } else {
                                if (quantityAvailable <= 0 && (quantityOnorder < 3 || quantityOnorder <= quantityBackordered)) {
                                    ableBackOrder = false;
                                }
                            }
                            log.debug('kitSearch result ' + ableBackOrder, result);
                            return true;
                        });
                        // log.debug('ableBackOrder', ableBackOrder);
                        fileContent.push(({ kit_able_backorder: ableBackOrder }));
                        if (ableBackOrder && !_.isEmpty(itemData.eta.value)) {
                            variantData.inventory_policy = 'continue';
                        }
                    } else if (item.ns_recordtype == 'inventoryitem') {
                        var onOrder = 0;
                        var backOrdered = 0;
                        if (itemData.on_order && itemData.on_order.value) {
                            onOrder = parseFloat(itemData.on_order.value);
                            if (itemData.back_ordered && itemData.back_ordered.value) {
                                backOrdered = parseFloat(itemData.back_ordered.value);
                            }
                        }
                        // log.debug(onOrder, backOrdered);
                        var scriptObj = runtime.getCurrentScript();
                        if (scriptObj.deploymentId == 'customdeploy3') {
                            log.debug({
                                title: 'Inventory Item log',
                                details: scriptObj.deploymentId
                            });
                            if (onOrder >= 1 && onOrder > backOrdered && !_.isEmpty(itemData.eta.value)) {
                                variantData.inventory_policy = 'continue';
                            }
                        }else{
                            if (onOrder >= 3 && onOrder > backOrdered && !_.isEmpty(itemData.eta.value)) {
                                variantData.inventory_policy = 'continue';
                            }
                        }
                    }
                }

                log.debug('to update variant', variantData);
                fileContent.push(({ to_update_variant_data: variantData }));
                if (runtime.envType == 'PRODUCTION') {
                    var variantRes = sl.updateVariant(variantData.id, variantData);
                    log.debug('variantRes', variantRes);
                    fileContent.push(({ vaiant_res: variantRes }));
                } else {
                    log.debug('runtime envType', runtime.envType)
                }
            }
            file.create({
                name: [shopifyConn.name, 'inventory', item.ns_internalid, itemData.sku.value].join('_') + '.txt',
                fileType: file.Type.PLAINTEXT,
                folder: 6685782,
                encoding: file.Encoding.UTF_8,
                contents: _.join(_.map(fileContent, JSON.stringify), '\n')
            }).save();
            log.debug('map end datetime', new Date().toISOString());
        }

        /**
         * Executes when the reduce entry point is triggered and applies to each group.
         *
         * @param {ReduceSummary} context - Data collection containing the groups to process through the reduce stage
         * @since 2015.1
         */
        function reduce(context) {

        }


        /**
         * Executes when the summarize entry point is triggered and applies to the result set.
         *
         * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
         * @since 2015.1
         */
        function summarize(summary) {
            summary.mapSummary.errors.iterator().each(function (key, value) {
                log.error('error in map stage ' + key, value);
                return true;
            })
        }

        return {
            getInputData: getInputData,
            map: map,
            // reduce: reduce,
            summarize: summarize
        };

    });
