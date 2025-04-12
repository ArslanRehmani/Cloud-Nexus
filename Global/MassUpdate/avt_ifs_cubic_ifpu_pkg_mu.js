/**
 * @NApiVersion 2.x
 * @NScriptType MassUpdateScript
 * @NModuleScope SameAccount
 */
define(
    [
        'N/log',
        'N/record',
        'N/search',
        'N/runtime',
        '../../common/avt_ifs_packages'
    ],
    /**
     * @param {log} log
     * @param {record} record
     * @param {search} search
     * @param {runtime} runtime
     * @param {AVT_IFS_Packages} AVT_IFS_Packages
     */
    function(log, record, search, runtime, AVT_IFS_Packages)
    {
        /**
         * Definition of Mass Update trigger point.
         *
         * @param {Object} params
         * @param {string} params.type - Record type of the record being processed by the mass update
         * @param {number} params.id - ID of the record being processed by the mass update
         *
         * @since 2016.1
         */
        function createRequiredIFSPackages(params)
        {
            function roundToDecimalPlaces (value, decimals)
            {
                return Math.round((value * Math.pow(10, decimals))) / Math.pow(10, decimals);
            }

            /**
             * Searches for IFS Item Package record (if any) that are associated with an item. Returns either an array of
             * objects with the IFS Item Package record information or false if an error occurs
             *
             * @param {number} itemId
             * @param {number} itemQuantity
             * @return {object[]|boolean}
             */
            function findItemPackageDetails (itemId, itemQuantity)
            {
                var itemPackages = false;

                if (!itemId)
                {
                    return false;
                }

                log.debug({ title: 'findItemPackageDetails', details: 'itemQuantity: ' + itemQuantity });

                var _quantity;

                if (!itemQuantity)
                {
                    return false;
                }
                else
                {
                    _quantity = Number(itemQuantity);
                }

                log.debug({ title: 'findItemPackageDetails', details: '_quantity: ' + _quantity });

                try
                {
                    var s =
                        search.create(
                            {
                                type: 'customrecord_avt_ifs_item_package',
                                filters:
                                    [
                                        search.createFilter(
                                            {
                                                name: 'custrecord_avt_ifs_item_package_item',
                                                operator: search.Operator.ANYOF,
                                                values: itemId
                                            }
                                        )
                                /* Commented By Stuti  CR000575 Label Description Automation Script

                                 ,
                                        search.createFilter(
                                            {
                                                name: 'custrecord_avt_ifs_item_package_qty',
                                                operator: search.Operator.GREATERTHANOREQUALTO,
                                                values: _quantity
                                            }
                                        )*/
                                    ],
                                columns:
                                    [
                                        search.createColumn(
                                            {
                                                name: 'custrecord_avt_item_package_type_length',
                                                join: 'custrecord_avt_ifs_item_package_ft'
                                            }
                                        ),
                                        search.createColumn(
                                            {
                                                name: 'custrecord_avt_item_package_type_width',
                                                join: 'custrecord_avt_ifs_item_package_ft'
                                            }
                                        ),
                                        search.createColumn(
                                            {
                                                name: 'custrecord_avt_item_package_type_weight',
                                                join: 'custrecord_avt_ifs_item_package_ft'
                                            }
                                        ),
                                        search.createColumn(
                                            {
                                                name: 'custrecord_avt_item_package_type_heigth',
                                                join: 'custrecord_avt_ifs_item_package_ft'
                                            }
                                        ),
                                        search.createColumn(
                                            {
                                                name: 'custrecord_avt_item_package_type_label',
                                                join: 'custrecord_avt_ifs_item_package_ft'
                                            }
                                        ),
                                        search.createColumn(
                                            {
                                                name: 'custrecord_avt_item_package_desc',
                                                join: 'custrecord_avt_ifs_item_package_ft'
                                            }
                                        ),
                                        search.createColumn(
                                            {
                                                name: 'custrecord_avt_item_package_type_is_fixe',
                                                join: 'custrecord_avt_ifs_item_package_ft'
                                            }
                                        ),
                                        search.createColumn(
                                            {
                                                name: 'custrecord_avt_ifs_item_package_qty',
                                                sort: search.Sort.ASC
                                            }
                                        ),
                                        //Added By Stuti CR000475
                                        search.createColumn(
                                            {
                                                name: 'custrecord_avt_ifs_item_package_use_cust',
                                            }
                                        ),
                                        search.createColumn(
                                            {
                                                name: 'custrecord_avt_ifs_item_package_inv_item',
                                            }
                                        )
                                    ]
                            }
                        );

                    itemPackages = [  ];

                    var results = s.run().getRange({ start: 0, end: 1000 });

                    log.debug({ title: 'findItemPackageDetails', details: 'results: ' + JSON.stringify(results) });

                    if (results.length) {
                        //Added By Stuti CR000475
                        var useCustomItemPkg = results[0].getValue({name: 'custrecord_avt_ifs_item_package_use_cust'});
                        log.debug({ title: 'findItemPackageDetails', details: 'useCustomItemPkg: ' + useCustomItemPkg });

                        var currentBreakQty = Number(results[0].getValue({name: 'custrecord_avt_ifs_item_package_qty'}));
                        var result = results[0];
                        var nextBreakQty;

                        if (useCustomItemPkg == true) {
                            pckg = new AVT_IFS_Packages();
                            pckg.item = itemId;
                            pckg.type.length =
                                result.getValue(
                                    {
                                        name: 'custrecord_avt_item_package_type_length',
                                        join: 'custrecord_avt_ifs_item_package_ft'
                                    }
                                );

                            pckg.type.width =
                                result.getValue(
                                    {
                                        name: 'custrecord_avt_item_package_type_width',
                                        join: 'custrecord_avt_ifs_item_package_ft'
                                    }
                                );

                            pckg.type.weight =
                                result.getValue(
                                    {
                                        name: 'custrecord_avt_item_package_type_weight',
                                        join: 'custrecord_avt_ifs_item_package_ft'
                                    }
                                );

                            pckg.type.height =
                                result.getValue(
                                    {
                                        name: 'custrecord_avt_item_package_type_heigth',
                                        join: 'custrecord_avt_ifs_item_package_ft'
                                    }
                                );

                            pckg.type.label =
                                result.getValue(
                                    {
                                        name: 'custrecord_avt_item_package_type_label',
                                        join: 'custrecord_avt_ifs_item_package_ft'
                                    }
                                );

                            pckg.type.description =
                                result.getValue(
                                    {
                                        name: 'custrecord_avt_item_package_desc',
                                        join: 'custrecord_avt_ifs_item_package_ft'
                                    }
                                );

                            pckg.type.isFixed =
                                result.getValue(
                                    {
                                        name: 'custrecord_avt_item_package_type_is_fixe',
                                        join: 'custrecord_avt_ifs_item_package_ft'
                                    }
                                );

                            pckg.quantityBreak = result.getValue({name: 'custrecord_avt_ifs_item_package_qty'});

                            itemPackages.push(pckg);

                             for (var ip = 1; ip < results.length; ip++) {

                                 result = results[ip];
                                 useCustomItemPkg = result.getValue({name: 'custrecord_avt_ifs_item_package_use_cust'});
                                 log.debug({ title: 'findItemPackageDetails', details: 'useCustomItemPkg in loop: ' + useCustomItemPkg });

                                 invItemId = result.getValue({name: 'custrecord_avt_ifs_item_package_inv_item'});
                                 log.debug({ title: 'findItemPackageDetails', details: 'invItemId in loop: ' + invItemId });

                                 currentBreakQty = Number(result.getValue({name: 'custrecord_avt_ifs_item_package_qty'}));
                                 //Commented By Stuti CR000575 Label Description Automation Script

                                /* nextBreakQty = Number(result.getValue({name: 'custrecord_avt_ifs_item_package_qty'}));

                                 if (nextBreakQty > currentBreakQty) {
                                     break;
                                 }*/
                                 if(useCustomItemPkg== false){
                                     log.debug({ title: LOG_NAME_ID, details: 'Looking in cache for item details' });

                                     if (!itemsCache[ invItemId ] && invItemId != null && invItemId !='')
                                     {
                                         log.debug({ title: LOG_NAME_ID, details: 'Item details not found the in cache. Loading item record' });

                                         try
                                         {
                                             var item = record.load({ type: record.Type.INVENTORY_ITEM, id: invItemId });

                                             log.debug({ title: LOG_NAME_ID, details: 'Item record loaded' });

                                             itemsCache[ itemId ] =
                                                 {
                                                     'name': item.getText({ fieldId: 'itemid' }),
                                                     //Added By Stuti CR000475
                                                     'description': item.getValue({ fieldId: 'custitem_shipping_label_description' }),
                                                     'packages': Number(currentBreakQty || '0'),
                                                     'volume': Number(item.getValue({ fieldId: 'custitem_avt_ifs_cubic_volume' }) || '0.0')* Number(currentBreakQty || '0'),
                                                     //Commented By Stuti CR000584
                                                     //'weight': Number(item.getValue({ fieldId: 'weight' }) || '0.0') * Number(currentBreakQty || '0'),
                                                     //Added By Stuti CR000584
                                                     'weight': Number(item.getValue({ fieldId: 'weight' }) || '0.0'),
                                                     'length': Number(item.getValue({ fieldId: 'custitem_avt_total_length' }) || '0'),
                                                     'width': Number(item.getValue({ fieldId: 'custitem_avt_total_width' }) || '0'),
                                                     'height': Number(item.getValue({ fieldId: 'custitem_avt_total_height' }) || '0'),
                                                     //Commented By Stuti CR000575 Label Description Automation Script
                                                     //'packages': Number(item.getValue({ fieldId: 'custitem_avt_total_packages' }) || '0'),
                                                     //'length': Number(item.getValue({ fieldId: 'custitem_avt_total_length' }) || '0'),
                                                     //'width': Number(item.getValue({ fieldId: 'custitem_avt_total_width' }) || '0'),
                                                     //'height': Number(item.getValue({ fieldId: 'custitem_avt_total_height' }) || '0'),
                                                     //'volume': Number(item.getValue({ fieldId: 'custitem_avt_ifs_cubic_volume' }) || '0.0'),
                                                    // 'weight': Number(item.getValue({ fieldId: 'weight' }) || '0.0'),
                                                     'fixed': (item.getValue({ fieldId: 'custitem_avt_is_fixed_weight' }) || false)
                                                 };

                                             log.debug({ title: LOG_NAME_ID, details: 'itemsCache = ' +  JSON.stringify(itemsCache) });

                                             log.debug({ title: LOG_NAME_ID, details: 'Cache updated' });
                                         }
                                         catch (e)
                                         {
                                             log.error({ title: LOG_NAME_ID, details: 'Failed to load item record: ' + itemName + ' - ' + e });

                                             log.audit(
                                                 {
                                                     title: LOG_NAME_ID,
                                                     details:
                                                     'Unable to find required packages information - Skipping item: ' + itemName + ' line: ' + (l + 1)
                                                 }
                                             );

                                         }
                                         log.debug({ title: LOG_NAME_ID, details: 'itemsCache = ' +  JSON.stringify(itemsCache) });
                                         log.debug({ title: 'After itemsCache2', details: '_quantity: ' + _quantity });

                                         // itemPackageDetails = [  ];

                                         var pckg = new AVT_IFS_Packages();

                                         pckg.item = itemId;
                                         pckg.totalPackages = ( Number(_quantity || '0') * itemsCache[ itemId ][ 'packages' ]);
                                         pckg.quantityBreak = 1; // N.B. not used and is set to 1
                                         //Commented By Stuti CR000575 Label Description Automation Script
                                        // pckg.totalPackages = (ifLineQuantity * itemsCache[ itemId ][ 'packages' ]);
                                         //pckg.type.length = itemsCache[ itemId ][ 'length' ];
                                        // pckg.type.width = itemsCache[ itemId ][ 'width' ];
                                        // pckg.type.weight = itemsCache[ itemId ][ 'weight' ];
                                        // pckg.type.height = itemsCache[ itemId ][ 'height' ];
                                        //Commented By Stuti CR000584
                                        // pckg.type.volume = (Number(_quantity || '0')*itemsCache[ itemId ][ 'volume' ]);
                                        // pckg.type.weight = (Number(_quantity || '0')*itemsCache[ itemId ][ 'weight' ]);

                                        //Added By Stuti CR000584
                                         pckg.type.weight = itemsCache[ itemId ][ 'weight' ];
                                         pckg.type.width = itemsCache[ itemId ][ 'width' ];
                                         pckg.type.length = itemsCache[ itemId ][ 'length' ];
                                         pckg.type.height = itemsCache[ itemId ][ 'height' ];
                                         pckg.type.label = itemsCache[ itemId ][ 'packages' ];
                                         pckg.type.description = itemsCache[ itemId ][ 'description' ];
                                         pckg.type.isFixed = itemsCache[ itemId ][ 'fixed' ];

                                         itemPackages.push(pckg);
                                     }



                                 }else{
                                     pckg = new AVT_IFS_Packages();
                                     pckg.item = itemId;
                                     pckg.type.length =
                                         result.getValue(
                                             {
                                                 name: 'custrecord_avt_item_package_type_length',
                                                 join: 'custrecord_avt_ifs_item_package_ft'
                                             }
                                         );

                                     pckg.type.width =
                                         result.getValue(
                                             {
                                                 name: 'custrecord_avt_item_package_type_width',
                                                 join: 'custrecord_avt_ifs_item_package_ft'
                                             }
                                         );

                                     pckg.type.weight =
                                         result.getValue(
                                             {
                                                 name: 'custrecord_avt_item_package_type_weight',
                                                 join: 'custrecord_avt_ifs_item_package_ft'
                                             }
                                         );

                                     pckg.type.height =
                                         result.getValue(
                                             {
                                                 name: 'custrecord_avt_item_package_type_heigth',
                                                 join: 'custrecord_avt_ifs_item_package_ft'
                                             }
                                         );

                                     pckg.type.label =
                                         result.getValue(
                                             {
                                                 name: 'custrecord_avt_item_package_type_label',
                                                 join: 'custrecord_avt_ifs_item_package_ft'
                                             }
                                         );

                                     pckg.type.description =
                                         result.getValue(
                                             {
                                                 name: 'custrecord_avt_item_package_desc',
                                                 join: 'custrecord_avt_ifs_item_package_ft'
                                             }
                                         );

                                     pckg.type.isFixed =
                                         result.getValue(
                                             {
                                                 name: 'custrecord_avt_item_package_type_is_fixe',
                                                 join: 'custrecord_avt_ifs_item_package_ft'
                                             }
                                         );

                                     pckg.quantityBreak = result.getValue({name: 'custrecord_avt_ifs_item_package_qty'});

                                     itemPackages.push(pckg);
                                 }
                             }
                        }else{

                            var invItemId = results[0].getValue({name: 'custrecord_avt_ifs_item_package_inv_item'});

                            log.debug({ title: 'Before itemsCache', details: 'currentBreakQty: ' + currentBreakQty });

                            log.debug({ title: LOG_NAME_ID, details: 'Looking in cache for item details' });

                            if (!itemsCache[ invItemId ])
                            {
                                log.debug({ title: LOG_NAME_ID, details: 'Item details not found the in cache. Loading item record' });

                                try
                                {
                                    var item = record.load({ type: record.Type.INVENTORY_ITEM, id: invItemId });

                                    log.debug({ title: LOG_NAME_ID, details: 'Item record loaded' });

                                    itemsCache[ itemId ] =
                                        {
                                            'name': item.getText({ fieldId: 'itemid' }),
                                            //Added By Stuti CR000475
                                            'description': item.getValue({ fieldId: 'custitem_shipping_label_description' }),
                                            'packages': Number(currentBreakQty || '0'),
                                            'volume': Number(item.getValue({ fieldId: 'custitem_avt_ifs_cubic_volume' }) || '0.0')* Number(currentBreakQty || '0'),
                                            //Commented By Stuti CR000584
                                            //'weight': Number(item.getValue({ fieldId: 'weight' }) || '0.0') * Number(currentBreakQty || '0'),
                                            //Added By Stuti CR000584
                                            'weight': Number(item.getValue({ fieldId: 'weight' }) || '0.0'),
                                            'length': Number(item.getValue({ fieldId: 'custitem_avt_total_length' }) || '0'),
                                            'width': Number(item.getValue({ fieldId: 'custitem_avt_total_width' }) || '0'),
                                            'height': Number(item.getValue({ fieldId: 'custitem_avt_total_height' }) || '0'),

                                            'description': item.getValue({ fieldId: 'custitem_shipping_label_description' }),
                                            'packages': Number(currentBreakQty || '0'),
                                            'volume': Number(item.getValue({ fieldId: 'custitem_avt_ifs_cubic_volume' }) || '0.0')* Number(currentBreakQty || '0'),
                                            'weight': Number(item.getValue({ fieldId: 'weight' }) || '0.0') * Number(currentBreakQty || '0'),

                                            //Commented By Stuti CR000575 Label Description Automation Script
                                            //'packages': Number(item.getValue({ fieldId: 'custitem_avt_total_packages' }) || '0'),
                                            /*'length': Number(item.getValue({ fieldId: 'custitem_avt_total_length' }) || '0'),
                                            'width': Number(item.getValue({ fieldId: 'custitem_avt_total_width' }) || '0'),
                                            'height': Number(item.getValue({ fieldId: 'custitem_avt_total_height' }) || '0'),*/
                                            //'volume': Number(item.getValue({ fieldId: 'custitem_avt_ifs_cubic_volume' }) || '0.0'),
                                            //'weight': Number(item.getValue({ fieldId: 'weight' }) || '0.0'),
                                            'fixed': (item.getValue({ fieldId: 'custitem_avt_is_fixed_weight' }) || false)
                                        };

                                    log.debug({ title: LOG_NAME_ID, details: 'itemsCache = ' +  JSON.stringify(itemsCache) });

                                    log.debug({ title: LOG_NAME_ID, details: 'Cache updated' });
                                }
                                catch (e)
                                {
                                    log.error({ title: LOG_NAME_ID, details: 'Failed to load item record: ' + itemName + ' - ' + e });

                                    log.audit(
                                        {
                                            title: LOG_NAME_ID,
                                            details:
                                            'Unable to find required packages information - Skipping item: ' + itemName + ' line: ' + (l + 1)
                                        }
                                    );

                                }
                            }

                            log.debug({ title: LOG_NAME_ID, details: 'itemsCache = ' +  JSON.stringify(itemsCache) });
                            log.debug({ title: 'After itemsCache', details: '_quantity: ' + _quantity });


                            // itemPackageDetails = [  ];

                            var pckg = new AVT_IFS_Packages();

                            pckg.item = itemId;
                            pckg.totalPackages = ( Number(_quantity || '0') * itemsCache[ itemId ][ 'packages' ]);
                            pckg.quantityBreak = 1; // N.B. not used and is set to 1
                            //Commented By Stuti CR000575 Label Description Automation Script
                           // pckg.totalPackages = (ifLineQuantity * itemsCache[ itemId ][ 'packages' ]);
                            //pckg.type.length = itemsCache[ itemId ][ 'length' ];
                            //pckg.type.width = itemsCache[ itemId ][ 'width' ];
                            //Commented By Stuti CR000584
                           // pckg.type.volume = (Number(_quantity || '0')*itemsCache[ itemId ][ 'volume' ]);
                           //Added By Stuti
                           pckg.totalPackages = (ifLineQuantity * itemsCache[ itemId ][ 'packages' ]);
                           pckg.type.length = itemsCache[ itemId ][ 'length' ];
                           pckg.type.width = itemsCache[ itemId ][ 'width' ];
                           pckg.type.weight = (Number(_quantity || '0')*itemsCache[ itemId ][ 'weight' ]);
                           pckg.type.height = itemsCache[ itemId ][ 'height' ];
                           pckg.type.label = itemsCache[ itemId ][ 'packages' ];
                           pckg.type.description = itemsCache[ itemId ][ 'description' ];
                           pckg.type.isFixed = itemsCache[ itemId ][ 'fixed' ];

                            itemPackages.push(pckg);

                            for (var ip = 1; ip < results.length; ip++) {
                                result = results[ip];
                                useCustomItemPkg = result.getValue({name: 'custrecord_avt_ifs_item_package_use_cust'});
                                invItemId = result.getValue({name: 'custrecord_avt_ifs_item_package_inv_item'});
                                currentBreakQty = Number(result.getValue({name: 'custrecord_avt_ifs_item_package_qty'}));
                                //Commented By Stuti CR000575 Label Description Automation Script

                               /* nextBreakQty = Number(result.getValue({name: 'custrecord_avt_ifs_item_package_qty'}));

                                if (nextBreakQty > currentBreakQty) {
                                    break;
                                }*/
                                if(useCustomItemPkg== false){
                                    log.debug({ title: LOG_NAME_ID, details: 'Looking in cache for item details' });

                                    if (!itemsCache[ invItemId ] && invItemId != null && invItemId !='')
                                    {
                                        log.debug({ title: LOG_NAME_ID, details: 'Item details not found the in cache. Loading item record' });

                                        try
                                        {
                                            var item = record.load({ type: record.Type.INVENTORY_ITEM, id: invItemId });

                                            log.debug({ title: LOG_NAME_ID, details: 'Item record loaded' });

                                            itemsCache[ itemId ] =
                                                {
                                                    'name': item.getText({ fieldId: 'itemid' }),
                                                    //Added By Stuti CR000475
                                                    'description': item.getValue({ fieldId: 'custitem_shipping_label_description' }),
                                                    'packages': Number(currentBreakQty || '0'),
                                                    'volume': Number(item.getValue({ fieldId: 'custitem_avt_ifs_cubic_volume' }) || '0.0')* Number(currentBreakQty || '0'),
                                                    //Commented By Stuti CR000584
                                                    //'weight': Number(item.getValue({ fieldId: 'weight' }) || '0.0') * Number(currentBreakQty || '0'),
                                                    //Added By Stuti CR000584
                                                    'weight': Number(item.getValue({ fieldId: 'weight' }) || '0.0'),
                                                    'length': Number(item.getValue({ fieldId: 'custitem_avt_total_length' }) || '0'),
                                                    'width': Number(item.getValue({ fieldId: 'custitem_avt_total_width' }) || '0'),
                                                    'height': Number(item.getValue({ fieldId: 'custitem_avt_total_height' }) || '0'),
                                                    //Commented By Stuti CR000575 Label Description Automation Script
                                                    //'packages': Number(item.getValue({ fieldId: 'custitem_avt_total_packages' }) || '0'),
                                                    //'length': Number(item.getValue({ fieldId: 'custitem_avt_total_length' }) || '0'),
                                                    //'width': Number(item.getValue({ fieldId: 'custitem_avt_total_width' }) || '0'),
                                                    //'height': Number(item.getValue({ fieldId: 'custitem_avt_total_height' }) || '0'),
                                                    //'volume': Number(item.getValue({ fieldId: 'custitem_avt_ifs_cubic_volume' }) || '0.0'),
                                                   // 'weight': Number(item.getValue({ fieldId: 'weight' }) || '0.0'),
                                                    'fixed': (item.getValue({ fieldId: 'custitem_avt_is_fixed_weight' }) || false)
                                                };

                                            log.debug({ title: LOG_NAME_ID, details: 'itemsCache = ' +  JSON.stringify(itemsCache) });

                                            log.debug({ title: LOG_NAME_ID, details: 'Cache updated' });
                                        }
                                        catch (e)
                                        {
                                            log.error({ title: LOG_NAME_ID, details: 'Failed to load item record: ' + itemName + ' - ' + e });

                                            log.audit(
                                                {
                                                    title: LOG_NAME_ID,
                                                    details:
                                                    'Unable to find required packages information - Skipping item: ' + itemName + ' line: ' + (l + 1)
                                                }
                                            );

                                        }
                                        log.debug({ title: LOG_NAME_ID, details: 'itemsCache = ' +  JSON.stringify(itemsCache) });
                                        log.debug({ title: 'After itemsCache2', details: '_quantity: ' + _quantity });

                                        // itemPackageDetails = [  ];

                                        var pckg = new AVT_IFS_Packages();

                                        pckg.item = itemId;
                                        pckg.totalPackages = ( Number(_quantity || '0') * itemsCache[ itemId ][ 'packages' ]);
                                        pckg.quantityBreak = 1; // N.B. not used and is set to 1
                                        //Commented By Stuti CR000575 Label Description Automation Script
                                       // pckg.totalPackages = (ifLineQuantity * itemsCache[ itemId ][ 'packages' ]);
                                        //pckg.type.length = itemsCache[ itemId ][ 'length' ];
                                       // pckg.type.width = itemsCache[ itemId ][ 'width' ];
                                       // pckg.type.weight = itemsCache[ itemId ][ 'weight' ];
                                       // pckg.type.height = itemsCache[ itemId ][ 'height' ];
                                       //Commented By Stuti CR000584
                                       // pckg.type.volume = (Number(_quantity || '0')*itemsCache[ itemId ][ 'volume' ]);
                                       // pckg.type.weight = (Number(_quantity || '0')*itemsCache[ itemId ][ 'weight' ]);

                                       //Added By Stuti CR000584
                                        pckg.type.weight = itemsCache[ itemId ][ 'weight' ];
                                        pckg.type.width = itemsCache[ itemId ][ 'width' ];
                                        pckg.type.length = itemsCache[ itemId ][ 'length' ];
                                        pckg.type.height = itemsCache[ itemId ][ 'height' ];
                                        pckg.type.label = itemsCache[ itemId ][ 'packages' ];
                                        pckg.type.description = itemsCache[ itemId ][ 'description' ];
                                        pckg.type.isFixed = itemsCache[ itemId ][ 'fixed' ];

                                        itemPackages.push(pckg);
                                    }



                                }else{
                                    pckg = new AVT_IFS_Packages();
                                    pckg.item = itemId;
                                    pckg.type.length =
                                        result.getValue(
                                            {
                                                name: 'custrecord_avt_item_package_type_length',
                                                join: 'custrecord_avt_ifs_item_package_ft'
                                            }
                                        );

                                    pckg.type.width =
                                        result.getValue(
                                            {
                                                name: 'custrecord_avt_item_package_type_width',
                                                join: 'custrecord_avt_ifs_item_package_ft'
                                            }
                                        );

                                    pckg.type.weight =
                                        result.getValue(
                                            {
                                                name: 'custrecord_avt_item_package_type_weight',
                                                join: 'custrecord_avt_ifs_item_package_ft'
                                            }
                                        );

                                    pckg.type.height =
                                        result.getValue(
                                            {
                                                name: 'custrecord_avt_item_package_type_heigth',
                                                join: 'custrecord_avt_ifs_item_package_ft'
                                            }
                                        );

                                    pckg.type.label =
                                        result.getValue(
                                            {
                                                name: 'custrecord_avt_item_package_type_label',
                                                join: 'custrecord_avt_ifs_item_package_ft'
                                            }
                                        );

                                    pckg.type.description =
                                        result.getValue(
                                            {
                                                name: 'custrecord_avt_item_package_desc',
                                                join: 'custrecord_avt_ifs_item_package_ft'
                                            }
                                        );

                                    pckg.type.isFixed =
                                        result.getValue(
                                            {
                                                name: 'custrecord_avt_item_package_type_is_fixe',
                                                join: 'custrecord_avt_ifs_item_package_ft'
                                            }
                                        );

                                    pckg.quantityBreak = result.getValue({name: 'custrecord_avt_ifs_item_package_qty'});

                                    itemPackages.push(pckg);
                                }
                            }
                        }//end else
                    }
                }
                catch (e)
                {
                    log.error({ title: 'findItemPackageDetails', details: 'Failed to find item package records: ' + e });

                    itemPackages = false;
                }

                log.debug({ title: 'findItemPackageDetails', details: 'itemPackages: ' + JSON.stringify(itemPackages) });

                return itemPackages;
            }

            var DECIMALS = 3;
            var CACHE_NAME = runtime.getCurrentScript().id;

            var itemsCache = {  };

            log.debug({ title: 'createRequiredIFSPackages:itemsCache', details: itemsCache });

            if (params.type !== record.Type.ITEM_FULFILLMENT)
            {
                log.error(
                    { title: createRequiredIFSPackages, details: 'Triggered on an unsupported record type: ' + params.type }
                );

                return;
            }

            var TRAN_ID = search.lookupFields({ type: params.type, id: params.id, columns: [ 'tranid' ] })[ 'tranid' ];
            var LOG_NAME_ID = 'createRequiredIFSPackages:' + TRAN_ID;

            log.audit({ title: LOG_NAME_ID, details: 'Examining record' });

            // Check that there are no packages already on the Item Fulfillment

            try
            {
                var s =
                    search.create(
                        {
                            type: 'customrecord_avt_ifs_record',
                            filters:
                                [
                                    search.createFilter(
                                        {
                                            name: 'custrecord_avt_ifs_record_transid',
                                            operator: search.Operator.ANYOF,
                                            values: params.id
                                        }
                                    )
                                ]
                        }
                    );

                var numExistingPackages = s.run().getRange({ start: 0, end: 1000 }).length;

                if (numExistingPackages > 0)
                {
                    log.debug({ title: LOG_NAME_ID, details: '# of packages: ' + numExistingPackages });
                    log.audit({ title: LOG_NAME_ID, details: 'Packages already exist - Skipping Item Fulfillment' });

                    return;
                }
            }
            catch (e)
            {
                log.error(
                    {
                        title: LOG_NAME_ID,
                        details: 'Unable to determine if there are already packages - Skipping Item Fulfillment: ' + e
                    }
                );

                return;
            }

            log.audit({ title: LOG_NAME_ID, details: 'Processing' });

            var itemFulfillment = record.load({ type: params.type, id: params.id });
            var splInstruction1 = itemFulfillment.getValue({ fieldId: 'custbody_avt_ifs_special_instructions1' });
            var splInstruction2 = itemFulfillment.getValue({fieldId: 'custbody_avt_ifs_special_instructions2'});
            var splInstruction3 = itemFulfillment.getValue({fieldId: 'custbody_avt_ifs_special_instructions3'});

            for (var l = 0 ; l < itemFulfillment.getLineCount({ sublistId: 'item' }) ; l++)
            {
                log.audit({ title: LOG_NAME_ID, details: 'Examining item line: ' + (l + 1) });

                var fulfill = itemFulfillment.getSublistValue({ sublistId: 'item', line: l, fieldId: 'itemreceive' });
                var ifLineQuantity = itemFulfillment.getSublistValue({ sublistId: 'item', line: l, fieldId: 'quantity' });
                var itemName = itemFulfillment.getSublistValue({ sublistId: 'item', line: l, fieldId: 'itemname' });
                var itemType = itemFulfillment.getSublistValue({ sublistId: 'item', line: l, fieldId: 'itemtype' });
                var itemId = Number(itemFulfillment.getSublistValue({ sublistId: 'item', line: l, fieldId: 'item' }));

                var p;

                log.debug({ title: LOG_NAME_ID, details: 'fulfill: ' + fulfill + ' {' + (typeof fulfill) + '}' });

                if (!fulfill)
                {
                    log.audit({ title: LOG_NAME_ID, details: 'Not to filfill - Skipping item line: ' + (l + 1) });

                    continue;
                }

                log.debug({ title: LOG_NAME_ID, details: 'itemType: ' + itemType + ' {' + (typeof itemType) + '}' });
                log.debug({ title: LOG_NAME_ID, details: 'itemName: ' + itemName });
                log.debug({ title: LOG_NAME_ID, details: 'quantity: ' + ifLineQuantity + ' (' + (typeof ifLineQuantity) + ')' });

                ifLineQuantity = parseFloat(ifLineQuantity);

                log.debug({ title: LOG_NAME_ID, details: 'parsed quantity: ' + ifLineQuantity + ' (' + (typeof ifLineQuantity) + ')' });

                if (!ifLineQuantity)
                {
                    log.audit({ title: LOG_NAME_ID, details: 'No usable quantity - Skipping item line: ' + (l + 1) });

                    continue;
                }

                if (itemType === 'InvtPart')
                {
                    var kitLevel = itemFulfillment.getSublistValue({ sublistId: 'item', line: l, fieldId: 'kitlevel' });

                    if (kitLevel)
                    {
                        log.audit({ title: LOG_NAME_ID, details: 'Kit item inventory item component - Skipping item line: ' + (l + 1) });

                        continue;
                    }
                }

                log.audit({ title: LOG_NAME_ID, details: 'Retrieving package details for item: ' + itemName });

                var itemPackageDetails = findItemPackageDetails(itemId, ifLineQuantity);

                log.debug(
                    {
                        title: LOG_NAME_ID,
                        details: 'itemPackageDetails for item: ' + itemName + ' = ' + JSON.stringify(itemPackageDetails)
                    }
                );

                if (itemPackageDetails === false)
                {
                    log.audit(
                        {
                            title: LOG_NAME_ID,
                            details: 'Failed to find package details - Skipping item: ' + itemName + ' line: ' + (l + 1)
                        }
                    );

                    continue;
                }

                log.debug({ title: LOG_NAME_ID, details: 'itemPackageDetails.length = ' + itemPackageDetails.length });

                if (itemPackageDetails.length < 1)
                {
                    log.debug({ title: LOG_NAME_ID, details: 'Looking in cache for item details' });

                    if (!itemsCache[ itemId ])
                    {
                        log.debug({ title: LOG_NAME_ID, details: 'Item details not found the in cache. Loading item record' });

                        try
                        {
                            var item = record.load({ type: record.Type.INVENTORY_ITEM, id: itemId });

                            log.debug({ title: LOG_NAME_ID, details: 'Item record loaded' });

                            itemsCache[ itemId ] =
                                {
                                    'name': item.getText({ fieldId: 'itemid' }),
                                    //Added By Stuti CR000475
                                    'description': item.getValue({ fieldId: 'custitem_shipping_label_description' }),
                                    'packages': Number(ifLineQuantity || '0'),
                                    //Commented By Stuti CR000584
                                    //'volume': Number(item.getValue({ fieldId: 'custitem_avt_ifs_cubic_volume' }) || '0.0')* Number(ifLineQuantity || '0'),
                                    //'weight': Number(item.getValue({ fieldId: 'weight' }) || '0.0') * Number(ifLineQuantity || '0'),
                                    //Added By Stuti CR000584
                                    'weight': Number(item.getValue({ fieldId: 'weight' }) || '0.0') ,
                                    'length': Number(item.getValue({ fieldId: 'custitem_avt_total_length' }) || '0'),
                                    'width': Number(item.getValue({ fieldId: 'custitem_avt_total_width' }) || '0'),
                                    'height': Number(item.getValue({ fieldId: 'custitem_avt_total_height' }) || '0'),
                                    //Commented By Stuti CR000575 Label Description Automation Script
                                  //  'length': Number(item.getValue({ fieldId: 'custitem_avt_total_length' }) || '0'),
                                 //   'width': Number(item.getValue({ fieldId: 'custitem_avt_total_width' }) || '0'),
                                  //  'height': Number(item.getValue({ fieldId: 'custitem_avt_total_height' }) || '0'),
                                    //'packages': Number(item.getValue({ fieldId: 'custitem_avt_total_packages' }) || '0'),
                                    //'volume': Number(item.getValue({ fieldId: 'custitem_avt_ifs_cubic_volume' }) || '0.0'),
                                   // 'weight': Number(item.getValue({ fieldId: 'weight' }) || '0.0'),
                                    'fixed': (item.getValue({ fieldId: 'custitem_avt_is_fixed_weight' }) || false)
                                };

                            log.debug({ title: LOG_NAME_ID, details: 'itemsCache = ' +  JSON.stringify(itemsCache) });

                            log.debug({ title: LOG_NAME_ID, details: 'Cache updated' });
                        }
                        catch (e)
                        {
                            log.error({ title: LOG_NAME_ID, details: 'Failed to load item record: ' + itemName + ' - ' + e });

                            log.audit(
                                {
                                    title: LOG_NAME_ID,
                                    details:
                                    'Unable to find required packages information - Skipping item: ' + itemName + ' line: ' + (l + 1)
                                }
                            );

                            continue;
                        }
                    }

                    log.debug({ title: LOG_NAME_ID, details: 'itemsCache = ' +  JSON.stringify(itemsCache) });
                    log.debug({ title: 'After itemsCache3', details: 'ifLineQuantity: ' + ifLineQuantity });

                    itemPackageDetails = [  ];

                    var pckg = new AVT_IFS_Packages();

                    pckg.item = itemId;
                    pckg.totalPackages = itemsCache[ itemId ][ 'packages' ];
                    pckg.quantityBreak = 1; // N.B. not used and is set to 1
                    //Commented By Stuti CR000575 Label Description Automation Script
                    // pckg.totalPackages = (ifLineQuantity * itemsCache[ itemId ][ 'packages' ]);
                    // pckg.type.length = itemsCache[ itemId ][ 'length' ];
                    //pckg.type.width = itemsCache[ itemId ][ 'width' ];
                   // pckg.type.weight = itemsCache[ itemId ][ 'weight' ];
                    //pckg.type.height = itemsCache[ itemId ][ 'height' ];

                    //Commented By Stuti CR000584
                   // pckg.type.volume = itemsCache[ itemId ][ 'volume' ];
                   //Added By Stuti CR000584
                    pckg.type.length = itemsCache[ itemId ][ 'length' ];
                    pckg.type.width = itemsCache[ itemId ][ 'width' ];
                    pckg.type.height = itemsCache[ itemId ][ 'height' ];

                    pckg.type.weight = itemsCache[ itemId ][ 'weight' ];
                    pckg.type.label = itemsCache[ itemId ][ 'packages' ];
                    pckg.type.description = itemsCache[ itemId ][ 'description' ];
                    pckg.type.isFixed = itemsCache[ itemId ][ 'fixed' ];

                    itemPackageDetails.push(pckg);
                }

                log.audit({ title: LOG_NAME_ID, details: 'Creating required packages' });

                var created = 0;
                var required;

                for (p = 0 ; p < itemPackageDetails.length ; p++)
                {
                    try
                    {
                        required = itemPackageDetails[ p ];

                        var pkg = record.create({ type: 'customrecord_avt_ifs_record' });

                        pkg.setValue({ fieldId: 'custrecord_avt_ifs_record_transid', value: params.id });
                        pkg.setValue({ fieldId: 'custrecord_avt_ifs_total_packages', value: required.totalPackages });
                        log.audit({ title: LOG_NAME_ID, details: 'required.type.volume  ' + required.type.volume });

                        //Commented By Stuti CR000584
                        //pkg.setValue({ fieldId: 'custrecord_avt_ifs_total_volume', value: required.type.volume });
                        //Added By Stuti CR000584
                         pkg.setValue({ fieldId: 'custrecord_avt_ifs_total_length', value: required.type.length });
                         pkg.setValue({ fieldId: 'custrecord_avt_ifs_total_width', value: required.type.width });
                         pkg.setValue({ fieldId: 'custrecord_avt_ifs_total_height', value: required.type.height });


                        //Commented By Stuti CR000575 Label Description Automation Script
                       // pkg.setValue({ fieldId: 'custrecord_avt_ifs_total_length', value: required.type.length });
                       // pkg.setValue({ fieldId: 'custrecord_avt_ifs_total_width', value: required.type.width });
                        // pkg.setValue({ fieldId: 'custrecord_avt_ifs_total_height', value: required.type.height });

                        // Steve Beyer account
                        pkg.setValue({ fieldId: 'custrecord_avt_ifs_item_package_desc', value: required.type.description });

                        // GLobal Fitness & Leisure account
                        pkg.setValue({ fieldId: 'custrecord_avt_ifs_pkg_item_desc', value: required.type.description });

                        var sender = itemFulfillment.getValue({ fieldId: 'custbody_avt_ifs_sender_business' });
                        var chargeTo = itemFulfillment.getValue({ fieldId: 'custbody_avt_ifs_charge_to' });
                        var carrier = itemFulfillment.getValue({ fieldId: 'custbody_avt_ifs_shipcarrier' });
                        var service = itemFulfillment.getValue({ fieldId: 'custbody_avt_ifs_shipservice' });
                        var freightType = itemFulfillment.getValue({ fieldId: 'custbody_avt_ifs_freight_type' });
                        var account = itemFulfillment.getValue({ fieldId: 'custbody_avt_ifs_accountno' });
                        //Added By Stuti CR000475
                        var str = itemFulfillment.getText({ fieldId: 'createdfrom' });
                        var splInstruction1 = itemFulfillment.getValue({ fieldId:"custbody_avt_ifs_special_instructions1"});
                        var splInstruction2 = itemFulfillment.getValue({ fieldId: "custbody_avt_ifs_special_instructions2"});
                        var splInstruction3 = itemFulfillment.getValue({ fieldId: "custbody_avt_ifs_special_instructions3"});
                        var n = str.lastIndexOf('#');
                        var freightRef = str.substring(n + 1);
                        pkg.setValue({ fieldId: 'custrecord_avt_ifs_freight_line_ref', value: freightRef });

                        pkg.setValue({ fieldId: 'custrecord_avt_ifs_sender_business', value: sender });
                        pkg.setValue({ fieldId: 'custrecord_avt_ifs_charge_to', value: chargeTo });
                        pkg.setValue({ fieldId: 'custrecord_avt_ifs_shipcarrier', value: carrier });
                        pkg.setValue({ fieldId: 'custrecord_avt_ifs_shipservice', value: service });
                        pkg.setValue({ fieldId: 'custrecord_avt_ifs_freight_type', value: freightType });
                        pkg.setValue({ fieldId: 'custrecord_avt_ifs_accountno_pack', value: account });
                        pkg.setValue({ fieldId: 'custrecord_avt_ifs_special_instructions1', value: splInstruction1 });
                        pkg.setValue({ fieldId: 'custrecord_avt_ifs_special_instructions2', value: splInstruction2 });
                        pkg.setValue({ fieldId: 'custrecord_avt_ifs_special_instructions3', value: splInstruction3 });


                        /*if (required.type.isFixed)
                        {
                            pkg.setValue({ fieldId: 'custrecord_avt_ifs_total_weight', value: required.type.weight });
                        }
                        else
                        {
                            var weight = (parseFloat(required.type.weight) * ifLineQuantity);

                            pkg.setValue(
                                {
                                    fieldId: 'custrecord_avt_ifs_total_weight',
                                    value: roundToDecimalPlaces(weight, DECIMALS)
                                }
                            );
                        }*/
                        pkg.setValue({ fieldId: 'custrecord_avt_ifs_total_weight', value: Math.ceil(required.type.weight) });

                        pkg.save();

                        created++;
                        created++;
                    }
                    catch (e)
                    {
                        log.error(
                            {
                                title: LOG_NAME_ID,
                                details: 'Failed to create packages for item: ' + itemName + ' line: ' + (l + 1) + ' - ' + e
                            }
                        );
                    }
                }

                log.audit({title: LOG_NAME_ID, details: created + ' packages created for item: ' + itemName + ' line: ' + (l + 1) });
            }

            record.submitFields({ type: params.type, id: params.id, values: { 'custbody_avt_ifs_is_multi_split': true } });

            log.audit({title: LOG_NAME_ID, details: 'Finished' });
        }

        return {
            each: createRequiredIFSPackages
        };
    }
);