/**
 * bigw_lib.js
 * @NApiVersion 2.x
 */

define([
        'N/search',
        'N/sftp',
        './libraryG2',
        '/SuiteScripts/G 2.0/moment-with-locales-timezones.min',
        '/SuiteScripts/G 2.0/lodash_amd_v4.17.10.min',
        'N/url',
        '/SuiteScripts/G 2.0/papaparse.min',
        'N/email',
        'N/format',
        'N/record',
        'N/file'
    ],

    function (search, sftp, lg, moment, _, url, papaparse, email, format, record, file) {

        var bigwLogRecord = {
            id: 'customrecord_bigw_order_log',
            fields: [
                'internalid',
                'name',
                'isinactive',
                'custrecord_bigw_order_consignment_number',
                'custrecord_bigw_order_customer',
                'custrecord_bigw_order_salesorder',
                'custrecord_bigw_order_fulfilled',
                'custrecord_bigw_order_fulfilled_items',
                'custrecord_bigw_order_source_code',
                'custrecord_bigw_order_shipment_code',
            ]
        }

        var bigwProdAccount = '4224001';

        var carrierData = [{
            carrier: 'Allied Express',
            website: 'http://www.alliedexpress.com.au/',
            tracking_url: '',
        }, {
            carrier: 'Australia Post Express',
            website: 'https://auspost.com.au/mypost/track/#/search',
            tracking_url: 'https://auspost.com.au/mypost/track/#/details/',
        }, {
            carrier: 'Australia Post',
            website: 'https://auspost.com.au/mypost/track/#/search',
            tracking_url: 'https://auspost.com.au/mypost/track/#/details/',
        }, {
            carrier: 'Bluestar',
            website: 'http://www.bluestarlogistics.com.au/index.html',
            tracking_url: '',
        },{
            carrier: 'Borders Express',
            website: 'https://bexonline.borderexpress.com.au/Home/QuickTrack',
            tracking_url: '',
        }, {
            carrier: 'TNT',
            website: 'https://www.tntexpress.com.au/interaction/Trackntrace.aspx',
            tracking_url: '',
        }, {
            carrier: 'Winning',
            website: 'https://www.winningservices.com.au/',
            tracking_url: '',
        }];

        function getRealSKU(styleId) {
            var items = [{
                style_id: 'CWOUTDOORKITCHE',
                ns_sku: 'CWOUTDOORKITCHEN'
            }, {
                style_id: 'BYDSUNNYDALE-SE',
                ns_sku: 'BYDSUNNYDALE-SET'  
            }, {
                style_id: 'PEWARRIGAL-SET-',
                ns_sku: 'PEWARRIGAL-SET-YEL'
            }];

            util.each(items, function(item) {
                if (styleId == item.style_id) {
                    styleId = item.ns_sku;
                }
            });

            return styleId;
        }

        function bigwSFTP(scope) {

            this.scopeDirs = {
                order: {
                    default: 'orders/',
                    archive: 'orders/archive/',
                    error: 'orders/error/'
                },
                inventory: {
                    default: 'inventory/',
                    archive: 'inventory/archive/',
                    error: 'inventory/error/',
                },
                shipment: {
                    default: 'shipments/',
                    archive: 'shipments/archive/',
                    error: 'shipments/error/',
                }
            }

            this.conn = null;
            var connectionOptions = {
                url: 'ftp.bigw-online.net',
                port: 22,
                hostKey: 'AAAAB3NzaC1yc2EAAAADAQABAAABAQCFE+LUqFXMiw6Qa9heRBhcaSgTromYSxJUZHmfj8OBeP2srI4mBF0H/DuJY4pnQO6Bd0muSOZwELQ5LxmXKvlpo1ldn3JStGlQFdONliMAVe15VgGUbHcS9EgeGKRsf16F9hH8riYJa5UnOLjljahJkSau0CM1N73Tc5lIPszNqK7OKkkxWp3m+NsccJgQVkUXbMN2EyEHBOeOtjNIqwbJwTeizlAUMjutZRF7QQYIATKJNOaGwaw+YBYAHml1QnXDUi3bGz/5e9wFYX5S3L0jLOJfvsTtQOLmArMd3i5GgtEL95HpSOiwMfdpkFTIgYMwOhtwDHrrtU2F8My3jsnH',
                hostKeyType: 'rsa',
                username: 'prod_4224001',
                // username: 'uat2_84320009',
                // keyId: 'custkey1',
                keyId: 'custkey_bigw_sft_private',
            }
            if (scope) {
                connectionOptions.directory = this.scopeDirs[scope].default
            }
            this.conn = sftp.createConnection(connectionOptions);
            log.debug('conn obj', this.conn);
            // {"MAX_TRANSFER_TIMEOUT":300,"MAX_FILE_SIZE":100000000}
        }

        bigwSFTP.prototype.listDir = function (dir) {
            var listOption = {
                path: ''
            };
            if (dir) {
                listOption.path = dir;
            }
            try {
                var paths = this.conn.list(listOption);
                // log.debug('paths', paths);
            } catch (error) {
                log.error('listroot error', error)
            }

            return paths || [];
        }

        // [{
        //     "directory": false,
        //     "name": "errorupload_inventory_84320009_20200207171445.csv",
        //     "size": 87,
        //     "lastModified": "2020-02-07T06:50:47.000Z"
        // }, {
        //     "directory": false,
        //     "name": "errorupload_inventory_84320009_20200207180010.csv",
        //     "size": 87,
        //     "lastModified": "2020-02-07T06:50:40.000Z"
        // }, {
        //     "directory": false,
        //     "name": "errorupload_inventory_84320009_20200305170318.csv",
        //     "size": 384,
        //     "lastModified": "2020-03-05T06:04:06.000Z"
        // }, {
        //     "directory": false,
        //     "name": "errorupload_inventory_84320009_20200306091843.csv",
        //     "size": 401,
        //     "lastModified": "2020-03-05T22:23:21.000Z"
        // }]

        bigwSFTP.prototype.generateFileName = function (scope) {
            var nowString = moment().tz('Australia/Melbourne').format('YYYYMMDDHHmmss');
            return [scope, bigwProdAccount, nowString].join('_');
        }

        bigwSFTP.prototype.download = function (options) {
            return this.conn.download(options);
        }

        bigwSFTP.prototype.upload = function (file) {
            this.conn.upload({
                file: file,
                replaceExisting: true
            });
        }

        bigwSFTP.prototype.getFileContentJSON = function (fileObj) {
            var data = papaparse.parse(fileObj.getContents(), {
                header: true
            }).data;
            // log.debug('fileobj data', data);
            // return _.dropRight(data);
            return data;
        }

        bigwSFTP.prototype.move = function(source, dest) {
            this.conn.move({
                from: source,
                to: dest
            });
        }


        var testItemMarkup = [
            { key: 'VIMPBMMRW', value: '11462',}, // rower306
            { key: 'DVS24256', value: '555',}, // SILSPRAY
            { key: 'VIMPFPMRW', value: '4615',}, // TMCOVER-S
            { key: '2COOL SR', value: '13875',}, // PEWOMBATPLUS
            { key: '1214584', value: '16363',}, // KAYAK
            { key: 'STM16230', value: '16365',}, // PADBOARD
            { key: 'VIMPBG16RW', value: '12902'}, // MATGYM15
            { key: 'STM16220', value: '13716'}, // MATYOGA14BLU
            { key: '4COOL SR', value: '7869'}, // BANDRESIST-13mm

        ];

        function bigwOrder(orderData, test) {
            this.test = test || false;
            this.version = 0.1;
            this.internalidSort = search.createColumn({
                name: 'internalid',
                sort: search.Sort.DESC
            });
            this.errors = [];
            this.logId = null;
            this.customerId = null;
            this.salesOrderId = null;
            this.orderNumber = orderData.order_number;

            if (util.isObject(orderData)) {
                this.data = orderData;
                var existingRecord = lg.SearchExistingRecord(
                    bigwLogRecord.id,
                    [
                        ['isinactive', 'is', 'F'], 'AND', ['name', 'is', this.data.order_number]
                    ],
                    _.concat(this.internalidSort, bigwLogRecord.fields)
                );
                if (existingRecord.length === 0) {
                    // to save the log first
                    this.logId = this.createUpdateLog(null, {
                        name: this.data.order_number,
                        custrecord_bigw_order_consignment_number: this.data.consignment_number,
                        custrecord_bigw_order_source_code: JSON.stringify(this.data),
                    });
                    var customerOrderData = this.getCustomerOrderData();
                    log.debug('customerorderdata', customerOrderData);
                    this.customerId = this.createUpdateCustomer(customerOrderData.customer);
                    this.orderId = this.createSalesOrder(customerOrderData.salesorder);
                } else if (existingRecord.length === 1) {
                    this.logId = existingRecord[0].internalid;
                    if (lg.isEmpty(existingRecord[0].custrecord_bigw_order_customer)) {
                        this.customerId = this.createUpdateCustomer(this.getCustomerData().customer);
                    } else {
                        this.customerId = existingRecord[0].custrecord_bigw_order_customer;
                    }
                    if (lg.isEmpty(existingRecord[0].custrecord_bigw_order_salesorder)) {
                        this.salesOrderId = this.createSalesOrder(this.getSalesOrderData().salesorder);
                    } else {
                        this.salesOrderId = existingRecord[0].custrecord_bigw_order_salesorder;
                    }
                } else {
                    // existingRecord.length > 1
                    log.error('duplicated order', this.data.order_number);
                    // notice email
                    lg.emailNotice({
                        recipients: [16],
                        subject: 'duplicated bigw order ' + this.data.order_number,
                        body: 'duplicated bigw order ' + this.data.order_number,
                    });
                    this.errors.push('duplicated orders for ' + this.data.order_number);
                }
            } else {
                this.data = {};
                log.error('invalid order data type, must be JSON/object', orderData);
                this.errors.push('invalid order data type, must be JSON/object');
            }

            return {
                errors: this.errors,
                log_id: this.logId,
                order_number: this.data.order_number,
                customer: this.customerId,
                salesorder: this.salesOrderId,
                test_env: this.test,
            };
        }

        bigwOrder.prototype.createUpdateLog = function (logid, logData) {
            var res = lg.createUpdateRecord(bigwLogRecord.id, logid, logData);
            log.debug('create_big_order_log ' + this.data.order_number, res);
            if (res.error) {
                this.errors.push(res.error);
            }

            return res.record_internalid;
        }

        bigwOrder.prototype.getCustomerData = function() {
            var customerInfo = this.data.customer;
            var customerFirstName = customerInfo.first_name || customerInfo.business_name;
            var customerFullName = customerFirstName + ' ' + customerInfo.last_name;
            var addressInfo = this.data.shipmentAddress;
            var stateShortForm = lg.getStateShortName(addressInfo.state);

            var customerPhone = lg.formatPhone(customerInfo.contact_number, stateShortForm);

            var addressData = {
                addressee: customerFullName,
                addr1: addressInfo.street1,
                addr2: addressInfo.street2,
                addrphone: customerPhone,
                city: addressInfo.suburb,
                state: stateShortForm, // must be short form
                zip: addressInfo.postcode,
                country: 'AU' // must be short form
            }

            var customerPayload = {
                email: customerInfo.email_address,
                phone: customerPhone,
                firstname: customerFirstName,
                lastname: customerInfo.last_name,
                parent: '861', // 6580 ONSELLER,
                custentity_bigw_customer_order: this.data.order_number,
                addressbook: [
                    // {
                    //     defaultbilling: false,
                    //     defaultshipping: true,
                    //     phone: '0312345678',
                    //     addrtext: 'John shipping\n3 Carson Dr\nBunya Queensland 4055\nAustralia' //doesn't work, Please enter value(s) for: Address
                    // },
                    {
                        defaultbilling: true,
                        defaultshipping: true,
                        addressbookaddress: addressData
                    },
                ]
                // defaultaddress: 'John Test\n3 Carson Dr\nBunya Queensland 4055\nAustralia' // doesn't work
            }

            return {
                customer: customerPayload,
                address_data: addressData
            }
        }

        bigwOrder.prototype.getSalesOrderData = function() {
            var addressData = this.getCustomerData().address_data;
            
            var itemData = this.getOrderItems();
            var nsItemData = _.map(itemData, function(item) {
                return _.pick(item, ['item', 'quantity', 'price', 'taxcode']);
            })
            var salesOrderFieldValue = {
                "customform": "118",
                "entity": "1731415", // Big W Australia
                "externalid": 'bigw|' + this.data.order_number,
                "custbody_dkd_special_instructions": "authority to leave : " + (this.data.authority_to_leave ? 'Yes' : 'No'),
                // "memo": this.data.order_number,
                "custbody1": this.data.order_number,
                "shippingcost": 0,
                "shippingtaxcode": "7",
                "shipmethod": "13712", // Allied Express
                "location": "15",
                "item": nsItemData,
                // 'shipaddress':"test\n17 fordson rd\nCampbellfield VIC 3061\nAustralia",
                // 'billaddress':"test\n17 fordson rd\nCampbellfield VIC 3061\nAustralia", // only set addrtxt, strange
                'shipaddresslist': null,
                'shippingaddress': addressData
            }

            var freight = this.getFreight(itemData, addressData);
            log.debug('freight', freight);
            var freightOpt = freight.freight_opt;
            salesOrderFieldValue.shippingcost = freight.shipping_cost;

            if (!_.isEmpty(freightOpt)) {
                if (freightOpt.location) {
                    salesOrderFieldValue.location = freightOpt.location.inventory_location_id;
                }
                // salesOrderFieldValue.shippingcost = freightOpt.rates[0].rate;
                // if (!freightOpt.premium) {
                    // salesOrderFieldValue.shipmethod = freightOpt.shipitem;
                // }
            }

            return {
                salesorder: salesOrderFieldValue
            };
        }

        bigwOrder.prototype.getCustomerOrderData = function () {

            return {
                customer: this.getCustomerData().customer,
                salesorder: this.getSalesOrderData().salesorder
            }
        }

        bigwOrder.prototype.getFreight = function(itemData, addressData) {

            var freight = {};

            var totalWeight = _.sum(_.map(itemData, function(id) {
                return Math.ceil(parseFloat(id.charge_weight)) * parseFloat(id.quantity);
            }));

            var itemids = _.map(itemData, function(id) {
                return id.item.toString() + '*' + id.quantity.toString()
            })

            var zone = null;
            var postcodeZones = JSON.parse(file.load('./bigw_postcode_zone.json').getContents());
            var addressDataZip = _.toString(parseInt(addressData.zip, 10));
            if (postcodeZones.hasOwnProperty(addressDataZip) && postcodeZones[addressDataZip]) {
                util.each(postcodeZones[addressDataZip], function(zoneV, suburbK) {
                    if (_.toUpper(addressData.city.replace(/\s/g, '')) == _.toUpper(suburbK.replace(/\s/g, ''))) {
                        zone = zoneV;
                    }
                });
                log.debug('zone', zone)
                if (zone) {
                    var zoneRates = JSON.parse(file.load({id: './bigw_zone_rates.json'}).getContents());
                    if (zoneRates.hasOwnProperty(zone) && !_.isEmpty(zoneRates[zone])) {
                        var currTier = zoneRates[zone];
                        var rate = currTier.rate;

                        while (totalWeight >= currTier.weight_start) {
                            var totalChargeWeight = totalWeight;
                            if (totalWeight <= 30) {
                                totalChargeWeight = 0
                            } else if (totalWeight > 30 && totalWeight <= 55) {
                                totalChargeWeight = totalWeight - 30
                            }
                            freight.shipping_cost = totalChargeWeight * (currTier.rate || rate) + currTier.basic
                            if (totalWeight <= currTier.weight_end) {
                                break;
                            } else {
                                if (currTier.hasOwnProperty('next')) {
                                    currTier = currTier.next
                                } else {
                                    break;
                                }
                            }
                        }
                        if (!freight.shipping_cost) {
                            log.error('shipping cost is 0 to zone ' + zone, itemData);
                            lg.emailNotice({
                                recipients: ['dropship@gflgroup.com.au'],
                                // recipients: ['sam@gflgroup.com.au'],
                                cc: [16],
                                subject: '[Notification] [bigw] ' + this.orderNumber + ' shipping cost is 0 to zone ' + zone,
                                body: 'please verify shipping cost is 0 to zone' + zone + ' for ' + addressData.city + ' ' + addressData.zip + '\n' + JSON.stringify(itemData) 
                            });
                        }
                    } else {
                        log.error('missing zone in bigw zone rates', zone);
                        lg.emailNotice({
                            recipients: ['dropship@gflgroup.com.au'],
                            // recipients: ['sam@gflgroup.com.au'],
                            cc: [16],
                            subject: '[Notification] missing zone rate ' + zone + ' in bigw zone rates',
                            body: 'Missing zone rate of ' + zone + ' for ' + addressData.city + ' ' + addressData.zip + ' and you can add it to file /Suitescripts/Bigw Connnector/bigw_zone_rates.json'
                        });
                        throw new Error('missing zone rate ' + zone + ' in bigw zone rates')
                    }
                } else {
                    log.error('no zone found', 'no zone found for ' + addressDataZip + ' ' + addressData.city);
                    lg.emailNotice({
                        recipients: ['dropship@gflgroup.com.au'],
                        // recipients: ['sam@gflgroup.com.au'],
                        cc: [16],
                        subject: '[Notification] no zone found for ' + addressDataZip + ' ' + addressData.city,
                        body: 'no zone found for ' + addressDataZip + ' ' + addressData.city + ' and you can add it to file /Suitescripts/Bigw Connnector/bigw_postcode_zone.json'
                    });
                    throw new Error('no zone found for ' + addressDataZip + ' ' + addressData.city)
                }
            } else {
                log.error('missing postcode in bigw postcode zones', addressDataZip);
                lg.emailNotice({
                    recipients: ['dropship@gflgroup.com.au'],
                    // recipients: ['sam@gflgroup.com.au'],
                    cc: [16],
                    subject: '[Notification] missing postcode ' + addressDataZip + ' in bigw order ' + this.orderNumber + ' postcode zones',
                    body: 'missing postcode ' + addressDataZip + ' in bigw postcode zones, and you can add it to file /Suitescripts/Bigw Connnector/bigw_postcode_zone.json'
                });
                throw new Error('missing postcode ' + addressDataZip + ' in bigw postcode zones');
            }

            var opts = lg.getFreightOptions(itemids.join(','), null, addressDataZip, addressData.city);
            if (opts && opts.cheapest_opt) {
                // if (_.isEmpty(opts.regular_opts)) {
                //     // return _.isEmpty(opts.premium_opts) ? null : opts.premium_opts[0];
                //     freight.freight_opt = _.isEmpty(opts.premium_opts) ? null : opts.premium_opts[0];
                // } else {
                //     // return opts.regular_opts[0];
                //     freight.freight_opt = opts.regular_opts[0];
                // }
                freight.freight_opt = opts.cheapest_opt
            }

            return freight;
        }

        bigwOrder.prototype.getOrderItems = function () {
            var itemData = [];
            var self = this;
            util.each(this.data.orderLines.orderLine, function (orderLine) {
                // style_id is sku in production environment
                // var itemInternalId = getRealSKU(orderLine.style_id);
                // var itemFields = lg.getItemFields(itemInternalId);
                var itemInternalId = null;
                var chargeWeight = null;
                
                if (self.test) {
                    var foundTest = _.find(testItemMarkup, {key: itemInternalId});
                    log.debug('foundTest', foundTest);
                    if (foundTest) {
                        itemInternalId = foundTest.value;
                    }
                } else {
                    // get sku / internalid by search upccode ean
                    var itemFound = lg.SearchExistingRecord(
                        'item', 
                        // [['isinactive', 'is', 'F'], 'AND', ['upccode', 'is', _.trim(orderLine.ean)]],
                        [['isinactive', 'is', 'F'], 'AND', ['custitem_bigw_itemid', 'is', _.trim(orderLine.product_code)]],
                        ['internalid', 'itemid', 'custitem_cubic_charge_weight']
                    );
                    log.debug('itemFound', itemFound);
                    if (_.isEmpty(itemFound)) {
                        // notice email
                        var errMsg = 'cannot find info for item upccode' + orderLine.ean + ' in order ' + self.orderNumber;
                        lg.emailNotice({
                            recipients: ['dropship@gflgroup.com.au'],
                            // recipients: ['sam@gflgroup.com.au'],
                            cc: [16],
                            subject: '[Notification] Cannot find item ' + orderLine.style_id  + ' in ' + self.order_number,
                            body: errMsg
                        });
                        throw new Error(errMsg);
                    } else {
                        itemInternalId = itemFound[0].internalid;
                        chargeWeight = itemFound[0].custitem_cubic_charge_weight;
                    }
                    // log.debug('itemInternalId', itemInternalId);
                }

                itemData.push({
                    item: itemInternalId,
                    quantity: orderLine.order_line_quantity,
                    price: '35',
                    taxcode: 7,
                    charge_weight: chargeWeight,
                });
            });

            return itemData;
        }

        bigwOrder.prototype.createSalesOrder = function (salesOrderData) {
            // to avoid uplicate, search the log for existing SO
            var results = search.lookupFields({
                type: bigwLogRecord.id,
                id: this.logId,
                columns: ['custrecord_bigw_order_salesorder']
            })
            if (results.custrecord_bigw_order_salesorder && results.custrecord_bigw_order_salesorder[0].value) {
                log.audit('existing salesorder', results)
            } else {
                var res = lg.createUpdateRecord('salesorder', null, salesOrderData);
                log.debug('create_big_order_salesorder ' + this.data.order_number, res);
                if (res.error) {
                    this.errors.push(res.error);
                    lg.emailNotice({
                        recipients: ['dropship@gflgroup.com.au'],
                        // recipients: ['sam@gflgroup.com.au'],
                        cc: [16],
                        subject: 'Error with create/update sales order for bigw ' + this.data.order_number,
                        body: res.error + '\n\n' + JSON.stringify(salesOrderData),
                    });
                }
                // update log
                if (res.record_internalid) {
                    this.createUpdateLog(this.logId, {
                        'custrecord_bigw_order_salesorder': res.record_internalid
                    })
                }

                return res.record_internalid;
            }
        }
        bigwOrder.prototype.createUpdateCustomer = function (customerObj) {
            // search exsting customer
            var existingRecord = lg.SearchExistingRecord(
                'customer',
                [
                    ['isinactive', 'is', 'F'], 'AND',
                    ['email', 'is', this.data.customer.email_address], 'AND',
                    ['parent', 'is', '861']
                ],
                [
                    this.internalidSort,
                    'phone',
                    'firstname',
                    'lastname',
                ]
            );
            if (existingRecord.length > 0) {
                var res = lg.createUpdateRecord('customer', existingRecord[0].internalid, customerObj);
                log.debug('update_big_order_customer ' + this.data.order_number, res);
            } else {
                var res = lg.createUpdateRecord('customer', null, customerObj);
                log.debug('create_big_order_customer ' + this.data.order_number, res);
            }
            if (res.error) {
                this.errors.push(res.error);
            }
            // update log
            if (res.record_internalid) {
                this.createUpdateLog(this.logId, {
                    'custrecord_bigw_order_customer': res.record_internalid
                })
            }

            return res.record_internalid;
        }

        function bigwInventory(test, itemKeys) {
            var testItems = [{
                    custitem_bigw_itemid: '411820',
                    internalid: '12345',
                    stock: 10
                },
                {
                    custitem_bigw_itemid: '411825',
                    internalid: '56789',
                    stock: 10
                },
                {
                    custitem_bigw_itemid: '411791',
                    internalid: '12345',
                    stock: 10
                },
                {
                    custitem_bigw_itemid: '102057',
                    internalid: '56789',
                    stock: 10
                },
                {
                    custitem_bigw_itemid: '102055',
                    internalid: '12345',
                    stock: 10
                },
                {
                    custitem_bigw_itemid: '250538',
                    internalid: '56789',
                    stock: 10
                },
                {
                    custitem_bigw_itemid: '803917',
                    internalid: '12345',
                    stock: 10
                },
                {
                    custitem_bigw_itemid: '805003',
                    internalid: '56789',
                    stock: 10
                },
                {
                    custitem_bigw_itemid: '7970764',
                    internalid: '12345',
                    stock: 10
                },
            ];
            if (test) {
                this.bigwItems = testItems;
                if (util.isArray(itemKeys) && itemKeys.length > 0) {
                    this.bigwItems = _.filter(testItems, function (ti) {
                        return _.indexOf(itemKeys, ti.custitem_bigw_itemid) >= 0;
                    });
                }
                this.itemInteralids = _.map(this.bigwItems, 'internalid');
            } else {
                this.bigwItems = this.getBigwItems(itemKeys);
                if (this.bigwItems.length > 0) {
                    this.itemInteralids = _.map(this.bigwItems, 'internalid');
                    this.bigwItems = this.appendItemStock();
                }
            }

            return {
                csv_contents: this.generateCSVContent(),
                item_internalids: this.itemInteralids,
                items: this.bigwItems,
            }
        }

        bigwInventory.prototype.getBigwItems = function (itemKeys) {
            var filters = [
                ['custitem_dealerstock_bigw', 'is', 'T']
            ];
            if (util.isArray(itemKeys) && itemKeys.length > 0) {
                filters.push('AND');
                filters.push(['custitem_bigw_itemid', 'anyof', itemKeys]);
            }
            var items = lg.SearchExistingRecord('item',
                filters,
                ['internalid', 'isinactive', 'itemid', 'type', 'custitem_bigw_itemid', 'custitem_stockoverride_bigw']
            );

            return items;
        }

        bigwInventory.prototype.getStock = function (itemInteralids) {
            var stockUrl = url.resolveScript({
                scriptId: 'customscript_get_bulk_item_inventory',
                deploymentId: 'customdeploy2',
                params: {
                    item_key_type: 'internalid',
                    item_keys: itemInteralids.join(','),
                    // location: '10,15',
                    location: '15',
                    source: 'bigw getStock'
                },
                returnExternalUrl: true
            });

            var stockResp = lg.requestUrl(stockUrl);
            if (stockResp.success && util.isArray(stockResp.body.inventory)) {
                return stockResp.body.inventory;
            } else {
                return [];
            }
        }

        bigwInventory.prototype.appendItemStock = function () {
            // var stockOverriderItemId = [];
            // stockOverriderItemId = ['11644', '34774', '36128'];
            // var stockOverriderBigwId = [];
            // stockOverriderBigwId = ['121003', '121007', '81542', '121014', '131119','166796','81546','131116','121009','131121', '81530', '166799'];
            var stockAllowrant = 2;
            var itemStocks = this.getStock(this.itemInteralids);
            var bigwItemsWithStock = _.map(this.bigwItems, function (item) {
                item.stock = 0;
                var found = _.find(itemStocks, {
                    internalid: item.internalid
                });
                if (found) {
                    item.stock = item.custitem_stockoverride_bigw ? 0 : (found.quantity_available_original - stockAllowrant > 0 ? found.quantity_available_original - stockAllowrant : 0);
                    // if (stockOverriderItemId.indexOf(item.internalid) >= 0) {
                    //     item.stock = 0;
                    // }
                    // if (stockOverriderBigwId.indexOf(item.custitem_bigw_itemid) >= 0) {
                    //     item.stock = 0;
                    // }
                }
                return item;
            });
            return bigwItemsWithStock;
        }

        bigwInventory.prototype.generateCSVContent = function () {
            if (this.bigwItems.length == 0) {
                return null;
            }

            var csvfileContent = 'warehouse,code,available,vendorStyleId\n';
            util.each(this.bigwItems, function (item) {
                csvfileContent += bigwProdAccount + ',' + item.custitem_bigw_itemid + ',' + item.stock.toString() + ',' + item.internalid + '\n';
            });

            return csvfileContent;
        }

        function bigwShipment(logData, test) {
            this.errors = [];
            this.logId = logData.internalid;
            this.logBody = logData;
            // this.existingItemFulfillments = [];
            // this.existingShipmentCodes = [];
            this.salesorderId = logData.custrecord_bigw_order_salesorder;
            this.salesOrderSource = JSON.parse(logData.custrecord_bigw_order_source_code);
            this.test = test || false;

            // var logUpdateFields = {};

            // if (!lg.isEmpty(logData.custrecord_bigw_order_fulfilled_items)) {
            //     this.existingItemFulfillments = JSON.parse(logData.custrecord_bigw_order_fulfilled_items);
            // }
            // if (!lg.isEmpty(logData.custrecord_bigw_order_shipment_code)) {
            //     this.existingShipmentCodes = JSON.parse(logData.custrecord_bigw_order_shipment_code);
            // }
            var allTrackings = this.getTrackingDetails();
            var status = allTrackings.status;
            if (status == 'fullyBilled' || status == 'closed' || status == 'pendingBilling') {
                // logUpdateFields.custrecord_bigw_order_fulfilled = 'T';
                this.logBody.custrecord_bigw_order_fulfilled = true;

                var allTrackingDetails = allTrackings.salesorder_tracking_details;

                // get fulfilled items, assuming process all the quantity for every item
                var fulfilledItems = this.getFulfilledItems(allTrackingDetails);
                log.debug('fulfilleditems', fulfilledItems);

                // no need this anymore check if fulfilled items logged,
                // var unUploaded = _.differenceBy(fulfilledItems, this.existingItemFulfillments, 'fulfillment_id');
                // log.debug('unUploaded', unUploaded);

                // logUpdateFields.custrecord_bigw_order_fulfilled_items = JSON.stringify(fulfilledItems);
                this.logBody.custrecord_bigw_order_fulfilled_items = JSON.stringify(fulfilledItems);

                // generate shipment object
                // var shipmentObj = this.generateShipment(unUploaded);
                if (status == 'closed') {
                    var shipmentObj = {
                        carrier_name: '',
                        consignment_number: this.logBody.custrecord_bigw_order_consignment_number,
                        no_of_parcels: 0,
                        shipment_lines: {
                            shipment_line: []
                        }
                    }
                    util.each(this.salesOrderSource.orderLines.orderLine, function(ol) {
                        var itemStyleId = ol.style_id;
                        if (this.test) {
                            var foundTest = _.find(testItemMarkup, {key: itemStyleId});
                            itemStyleId = foundTest.value;
                        }
                        log.debug('closed itemStyleId', itemStyleId);
    
                        shipmentObj.shipment_lines.shipment_line.push({
                            order_line_id: ol.order_line_id,
                            product_code: ol.product_code,
                            rejected_quantity: ol.order_line_quantity,
                            shipped_quantity: 0,
                        });
                    });
                    shipmentObj.shipped_date = this.getDateString((new Date()).toISOString());
                    shipmentObj.tracking_number = '';
                    shipmentObj.tracking_url = '';
        
                    var shipmentObj = {shipment: [shipmentObj]};
                } else {
                    var shipmentObj = this.generateShipment(fulfilledItems);
                }
                // if (shipmentObj) {
                //     this.existingShipmentCodes.push(shipmentObj);
                // }
                // logUpdateFields.custrecord_bigw_order_shipment_code = JSON.stringify(this.existingShipmentCodes);
                // this.logBody.custrecord_bigw_order_shipment_code = JSON.stringify(this.existingShipmentCodes);
                this.logBody.custrecord_bigw_order_shipment_code = JSON.stringify(shipmentObj);
                // update log record
                this.updateLog(logData.internalid, this.logBody);

                // log.debug('logBody', this.logBody);
            }

            return {
                log_data: this.logBody,
                errors: this.errors,
                shipment_content: shipmentObj || null,
            }
        }

        bigwShipment.prototype.updateLog = function (logid, logData) {
            var res = lg.createUpdateRecord(bigwLogRecord.id, logid, logData);
            log.debug('update_big_order_log ' + this.logBody.name, res);
            if (res.error) {
                this.errors.push(res.error);
            }

            return res.record_internalid;
        }

        bigwShipment.prototype.generateShipment = function(itemFulfillments) {
            var shipments = [];
            var self = this;
            util.each(itemFulfillments, function(iff){
                //{
                //     "fulfillment_id": "8244529",
                //     "shipmethod": "632",
                //     "shipmethod_name": "Australia Post",
                //     "trackingnumbers": "987654321<BR>123456789",
                //     "lastmodifieddate": "11/3/2020 4:55 PM",
                //     "items": [
                //         {
                //             "item_id": "555",
                //             "package": 1,
                //             "fulfilled_qty": 2,
                //             "qty": "2"
                //         }
                //     ]
                // }
                // {
                //     "carrier_name": "AUSPOST",
                //     "consignment_number": "consAUBWOD7259111_0",
                //     "no_of_parcels": 1,
                //     "shipment_lines": {
                //         "shipment_line": [
                //             {
                //                 "order_line_id": "0",
                //                 "product_code": "7343179",
                //                 "rejected_quantity": 2,
                //                 "shipped_quantity": 0
                //             }
                //         ]
                //     },
                //     "shipped_date": "2019-06-04 19:30:46",
                //     "tracking_number": "89457648116",
                //     "tracking_url": "https://www.auspost.com.au/tracking/89457648116"
                // }
                var shipmentObj = {
                    carrier_name: iff.shipmethod_name,
                    consignment_number: self.logBody.custrecord_bigw_order_consignment_number,
                    no_of_parcels: 1,
                    shipment_lines: {
                        shipment_line: []
                    }
                }
                var parcelNum = 0;

                // "orderLines" : {
                //     "orderLine" : [ {
                //       "order_line_id" : 0,
                //       "order_line_quantity" : 2,
                //       "product_code" : "250538",
                //       "style_id" : "DVS24256",
                //       "ean" : "9325336021293",
                //       "description" : "Smallville: Season 2",
                //       "colour" : null,
                //       "size" : null
                //     }, {
                //       "order_line_id" : 1,
                //       "order_line_quantity" : 1,
                //       "product_code" : "411825",
                //       "style_id" : "VIMPFPMRW",
                //       "ean" : "9316600556122",
                //       "description" : "VIP Sports Men's Focus Pads - Red",
                //       "colour" : null,
                //       "size" : null
                //     } ]
                //   }
                util.each(self.salesOrderSource.orderLines.orderLine, function(ol) {
                    // var itemStyleId = getRealSKU(ol.style_id); // sku
                    // if (self.test) {
                    //     var foundTest = _.find(testItemMarkup, {key: itemStyleId});
                    //     itemStyleId = foundTest.value;
                    // }
                    // log.debug('itemStyleId', itemStyleId);
                    // var foundItemLine = _.find(iff.items, {'item_sku': itemStyleId});
                    // var foundItemLine = _.find(iff.items, {'item_upccode': ol.ean});
                    var foundItemLine = _.find(iff.items, {'item_bigwid': ol.product_code});
                    log.debug('foundItemLine', foundItemLine);
                    if (foundItemLine) {
                        parcelNum += foundItemLine.fulfilled_qty * foundItemLine.package;
                        shipmentObj.shipment_lines.shipment_line.push({
                            order_line_id: ol.order_line_id,
                            product_code: ol.product_code,
                            rejected_quantity: ol.order_line_quantity - foundItemLine.fulfilled_qty ? null : 0,
                            shipped_quantity: foundItemLine.fulfilled_qty,
                        });
                    } else {
                        log.error('foundItemLine error', 'failed to find item ' + JSON.stringify(ol));
                        lg.emailNotice({
                            recipients: [16],
                            subject: 'Shipment error for bigw order ' + self.logBody.name,
                            body: 'Failed to find matched item for ' + self.logBody.name + '\r\n' + JSON.stringify(ol) + '\r\n' + JSON.stringify(iff),
                        })
                        shipmentObj.shipment_lines.shipment_line.push({
                            order_line_id: ol.order_line_id,
                            product_code: ol.product_code,
                            // rejected_quantity: ol.order_line_quantity,
                            // rejected_quantity: 0,
                            // shipped_quantity: 0,
                        }); 
                    }
                });

                // calc no_of_parcels;
                if (!_.isNaN(_.parseInt(iff.custbody_avt_ifs_tot_items_shipped))) {
                    shipmentObj.no_of_parcels = _.parseInt(iff.custbody_avt_ifs_tot_items_shipped);
                } else if (parcelNum) {
                    shipmentObj.no_of_parcels = parcelNum;
                }

                shipmentObj.shipped_date = self.getDateString(iff.lastmodifieddate);
                // shipmentObj.shipped_date = iff.transhippeddate; // this the dd/mm/yyy only, it requires dd/mm/yyyy hh:mm:ss
                shipmentObj.tracking_number = iff.trackingnumbers;
                shipmentObj.tracking_url = iff.tracking_url;

                shipments.push(shipmentObj);
            });

            if (shipments.length > 0) {
                return {
                    shipment: shipments
                };
            } else {
                return null;
            }
        }

        bigwShipment.prototype.getDateString = function(dateString){
            var dateObj = format.parse({type: format.Type.DATETIME, value: dateString});
            log.debug('date', dateObj);
            var dateString = moment(dateObj).tz('Australia/Melbourne').format('YYYY-MM-DD HH:mm:ss');
            log.debug('moment date', dateString);
            return dateString;
        }
 
        bigwShipment.prototype.getFulfilledItems = function(allTrackings) {
            var allFulfilledItems = _.compact(_.map(allTrackings, function(tracking) {
                if (tracking.fulfillingtransaction){
                    return tracking;
                }
            }));

            var fulfillments = [];
            var fulfillmentGroup = _.groupBy(allFulfilledItems, 'fulfillingtransaction');

            if (!_.isEmpty(fulfillmentGroup)) {
                util.each(fulfillmentGroup, function(gv, gk) {
                    var shipmethodName = gv[0].shipmethod_name.split(' (');
                    var foundCarrier = lg.getTrackingUrl(gv[0].custbody_avt_ifs_shipcarrier, gv[0].shipmethod);
                    var trackingUrl = '';
                    var trackingNumbers = gv[0].custbody_avt_ifs_connote_num || gv[0].trackingnumbers.replace('<BR>', ',');
                    if (foundCarrier) {
                        if (gv[0].shipmethod == '34248') {// australia post
                            trackingUrl = foundCarrier.custrecord_avt_ifs_carrier_web + trackingNumbers;
                        } else {
                            trackingUrl = foundCarrier.custrecord_avt_ifs_carrier_web + '&tracking-numbers=' + trackingNumbers + '&tracking_postal_code=' + gv[0].shipzip;
                        }
                    } else {
                        var tracking = gv[0].custbody8.match(/\d+/);
                        if (shipmethodName == 'Same Day - VIC [Allied]') {
                            trackingNumbers = _.isEmpty(tracking) ? '' : tracking[0];
                            // trackingUrl = 'https://track.aftership.com/trackings?courier=alliedexpress&tracking-numbers=' + trackingNumbers + '&tracking_postal_code=' + gv[0].shipzip;
                            trackingUrl = 'http://www.alliedexpress.com.au/';
                        } else if (shipmethodName == 'Same Day - VIC [Civic]') {
                            trackingNumbers = _.isEmpty(tracking) ? '' : tracking[0];
                            trackingUrl = 'https://www.civic.com.au/Home/';
                        }
                    }
                    var fulfill = {
                        fulfillment_id: gk,
                        shipmethod: gv[0].shipmethod,
                        shipmethod_name: foundCarrier ? foundCarrier.custrecord_avt_ifs_carriername : shipmethodName[0],
                        trackingnumbers: trackingNumbers,
                        tracking_url: trackingUrl,
                        lastmodifieddate: gv[0].lastmodifieddate,
                        transhippeddate: gv[0].transhippeddate,
                        packages: gv[0].custbody_avt_ifs_tot_items_shipped,

                        items: []
                    }
    
                    util.each(gv, function(itemv) {
                        fulfill.items.push({
                            item_id: itemv.item,
                            item_sku: itemv.item_sku,
                            item_upccode: _.trim(itemv.upccode),
                            item_bigwid: _.trim(itemv.custitem_bigw_itemid),
                            package: _.isNaN(_.parseInt(itemv.custitem_avt_total_packages)) ? 1 : _.parseInt(itemv.custitem_avt_total_packages),
                            fulfilled_qty: _.isNaN(_.parseInt(itemv.quantityshiprecv)) ? 1 : _.parseInt(itemv.quantityshiprecv),
                            qty: itemv.quantity,
                        });
                    });
    
                    fulfillments.push(fulfill);
                });
            }
            return fulfillments;
        }

        bigwShipment.prototype.getTrackingDetails = function () {
            var salesorderTrackingDetailsSearch = search.create( {
                type: 'salesorder',
                filters: [
                    ['internalid', 'is', this.salesorderId],
                    'AND',
                    ['mainline', 'is', 'F'],
                    'AND',
                    ['shipping', 'is', 'F'],
                    'AND',
                    ['taxline', 'is', 'F']
                ],
                columns: [
                    'tranid',
                    'statusref',
                    'transhippeddate',
                    'custbody8',
                    'custbody_avt_ifs_special_instructions1',
                    'item',
                    'item.custitem_avt_total_packages',
                    'item.upccode',
                    'item.custitem_bigw_itemid',
                    'quantity',
                    'fulfillingtransaction',
                    'quantityshiprecv',
                    'line',
                    'fulfillingtransaction.packagecount',
                    'fulfillingtransaction.trackingnumbers',
                    'fulfillingtransaction.lastmodifieddate',
                    'fulfillingtransaction.shipmethod',
                    'fulfillingtransaction.shipzip',
                    'fulfillingtransaction.custbody_avt_ifs_tot_items_shipped',
                    'fulfillingtransaction.custbody_avt_ifs_connote_num',
                    'fulfillingtransaction.custbody_avt_ifs_shipcarrier',
                ]
            });

            var searchColumns = salesorderTrackingDetailsSearch.columns;
            var salesorderTrackingDetails = [];
            var salesOrderStatus = '';
            salesorderTrackingDetailsSearch.run().each(function(result) {
                salesOrderStatus = result.getValue('statusref');
                var resultObj = {};
                util.each(searchColumns, function(sc) {
                    resultObj[sc.name] = result.getValue(sc);
                });
                resultObj.item_sku = lg.getSKU(result.getText('item'));
                resultObj.shipmethod_name = result.getText({name: 'shipmethod', join: 'fulfillingtransaction'});
                salesorderTrackingDetails.push(resultObj);
                return true;
            });
            log.debug('salesorderTrackingDetails', salesorderTrackingDetails);

            return {
                status: salesOrderStatus,
                salesorder_tracking_details: salesorderTrackingDetails
            };
        }

        function bigwError(scope, fileName, fileContent) {
            log.audit('cek fileContent', fileContent)
            var errorCode = {
                'INV01':'INV_INVALID_WAREHOUSECODE',
                'INV02':'INV_INVALID_PRODUCTCODE',
                'INV03':'INV_INVALID_STOCK',
                'INV04':'INV_MANDATORY_FIELD_MISSING',
                'SH01':'BIGW_INVALID_CONSIGNMENTNUMBER',
                'SH02':'BIGW_MANDATORY_FIELD_MISSING',
                'SH03':'BIGW_INVALID_CONSIGNMENTNUMBER',
                'SH04':'BIGW_MISMATCH_PRODUCTCODE_ORDERLINENUMBER',
                'SH05':'BIGW_MISMATCH_PRODUCTCODE_CONSIGNMENTNUMBER',
                'SH06':'BIGW_VENDOR_INCORRECT_OUTBOND_FORMAT',
                'SH07':'BIGW_ACCEPTEDQUANTITY_ERROR',
                'SH08':'BIGW_REJECTEDQUANTITY_ERROR',
                'SH09':'BIGW_ACCEPTEDANDREJECTEDQUANTITY_ERROR',
                'SH10':'BIGW_DUPLICATE_ORDERSHIPPINGINFO',
                'SH11':'BIGW_INVALID_PRODUCTCODE',
                'SH12':'BIGW_INVALID_TRACKINGURL',
                'SH13':'BIGW_INVALID_VENDOR_ID',
                'SH14':'BIGW_INVALID_SCHEMA',
                'SH15':'BIGW_INVALID_ERROR',
                'SH16':'BIGW_INVALID_ATTRIBUTE_VALUE_OR_MANDATORY_FIELD_VALUE_MISSING',
                'SH17':'BIGW_INVALID_SHIPPED_DATE',
            };
            if (scope == 'inventory') {
                var errorCodeKey = 'ErrorCode';
                var errorLineKey = 'SourceLine';
            } else if (scope == 'shipment') {
                var errorCodeKey = 'errorCode';
                var errorLineKey = 'ConsignmentId';
            }

            if (errorCodeKey && errorLineKey) {
                var errorGroups = _.groupBy(fileContent, errorCodeKey);
                var emailContents = 'Errors in ' + scope + ' upload\n';
                _.forEach(errorGroups, function(egv, egk) {
                    emailContents += 'The following items have error ' + (errorCode[egk] || 'UNKNOWN ERROR') + '\n';
                    _.forEach(egv, function(egvv, egvi) {
                        emailContents += egvv[errorLineKey] + '\n';
                    });

                    emailContents +='\n\n';
                });
                log.debug('emailcontents', emailContents);

                email.send({
                    author: 16,
                    //recipients: ['george.y@gflgroup.com.au', 'sam@gflgroup.com.au'],
                    recipients: ['sugito.r@gflgroup.com.au', 'sam@gflgroup.com.au'],
                    subject: 'Bigw Upload error: ' + fileName,
                    body: emailContents,
                    isInternalOnly: true,
                });
            }
        }

        function bigwShipmentError(consignmentNumber) {
            // find the log id by seach consignment number
            var orderLog = lg.SearchExistingRecord(
                bigwLogRecord.id,
                [['custrecord_bigw_order_consignment_number', 'is', consignmentNumber]],
                ['internalid', 'name']
            );

            if (orderLog.length < 1) {
                // no order has been created
            } else if (orderLog.length == 1) {
                var orderLogRecord = record.load({
                    type: bigwLogRecord.id,
                    id: orderLog[0].internalid
                });
                orderLogRecord.setValue({
                    fieldId: 'custrecord_bigw_order_fulfilled',
                    value: false
                });

                var logId = orderLogRecord.save();
                log.debug('logId', logId);
            } else {
                // duplicated orders
            }
        }

        return {
            bigwSFTP: bigwSFTP,
            bigwOrder: bigwOrder,
            bigwInventory: bigwInventory,
            _: _,
            log_records: bigwLogRecord,
            bigwShipment: bigwShipment,
            bigwError: bigwError,
            bigwShipmentError: bigwShipmentError,
        };

    });