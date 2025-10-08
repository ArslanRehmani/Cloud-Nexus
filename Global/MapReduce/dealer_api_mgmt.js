/**
 * dealer_api_mgmt
 * @NApiVersion 2.1
 * 
 */

define(['N/record', 'N/search', '/SuiteScripts/G 2.0/lodash.4.17.15', 'N/https', 'N/url', 'N/email', 'N/format',
    '/SuiteScripts/G 2.0/moment-with-locales-timezones.min', 'N/file',
    '/SuiteScripts/Lib-NS/crypto-v3.1.2/crypto-js',
    'N/xml'
], function (record, search, _, https, url, email, format, moment, file, crypto, xml) {
    let dealerApiRecord;

    // if the following fields is empty "", remove them from json obj
    const nonEmptyFields = {
        customer: ['lastname', 'email']
    }
    class dealerApiMgmt {
        constructor(id) {
            if (id == undefined || id == null || id == '') {
                throw new Error('id can not be empty for dealer API management')
            }
            this.id = id;
            this.moment = moment;
            this._ = _;
            // this.crypto = crypto;
            this.custom_record_type = 'customrecord_dealer_api_management';
            dealerApiRecord = record.load({
                type: this.custom_record_type,
                id: id
            });
            // this.all_fields = this.record.getFields();
            this.name = dealerApiRecord.getValue('name');
            this.customer = '861';
            this.dealer = dealerApiRecord.getValue('custrecord_dealer_api_mgmt_customer');
            this.subcustomer = dealerApiRecord.getValue('custrecord_dealer_api_mgmt_subcustomer');
            if (this.subcustomer) {
                this.customer = this.dealer
            }
            // this.location = dealerApiRecord.getValue('custrecord_dealer_api_mgmt_locations');
            this.location = ['15'];
            this.field_mapping = JSON.parse(dealerApiRecord.getValue('custrecord_dealer_api_mgmt_field_mapping'));
            this.root_url = dealerApiRecord.getValue('custrecord_dealer_api_mgmt_root_url');
            this.price_level = dealerApiRecord.getValue('custrecord_dealer_api_mgmt_price_level') || this.getPriceLevel(this.dealer);
            this.dealer_folder = dealerApiRecord.getValue('custrecord_dealer_api_mgmt_folder')
            this.discount_item = dealerApiRecord.getValue('custrecord_dealer_api_mgmt_disc_item');
            this.discount_on_freight = dealerApiRecord.getValue('custrecord_dealer_api_mgmt_disc_on_frt');
            this.nds_freight_peritem = dealerApiRecord.getValue('custrecord_dealer_api_mgmt_nds_frt_per');
            this.order_log_record_type = dealerApiRecord.getValue('custrecord_dealer_api_mgmt_order_log');

            // const configValue = dealerApiRecord.getValue('custrecord_dealer_api_mgmt_config')

            this.config = {}
            try {
                const configValue = dealerApiRecord.getValue('custrecord_dealer_api_mgmt_config')
                if (configValue && configValue.startsWith('{') && configValue.endsWith('}')) {
                    this.config = JSON.parse(configValue)
                }
            } catch (error) {
                log.error(`Dealer ${this.id} ${this.name} API configuration has wrong JSON format`)
            }

            this.record_values = this.getRecordValues();

            this.inventory_formula = this.getInventoryFormula();
            // this.items = this.getItemsFromSearch();
            // this.getItemsWithMatrixOptions();
            // this.getItemStock();
        }

        getItemDimensionsWeightCarrier(recType, id) {
            if (!['InvtPart', 'Kit'].includes(recType)) {
                throw new Error('invalid record type must be "InvtPart" or "Kit"')
            }

            if (recType == 'InvtPart') {
                return this.getRecordValuesFromSearch({
                    type: 'item',
                    filters: [
                        ['internalid', 'is', id]
                    ],
                    columns: [
                        { name: 'isinactive', label: 'inactive' },
                        { name: 'custitem_avt_total_packages', label: 'total_package' },
                        { name: 'custitem_avt_total_length', label: 'length' },
                        { name: 'custitem_avt_total_width', label: 'width' },
                        { name: 'custitem_avt_total_height', label: 'height' },
                        { name: 'custitem_avt_ifs_cubic_volume', label: 'cubic' },
                        { name: 'custitem_net_weight', label: 'net_weight' },
                        { name: 'weight', label: 'weight' },
                        { name: 'custitem_cubic_charge_weight', label: 'charge_weight' },
                        { name: 'custitem_assemblyhours', label: 'assemblyhours' },
                        { name: 'custitem_cubic_carrier', label: 'carrier' },
                        { name: 'custitem_cubic_carrier_express', label: 'express_carrier' },
                        { name: 'custitem_multi_qty_carrier_override', label: 'multi_qty_override' },
                    ]
                })
            } else if (recType == 'Kit') {
                return this.getRecordValuesFromSearch({
                    type: 'item',
                    filters: [['internalid', 'is', id]],
                    columns: [
                        { name: 'isinactive', label: 'inactive' },
                        { name: 'custitem_avt_total_packages', label: 'total_package' },
                        { name: 'custitem_avt_total_length', label: 'length' },
                        { name: 'custitem_avt_total_width', label: 'width' },
                        { name: 'custitem_avt_total_height', label: 'height' },
                        { name: 'custitem_avt_ifs_cubic_volume', label: 'cubic' },
                        { name: 'custitem_net_weight', label: 'net_weight' },
                        { name: 'weight', label: 'weight' },
                        { name: 'custitem_cubic_charge_weight', label: 'charge_weight' },
                        { name: 'custitem_assemblyhours', label: 'assemblyhours' },
                        { name: 'custitem_cubic_carrier', label: 'carrier' },
                        { name: 'custitem_cubic_carrier_express', label: 'express_carrier' },
                        { name: 'custitem_multi_qty_carrier_override', label: 'multi_qty_override' },
                        { name: 'memberitem', label: 'memberitem' },
                        { name: 'memberquantity', label: 'memberquantity' },
                        { name: 'type', join: 'memberitem', label: 'memberitem_type' },
                        { name: 'displayname', join: 'memberitem', label: 'memberitem_displayname' },
                        { name: 'isinactive', join: 'memberitem', label: 'memberitem_inactive' },
                        { name: 'custitem_avt_total_packages', join: 'memberitem', label: 'memberitem_total_package' },
                        { name: 'custitem_avt_total_length', join: 'memberitem', label: 'memberitem_length' },
                        { name: 'custitem_avt_total_width', join: 'memberitem', label: 'memberitem_width' },
                        { name: 'custitem_avt_total_height', join: 'memberitem', label: 'memberitem_height' },
                        { name: 'custitem_avt_ifs_cubic_volume', join: 'memberitem', label: 'memberitem_cubic' },
                        { name: 'custitem_net_weight', join: 'memberitem', label: 'memberitem_net_weight' },
                        { name: 'weight', join: 'memberitem', label: 'memberitem_weight' },
                        { name: 'custitem_cubic_charge_weight', join: 'memberitem', label: 'memberitem_charge_weight' },
                        { name: 'custitem_assemblyhours', join: 'memberitem', label: 'memberitem_assemblyhours' },
                        { name: 'custitem_cubic_carrier', join: 'memberitem', label: 'memberitem_carrier' },
                        { name: 'custitem_cubic_carrier_express', join: 'memberitem', label: 'memberitem_express_carrier' },
                        { name: 'custitem_multi_qty_carrier_override', join: 'memberitem', label: 'memberitem_multi_qty_override' },
                    ]
                })
            }
        }

        /**
         * 
         * @param {Object} options collection, required: spreadsheetId:String, action (enum: get|update|clear), 
         * data:Array, data[i].sheetName:String, example:
         * {
                    spreadsheetId: "String",
                    action: 'update',
                    data: [{sheetName:"simple_product", keepHeaders: true, values: [{}...]}]
                }
         * @returns 
         */
        updataGoogleSheet(options) {
            const resp = https.post({
                url: 'https://o9iyof2eqi.execute-api.ap-southeast-2.amazonaws.com/default/googleSheet',
                headers: {
                    'x-api-key': 'iuBuYJ3IQl9J8wN2AMMz53T1SRW2nKeM3FLWRJ0w',
                    'Content-Type': 'application/json',
                    'User-Agent': `Netsuite/${this.name}`
                },
                ...options
            })
            if (resp.code == 200) {
                return JSON.parse(resp.body)
            } else {
                throw new Error(`Failed to update google sheet due to ${resp.code} ${resp.body}`)
            }
        }

        callCrypto() {
            return crypto;
        }

        searchExistingCustomers(filters) {
            if (util.isArray(filters) && filters.length > 0) {
                filters = [
                    ...[
                        ['isinactive', 'is', 'F'],
                        'AND',
                        ['parentcustomer.internalidnumber', 'equalto', this.customer]
                    ],
                    'AND',
                    ...filters
                ]

                return this.searchExisting({
                    type: 'customer',
                    filters,
                    columns: [
                        { name: 'entityid', sortdir: 'DESC' },
                        'companyname',
                        'firstname',
                        'lastname',
                        'email',
                        'phone'
                    ]
                })
            } else {
                throw new Error(`Error when search existing customer with filters [must be array], ${filters}`)
            }
        }
        /**
         * 
         * @param {Object} payload - {url:String, method:String, header:Object, formData:Object} 
         * @returns {Object}
         */
        formData(payload) {
            const encrypted = crypto.AES.encrypt(JSON.stringify(payload), 'netsuitesftp').toString()
            log.debug('formData encrypted', encrypted)
            const resp = https.post({
                url: 'https://www.shopify.gflgroup.com.au/formdata',
                headers: {
                    'User-Agent': `Netsuite/${this.name}`,
                    'Content-Type': 'application/json',
                    'X-From': 'suitescript'
                },
                body: JSON.stringify({ encrypted })
            })
            if (resp.code == 200) {
                return JSON.parse(resp.body)
            } else {
                throw new Error(`Unknown error with formData service for ${this.name},
                payload: ${JSON.stringify(payload)}
                errorDetails: ${resp.code} ${resp.body}
                `)
            }
        }

        ftp(options) {
            const encrypted = crypto.AES.encrypt(this.record_values.custrecord_dealer_api_mgmt_credentials.value, 'netsuitesftp').toString()
            log.debug('ftp encrypted', encrypted)
            const body = JSON.stringify({
                encrypted,
                ...options
            })
            const resp = https.post({
                url: 'https://www.shopify.gflgroup.com.au/ftp',
                body,
                headers: {
                    'User-Agent': `NetSuite/${this.name}`,
                    'Content-Type': 'application/json',
                    'X-From': 'suitescript'
                }
            })
            if (resp.code == 200) {
                return JSON.parse(resp.body)
            } else {
                throw new Error(`Unknown error with FTP service for ${this.name},
                payload: ${body}
                errorDetails: ${resp.body}
                `)
            }
        }

        getCustomerDefaultBillingAddress() {
            // const savedsearch = search.load(1996)
            // log.debug('filters', savedsearch.filterExpression)
            // log.debug('columns', savedsearch.columns)

            return this.getRecordValuesFromSearch({
                type: 'customer',
                // filters: [
                //     ['internalidnumber', 'equalto', this.customer],
                //     'AND',
                //     ['isdefaultbilling', 'is', 'T']
                // ],
                // columns: [
                //     'entityid',
                //     'email',
                //     'companyname',
                //     'firstname',
                //     'lastname',
                //     {name: 'internalid', join: 'address', label: 'billaddressinternalid'}
                // ]
                filters: [
                    ["internalidnumber", "equalto", "4025607"],
                    "AND",
                    ["isdefaultbilling", "is", "T"]
                ],
                columns: [
                    { "name": "entityid" },
                    { "name": "companyname" },
                    { "name": "email" },
                    { "name": "phone" },
                    { "name": "billaddress" },
                    { "name": "isdefaultbilling", "join": "billingAddress", "label": "defaultbillingaddress" },
                    { "name": "internalid", "join": "billingAddress", "label": "defaultbillingaddressinternalid" },
                    { "name": "addressinternalid", "join": "billingAddress", "label": "addressinternalid" }
                ]
            })
        }

        // case insentive for string
        searchExisting(options) {
            const existing = this.getRecordValuesOnlyFromSearch(options)
            log.debug(`search existing ${options.type}`, existing)
            if (existing.length == 1) {
                if (existing[0].isinactive) {
                    const msg = `${this.name} is existing already but it is inactive, detail:
                    ${JSON.stringify(existing)}
                    from request: ${JSON.stringify(options)}`
                    log.error('inactive existing log', msg)
                    // noticeEmail

                    throw new Error(msg)
                } else {
                    return existing[0]
                }
            } else if (existing.length > 1) {
                const msg = `${this.name} has duplicated log, 
                details: ${JSON.stringify(existing)}
                from request: ${JSON.stringify(options)}`
                log.error('duplocated logs', msg)
                throw new Error(msg)
                // noticeEmail
                // this.noticeEmail()
            } else {
                return null
            }
        }

        /**
         * get __NS_ITEMS__, __NS_SHIPITEM__, __NS_LOCATION__
         * 
         * @param {Array} itemSKUs [{sku: String, quantity: Number}, ...] 
         * @param {Array} itemIds [{internalid: String|Number, quantity: Number}, ...]
         * @param {String|Number} postcode 
         * @param {String} suburb 
         */
        getSalesOrderFreight(items, type = 'sku', postcode, suburb) {
            const options = {
                postcode, suburb
            }
            const itemStr = items.map(item => `${item[type]}*${item.quantity}`).join(',')
            if (type == 'sku') {
                options.item_sku = itemStr
            } else if (type == 'internalid') {
                options.item_id = itemStr
            }
            const freightOptions = this.getFreightOptions(options)
            log.debug('freightOptions', freightOptions)
            // {"item":[{"sku":"BENCHBN2","internalid":"20390"}],"item_qty":{"BENCHBN2":1},"regular_opts":[{"carrier_name":"Allied Express","display_code":"Regular Delivery","shipitem":"34247","shipitem_name":"Allied Express","freightitem":"33927","freightitem_name":"1FREIGHT CHARGES : FREIGHTALLIED","postcode":"6148","regular":true,"premium":false,"express":false,"diverse":false,"priority":"25","rates":[{"suburb":"SHELLEY","rate":53.91,"rate_with_gst":59.3,"location":{"inventory_location_id":"15","inventory_location_name":"AU : Broadmeadows VIC","state":"VIC"}}],"type":"regular"}]}

            // if (freightOptions.regular_opts.length > 0) {
            //     const __NS_ITEMS__ = _.flattenDeep(items.map(item => {
            //         const found = freightOptions.item.find(i => i[type] == item[type])
            //         if (found) {
            //             const itemLine = [{
            //                 item: found.internalid,
            //                 price: this.price_level,
            //                 quantity: item.quantity,
            //                 taxcode: 7
            //             }]

            //             if (this.nds_freight_peritem) {
            //                 const itemFreightItem = this.getRecordValuesFromSearch({
            //                     type: 'item',
            //                     filters: [
            //                         ['internalid', 'is', found.internalid]
            //                     ],
            //                     columns: [
            //                         {name: 'internalid'},
            //                         {name: 'itemid'},
            //                         {name: 'shippingrate'},
            //                         {name: 'custitem_cubic_carrier'},
            //                         {name: 'custrecord_shipping_carrier_freightitem', join: 'CUSTITEM_CUBIC_CARRIER'},
            //                         {name: 'custrecord_shipping_carrier_shipitem', join: 'CUSTITEM_CUBIC_CARRIER'}
            //                     ]
            //                 })
            //                 log.debug('itemFreightItem', itemFreightItem)
            //                 if (itemFreightItem[0].data.custrecord_shipping_carrier_freightitem.value && itemFreightItem[0].data.shippingrate.value) {
            //                     itemLine.push({
            //                         item: itemFreightItem[0].data.custrecord_shipping_carrier_freightitem.value,
            //                         price: -1,
            //                         quantity: 1,
            //                         amount: itemFreightItem[0].data.shippingrate.value * item.quantity,
            //                         taxcode: 7
            //                     })
            //                 } else {
            //                     throw new Error(`Missing freight item or/and NDS shipping cost from ${found.sku}
            //                         details: ${JSON.stringify(found)}
            //                         ${JSON.stringify(itemFreightItem)}`
            //                     )
            //                 }
            //             }

            //             return itemLine
            //         } else {
            //             throw new Error(`${this.name} unable to find ${type} ${item[type]} from Netsuite`)
            //         }
            //     }))
            //     // const __NS_SHIPITEM__ = freightOptions.regular_opts[0].shipitem
            //     const __NS_SHIPITEM__ = '13712'
            //     const __NS_LOCATION__ = freightOptions.regular_opts[0].rates[0] && freightOptions.regular_opts[0].rates[0].location ? freightOptions.regular_opts[0].rates[0].location.inventory_location_id : '15'  
            //     const __NS_SHIPPINGCOST__ = freightOptions.regular_opts[0].rates[0].rate

            //     return { __NS_ITEMS__, __NS_SHIPITEM__, __NS_LOCATION__, __NS_SHIPPINGCOST__ }
            // } else {
            //     throw new Error(`${this.name} Failed to get freight options for ${JSON.stringify(items)} to ${postcode} ${suburb} 
            //     details ${JSON.stringify(freightOptions)}`)
            // }

            if (!_.isEmpty(freightOptions.cheapest_opt)) {
                const __NS_ITEMS__ = _.flattenDeep(items.map(item => {
                    const found = freightOptions.item.find(i => i[type] == item[type])
                    if (found) {
                        const itemLine = [{
                            item: found.internalid,
                            price: this.price_level,
                            quantity: item.quantity,
                            taxcode: 7
                        }]

                        if (this.nds_freight_peritem) {
                            const itemFreightItem = this.getRecordValuesFromSearch({
                                type: 'item',
                                filters: [
                                    ['internalid', 'is', found.internalid]
                                ],
                                columns: [
                                    { name: 'internalid' },
                                    { name: 'itemid' },
                                    { name: 'shippingrate' },
                                    { name: 'custitem_cubic_carrier' },
                                    { name: 'custrecord_shipping_carrier_freightitem', join: 'CUSTITEM_CUBIC_CARRIER' },
                                    { name: 'custrecord_shipping_carrier_shipitem', join: 'CUSTITEM_CUBIC_CARRIER' }
                                ]
                            })
                            log.debug('itemFreightItem', itemFreightItem)
                            if (itemFreightItem[0].data.custrecord_shipping_carrier_freightitem.value && itemFreightItem[0].data.shippingrate.value) {
                                itemLine.push({
                                    item: itemFreightItem[0].data.custrecord_shipping_carrier_freightitem.value,
                                    price: -1,
                                    quantity: 1,
                                    amount: itemFreightItem[0].data.shippingrate.value * item.quantity,
                                    taxcode: 7
                                })
                            } else {
                                throw new Error(`Missing freight item or/and NDS shipping cost from ${found.sku}
                                    details: ${JSON.stringify(found)}
                                    ${JSON.stringify(itemFreightItem)}`
                                )
                            }
                        }

                        return itemLine
                    } else {
                        throw new Error(`${this.name} unable to find ${type} ${item[type]} from Netsuite`)
                    }
                }))
                // const __NS_SHIPITEM__ = freightOptions.regular_opts[0].shipitem
                const __NS_SHIPITEM__ = '13712'
                // const __NS_LOCATION__ = freightOptions.regular_opts[0].rates[0] && freightOptions.regular_opts[0].rates[0].location ? freightOptions.regular_opts[0].rates[0].location.inventory_location_id : '15'  
                const __NS_LOCATION__ = '15'
                const __NS_SHIPPINGCOST__ = freightOptions.cheapest_opt.rate

                return { __NS_ITEMS__, __NS_SHIPITEM__, __NS_LOCATION__, __NS_SHIPPINGCOST__ }
            } else {
                throw new Error(`${this.name} Failed to get freight options for ${JSON.stringify(items)} to ${postcode} ${suburb} 
                details ${JSON.stringify(freightOptions)}`)
            }
        }

        getPriceLevel(customerId) {
            if (customerId) {
                const cols = search.lookupFields({
                    type: 'customer',
                    id: customerId,
                    columns: ['pricelevel']
                })
                return cols.pricelevel[0] && cols.pricelevel[0].value ? cols.pricelevel[0].value : 5
            } else {
                return 5
            }
        }

        /**
         * 
         * @param {*} salesorderid 
         */
        closeSalesOrder(salesorderId, reason) {
            log.debug(`close sales order ${salesorderId}`, reason)
            const soRecord = record.load({
                type: 'salesorder',
                id: salesorderId,
                isDynamic: true
            })
            const itemCount = soRecord.getLineCount('item')
            for (let i = 0; i < itemCount; i++) {
                soRecord.selectLine({ sublistId: 'item', line: i })
                soRecord.setCurrentSublistValue({
                    sublistId: 'item',
                    line: i,
                    fieldId: 'isclosed',
                    value: true
                })
                soRecord.commitLine({ sublistId: 'item' })
            }
            soRecord.setValue({
                fieldId: 'custbody_close_reason',
                value: reason || `cancelled by ${this.name}`
            })
            soRecord.save({
                enableSourcing: true,
                ignoreMandatoryFields: true
            })
        }

        /**
         * 
         * @param {String} itemids 
         */
        getItemInfo(params) {
            const link = url.resolveScript({
                scriptId: 'customscript_get_item_fields',
                deploymentId: 'customdeploy1',
                returnExternalUrl: true,
                params: params
            })

            const resp = https.get({ url: link })
            if (resp.code == 200) {
                return JSON.parse(resp.body)
            } else {
                throw new Error(`Faild to get Item info ${JSON.params} due to ${resp.body}`)
            }
        }

        /**
         * Mainly used for transfer price string to float
         * 
         * @param {String} numbStr 
         */
        numberStringToFloat(numbStr) {
            return format.parse({
                type: format.Type.FLOAT,
                value: numbStr
            })
        }

        /**
         * Get primary keys from fields mapping for comparison between old and new product data 
         * could potaitially be working for product and offer
         * 
         * @param {String} type
         * 
         * @return {Array}
         */
        getPrimaryKeys(obj) {
            var keys = []
            if (!_.isEmpty(obj)) {
                keys = Object.keys(obj).map(k => k.split('.')[0])
            }

            return _.uniq(keys)
        }

        /**
         * Get fulfillment data by saved search
         * search result includes: order status, fulfilled item fulfilled quantity, shipping address, carrier, tracking number
         * 
         * @param {String|Number} salesOrderId
         * 
         * @return {Object}
         */
        getFulfillmentDetails(salesOrderId) {
            log.debug('salesOrderId', `get fulfillments for ${salesOrderId}`)
            const fulfillments = []
            let status;
            search.create({
                type: 'salesorder',
                filters: [
                    ['internalid', 'is', salesOrderId],
                    'AND',
                    ['mainline', 'is', 'F'],
                    'AND',
                    ['shipping', 'is', 'F'],
                    'AND',
                    ['taxline', 'is', 'F'],
                    'AND',
                    ['fulfillingtransaction.type', 'is', 'ItemShip'] // CustInvc for invoice
                ],
                columns: [
                    'tranid',
                    'statusref',
                    'custbody_close_reason',
                    'item',
                    'item.type',
                    'item.custitem_avt_total_packages',
                    'quantity',
                    'fulfillingtransaction',
                    'quantityshiprecv',
                    'line',
                    'custbody8',
                    'transhippeddate',
                    'fulfillingtransaction.packagecount',
                    'fulfillingtransaction.trackingnumbers',
                    'fulfillingtransaction.lastmodifieddate',
                    'fulfillingtransaction.shipmethod',
                    'fulfillingtransaction.shipzip',
                    'fulfillingtransaction.custbody_avt_ifs_tot_items_shipped',
                    'fulfillingtransaction.custbody_avt_ifs_connote_num',
                    'fulfillingtransaction.custbody_avt_ifs_shipcarrier',
                ]
            }).run().each(result => {
                log.debug('fulfillment result', result);
                // if (['InvtPart', 'Kit'].includes(result.getValue({name: 'type', join: 'item'}))) {
                const fulfillment = {}
                status = result.getValue('statusref')
                fulfillment.sku = this.getSKU(result.getText('item'))
                for (const col of result.columns) {
                    fulfillment[col.name] = result.getValue(col)
                    fulfillment[`${col.name}_text`] = result.getText(col)
                }
                if (fulfillment.transhippeddate) {
                    fulfillment.dispatch_moment = this.getDispatchMoment(fulfillment.transhippeddate)
                }
                // log.debug('fulfillment', fulfillment)
                let trackingNumbers = fulfillment.custbody_avt_ifs_connote_num || fulfillment.trackingnumbers.replace('<BR>', ',');
                if (_.toUpper(fulfillment.shipmethod_text).startsWith('SAME DAY')) {
                    const matched = fulfillment.custbody8.match(/\d+/)
                    if (_.isEmpty(matched)) {
                        throw new Error(`${this.name} ${result.getValue('tranid')} with status ${status} ${fulfillment.shipmethod_text} missing tracking number in field CARRIER TRACKING NUMBER`)
                    } else {
                        trackingNumbers = matched[0]
                    }
                }
                // log.debug('trackingNumbers', trackingNumbers)
                const trackingDetails = this.getTrackingDetails(
                    fulfillment.custbody_avt_ifs_shipcarrier, fulfillment.shipmethod, fulfillment.shipmethod_text,
                    trackingNumbers, fulfillment.shipzip
                )

                fulfillments.push({ ...fulfillment, ...trackingDetails })
                // } else {
                // log.audit(`item type is excluded`, `${result.getText('item')} ${result.getValue({name: 'type', join: 'item'})}`)
                // }
                return true;
            });

            // order is closed
            if (fulfillments.length == 0 && _.isEmpty(status)) {
                const salesorderStatus = this.getSalesorderStatus(salesOrderId)
                status = salesorderStatus.status;
                fulfillments.push({
                    custbody_close_reason: salesorderStatus.custbody_close_reason,
                    tranid: salesorderStatus.tranid
                })
            }
            // log.debug('status', status)
            // log.debug('fulfillments', fulfillments)

            return {
                status, fulfillments
            }
        }

        getSalesorderStatus(salesOrderId) {
            const results = search.lookupFields({
                type: 'salesorder',
                id: salesOrderId,
                columns: ['statusref', 'custbody_close_reason', 'tranid']
            })
            log.debug('getSalesorderStatus', results)
            // {"statusref":[{"value":"closed","text":"Closed"}],"custbody_close_reason":"test","tranid":"SO447720"}
            return {
                status: results.statusref[0].value,
                custbody_close_reason: results.custbody_close_reason,
                tranid: results.tranid
            }
        }

        getInvoiceDetails(salesOrderId) {
            // const savedsearch = search.load(1998)
            // log.debug('filters', savedsearch.filterExpression)
            // log.debug('columns', savedsearch.columns)

            log.debug('salesOrderId', `get invoices for ${salesOrderId}`)

            const invoices = []
            let status;
            search.create({
                type: 'salesorder',
                filters: [
                    ["internalidnumber", "equalto", salesOrderId],
                    "AND",
                    ["mainline", "is", "F"],
                    "AND",
                    ["shipping", "is", "F"],
                    "AND",
                    ["taxline", "is", "F"],
                    "AND",
                    ["billingtransaction.type", "anyof", "CustInvc"]
                ],
                columns: [
                    { "name": "tranid" },
                    { "name": "statusref" },
                    { "name": "entity" },
                    { "name": "account" },
                    { "name": "billeddate" },
                    { "name": "billingtransaction" },
                    { "name": "datecreated", "join": "billingTransaction", "label": "invoicedatecreated" },
                    { "name": "tranid", "join": "billingTransaction", "label": "invoicetranid" },
                    { "name": "total", "join": "billingTransaction", "label": "invoicetotal" },
                    { "name": "taxtotal", "join": "billingTransaction", "label": "invoicetaxtotal" },
                    { "name": "shippingamount", "join": "billingTransaction", "label": "invoiceshippingamount" },
                    { "name": "item", "join": "billingTransaction", "label": "invoiceitem" },
                    { "name": "memo", "join": "billingTransaction", "label": "invoiceitemmemo" },
                    { "name": "rate", "join": "billingTransaction", "label": "invoiceitemrate" },
                    { "name": "quantity", "join": "billingTransaction", "label": "invoiceitemquantity" },
                    { "name": "grossamount", "join": "billingTransaction", "label": "invoicegrossamount" },
                    { "name": "taxamount", "join": "billingTransaction", "label": "invoicetaxamount" },
                    { "name": "netamount", "join": "billingTransaction", "label": "invoicenetamount" },
                ]
            }).run().each(result => {
                log.debug('invoice result', result)
                const invoice = {}
                status = result.getValue('statusref')
                for (const col of result.columns) {
                    invoice[col.label || col.name] = result.getValue(col)
                    invoice[`${col.label || col.name}_text`] = result.getText(col)
                }
                invoice.sku = this.getSKU(invoice.invoiceitem_text)
                if (invoice.invoicedatecreated) {
                    invoice.invoice_moment = this.getDispatchMoment(null, invoice.invoicedatecreated)
                }
                // log.debug('invoice', invoice)

                invoices.push(invoice)
                return true;
            });

            // when order is closed
            if (invoices.length == 0 && _.isEmpty(status)) {
                const salesorderStatus = this.getSalesorderStatus(salesOrderId)
                status = salesorderStatus.status;
                invoices.push({
                    custbody_close_reason: salesorderStatus.custbody_close_reason,
                    tranid: salesorderStatus.tranid
                })
            }
            // log.debug('status', status)
            // log.debug('invoices', invoices)

            return {
                status, invoices
            }
        }

        /***
         * Change date to Australia/Melbourne datetime
         * 
         * @param {String} dateStr
         * 
         * @return {Object} moment instance
         */
        getDispatchMoment(dateStr, datetimeStr) {
            // const dateTimeObj = format.parse({
            //     value: `${dateStr} 18:00:00 PM`,
            //     // type: format.Type.DATE,
            //     type: format.Type.DATETIMETZ,
            //     timezone: format.Timezone.AUSTRALIA_SYDNEY
            // }) not working
            // log.debug('moment format', moment(`1/6/2021 8:00:00 AM`, 'D/M/YYYY h:m:s a').format())
            // log.debug('moment format tz', moment.tz(`1/6/2021 8:00:00 PM`, 'D/M/YYYY h:m:s a', 'Australia/Melbourne').format())
            // const dateObj = format.parse({
            //     value: dateStr,
            //     type: format.Type.DATE,
            // });
            // // dateTimeObj
            // const dateTimeObj = new Date()
            // dateTimeObj.setTime(dateObj.getTime() + 18 * 60 * 60 * 1000)
            // log.debug(`format dateTime ${typeof dateTimeObj}`, {dateStr, dateTimeObj})
            // log.debug('iso string', dateTimeObj.toISOString())
            const str = datetimeStr ? datetimeStr : `${dateStr} 18:00:00`;
            log.debug('date str', str)
            let formatStr = 'D/M/YYYY h:m:s';
            if (str.toUpperCase().endsWith('M')) formatStr = 'D/M/YYYY h:m:s a';
            log.debug('formatstr', formatStr)
            const dispatchMoment = moment.tz(str, formatStr, 'Australia/Melbourne')
            log.debug('dispatchMoment', dispatchMoment.format())
            log.debug('dispatchMoment utc', dispatchMoment.utc().format())
            return dispatchMoment
        }

        /**
         * Get ifsCarrier data, return carrier name, tracking number and tracking url
         * 
         * @param {String|Number} ifsCarrierId 
         * @param {String|Number} shipmethodId 
         * @param {String} shipmethodName 
         * @param {String} trackingNumbers 
         * @param {String} shipzip 
         * 
         * @return {Object}
         */
        getTrackingDetails(ifsCarrierId, shipmethodId, shipmethodName, trackingNumbers = '', shipzip) {
            let tracking = {
                carrier_name: shipmethodName,
                tracking_number: trackingNumbers,
                tracking_url: ''
            }, ifsCarrier = [];
            if (ifsCarrierId || shipmethodId) {
                const filters = [['isinactive', 'is', 'F']]
                if (ifsCarrierId) {
                    filters.push('AND')
                    filters.push(['internalid', 'is', ifsCarrierId])
                } else if (shipmethodId) {
                    filters.push('AND')
                    filters.push(['custrecord_avt_ifs_ship_method_car', 'is', shipmethodId])
                }

                ifsCarrier = this.getRecordValuesFromSearch({
                    type: 'customrecord_avt_ifs_carrier',
                    filters: filters,
                    columns: ['name', 'custrecord_avt_ifs_carriername', 'custrecord_avt_ifs_ship_method_car', 'custrecord_avt_ifs_carrier_web']
                })
            }
            log.debug('ifsCarrier', ifsCarrier)
            if (!_.isEmpty(ifsCarrier)) {
                // get shipmethodName(shipmethod_text) first, then IFS carrier name/value
                const carrierName = ifsCarrier[0].data.custrecord_avt_ifs_ship_method_car.value == shipmethodId ? shipmethodName : (ifsCarrier[0].data.custrecord_avt_ifs_carriername.text || ifsCarrier[0].data.custrecord_avt_ifs_carriername.value)
                if (ifsCarrier[0].data.name.value.toUpperCase().startsWith('AUSTRALIA POST') || ifsCarrier[0].data.name.value.toUpperCase().startsWith('AUS POST')) {
                    tracking = {
                        carrier_name: 'Australia Post',
                        tracking_number: trackingNumbers,
                        tracking_url: ifsCarrier[0].data.custrecord_avt_ifs_carrier_web.value + trackingNumbers
                    }
                } else {
                    tracking = {
                        carrier_name: carrierName,
                        tracking_number: trackingNumbers,
                        tracking_url: `${ifsCarrier[0].data.custrecord_avt_ifs_carrier_web.value}&tracking-numbers=${trackingNumbers}&tracking_postal_code=${shipzip}`
                    }
                }
            } else {
                if (shipmethodId == '34995') { // SAME DAY - VIC [ALLIED]
                    tracking = {
                        carrier_name: 'Allied Express',
                        tracking_number: trackingNumbers,
                        tracking_url: `https://track.aftership.com/trackings?courier=alliedexpress&tracking-numbers=${trackingNumbers}&tracking_postal_code=${shipzip}`
                    }
                } else if (shipmethodId == '34263') { // SAME DAY - VIC [Civic]
                    tracking = {
                        carrier_name: 'Civic',
                        tracking_number: trackingNumbers,
                        tracking_url: 'https://www.civic.com.au/Home/'
                    }
                } else if (shipmethodId == '34261') { // Winning
                    tracking = {
                        carrier_name: 'Winning',
                        tracking_number: trackingNumbers,
                        tracking_url: 'https://www.winningservices.com.au/'
                    }
                }
            }

            if (tracking && tracking.carrier_name) {
                tracking.carrier_name_original = tracking.carrier_name
                const fulfillmentMapping = JSON.parse((this.record_values.custrecord_dealer_api_mgmt_fufil_mapping.value) || '{}')
                if (fulfillmentMapping.carrier) {
                    const found = fulfillmentMapping.carrier.carriers.find(carrier => {
                        const carrierArr = carrier.split(':').map(c => {
                            return c.replace(/\s/g, '').toUpperCase()
                        })
                        // const markupCarrier = tracking.carrier_name.match(/[a-zA-Z\s\d]+/)[0].replace(/\s/g, '').toUpperCase();
                        const markupCarrier = tracking.carrier_name.replace(/\s/g, '').toUpperCase();
                        return carrierArr.includes(markupCarrier)
                    })
                    tracking.carrier_name = found ? found.split(':')[0] : fulfillmentMapping.carrier.default;
                }
            }
            log.debug('tracking', tracking)
            return tracking;
        }

        /**
         * check item mapping between external sku and sku in Netsuite
         * 
         * @param {Object} param0 
         * 
         * @return {Object}
         */
        getItemMapping({ real, fake }) {
            // log.debug('real fake', `${real} --- ${fake}`)
            if (this.field_mapping.items) {
                if (real) {
                    const found = _.find(this.field_mapping.items, { real: real })
                    return { real: real, fake: found ? found.fake : real }
                } else if (fake) {
                    const found = _.find(this.field_mapping.items, { fake: fake })
                    return { real: found ? found.real : fake, fake: fake }
                }
            } else {
                return null;
            }
        }

        /**
         * get freight options
         * 
         * @param {Object} options 
         */
        getFreightOptions(options) {
            let results;
            const freightUrl = url.resolveScript({
                scriptId: 'customscript_get_freight_options_v3',
                deploymentId: 'customdeploy2',
                returnExternalUrl: true,
                params: {
                    source: `dealer_api_${this.name}`,
                    location: _.isEmpty(this.location) ? '15' : this.location.join(','),
                    ...options
                }
            });
            log.debug('freightUrl', freightUrl)
            let respCode = 0, count = 4;
            do {
                try {
                    const freightResp = https.get({ url: freightUrl })
                    respCode = freightResp.code
                    if (freightResp.code == 200) {
                        log.debug('freightResp.bddy', freightResp.body)
                        const freightOptions = JSON.parse(freightResp.body)
                        results = _.pick(freightOptions, ['item', 'item_qty', 'regular_opts', 'cheapest_opt'])
                    }
                } catch (error) {
                    log.error('getFreightOptions Error', error);
                }
                count--
            } while (respCode != 200 && count >= 0);

            return results;
        }

        /**
         * Generate customer / order object from dealer order object basing on field mapping
         * 
         * @param {String} type 
         * @param {Object} order 
         */
        fetchNSValues(type, order, overrideLineItems = false) {
            let recordValues = {}
            if (this.field_mapping[type]) {
                for (const key in this.field_mapping[type]) {
                    const el = this.field_mapping[type][key]
                    const elValue = this.getObjValues(el, order);
                    // if ((nonEmptyFields[type] && nonEmptyFields[type].includes(key) == false) && elValue !== '') {
                    //     _.set(recordValues, key, elValue)
                    // }

                    if (nonEmptyFields[type]) {
                        if (nonEmptyFields[type].includes(key)) {
                            if (elValue !== '') {
                                _.set(recordValues, key, elValue)
                            }
                        } else {
                            _.set(recordValues, key, elValue)
                        }
                    } else {
                        _.set(recordValues, key, elValue)
                    }
                }
            } else {
                log.error('missing field mapping', type)
            }

            if (type == 'order') {
                // add freight item if discount on freight is true
                // manually add freight item
                // use NDS Freight Per Item if the dealer freight is NDS
                if (this.discount_on_freight) {
                    if ('shippingcost' in recordValues) {
                        recordValues = _.omit(recordValues, 'shippingcost')
                    }
                }

                if (!overrideLineItems) {
                    // add subtotal and commission item at last
                    if (this.discount_item) {
                        // subtotal
                        recordValues.item.push({
                            item: -2
                        })

                        // comission
                        recordValues.item.push({
                            item: this.discount_item
                        })
                    }
                }

                if (this.subcustomer) {
                    recordValues = _.omit(recordValues, ['shipaddresslist', 'shippingaddress'])
                }
            }

            if (type == 'customer') {
                if (this.subcustomer) {
                    recordValues.parent = this.customer
                }
            }

            return recordValues
        }

        /**
         * return value basing on field mapping settings (type, default value, formula, etc)
         * 
         * @param {Object} el 
         * @param {Object} _INPUT_ 
         */
        getObjValues(el, _INPUT_) {
            let value;
            try {
                if (el.type == 'static') {
                    value = el.value
                } else if (el.path) {
                    value = _.get(_INPUT_, el.path)
                } else if (el.type == 'list') {
                    const arr = []
                    for (let i = 0; i < el.elements.length; i++) {
                        const elelObj = {}
                        for (const key in el.elements[i]) {
                            const val = el.elements[i][key]
                            _.set(elelObj, key, this.getObjValues(val, _INPUT_))
                        }
                        arr.push(elelObj)
                    }
                    value = arr;
                } else if (el.type == 'formula') {
                    if (el.name) {
                        value = _.get(_INPUT_, el.name)
                    } else if (el.formula) {
                        value = eval(el.formula)
                    }
                }
            } catch (error) {
                log.error(error.message, el)
                throw new Error(error.message)
            }

            if (_.isEmpty(value) && el.default_value) {
                value = el.default_value
            }

            return value;
        }

        /**
         * require getItemStock() first
         */
        validateProduct() {
            const failed = [], passed = [];
            if (this.items) {
                this.items.forEach(itemData => {
                    const reason = []
                    util.each(itemData.product, (value, key) => {
                        // log.debug(key, value)
                        // log.debug('product[key]', this.field_mapping.product[key])
                        if (this.field_mapping.product[key]) {
                            if (this.field_mapping.product[key].required) {
                                if (value == undefined || value == null || value == '') {
                                    reason.push(`product key [${key}] is required`)
                                }
                            }
                            if (this.field_mapping.product[key].max_length) {
                                if (value.length > this.field_mapping.product[key].max_length) {
                                    reason.push(`prodcut key [${key}] is over allowed maxium length`)
                                }
                            }
                        } else {
                            log.audit(`missing product key [${key}]`, { key, value })
                        }
                    })
                    log.debug(`reason ${reason.length}`, reason)
                    if (reason.length > 0) {
                        failed.push({ itemData, reason })
                    } else {
                        passed.push(itemData)
                    }
                })
            } else {
                throw new Error('missing items, getItemsFromSearch and getItemStock first')
            }
            log.debug('failed vs passed', `${failed.length} vs ${passed.length}`)
            return { failed, passed }
        }

        /**
         * Get item stock quantity by appling inventory formula
         * run getItemsFromSearch first return to this.items then run getItemStock to add stock to each item
         * attach quantity, inventory_original and quantity_original to this.items
         */
        getItemStock() {
            log.debug('inventory_formula', this.inventory_formula)

            const inventoryUrl = url.resolveScript({
                scriptId: 'customscript_bulk_inventory',
                deploymentId: 'customdeploy1',
                returnExternalUrl: true,
                params: {
                    item_key_type: 'internalid',
                    source: `dealerApiMgmt_${this.id}_${this.name}`,
                    location: _.isEmpty(this.location) ? '' : this.location.join(','),
                    matrix_option: 'y'
                }
            }); // need to get items first by getItemsFromSearch()
            const itemInternalids = this.items.map(item => { return item.item.internalid.value });
            let respCode = 200, count = 4;
            do {
                try {
                    const resp = https.post({
                        url: inventoryUrl,
                        body: JSON.stringify({
                            item_keys: itemInternalids.join(',')
                        })
                    });
                    log.debug("check inv url", resp);
                    if (resp.code == 200) {
                        const inventoryBody = JSON.parse(resp.body);
                        this.items.forEach(item => {
                            item.item.quantity = { value: 0 };
                            const found = inventoryBody.inventory.find(inventory => inventory.internalid == item.item.internalid.value)
                            if (found) {
                                item.item.inventory_original = found.inventory;
                                item.item.quantity_original = found.quantity_available;
                                item.item.matrix_options = found.matrix_options;
                                if (found.enforce_stock_buffer) {
                                    if (this.inventory_formula.length == 1 && this.inventory_formula[0].key == 'all') {
                                        item.item.quantity.value = this.applyFormula(found.quantity_available, this.inventory_formula[0].formula);
                                    } else if (this.inventory_formula.length >= 2) {
                                        this.location.forEach(loc => {
                                            const foundLocInventory = this.inventory_formula.find(invent => invent.key == loc);
                                            const foundItemInventory = found.inventory.find(itemInvent => itemInvent.inventory_location_id == loc);
                                            if (foundLocInventory) {
                                                item.item.quantity.value += this.applyFormula(foundItemInventory.location_quantity_available, foundLocInventory.formula);
                                            }
                                        })
                                    } else {
                                        log.error('no inventory formula', `no inventory formula for dealer api mgmt ${this.id}_${this.name}`)
                                    }
                                } else {
                                    item.item.quantity.value = found.quantity_available;
                                    // log.audit('check inventory '+item.item.sku.value, item.item.quantity.value)
                                }
                            } else {
                                log.error(`no inventory for item`, `no inventory item ${item.item.name.value}_${item.item.internalid.value} for dealer ${this.id}_${this.name}`)
                            }
                        })
                    } else {
                        respCode = resp.code
                    }
                } catch (error) {
                    log.error('inventory request error', `Error when ${this.name} make inventory request,
                    details: ${inventoryUrl}
                    ${itemInternalids}`)
                    respCode = -1;
                }
                count--
            } while (respCode != 200 && count >= 0);

        }

        /**
         * Apply formula to give number
         * 
         * @param {Number} _QTY_ 
         * @param {String} formula 
         */
        applyFormula(_QTY_, formula) {
            let qty = 0
            // log.debug(formula.length, formula)
            formula = formula.replace('&gt;', '>').replace('&lt;', '<').replace('&le;', '<=').replace('&ge;', '>=');
            // log.debug(formula.length, formula)
            const matched = formula.match(/^(.*?)([>|>=|<|<=]{1,2})(\d+)\s*\?(.*?)\:(.*?)$/)
            // '_QTY_>=4? (_QTY_-= 4; _QTY_ *= 70/100;) : 0'.match(/^(.*?)([>|>=|<|<=]{1,2})(\d+)\s*\?(.*?)\:(.*?)$/)
            // ["_QTY_>=4? (_QTY_-= 4; _QTY_ *= 70/100;) : 0", "_QTY_", ">=", "4", " (_QTY_-= 4; _QTY_ *= 70/100;) ", " 0"]
            if (matched) {
                switch (matched[2]) {
                    case '>=':
                        qty = _QTY_ >= parseFloat(matched[3]) ? eval(matched[4]) : 0;
                        break;
                    case '<':
                        qty = _QTY_ < parseFloat(matched[3]) ? 0 : eval(matched[4]);
                        break;
                    case '<=':
                        qty = _QTY_ <= parseFloat(matched[3]) ? 0 : eval(matched[4]);
                        break;
                    default:
                        qty = _QTY_ > parseFloat(matched[3]) ? eval(matched[4]) : 0;
                }
            } else {
                eval(formula);
            }
            // eval(formula)
            // return _QTY_ > 0 ? Math.floor(_QTY_) : 0;
            return qty > 0 ? Math.floor(qty) : 0;
        }

        /**
         * NEVER USED, IT CAN BE DONE BY GET BULKY STOCK WITH #MATRIX_OPTION=Y#
         */
        getItemsWithMatrixOptions() {
            this.items.forEach(item => {
                if (item.item.matrix.value) {
                    const itemRecord = record.load({
                        type: item.item.record_type.value,
                        id: item.item.internalid.value
                    });

                    const lineCount = itemRecord.getLineCount('matrixmach');
                    const itemOptions = itemRecord.getText('itemoptions');
                    log.debug('item options', itemOptions); // like ['Colour', 'Size']

                    // product options format
                    // "options": [{"name": "Color","values": ["Blue","Black"]},{"name": "Size","values": ["155","159"]}]

                    if (itemOptions && itemOptions.length > 0) {
                        item.item.options = new Array();
                        item.item.child_options = new Array();

                        // get all matrix options, colour, size etc.
                        for (let j = 0; j < itemOptions.length; j++) {
                            item.item.options.push({
                                name: itemOptions[j]
                            });
                        }
                        // for each matrix option, get child internalid, matrix option value, option index
                        for (let i = 0; i < lineCount; i++) {
                            // get each matrix child internalid
                            const matrixOption = {
                                child_id: _.toString(itemRecord.getSublistValue({
                                    sublistId: 'matrixmach',
                                    fieldId: 'mtrxid',
                                    line: i
                                }))
                            };
                            log.debug('matrixOption', matrixOption)
                            // important, here I assume sequence in item options array is always same as options in children item list
                            // for each item option, find option index, and option value like mtrxoption1: "Green"
                            for (let k = 0; k < itemOptions.length; k++) {
                                matrixOption[itemOptions[k]] = itemRecord.getSublistText({
                                    sublistId: 'matrixmach',
                                    fieldId: 'mtrxoption' + _.toString(k + 1),
                                    line: i
                                });
                                matrixOption['index'] = 'option' + _.toString(k + 1);
                                matrixOption['option'] = itemOptions[k];
                            }
                            log.debug('matrix option', matrixOption);
                            // {"child_id":"11760","Colour":"Blue","index":"option1","option":"Colour"}

                            item.item.child_options.push(matrixOption);
                        }
                    } else {
                        log.error('item options failed', 'get item options from ' + item.item.name.value + ' failed')
                        throw new Error('get item options failed from ' + item.item.name.value + ' failed');
                    }
                }
            })
        }

        /**
         * Get items by running saved search provided and get products by product mappings
         */
        getItemsFromSearch() {
            const searchInternalId = dealerApiRecord.getValue('custrecord_dealer_api_mgmt_item_search');

            if (searchInternalId) {
                const itemSearch = search.load({ id: searchInternalId })
                const searchCols = itemSearch.columns
                const items = [];
                itemSearch.run().each(r => {
                    // log.debug('r', r);
                    const item = {};
                    const product = {};
                    searchCols.forEach(col => {
                        item[col.label ? col.label : col.name] = { field: col.name, value: r.getValue(col), text: r.getText(col) }
                    });
                    // util.each(r.columns, (col) => item[col.label ? col.label : col.name] = { field: col.name, value: r.getValue(col), text: r.getText(col) })
                    item.internalid = { field: 'internalid', value: r.id }
                    item.record_type = { field: 'type', value: r.recordType };
                    // log.debug('item', item)
                    if (this.field_mapping.product) {
                        for (const key in this.field_mapping.product) {
                            const cp = this.field_mapping.product[key];
                            if (cp.type == 'formula' || cp.type == 'value' || cp.type == 'text') {
                                const itemKey = cp.name || cp.field;
                                const cpType = cp.type == 'text' ? 'text' : 'value';
                                if (item.hasOwnProperty(itemKey) || item.hasOwnProperty(key)) {
                                    let tosetValue = item.hasOwnProperty(itemKey) ? item[itemKey][cpType] : item[key][cpType];
                                    // _.set(product, key, tosetValue);
                                    this.constructor.setObjValue(product, key, tosetValue, cp)
                                } else {
                                    log.error(`missing column ${itemKey} in item ${item.sku.value}_${item.internalid.value}`, cp)
                                }
                            } else if (cp.type == 'list') {
                                const list = [];
                                for (let field of cp.fields) {
                                    if (item.hasOwnProperty(field)) {
                                        list.push(item[field].value)
                                    } else {
                                        log.error(`missing column or column value ${field} in ${item.sku.value}_${item.internalid.value}`, cp)
                                    }
                                }
                                // _.set(product, key, list);
                                this.constructor.setObjValue(product, key, _.compact(list), cp)
                            } else if (cp.type == 'static' || cp.type == undefined) {
                                // _.set(product, key, cp.value)
                                this.constructor.setObjValue(product, key, cp.value, cp)
                            } else {
                                log.error(`Not recorgise product key ${cp.type}`, cp)
                            }
                        }
                    } else {
                        throw new Error('missing product field mapping')
                    }

                    // if item missing sku
                    if (_.isEmpty(item.sku)) {
                        item.sku = {
                            field: "formulatext",
                            value: this.getSKU(item.name.value),
                            text: null
                        }
                    }
                    items.push({
                        item: item,
                        product: product
                    })

                    return true;
                });

                return items;
            } else {
                throw new Error('missing item search');
            }
        }

        /**
         * Form object with key and value
         * @param {Object} obj 
         * @param {String} path 
         * @param {String|Number|Object} value 
         * @param {Object} pm   to convert the value to require type basing pm.value_type
         */
        static setObjValue(obj, path, value, pm) {
            if (pm.value_type == 'number') {
                _.set(obj, path, parseFloat(value) || 0);
            } else if (pm.value_type == 'boolean') {
                _.set(obj, path, _.toUpper(value) == 'YES' ? true : false)
            } else if (pm.value_type == 'currency') { // with comma, like 10,000 in string format
                if (value) _.set(obj, path, format.format({ value, type: format.Type.CURRENCY }))
            } else {
                if (value) {
                    _.set(obj, path, value)
                } else {
                    if (pm.hasOwnProperty('default_value')) {
                        _.set(obj, path, pm.default_value)
                    }
                }
            }
        }

        /**
         * get dealer record value and return objec with {value and text}
         */
        getRecordValues() {
            const allFields = dealerApiRecord.getFields();
            // log.debug('allFields', allFields);
            const custFields = allFields.map(f => { if (f.startsWith('custrecord')) return f }).filter(Boolean);
            // log.debug('custFields', custFields)
            const recordValues = {};
            custFields.concat(['isinactive', 'name']).forEach(element => {
                recordValues[element] = {
                    value: dealerApiRecord.getValue(element),
                    text: dealerApiRecord.getText(element)
                }
            });

            return recordValues;
        }

        /**
         * turn invnetory rule from dealer api record to formula by parse rule provided
         * 
         * return with location id and formula apply to total inventory
         */
        getInventoryFormula() {
            // log.debug('dealerApiRecord', dealerApiRecord);
            // const raw = this.record.getValue('custrecord_dealer_api_mgmt_inventory_rul');
            const raw = dealerApiRecord.getValue('custrecord_dealer_api_mgmt_inventory_rul');
            // log.debug('raw', raw)
            if (raw) {
                const rawLocArr = raw.split(',');
                return rawLocArr.map(raw => {
                    return this.parseFormula(raw)
                });
            } else {
                return [{
                    key: 'all',
                    formula: '_QTY_',
                }];
            }
        }

        /**
         * parse inventory rule to formula fi else short hand (? :) with location id/s
         * @param {String} raw 
         */
        parseFormula(raw) {
            const rawArr = raw.split(':');
            // log.debug('rawArr', rawArr)
            if (rawArr.length > 1) {
                const formulaArr = [];
                for (let i = 2; i < rawArr.length; i++) {
                    formulaArr.push(this.parseCell(rawArr[i]))
                }
                // log.debug('formulaArr', formulaArr);

                // const gtMatched = rawArr[1].match(/>=?(\d+)/);

                // log.debug('gtMatched ' + rawArr[1], rawArr[1].toString().length)
                // for (let i = 0; i < rawArr[1].length; i++) {
                //     log.debug(i, rawArr[1][i]);
                // }
                // > is html tag &gt;
                // if (gtMatched && gtMatched[1]) {
                if (rawArr[1].startsWith('&')) {
                    return {
                        key: rawArr[0] || 'all',
                        formula: '_QTY_' + rawArr[1] + ' ? {' + formulaArr.join(' ') + '} : 0'
                    }
                } else {
                    formulaArr.unshift(this.parseCell(rawArr[1]))
                    log.debug('formulaArr', formulaArr)
                    return {
                        key: rawArr[0] || 'all',
                        formula: formulaArr.join(' ')
                    }
                }
            } else {
                throw new Error(`Dealer API Management ${this.name} has incorrect inventory rule ${raw}`)
            }
        }

        /**
         * deduct numbers or multiply the percenage
         * @param {String} cell 
         */
        parseCell(cell) {
            const ptMatched = cell.match(/(\d+)[p|P]{1}/);
            if (ptMatched && ptMatched[1]) {
                return '_QTY_ *= ' + ptMatched[1] + '/100;';
            }
            const dtMatched = cell.match(/(\d+)/);
            if (dtMatched && dtMatched[1]) {
                return '_QTY_ -= ' + dtMatched[1] + ';';
            }
        }

        /**
         * Send notice email
         * @param {Object} options 
         */
        noticeEmail(options) {
            const defaultOptions = {
                author: 16,
                recipients: ['sugito.r@gflgroup.com.au'],
                cc: ['sugito.r@gflgroup.com.au']
            }

            if (!options.recipients) {
                let emailArr = this.constructor.splitStrToArr(this.record_values.custrecord_dealer_api_mgmt_notice_receiv.value);
                if (!_.isEmpty(emailArr)) {
                    options.recipients = emailArr
                } else {
                    if (this.dealer) {
                        const cols = search.lookupFields({
                            type: 'customer',
                            id: this.dealer,
                            columns: ['salesrep']
                        })
                        log.debug('cols', cols)
                        const recip = cols?.salesrep[0]?.value
                        if (recip) {
                            options.recipients = [recip]
                        }
                    }
                }
            }

            let emailOptions = { ...defaultOptions, ...options }
            if (_.isEqual(emailOptions.recipients, emailOptions.cc)) {
                emailOptions = _.omit(emailOptions, ['cc'])
            }

            email.send(emailOptions)
        }

        /**
         * splict string to array using delimiter ; or ,/s
         * @param {String} str 
         */
        static splitStrToArr(str) {
            let arr = [];
            if (str.indexOf(',') > 0) {
                arr = str.split(',')
            } else if (str.indexOf(';') > 0) {
                arr = str.split(';')
            }

            return _.uniq(_.compact(arr));
        }

        /**
         * get result {text, value} by create search and run
         * @param {Object} options Search options {type, filters, columns}
         * 
         * @returns {Array}
         */
        getRecordValuesFromSearch(options) {
            const results = [];
            search.create(options).run().each(res => {
                // log.debug('res', res)
                const line = {
                    record_type: res.recordType,
                    record_id: res.id,
                    data: {}
                };
                const cols = res.columns
                cols.forEach(col => {
                    line.data[col.label || col.name] = {
                        text: res.getText(col),
                        value: res.getValue(col)
                    }
                })
                results.push(line);

                return true;
            })

            return results;
        }

        getRecordValuesOnlyFromSearch(options) {
            const searchResults = this.getRecordValuesFromSearch(options)
            return searchResults.map(result => {
                const values = {}
                for (const [key, value] of Object.entries(result)) {
                    if (key == 'data') {
                        for (const [dataKey, dataValue] of Object.entries(value)) {
                            values[dataKey] = dataValue.value
                        }
                    } else {
                        values[_.camelCase(key)] = value
                    }
                }
                return values
            })
        }

        /**
         * submit record Field in NS
         * @param {Object} options 
         */
        submitRecordFields(options) {
            try {
                record.submitFields({
                    ...options, ...{
                        options: {
                            enableSourcing: false,
                            ignoreMandatoryFields: true
                        }
                    }
                })
            } catch (error) {
                log.error(`submit record ${options.type} id ${options.id}`, error);
                const errMsg = `submit record ${options.type} id ${options.id} due to ${error.message}`;
                this.noticeEmail({ recipients: ['sugito.r@gflgroup.com.au'], subject: 'submit record error', body: errMsg })
                throw new Error(errMsg);
            }

        }

        /**
         * create / update record in NS with value and text
         * @param {object} param0 
         */
        createUpdateRecordWithText({ type, id, data }) {
            let recordObj;
            if (id) {
                recordObj = record.load({
                    type: type,
                    id: id,
                    isDynamic: true,
                })
            } else {
                recordObj = record.create({ type: type, isDynamic: true })
            }

            if (recordObj) {
                try {
                    util.each(data, (fv, key) => {
                        if (util.isArray(fv) && fv.length > 0) {
                            for (let i = 0; i < fv.length; i++) {
                                recordObj.selectNewLine(key);
                                const lv = fv[i];
                                util.each(lv, (lineValue, lineKey) => {
                                    if (util.isObject(lineValue)) {
                                        let sublistsubrecord = recordObj.getCurrentSublistSubrecord({
                                            sublistId: key,
                                            fieldId: lineKey
                                        });
                                        util.each(lineValue, (lvv, lvk) => {
                                            if (lvk.endsWith('@text')) {
                                                sublistsubrecord.setText({
                                                    fieldId: lvk.replace('@text', ''),
                                                    text: lvv
                                                });
                                            } else {
                                                sublistsubrecord.setValue({
                                                    fieldId: lvk,
                                                    value: lvv
                                                });
                                            }
                                        });
                                    } else {
                                        recordObj.setCurrentSublistValue({
                                            sublistId: key,
                                            fieldId: lineKey,
                                            value: lineValue
                                        });
                                    }
                                });
                                recordObj.commitLine(key);
                            }
                        } else if (util.isObject(fv)) {
                            let subrecord = recordObj.getSubrecord(key)
                            util.each(fv, function (fvv, fvk) {
                                if (fvk.endsWith('@text')) {
                                    subrecord.setText({
                                        fieldId: fvk.replace('@text', ''),
                                        text: fvv
                                    })
                                } else {
                                    subrecord.setValue({
                                        fieldId: fvk,
                                        value: fvv
                                    })
                                }
                            })
                        } else {
                            if (key.endsWith('@text')) {
                                recordObj.setText({
                                    fieldId: key.replace('@text', ''),
                                    text: fv
                                })
                            } else {
                                recordObj.setValue({
                                    fieldId: key,
                                    value: fv
                                });
                            }
                        }
                    });

                    const internalid = recordObj.save({
                        enableSourcing: true,
                        ignoreMandatoryFields: true
                    }); // return number
                    log.debug(`${id ? 'update' : 'new'} ${type} ${internalid || ''}`, data);
                    id = internalid
                    return { type, id }
                } catch (err) {
                    log.error('create ' + type + ' error', err);
                    this.noticeEmail({
                        subject: `Faid to create/load record ${type} ${id} due to ${err.name}`,
                        body: `${this.name}<br/><br/>${err.message}<br/><br/>${JSON.stringify(data)}`
                    })

                    throw new Error(`Faid to create/load record ${type} ${id} due to ${err.message}`)
                }
            } else {
                throw new Error(`Faild to create or load internalid ${id} for record ${type}`);
            }
        }

        /**
         * create / update record in NS
         * @param {object} param0 
         */
        createUpdateRecord({ type, id, data }) {
            let recordObj;
            if (id) {
                recordObj = record.load({
                    type: type,
                    id: id,
                    isDynamic: true,
                })
            } else {
                recordObj = record.create({ type: type, isDynamic: true })

                if (type == 'salesorder') {
                    data.externalid = `dealerapi|${this.name}|${data.memo || data.custbody1}`
                }
            }

            if (recordObj) {
                try {
                    util.each(data, (fv, key) => {
                        if (util.isArray(fv) && fv.length > 0) {
                            for (let i = 0; i < fv.length; i++) {
                                recordObj.selectNewLine(key);
                                const lv = fv[i];
                                util.each(lv, (lineValue, lineKey) => {
                                    if (util.isObject(lineValue)) {
                                        let sublistsubrecord = recordObj.getCurrentSublistSubrecord({
                                            sublistId: key,
                                            fieldId: lineKey
                                        });
                                        util.each(lineValue, (lvv, lvk) => {
                                            sublistsubrecord.setValue({
                                                fieldId: lvk,
                                                value: lvv
                                            });
                                        });
                                    } else {
                                        recordObj.setCurrentSublistValue({
                                            sublistId: key,
                                            fieldId: lineKey,
                                            value: lineValue
                                        });
                                    }
                                });
                                recordObj.commitLine(key);
                            }
                        } else if (util.isObject(fv)) {
                            let subrecord = recordObj.getSubrecord(key)
                            util.each(fv, function (fvv, fvk) {
                                subrecord.setValue({
                                    fieldId: fvk,
                                    value: fvv
                                })
                            })
                        } else {
                            recordObj.setValue({
                                fieldId: key,
                                value: fv
                            });
                        }
                    });
                    //new Code MW
                    var externalId = recordObj.getValue({ fieldId: 'externalid' });

                    log.debug({
                        title: 'externalId NEW',
                        details: externalId
                    });

                    if (externalId.toLowerCase().includes("amazon")) {

                        recordObj.setValue({
                            fieldId: 'shipmethod',
                            value: 25032   //Pickup - Broadmeadows, VIC
                        });
                        recordObj.setValue({
                            fieldId: 'ordertype',
                            value: 4   //AFD: General
                        });
                        log.debug({
                            title: 'Update Two Fields',
                            details: 'YES'
                        });

                    }
                    //end new Code

                    const internalid = recordObj.save({
                        enableSourcing: true,
                        ignoreMandatoryFields: true
                    }); // return number
                    log.debug(`${id ? 'update' : 'new'} ${type} ${internalid || ''}`, data);

                    id = internalid
                    // this.noticeEmail({
                    //     subject: `[Audit] ${this.name} create/update record ${type} ${id}`,
                    //     recipients: ['sugito.r@gflgroup.com.au'],
                    //     body: `${this.name}

                    //     ${JSON.stringify(data)}`
                    // })
                    return { type, id }
                } catch (err) {
                    log.error('create ' + type + ' error', err);
                    if (!id) { id = data.memo }
                    this.noticeEmail({
                        subject: `${this.name} Faid to create/update record ${type} ${id} due to ${err.name}`,
                        body: `${this.name}<br/><br/>${err.message}<br/><br/>${JSON.stringify(data)}`
                    })

                    throw new Error(`Faid to create/update record ${type} ${id} due to ${err.message}`)
                }
            } else {
                throw new Error(`Faild to create or update internalid ${id} for record ${type}`);
            }
        }

        getSKU(name) {
            const arr = name.split(' : ')
            return arr[arr.length - 1]
        }

        wait(second = 0.5) {
            const start = new Date().getTime();
            for (let i = 0; i < 1e7; i++) {
                if ((new Date().getTime() - start) > (second * 1000)) break;
            }
        }

        generateFile(options) {
            const fileObj = file.create({
                folder: this.dealer_folder,
                encoding: file.Encoding.UTF8,
                ...options
            })
            const id = fileObj.save()

            return {
                id,
                obj: file.load({ id })
            }
        }
    }

    // function dealerApiMgmt(id) {
    //     this.dealer_api_id = id;
    //     this.dealer_api_record = record.load({
    //         type: 'customrecord_dealer_api_management',
    //         id: id
    //     });
    //     this.all_fields = this.dealer_api_record.getFields();
    //     // this.inventory_formula = this.getInventoryFormula();
    // }
    // dealerApiMgmt.prototype.getInventoryFormula = function() {
    //     var raw = this.dealer_api_record.getValue('custrecord_dealer_api_mgmt_inventory_rul');
    //     log.debug('raw', raw)
    //     if (raw) {
    //         var rawLocArr = raw.split(',');
    //         return _.map(rawLocArr, this.parseFormula(raw));
    //     } else {
    //         return [{
    //             key: 'all',
    //             formula: '_QTY_',
    //         }];
    //     }
    // }
    // dealerApiMgmt.prototype.parseFormula = function(raw) {
    //     var rawArr = raw.split(':');
    //     if (rawArr.length > 1) {
    //         var formulaArr = [];
    //         for (var i = 2; i < rawArr.length; i++) {
    //             formularArr.push(this.parseCell(rawArr[i]))
    //         }
    //         var gtMatched = rawArr[1].match(/>=?(\d+)/);
    //         if (gtMatched && gtMatched[1]) {
    //             return {
    //                 key: rawArr[0] || 'all',
    //                 formula: '_QTY_' + rawArr[1] + ' ? (' + formulaArr.join(' ') + ') : 0'
    //             }
    //         } else {
    //             return {
    //                 key: rawArr[0] || 'all',
    //                 formula: formulaArr.unshift(this.parseCell(rawArr[1])) && formulaArr.join(' ')
    //             }
    //         }
    //     } else {
    //         throw new Error('Dealer API Management ' +this.dealer_api_record.getValue('name') + '  has incorrect inventory rule ' + raw)
    //     }
    // }
    // dealerApiMgmt.prototype.parseCell = function(cell) {
    //     var dtMatched = cell.match(/(\d+)/);
    //     if (dtMatched && dtMatched[1]) {
    //         return '_QTY_ -= ' + dtMatched[1] + ';';
    //     }
    //     var ptMatched = cell.match(/(\d+)[p|P]{1}/);
    //     if (ptMatched && ptMatched[1]) {
    //         return '_QTY_ *= ' + ptMatched[1] + ';';
    //     }
    // }

    class dealerOrderLog extends dealerApiMgmt {

        constructor(dealerId, logFields, logInternalid, logValues) {
            super(dealerId)
            this.order_log_record_type = logFields.order_log_record_type
            this.order_log_fields = logFields.order_log_fields
            this.logInternalid = logInternalid
            this.logValues = logValues

            if (this._.isEmpty(this.logValues)) {
                const recValues = this.getRecordValuesOnlyFromSearch({
                    type: this.order_log_record_type,
                    filters: [
                        ['internalid', 'is', this.logInternalid]
                    ],
                    columns: this.order_log_fields
                })
                log.debug('recValues', recValues)
                this.logValues = this._.omit(recValues[0], ['recordType', 'recordId'])
            }

            if (!this.logInternalid) {
                this.save()
            }
        }

        update(values) {
            util.each(values, (v, k) => {
                this.logValues[k] = v
            })

            this.submitRecordFields({
                type: this.order_log_record_type,
                id: this.logInternalid,
                values
            })
        }

        save() {
            const existing = this.searchExisting({
                type: this.order_log_record_type,
                filters: [
                    ['name', 'is', this.logValues.name]
                ],
                columns: this.order_log_fields
            })
            // log.debug('existing order log', existing)
            if (existing) {
                const { recordType, recordId, ...logValues } = existing;
                this.logInternalid = recordId
                // update
                this.logValues = { ...logValues, ...this.logValues }
                this.update(this.logValues)
            } else {
                const { type, id } = this.createUpdateRecord({
                    type: this.order_log_record_type,
                    id: this.logInternalid,
                    data: this.logValues
                })

                this.logInternalid = id
            }
        }
    }

    class XML2JSON {
        constructor(str) {
            this.xmlString = str
        }

        parse() {
            this.xmlDoc = xml.Parser.fromString(this.xmlString)
        }
    }

    return {
        dealer_api_mgmt: dealerApiMgmt,
        dealerOrderLog,
        XML2JSON
    }
});

