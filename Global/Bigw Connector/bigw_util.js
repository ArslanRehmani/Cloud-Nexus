/**
 * bigw_util.js
 * @NApiVersion 2.x
 */

 define(['/SuiteScripts/G 2.0/lodash_amd_v4.17.10.min', './libraryG2'], function(_, lg) {

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

    function _bigwOrder(orderData, test) {

        this.test = test || false;
        this.errors = [];
        this.data = orderData;

        if (util.isObject(orderData)) {
            var orderData = this.getOrderData();
            log.debug('orderData', orderData);

            this.salesOrderId = this.createSalesOrder(orderData);
        } else {
            log.error('invalid order data type, must be JSON/object', orderData);
            this.errors.push('invalid order data type, must be JSON/object');
        }

        return {
            errors: this.errors,
            order_number: this.data.order_number,
            salesorder: this.salesOrderId,
            test_env: this.test,
        };
    }

    _bigwOrder.prototype.getOrderData = function () {
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

        var itemData = this.getOrderItems();

        var salesOrderFieldValue = {
            "customform": "118",
            "entity": "1731415", // Big W Australia
            // "entity": "588032",
            "custbody_dkd_special_instructions": "authority to leave : " + (this.data.authority_to_leave ? 'Yes' : 'No'),
            "memo": this.data.order_number,
            "shippingcost": 0,
            "shippingtaxcode": "7",
            "shipmethod": "13712", // best available
            "location": "15",
            "item": itemData,
            // 'shipaddress':"test\n17 fordson rd\nCampbellfield VIC 3061\nAustralia",
            // 'billaddress':"test\n17 fordson rd\nCampbellfield VIC 3061\nAustralia", // only set addrtxt, strange
            'shipaddresslist': null,
            'shippingaddress': addressData
        }

        var freightOpt = this.getFreight(itemData, addressData);

        if (freightOpt && freightOpt.rates[0]) {
            if (freightOpt.rates[0].location) {
                salesOrderFieldValue.location = freightOpt.rates[0].location.inventory_location_id;
            }
            salesOrderFieldValue.shippingcost = freightOpt.rates[0].rate;
            // salesOrderFieldValue.shipmethod = freightOpt.shipitem;
        }

        return salesOrderFieldValue;
    }

    _bigwOrder.prototype.getFreight = function(itemData, addressData) {
        var itemids = _.map(itemData, function(id) {
            return id.item + '*' + id.quantity;
        });

        var opts = lg.getFreightOptions(itemids.join(','), null, addressData.zip, addressData.city);
        if (opts) {
            return opts.regular_opts[0];
        } else {
            return null;
        }
    }

    _bigwOrder.prototype.getOrderItems = function() {
        var itemData = [];
        var self = this;
        util.each(self.data.orderLines.orderLine, function(orderLine) {

            var itemInternalId = orderLine.style_id;
            if (self.test) {
                var foundTest = _.find(testItemMarkup, {key: itemInternalId});
                log.debug('foundTest', foundTest);
                if (foundTest) {
                    itemInternalId = foundTest.value;
                }
            }

            itemData.push({
                item: itemInternalId,
                quantity: orderLine.order_line_quantity,
                price: '35', // '35'
                taxcode: 7,
            });
        });

        return itemData;
    }

    _bigwOrder.prototype.createSalesOrder = function (salesOrderData) {
        var res = lg.createUpdateRecord('salesorder', null, salesOrderData);
        log.debug('create_big_order_salesorder ' + this.data.order_number, res);
        if (res.error) {
            this.errors.push(res.error);
        }

        return res.record_internalid;
    }

    function _bigwCustomer(orderData) {
        this.errors = [];
        this.data = orderData;

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

        customerPayload = {
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
        this.customerId = this.createUpdateCustomer(customerPayload);

        return {
            errors: this.errors,
            order_number: this.data.order_number,
            customer: this.customerId
        }
    }

    _bigwCustomer.prototype.createUpdateCustomer = function (customerObj) {
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

        return res.record_internalid;
    }
 
    return {
        _bigwOrder: _bigwOrder,
        _bigwCustomer: _bigwCustomer,
    }
 })