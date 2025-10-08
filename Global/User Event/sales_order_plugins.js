/**
 * sales_order_plugins.js
 * @NApiVersion 2.1
 */

define([
    'N/https',
    'N/record',
    'N/url',
    'N/search',
    'N/email',
    '/SuiteScripts/G 2.0/lodash.4.17.15',
    '/SuiteScripts/G 2.0/moment-with-locales-timezones.min',
    'N/format',
    './sales_order_plugins_v2.x'
], function(https, record, url, search, email, _, moment, format, soPluginsV2x) {

    function locationMapper(scriptContext) {
        let result; // VIC
        let toSetLocation;
        const locationMappers = [];
        let defaultLocation;
        let existingLocation;

        search.create({
            type: 'customrecord_location_mapper',
            filters: [
                ['isinactive', 'is', 'F'],
                'AND',
                ['custrecord_location_mapper_location', 'isnotempty', null]
            ],
            columns: [
                'name',
                'custrecord_location_mapper_default',
                'custrecord_location_mapper_location',
                'custrecord_location_mapper_pref_states',
                'custrecord_location_mapper_priority',
                'custrecord_location_mapper_def_exl_state',
                'custrecord_location_mapper_shipitem'
            ]
        }).run().each(lm => {
            const loc = {
                name: lm.getValue('name'),
                default: lm.getValue('custrecord_location_mapper_default'),
                location_id: lm.getValue('custrecord_location_mapper_location'),
                location_name: lm.getText('custrecord_location_mapper_location'),
                preferred_states: lm.getValue('custrecord_location_mapper_pref_states').split(','),
                priority: parseFloat(lm.getValue('custrecord_location_mapper_priority')),
                shipitem: lm.getValue('custrecord_location_mapper_shipitem'),
                shipitem_name: lm.getText('custrecord_location_mapper_shipitem'),
                default_exclude_states: lm.getValue('custrecord_location_mapper_def_exl_state').split(',')
            }
            if (loc.default) {
                defaultLocation = loc
            }
            locationMappers.push(loc)

            return true;
        });
        log.debug('locationMappers', locationMappers)

        const items = [];
        // get comon location
        const itemCount = scriptContext.newRecord.getLineCount({sublistId: 'item'})
        for (let i = 0; i < itemCount; i++) {
            const itemType = scriptContext.newRecord.getSublistValue({
                sublistId: 'item',
                fieldId: 'itemtype',
                line: i
            });
            log.debug('itemType', itemType)
            const qtyFulfilled = parseFloat(scriptContext.newRecord.getSublistValue({
                sublistId: 'item',
                fieldId: 'quantityfulfilled',
                line: i
            })) || 0
            const qtyCommitted = parseFloat(scriptContext.newRecord.getSublistValue({
                sublistId: 'item',
                fieldId: 'quantitycommitted',
                line: i
            })) || 0
            const qty = scriptContext.newRecord.getSublistValue({
                sublistId: 'item',
                fieldId: 'quantity',
                line: i
            })
            if (['InvtPart', 'Kit', 'Group'].indexOf(itemType) >= 0 && qty > qtyFulfilled) {
                items.push({
                    internalid: scriptContext.newRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'item',
                        line: i
                    }),
                    name: scriptContext.newRecord.getSublistText({
                        sublistId: 'item',
                        fieldId: 'item',
                        line: i
                    }),
                    qty: qty - qtyFulfilled,
                    qtyCommitted
                })
            }
        }
        log.debug('items', items)

        if (!_.isEmpty(items)) {
            // get shipping state
            const recordFields = search.lookupFields({
                type: scriptContext.newRecord.type,
                id: scriptContext.newRecord.id,
                columns: ['tranid', 'shippingaddress.state', 'shipmethod', 'location']
            });
            log.debug('recordFields', recordFields)
            existingLocation = !_.isEmpty(recordFields.location) && recordFields.location[0].value
            if (_.map(locationMappers, 'location_id').includes(existingLocation)) {
                const destinationState = recordFields['shippingaddress.state']
                if (recordFields.shipmethod[0].text.toUpperCase().startsWith('PICKUP')) {
                    log.audit(`${recordFields.tranid} Pickup shipmethod not eligable`, recordFields.shipmethod)
                    const found = _.find(locationMappers, {shipitem: recordFields.shipmethod[0].value})
                    result = found.location_id
                } else {
                    let instockLocations = [], availableLocations = []
                    try {
                        const bulkInventoryUrl = url.resolveScript({
                            scriptId: 'customscript_bulk_inventory',
                            deploymentId: 'customdeploy2',
                            params: {
                                item_key_type: 'internalid',
                                location: _.compact(_.map(locationMappers, 'location_id')).join(',')
                            },
                            returnExternalUrl: true
                        });
                        const bulkInventoryReq = https.post({
                            url: bulkInventoryUrl,
                            body: JSON.stringify({
                                item_keys: _.map(items, 'internalid').join(','),
                                fields:[{name: 'custitem_eta_po', summary: 'max'}]
                            })
                        });
                        if (bulkInventoryReq.code == 200) {
                            const bodyObj = JSON.parse(bulkInventoryReq.body);
                            log.debug('bodyObj', bodyObj)
                            // add committed qty back to location quantity
                            bodyObj.inventory.forEach(inventory => {
                                const found = items.find(item => item.internalid == inventory.internalid)
                                if (found) {
                                    inventory.quantity_available += found.qtyCommitted;
                                    inventory.quantity_available_original += found.qtyCommitted;

                                    const foundLocationOriginal = inventory.inventory_original.find(ivt => ivt.inventory_location_id == existingLocation);
                                    foundLocationOriginal.location_quantity_available_original += found.qtyCommitted;

                                    const foundLocation = inventory.inventory.find(ivt => ivt.inventory_location_id == existingLocation);
                                    foundLocation.location_quantity_available += found.qtyCommitted;
                                }
                            });
                            log.audit('Detail inventory final', bodyObj)
                            const allInStockInventory = bodyObj.inventory.filter(invt => invt.quantity_available_original > 0)
                            log.debug('allInStockInventory', allInStockInventory)
                            if (_.isEmpty(allInStockInventory)) {
                                const heaviestItem = _.maxBy(bodyObj.inventory, 'cubic_weight')
                                log.debug('heaviestItem', heaviestItem)
                                if (heaviestItem.custitem_eta_po) {
                                    const poFields = search.lookupFields({
                                        type: 'purchaseorder',
                                        id: heaviestItem.custitem_eta_po,
                                        columns: ['location', 'tranid']
                                    });
                                    log.debug('poFields', poFields)
                                    result = poFields.location[0].value || '15'
                                } else {
                                    const outofstockLocations = []
                                    const poInternalids = _.compact(_.map(bodyObj.inventory, 'custitem_eta_po'))
                                    log.debug('poInternalids', poInternalids)
                                    if (poInternalids.length > 0) {
                                        search.create({
                                            type: 'purchaseorder',
                                            filters: [
                                                ['internalid', 'anyof', poInternalids],
                                                'AND',
                                                ['mainline', 'is', 'T']
                                            ],
                                            columns: ['tranid', 'location']
                                        }).run().each(res => {
                                            const locationId = res.getValue('location')
                                            if (locationId) {
                                                const foundLocation = _.find(locationMappers, {location_id: locationId})
                                                // log.debug('foundLocation', foundLocation)
                                                if (foundLocation) {
                                                    outofstockLocations.push(foundLocation)
                                                }
                                            }

                                            return true;
                                        })
                                        log.debug(`outofstockLocations ${outofstockLocations.length}`, outofstockLocations)
                                        const topPriorityLocation = _.minBy(outofstockLocations, 'priority')
                                        log.debug(`topPriorityLocation`, topPriorityLocation)
                                        if (topPriorityLocation) {
                                            result = topPriorityLocation.location_id
                                        }
                                    }
                                }
                            } else {
                                const heaviestItem = _.maxBy(allInStockInventory, 'cubic_weight')
                                const foundHeaviestItem = _.find(items, {internalid: heaviestItem.internalid})
                                heaviestItem.qty = foundHeaviestItem.qty
                                log.debug('heaviestItem', heaviestItem)
                                // let intersection = _.map(heaviestItem.inventory, invt => invt);
                                const intersectionBase = heaviestItem.inventory.filter(invt => invt.location_quantity_available >= foundHeaviestItem.qty)
                                log.debug('intersectionBase', intersectionBase)
                                let intersection = [];
                                for (const item of items) {
                                    if (item.internalid == heaviestItem.internalid) {
                                        const found = _.find(allInStockInventory, {internalid: item.internalid})
                                        if (found) {
                                            intersection = _.intersectionWith(intersectionBase, found.inventory, (base, other) => {
                                                // log.debug('base other', {base, other})
                                                if (base.inventory_location_id == other.inventory_location_id) {
                                                    if (base.location_quantity_available < heaviestItem.qty && base.location_quantity_available > 0) {
                                                        availableLocations.push(base)
                                                    }
                                                    
                                                    if (other.location_quantity_available < item.qty && other.location_quantity_available > 0) {
                                                        availableLocations.push(other)
                                                    }
                                                }
                                                return base.inventory_location_id == other.inventory_location_id && 
                                                    base.location_quantity_available >= heaviestItem.qty && other.location_quantity_available >= item.qty
                                            })
                                        } else {
                                            // throw new Error(`Unable to find inventory for item ${item.internalid} in record ${scriptContext.newRecord.type} ${scriptContext.newRecord.id}`)
                                            log.debug('item is out of stock', item)
                                        }
                                        // log.debug(`intersection ${item.internalid}`, intersection)
                                    }
                                }
                                log.debug('intersection', intersection)
                                intersection = _.compact(intersection)
                                intersection = _.isEmpty(intersection) ? intersectionBase : intersection
                                availableLocations = _.compact(availableLocations)
                                log.debug('intersection after', intersection)
                                log.debug('availableLocations', availableLocations)

                                instockLocations = !_.isEmpty(intersection) ? _.compact(_.map(intersection, inventory => {
                                    return _.find(locationMappers, {location_id: inventory.inventory_location_id})
                                })) : (!_.isEmpty(availableLocations) ? _.compact(_.map(availableLocations, inventory => {
                                    return _.find(locationMappers, {location_id: inventory.inventory_location_id})
                                })) : [])
                                log.debug(`instockLocations ${instockLocations.length}`, instockLocations)
                                if (_.isEmpty(instockLocations)) {
                                    log.error('empty instock location', items)
                                } else {
                                    const uniqSortedInstockLocation = _.sortBy(_.uniqBy(_.compact(instockLocations), 'name'), 'priority')
                                    log.debug(`uniqSortedInstockLocation ${uniqSortedInstockLocation.length}`, uniqSortedInstockLocation);
                                    
                                    result = uniqSortedInstockLocation[0].location_id;
                                    if (!_.isEmpty(uniqSortedInstockLocation[0].default_exclude_states) &&
                                        uniqSortedInstockLocation[0].default_exclude_states.indexOf(destinationState) >= 0
                                    ) {
                                        result = (defaultLocation && defaultLocation.location_id) || '15';
                                        log.debug('if result', result);
                                        log.debug('defaultLocation', defaultLocation);
                                    }
                                    log.debug('uniqSortedInstockLocation[0]', uniqSortedInstockLocation[0])
                                    log.debug('result 0', result)
                                    for (let i = 1; i < uniqSortedInstockLocation.length; i++) {
                                        log.debug(`uniqSortedInstockLocation[${i}]`, uniqSortedInstockLocation[i])
                                        if (destinationState == uniqSortedInstockLocation[i].name) {
                                            result = uniqSortedInstockLocation[i].location_id
                                            log.debug(`result ${i}`, result)
                                        } else {
                                            // if (uniqSortedInstockLocation[i].preferred_states.indexOf(uniqSortedInstockLocation[i-1].name) >= 0) {
                                            //     result = uniqSortedInstockLocation[i].location_id
                                            //     log.debug(`not name result ${i}`, result)
                                            // } else if (uniqSortedInstockLocation[i].preferred_states.indexOf(destinationState) >= 0) {
                                            //     result = uniqSortedInstockLocation[i].location_id
                                            //     log.debug(`preferred name result ${i}`, result)
                                            // }
                                            const preferredStates = _.pull(uniqSortedInstockLocation[i].preferred_states, uniqSortedInstockLocation[i-1].name)
                                            log.debug('preferredStates', preferredStates);

                                            if (preferredStates.indexOf(destinationState) >= 0) {
                                                result = uniqSortedInstockLocation[i].location_id
                                                log.debug(`preferred name result ${i}`, result)
                                            }
                                        }
                                    }
                                }
                            }
                        } else {
                            log.error('bulk inventory req error', bulkInventoryReq)
                        }
                    } catch (error) {
                        log.error('get inventory location error', error)
                        // result = error.message
                    }
                }
            }
        }
        
        return result || existingLocation || (defaultLocation && defaultLocation.location_id) || '15';
    }

    /**
     * 
     * @param {string} etaStr eta dd/mm/yyyy
     */
    function getWebsiteETA(etaStr) {
        let eta = null;
        if (etaStr) {
            const etaDate = format.parse({
                value: etaStr,
                // return String
                // type: format.Type.DATETIMETZ,
                // timezone: format.Timezone.AUSTRALIA_SYDNEY,
                type: format.Type.DATE,
                // not apply to type DATE
                // timezone: format.Timezone.AUSTRALIA_SYDNEY
            });
            log.debug(typeof etaDate, etaDate);
            // const etaMoment = new moment(etaDate).tz('Australia/Melbourne');
            // const daysDiff = (etaDate - new Date()) / 1000 / 60 / 60 / 24;
            // log.debug('daysDiff', daysDiff);
            // if (daysDiff < 0) {
            //     eta = null;
            // } else if (daysDiff < 7) {
            //     eta = etaMoment.add(3, 'days');
            // } else if (daysDiff < 14) {
            //     eta = etaMoment.add(7, 'days');
            // } else if (daysDiff < 30) {
            //     eta = etaMoment.add(14, 'days');
            // } else {
            //     eta = etaMoment.add(21, 'days');
            // }
            eta = soPluginsV2x.customETA(etaDate)
        }

        return eta;
    }

    function customETA(datetimeObj) {
        const etaMoment = new moment(etaDate).tz('Australia/Melbourne');
        const daysDiff = (etaDate - new Date()) / 1000 / 60 / 60 / 24;
        log.debug('daysDiff', daysDiff);
        if (daysDiff < 0) {
            eta = null;
        } else if (daysDiff < 7) {
            eta = etaMoment.add(3, 'days');
        } else if (daysDiff < 14) {
            eta = etaMoment.add(7, 'days');
        } else if (daysDiff < 30) {
            eta = etaMoment.add(14, 'days');
        } else {
            eta = etaMoment.add(21, 'days');
        }
    }

    /**
     * 
     * @param {object} {type: salesorder(recordType), id: salesorder internalid}
     *  
     * @return shipitem default bluestar
     */
    function getShipitem({type, id, ignroeLoaction=true, source}) {
        const defaultShipitem = '53878'; // Outside Rec. Carrier Zone
        const defaultFreightitem = '704';
        let shipitem, freightitem, selected_dispatch, selected_shipmethod, checkLog;
        const rec = record.load({
            type,
            id,
            isDynamic: true
        });
        const items = [];
        // get comon location
        const itemCount = rec.getLineCount({sublistId: 'item'})
        for (let i = 0; i < itemCount; i++) {
            const itemType = rec.getSublistValue({
                sublistId: 'item',
                fieldId: 'itemtype',
                line: i
            });
            log.debug('itemType', itemType)
            const qtyFulfilled = parseFloat(rec.getSublistValue({
                sublistId: 'item',
                fieldId: 'quantityfulfilled',
                line: i
            })) || 0
            const qtyCommitted = parseFloat(rec.getSublistValue({
                sublistId: 'item',
                fieldId: 'quantitycommitted',
                line: i
            })) || 0
            const qty = rec.getSublistValue({
                sublistId: 'item',
                fieldId: 'quantity',
                line: i
            })
            //if(id == '28253649'){qtyFulfilled = 0} //for testing, change qtyFulfilled to var
            log.debug('qtyFulfilled rec '+id, qtyFulfilled)
            if (['InvtPart', 'Kit', 'Group'].indexOf(itemType) >= 0 && qty > qtyFulfilled) {
                items.push({
                    internalid: rec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'item',
                        line: i
                    }),
                    name: rec.getSublistText({
                        sublistId: 'item',
                        fieldId: 'item',
                        line: i
                    }),
                    quantity: qty - qtyFulfilled,
                    qtyCommitted
                })
            }
        }
        log.debug('items', items)

        const recordFields = search.lookupFields({
            type,
            id,
            columns: ['tranid', 'shippingaddress.state', 'shippingaddress.zip', 'shippingaddress.city', 'shipmethod', 'location', 'custbody_catch_order_id']
        });
        log.debug('recordFields', recordFields)
        // {"tranid":"SO440142","shippingaddress.state":"NSW","shippingaddress.zip":"2536","shippingaddress.city":"CATALINA","shipmethod":[{"value":"34247","text":"Allied Express"}],"location":[{"value":"15","text":"AU : Broadmeadows VIC"}]}

        var postcode = recordFields['shippingaddress.zip'], 
            suburb = recordFields['shippingaddress.city'], 
            location = ignroeLoaction ? '10,15,9' : recordFields.location[0].value;
 
        let sourceFrom = false;
        if(recordFields.custbody_catch_order_id){
            sourceFrom = 'CATCH'
        }
        if (postcode && suburb && location && items.length > 0) {
            const freight = getFreightOptions({
                item_id: _.compact(items.map(item => {
                    if (item.quantity > 0) {
                        return `${item.internalid}*${item.quantity}`
                    }
                })).join(','),
                postcode,
                suburb,
                location,
                source:  sourceFrom || `sales_order_plugin`
            });
            log.debug('freight', freight)
            shipitem = freight?.cheapest_opt?.shipitem
            freightitem = freight?.cheapest_opt?.freightitem;
            selected_shipmethod = freight?.cheapest_opt?.shipitem_name
            selected_dispatch = freight?.cheapest_opt?.location?.inventory_location_id;
            checkLog = {
                available_warehouse : _.map(freight?.available_dispatch_location, 'inventory_location_id'),
                selected_warehouse: selected_dispatch ||'',
                shipmethod : selected_shipmethod || ''
            }
        } else {
            log.error(`${type} ${id} ${recordFields.tranid} missing postcode/suburb/location/items`, {recordFields, items})
        }

        return {
            shipitem: shipitem || defaultShipitem,
            freightitem: freightitem || defaultFreightitem,
            checkLog: checkLog,
            shipstate: recordFields['shippingaddress.state']
        }
    }

    /**
     * 
     * @param {object} options {item_id, postcode, suburb, location}
     * @returns 
     */
    function getFreightOptions(options) {
        let results;
        const freightUrl = url.resolveScript({
            scriptId: 'customscript_get_freight_options_v3',
            deploymentId: 'customdeploy2',
            returnExternalUrl: true,
            params: {
                ...options
            }
        });
        log.debug('check freighurl', freightUrl);
        let respCode = 0, count = 4;
        do {
            try {
                const freightResp = https.get({url: freightUrl})
                respCode = freightResp.code
                if (freightResp.code == 200) {
                    const freightOptions = JSON.parse(freightResp.body)
                    log.debug('freightOptions', freightOptions)
                    results = _.pick(freightOptions, ['item', 'item_qty', 'regular_opts', 'cheapest_opt', 'available_dispatch_location']);
                    results.freightUrl = freightUrl
                }
            } catch (error) {
                log.error('getFreightOptions Error', error);
            }
            count--
        } while (respCode != 200 && count >= 0);

        return results;
    }

    function getLineItems(rec, extra) {
        const itemArray = [];

        if (rec && rec.id) {
            rec = record.load({
                type: rec.type,
                id: rec.id,
                isDynamic: true
            })
            const itemCount = rec.getLineCount('item');
            for (let i= 0; i < itemCount; i++) {
                const preset = {
                    sublistId: 'item',
                    line: i
                }
                const fullName = rec.getSublistText({
                    ...preset,
                    fieldId: 'item',
                });
                
                const extraObj = {}
                if (extra && util.isArray(extra)) {
                    for (const fieldId of extra) {
                        extraObj[fieldId] = rec.getSublistValue({
                            ...preset,
                            fieldId
                        })
                    }
                }

                itemArray.push({
                    internalid: rec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'item',
                        line: i
                    }),
                    fullName,
                    sku: fullName.slice(fullName.lastIndexOf(' : ')+3),
                    quantity: parseInt(rec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'quantity',
                        line: i
                    })) || 1,
                    fulfilledQuantity: parseInt(rec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'quantityfulfilled',
                        line: i
                    })) || 0,
                    type: rec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'itemtype',
                        line: i
                    }),
                    line: rec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'line',
                        line: i
                    }),
                    ...extraObj
                });
            }
        }

        log.debug('item array', itemArray);
        return itemArray
    }

    function getPhysicalItems(rec) {
        const itemArray = getLineItems(rec)
        const items = []
        
        itemArray.forEach(item => {
            if (['InvtPart','Kit','Group'].includes(item.type)) {
                items.push(item)
            }
        })

        return items
    }
    function getPhysicalItemsCommitted(rec) {
        const itemArray = getLineItems(rec)
        const items = []
        
        itemArray.forEach(item => {
            if (['InvtPart','Kit','Group'].includes(item.type)) {
                items.push(item)
            }
        })

        return items
    }

    function getItemData(items, columns) {
        const srch = search.create({
            type: search.Type.ITEM,
            filters: [
                ['internalid', 'anyof', items.map(item => item.internalid)]
            ],
            columns
        })
        const cols = srch.columns;
        srch.run().each(result => {
            log.debug('result', result)
            const found = items.find(item => item.internalid == result.id)
            if (found) {
                util.each(cols, (col) => {
                    found[col.name] = result.getValue(col)
                })
            }

            return true
        })

        return items
    }

    function checkDuplicate(id) {
        const duplicates = []
        const {memo, custbody1, tranid, entity} = search.lookupFields({
            type: 'salesorder',
            id,
            columns: ['custbody1','memo', 'tranid', 'entity']
        })
        log.debug('current record', {memo, custbody1, tranid, entity})

        const filters = [
            ['mainline', 'is', 'T'],
            'AND',
            ['internalid', 'noneof', id],
            'AND',
            ["status","noneof","SalesOrd:H"],
            // 'AND',
            // ["systemnotes.type","is","T"],
            // "AND",
            // ["systemnotes.context","noneof","UIF", "@NONE@"],
            'AND',
            ["datecreated","notbefore","ninetydaysago"]
        ]
        let keys = []
        // if (memo) {
        //     keys.push(['memo', 'is', memo])
        //     keys.push('OR')
        // }
        if (custbody1) {
            keys.push(['custbody1', 'is', custbody1])
            keys.push('OR')
        }
        if (keys.length > 1) {
            keys = keys.slice(0, keys.length-1)
        }
        log.debug('keys', keys)
        if (keys.length > 0) {
            filters.push('AND')
            filters.push(keys)
            log.debug('filters', filters)
    
            const orderSearch = search.create({
                type: 'salesorder',
                filters,
                columns: ['internalid','tranid', 'entity', 'status', 'total', 'memo', 'custbody1']
            })
            // .run().each(result => {
            //     log.debug('result', result)
            //     if (result.getValue('tranid') != tranid) {
            //         duplicates.push({
            //             internalid: result.getValue('internalid'),
            //             tranid: result.getValue('tranid'),
            //             entity: result.getText('entity'),
            //             status: result.getText('status'),
            //             amount: result.getValue('total'),
            //             memo: result.getValue('memo'),
            //             custbody1: result.getValue('custbody1')
            //         })
            //     }

            //     return true;
            // });
            const orderPagedData = orderSearch.runPaged()
            orderPagedData.pageRanges.forEach((pageRange) => {
                const orderPage = orderPagedData.fetch({index: pageRange.index})
                orderPage.data.forEach(result => {
                        // log.debug('result', result)
                    duplicates.push({
                        internalid: result.getValue('internalid'),
                        tranid: result.getValue('tranid'),
                        entity: result.getText('entity'),
                        status: result.getText('status'),
                        amount: result.getValue('total'),
                        memo: result.getValue('memo'),
                        custbody1: result.getValue('custbody1')
                    })
                })
            })
            log.debug('duplicates', duplicates)
            // if (duplicates.length > 0) {
            //     const body = `
            //     there is duplicated order ${entity[0].text} ${tranid} with same memo / reference ${memo || custbody1}.
            //     Please Note that "MEMO" field is not searchable globally

            //     ${duplicates.map(d =>
            //         `${d.entity}    |    ${d.tranid}    |    ${d.amount}    |    ${d.status}
            //         `
            //     ).join('')}
            //     `
            //     // email.send({
            //     //     author: 16,
            //     //     recipients: ['reece@gflgroup.com.au'],
            //     //     subject: `Duplicated Sales Order ${tranid} with ${memo || custbody1}`,
            //     //     body
            //     // })
            //     results = body
            // }
        }

        return {
            self: {memo, custbody1, tranid, entity},
            duplicates
        }
    }

    return {
        locationMapper, getWebsiteETA, getShipitem, getFreightOptions, getLineItems, getPhysicalItems, getItemData, checkDuplicate, getPhysicalItemsCommitted
    };

});
