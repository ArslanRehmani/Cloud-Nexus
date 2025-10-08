/**
* @NApiVersion 2.1
* @NScriptType UserEventScript
* @NModuleScope SameAccount
* @NAmdConfig /SuiteScripts/G 2.0/gconfig.json
* 
* 
* set FS toal cost, total packages, ifs instructions
*/
define(['N/record', 'N/search', '/SuiteScripts/G 2.0/lodash.4.17.15', './sales_order_plugins'],

function (record, search, _, plugins) {

    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {string} scriptContext.type - Trigger type
     * @param {Form} scriptContext.form - Current form
     * @Since 2015.2
     */
    function beforeLoad(scriptContext) {
        try {
            scriptContext.form.clientScriptModulePath = './sales_order_custom_client.js';
            if (scriptContext.type == 'view') {
                // not available when create, reload
                const shipmethod = scriptContext.newRecord.getText('shipmethod')
                log.debug('shipmethod', shipmethod)
                const status = scriptContext.newRecord.getValue('status')
                log.debug('status', status)

                if (shipmethod.toUpperCase().startsWith('SAME DAY')) {
                    scriptContext.form.addButton({
                        id: 'custpage_print_express_label',
                        label: 'Express Label',
                        functionName: 'expressLabel'
                    })
                }
            }
            if (['edit', 'view'].includes(scriptContext.type)) {
                scriptContext.form.clientScriptModulePath = './sales_order_ui_client.js';
            }
        } catch (error) {
            log.error('beforeload error', error)
        }
    }

    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type
     * @Since 2015.2
     */
    function beforeSubmit(scriptContext) {

    }

    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type
     * @Since 2015.2
     */
    function afterSubmit(scriptContext) {
        log.debug({
            title: 'new record',
            details: JSON.stringify(scriptContext.newRecord)
        });

        // oldRecord is null when trigger type is create
        // log.debug({
        // 	title: 'old record Doc',
        // 	details: JSON.stringify(scriptContext.oldRecord)
        // });

        log.debug({
            title: 'script context type',
            details: scriptContext.type
        })

        if (scriptContext.type == 'create') {
            let totalPackage = 0;
            let FSCostTotal = 0;
            let itemTypeList = ['InvtPart', 'Group', 'Kit'];
            let totalItemQty = 0;

            let itemInternalIdArray = new Array();

            let itemShippingLabels = [];

            let newRecord = scriptContext.newRecord;
            let recordId = newRecord.getValue({
                fieldId: 'internalid'
            }); // null, doesn't exist
            let recordType = newRecord.getValue({
                fieldId: 'recordtype'
            }); // null, doesn't exist
            log.audit('record id', recordId)
            let total = newRecord.getValue({
                fieldId: 'total'
            });

            let webstore = newRecord.getValue('webstore'); //always return undefined
            let website = newRecord.getValue('website');
            log.debug('website', website);

            let location = newRecord.getValue('location');
            log.debug('location', location);

            let shipmethod = newRecord.getValue('shipmethod');
            log.debug('shipmethod', shipmethod);

            let specialInstruction = newRecord.getValue('custbody_dkd_special_instructions');
            log.debug('special instruction', specialInstruction);

            //Shopify, eBay, Amazon
            let farappStoreFront = newRecord.getValue({
                fieldId: 'custbody_farapp_storefront'
            });

            log.debug('record total', total);
            log.debug('record type and id', newRecord.id + ' - ' + newRecord.type);

            let lineItemCount = newRecord.getLineCount({
                sublistId: 'item'
            });

            let itemSublist = newRecord.getSublist({
                sublistId: 'item'
            });

            log.debug({
                title: 'item sublit',
                details: JSON.stringify(itemSublist)
            });

            // get line item details
            for (let i = 0; i < lineItemCount; i++) {
                let itemType = newRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'itemtype',
                    line: i
                });

                let itemId = newRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'item',
                    line: i
                });

                // Error SSS_INVALID_API_USAGE
                // Invalid API usage. You must use getSublistValue to return the value set with setSublistValue.
                // let itemName = newRecord.getSublistText({
                //     sublistId: 'item'
                //     , fieldId: 'item'
                //     , line: i
                // });

                let itemDesc = newRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'description',
                    line: i
                });

                let itemRate = newRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'rate',
                    line: i
                });

                let itemAmount = newRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'amount',
                    line: i
                });

                let itemQty = newRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'quantity',
                    line: i
                });

                let itemCommittedQty = newRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'quantitycommitted',
                    line: i
                });

                let itemFulfilledQty = newRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'quantityfulfilled',
                    line: i
                });

                let itemBilledQty = newRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'quantitybilled',
                    line: i
                });

                let itemBackorderedQty = newRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'quantitybackordered',
                    line: i
                });

                let itemPriceLevel = newRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'price',
                    line: i
                });

                let itemFSCost = newRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_fs_cost',
                    line: i
                });

                log.debug('item quantity', ' item qty:' + itemQty + ' - item backorder qty:' + itemBackorderedQty + '- item commit qty:' +
                    itemCommittedQty + '- item fulfilled qty:' + itemFulfilledQty + '- item amount:' + itemAmount +
                    ' - item pricelevel:' + itemPriceLevel + '- item id:' + itemId + '- item desc:' + itemDesc + '- item billed qty:' + itemBilledQty +
                    ' - item fs cost:' + itemFSCost);

                log.debug('item rate * itemQty, amount', itemRate + ' * ' + itemQty + ' == ' + itemAmount + ' ??');
                log.debug('item type', itemType);

                totalItemQty += parseFloat(itemQty) || 0;

                // get item package
                if (itemTypeList.indexOf(itemType) >= 0) {
                    try {
                        let package = search.lookupFields({
                            type: search.Type.ITEM,
                            id: itemId,
                            columns: [
                                'custitem_avt_total_packages',
                                'itemid',
                                'custitem_shipping_label_description'
                            ]
                        });

                        log.debug('package', JSON.stringify(package));

                        if (itemType == 'Kit' || itemType == 'InvtPart') {
                            itemShippingLabels.push(package.custitem_shipping_label_description);
                        }

                        let packageNum = isNaN(parseInt(package.custitem_avt_total_packages)) ? 0 : parseInt(package.custitem_avt_total_packages);
                        totalPackage += packageNum * parseInt(itemQty);

                        itemInternalIdArray.push({
                            internalid: itemId,
                            qty: itemQty
                        })

                    } catch (err) {
                        log.debug('package search error', JSON.stringify(err));
                    }
                }

                //get ebay fs cost
                if (farappStoreFront == 'eBay') {
                    let fsCostEBay = search.lookupFields({
                        type: search.Type.ITEM,
                        id: itemId,
                        columns: 'custitem_fs_cost_ebay'
                    });

                    log.debug('fs cost ebay', JSON.stringify(fsCostEBay));
                    fsCostEBay = isNaN(parseFloat(fsCostEBay.custitem_fs_cost_ebay)) ? 0 : parseFloat(fsCostEBay.custitem_fs_cost_ebay);
                    FSCostTotal += fsCostEBay * parseInt(itemQty);
                }

                //get amazon fs cost
                if (farappStoreFront == 'Amazon') {
                    let fsCostAM = search.lookupFields({
                        type: search.Type.ITEM,
                        id: itemId,
                        columns: 'custitem_fs_cost_amazon'
                    });

                    log.debug('fs cost ebay', JSON.stringify(fsCostAM));
                    fsCostAM = isNaN(parseFloat(fsCostAM.custitem_fs_cost_amazon)) ? 0 : parseFloat(fsCostAM.custitem_fs_cost_amazon);
                    FSCostTotal += fsCostAM * parseInt(itemQty);
                }
            }

            let appliedRecord = record.load({
                type: newRecord.type,
                id: newRecord.id,
                isDynamic: true
            });

            let recordFields = search.lookupFields({
                type: newRecord.type,
                id: newRecord.id,
                columns: ['shippingaddress.zip', 'shippingaddress.phone', 'shipmethod']
            });

            log.debug('record fields', JSON.stringify(recordFields));

            // let staticRecord = record.load({
            //     type: newRecord.type
            //     , id: newRecord.id
            //     , isDynamic: false
            // })

            // let firstName = appliedRecord.getValue('firstname'); // undefined
            // firstName = appliedRecord.getValue('entity.firstname');
            // let lastName = appliedRecord.getValue('lastname'); // undefined
            // lastName = appliedRecord.getValue('entity.lastname');
            // let billAddressee = staticRecord.getValue('billaddressee'); // undefined
            // let shipAddressee = staticRecord.getValue('shipaddressee'); // undefined
            // billAddressee = appliedRecord.getValue('billaddressee'); // undefined
            // shipAddressee = appliedRecord.getValue('shipaddressee'); // undefined
            // billAddressee = appliedRecord.getValue('billingaddress.addressee'); // undefined
            // shipAddressee = appliedRecord.getValue('shippingaddress.addressee'); //undefined

            // log.debug('new record tranid', tranId + ' - ' + email + ' - ' + firstName + ' - ' + lastName + ' - ' + billAddressee + ' - ' + shipAddressee + ' - ' + JSON.stringify(externalId));
            // log.debug('new record addressee', JSON.stringify(newRecord.getValue('billaddressee'))); //empty

            // use search

            let tranId = appliedRecord.getValue('tranid');
            let emailAddress = appliedRecord.getValue('email');
            let externalId = appliedRecord.getValue('externalid');
            let entityArray = appliedRecord.getText('entity').split(' : ');
            let instruction2 = appliedRecord.getValue('custbody_avt_ifs_special_instructions2');
            let instruction3 = appliedRecord.getValue('custbody_avt_ifs_special_instructions3');

            // let customerId = appliedRecord.getValue('entity');
            // let customerDetails = search.lookupFields({
            //     type: 'customer',
            //     id: customerId,
            //     columns: ['firstname', 'lastname']
            // })

            log.debug('new record tranid', appliedRecord.getValue('tranid'));
            log.debug('new record entity', appliedRecord.getText('entity'));

            let existingTotalPackage = appliedRecord.getValue('custbody_total_package');

            // if (!existingTotalPackage) {
            //     // set total package
            //     appliedRecord.setValue({
            //         fieldId: 'custbody_total_package',
            //         value: totalPackage || ''
            //     });
            // }

            // set fs cost
            appliedRecord.setValue({
                fieldId: 'custbody_fs_cost_total',
                value: FSCostTotal || ''
            });

            try {
                let lineItemNumber = appliedRecord.getLineCount({sublistId: 'item'});
                // get line item details
                for (let i = 0; i < lineItemNumber; i++) {
                    let itemId = newRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'item',
                        line: i
                    });
                    let rateValue = appliedRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'rate',
                        line: i
                    });
                    let rateGross = appliedRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'grossamt',
                        line: i
                    });
                   let itemQty = appliedRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'quantity',
                        line: i
                    });
                    log.debug('rate & gross', rateValue+' == '+rateGross);
                    if (rateValue && rateValue !== rateGross && itemQty) {
                        let isTaxEnabled = search.lookupFields({
                            type: search.Type.ITEM,
                            id: itemId,
                            columns: 'custitem_prices_include_tax'
                        });
                        log.debug('Is tax enabled', JSON.stringify(isTaxEnabled));
                        if (isTaxEnabled.custitem_prices_include_tax) {
                            appliedRecord.selectLine({
                              sublistId : 'item',
                              line : i
                            })
                            appliedRecord.setCurrentSublistValue({
                                sublistId : 'item',
                                fieldId : 'grossamt',
                                value : rateValue * itemQty,
                                //line : i,
                               // ignoreFieldChange : true
                            });
                            appliedRecord.commitLine({
                              sublistId : 'item'
                            })
                        }
                    }
                }
                log.debug('itemShippingLabels', itemShippingLabels);
                if (_.isEmpty(instruction2)) {
                    appliedRecord.setValue({
                        fieldId: 'custbody_avt_ifs_special_instructions2',
                        value: (tranId + ' ' + _.join(itemShippingLabels, '|')).slice(0, 30)
                    })
                }
                if (_.isEmpty(instruction3) && recordFields && !_.isEmpty(recordFields['shippingaddress.phone'])) {
                    appliedRecord.setValue({
                        fieldId: 'custbody_avt_ifs_special_instructions3',
                        value: recordFields['shippingaddress.phone']
                    })
                }

                log.debug('totalItemQty', totalItemQty)
                if (totalItemQty) {
                    appliedRecord.setValue({
                        fieldId: 'custbody_so_qty_unbilled',
                        value: totalItemQty
                    })
                }

                let recordId = appliedRecord.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                });
            } catch (error) {
                log.error('error when save record', error)
            }

        } else if (scriptContext.type == 'edit') {
            let allocOld = scriptContext.oldRecord.getValue('custbody_auto_allocate_location');
            let allocNew = scriptContext.newRecord.getValue('custbody_auto_allocate_location');
            let trandateSO = new Date(scriptContext.newRecord.getValue('trandate'));
            // check if SO available on Saved search (On Hold, further confirmation needed)
            // var allocateLocSavedSearch = search.load({
            //     id: '1937' //
            // })
            // let currentSoId = scriptContext.oldRecord.id;
            // const soSavedSearch = []
            // allocateLocSavedSearch.run().each(function(result){
            //     //log.audit('result', result);
            //     soSavedSearch.push({'id': result.id});
            //     return true;
            // })
            // var currentSoInSavedSearch = _.findIndex(soSavedSearch, function(so){
            //     return so.id == currentSoId;
            // });
            // log.debug('currentSoInSavedSearch', currentSoInSavedSearch)
            try {
                var currentRecord = record.load({
                        type: scriptContext.newRecord.type,
                        id: scriptContext.newRecord.id
                    });
                if (!allocOld && allocNew) {
                    let locationNew = plugins.locationMapper(scriptContext)
                    currentRecord.setValue({
                        fieldId: 'location',
                        value: locationNew
                    })
                }
                try {
                    let recordFields = search.lookupFields({
                        type: scriptContext.newRecord.type,
                        id: scriptContext.newRecord.id,
                        columns: ['shippingaddress.zip', 'shippingaddress.phone', 'shipmethod']
                    });
                    let instruction3 = currentRecord.getValue('custbody_avt_ifs_special_instructions3');
                    if (!instruction3 && recordFields && !_.isEmpty(recordFields['shippingaddress.phone'])) {
                        currentRecord.setValue({
                            fieldId: 'custbody_avt_ifs_special_instructions3',
                            value: recordFields['shippingaddress.phone']
                        })
                    }
                }
                catch (e) {
                    log.error('error in setting shipping phone', e.message);
                }

                let dateBefore = new Date('2024-01-03');
                if (trandateSO > dateBefore) {
                    try{
                        let lineItemNumber = currentRecord.getLineCount({sublistId: 'item'});
                        // get line item details
                        for (let i = 0; i < lineItemNumber; i++) {
                            let itemId = currentRecord.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'item',
                                line: i
                            });
                            let rateValue = currentRecord.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'rate',
                                line: i
                            });
                            let rateGross = currentRecord.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'grossamt',
                                line: i
                            });
                            let itemQty = currentRecord.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'quantity',
                                line: i
                            });
                            log.audit('rate & gross', rateValue+' == '+rateGross);
                            log.audit('Item Quantity', itemQty);
                            if (rateValue && rateValue !== rateGross && itemQty) {
                                let isTaxEnabled = search.lookupFields({
                                    type: search.Type.ITEM,
                                    id: itemId,
                                    columns: 'custitem_prices_include_tax'
                                });
                                log.audit('Is tax enabled', JSON.stringify(isTaxEnabled));
                                if (isTaxEnabled.custitem_prices_include_tax) {
                                    currentRecord.setSublistValue({
                                        sublistId : 'item',
                                        fieldId : 'grossamt',
                                        value : rateValue * itemQty,
                                        line : i,
                                    });
                      
                                }
                            }
                        }
                    } catch(e){
                        log.error('Error in Setting Gross Amnt', e.message)
                    }
                }

                currentRecord.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                })
            } catch (error) {
                log.error('get locatiom mapper error', error)
            }
        }

        if (['edit', 'create', 'copy'].includes(scriptContext.type)) {
            try {
            const items = plugins.getPhysicalItemsCommitted(scriptContext.newRecord)
                log.debug('items', items)
                const itemData = plugins.getItemData(items, ['custitem_cubic_charge_weight', 'custitem_avt_total_packages'])
                log.debug('itemData', itemData)
                let totalCubicWeight = itemData.reduce((pv, cv, ci, arr) => {
                    log.audit('COMPUTATION', pv + '+' + cv.custitem_cubic_charge_weight + '*' + cv.quantity)
                    return pv + cv.custitem_cubic_charge_weight * cv.quantity
                }, 0)
                let totalCommittedPackages = itemData.reduce((pv,cv) =>{
                    return pv + cv.custitem_avt_total_packages * cv.quantity;
                },0)

                log.debug('totalCubicWeight', totalCubicWeight)
                log.debug('totalCommittedPackages', totalCommittedPackages)

                record.load({
                    type: scriptContext.newRecord.type,
                    id: scriptContext.newRecord.id
                }).setValue({
                    fieldId: 'custbody_total_charge_weight',
                    value: totalCubicWeight
                }).setValue({
                    fieldId: 'custbody_total_package',
                    value: totalCommittedPackages
                }).save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                })
                // record.submitFields({
                //     type: scriptContext.newRecord.type,
                //     id: scriptContext.newRecord.id,
                //     values: {
                //         custbody_total_charge_weight: totalCubicWeight
                //     },
                //     options: {
                //         enableSourcing: false,
                //         ignoreMandatoryFields : true
                //     }
                // })
            } catch (error) {
                log.error('error when set total cubic weight', error)
            }
        }
    }

    return {
        beforeLoad,
        beforeSubmit,
        afterSubmit: afterSubmit
    };

});