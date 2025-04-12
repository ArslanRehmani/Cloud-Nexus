/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 * 
 * add contact to shopify as customer,
 * use addresses in customer record
 * set default address
 */
define(['N/search', 'N/runtime', './ShopifyLib_v2', 'N/record', 'N/format'],

function(search, runtime, ShopifyLib, record, format) {

    var customerTags = {
        custentity_bhbikes_dealer: 'brand_BH',
        custentity_eastern_dealer: 'brand_Eastern',
        custentity_brandaccess_bydpergola: 'brand_Bydliving',
        custentity_icon_dealer: 'brand_Icon',
        custentity25: 'brand_Progear',
        custentity_rocky_dealer: 'brand_Rocky',
        custentity_brandaccess_rockyc: 'brand_Rockycarbon',
        custentity_brandaccess_rockyeb: 'brand_Rockyelectric',
        custentity_brandaccess_rockyparts: 'brand_Rockypartaccessories',
        custentity_thruster_dealer: 'brand_Thruster',
        custentity_lifespandealer: 'brand_XDS',
        custentity_cortex_dealer: 'brand_Cortex',
        custentity23: 'brand_LifespanFitness',
        custentity_brandaccess_walkingpad: 'brand_Walkingpad',
        custentity_lsg_dealer: 'brand_LSG',
        custentity_reebok_dealer: 'brand_Reebok',
        custentity_jamis_dealer: 'brand_Jamis',
        custentity22: 'brand_LifespanKids',
        custentity_brandaccess_securacell: 'brand_Securacell',
        custentity_brandaccess_lsfdelta: 'brand_LifespanDelta',
        custentity_brandaccess_haro: 'brand_Haro',
        custentity_brandaccess_regen8: 'brand_Regen8',
        custentity_brandaccess_bikeaccessories: 'brand_bikeaccessories'
    }

    var pricelevelTags = {
        Dealer: 'dealer',
        Wholesale: 'wholesale',
        "Premium Dealer": 'premium-dealer',
        "Dealer Promo": 'dealer-promo'
    }

    var toggleTag = {
        custentity_shopify_gfl_b2b_dropship: 'Dropship',
        custentity_shopify_gfl_b2b_shiptostore: 'Shiptostore'
    }
    var now = new Date().getTime();
    var compareTime = now - 1000 * 60 * 60 * 2;
    
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
    function getInputData(inputContext) {
        //log.debug('input object', inputContext)
        var shopifyConnId = runtime.getCurrentScript().getParameter('custscript_shopify_customer_conn');
        log.debug('shopifyconnid', shopifyConnId);
        var contactId = runtime.getCurrentScript().getParameter('custscript_shopify_contact_id');
        log.debug('contactId', contactId)
        // to be compatible with old settings in user event customer_user_event.js (as we changed from customer to contact), here means contact
        var customerObj = JSON.parse(runtime.getCurrentScript().getParameter('custscript_shopify_customer_obj'));
        log.debug('customer', customerObj);
        var updateAll = runtime.getCurrentScript().getParameter('custscript_shopify_customer_update_all');
        log.debug('updateAll', updateAll)

        var connFields = search.lookupFields({
            type: 'customrecord_shopify_conn_settings',
            id: shopifyConnId,
            columns: [
                'name',
                'custrecord_shopify_conn_auth_key',
                'custrecord_shopify_conn_auth_password',
                'custrecord_shopify_conn_customer_field',
                'custrecord_shopify_conn_customer_id_fiel',
            ]
        });
        var customerIDField = connFields.custrecord_shopify_conn_customer_id_fiel;

        var customerArr = [];

        var customerColumns = [
            'internalid',
            'entityid',
            'firstname',
            'lastname',
            'company',
            'email',
            'phone',
            'lastmodifieddate',
            customerIDField,
            'customer.addressinternalid',
            'customer.address1',
            'customer.address2',
            'customer.address3',
            'customer.addressee',
            'customer.addressphone',
            'customer.attention',
            'customer.city',
            'customer.country',
            'customer.countrycode',
            'customer.companyname',
            'customer.pricelevel',
            'customer.state',
            'customer.statedisplayname',
            'customer.zipcode',
            'customer.isdefaultshipping',
            'customer.custentity_shopify_xds_customer_tags',
            {name:'lastmodifieddate', join: 'customer', label: 'customer_lastmodifieddate'},
            'customer.daysoverdue',
            {name:'firstname', join: 'customer', label: 'customer_firstname'},
            {name:'lastname', join: 'customer', label: 'customer_lastname'},
        ];
        util.each(customerTags, function(value, key) {
            customerColumns.push('customer.' + key)
        })

        util.each(toggleTag, function(value, key) {
            customerColumns.push('customer.' + key)
        })

        if (connFields.custrecord_shopify_conn_customer_field && customerIDField) {

            var customerFilters = [
                [connFields.custrecord_shopify_conn_customer_field, 'is', 'T'],
                // 'AND',
                // [customerIDField, 'isempty', null],
                'AND',
                ['isinactive', 'is', 'F'],
            ];

            if (contactId) {
                customerFilters.push('AND');
                customerFilters.push(['internalid', 'is', contactId])
            }

            if (customerObj && customerObj.id) {
                customerFilters.push('AND');
                customerFilters.push(['internalid', 'is', customerObj.id])
            }

            var customerSearch = search.create({
                type: (customerObj && customerObj.type) || 'contact',
                filters: customerFilters,
                columns: customerColumns
            });

            customerSearch.run().each(function(result) {
                var allColsArr = result.columns;
                var customerData = {
                    customer_id_field: customerIDField,
                    sl: {
                        name: connFields.name,
                        key: connFields.custrecord_shopify_conn_auth_key,
                        password: connFields.custrecord_shopify_conn_auth_password 
                    }
                };

                var customerFields = {};
                util.each(allColsArr, function(col, key) {
                    customerFields[col.label || col.name] = result.getText(col) || result.getValue(col);

                    if (col.name == 'company') {
                        customerFields.parent_customer_internalid = result.getValue(col)
                    }
                });
                // Get creditholdoverride value.
                customerFields['creditholdoverride'] = false;
                if(customerFields.parent_customer_internalid){
                    const customerFields1 = record.load({
                        type: 'customer',
                        id: customerFields.parent_customer_internalid,
                        isDynamic: false
                    });
                    customerFields['creditholdoverride'] = customerFields1.getValue('creditholdoverride')
                } else {
                    log.audit('Contact has no parent', customerFields)
                }

                customerData.customer = customerFields;
                log.debug('customerData', customerData)

                if (contactId) {
                    customerArr.push(customerData);
                } else if (customerObj && customerObj.id) {
                    customerArr.push(customerData);
                } else {
                    if (!updateAll && runtime.envType == 'PRODUCTION' 
                        && (customerFields.customer_lastmodifieddate || customerFields.lastmodifieddate)
                    ) {
                        var lastModifiedDateCustomer;
                        var lastModifiedDateContact;
                        if (customerFields.customer_lastmodifieddate) {
                            lastModifiedDateCustomer = format.parse({
                                value: customerFields.customer_lastmodifieddate,
                                type: format.Type.DATETIMETZ,
                                timezone: format.Timezone.AUSTRALIA_SYDNEY
                            });
                        }
                        if (customerFields.lastmodifieddate) {
                            lastModifiedDateContact = format.parse({
                                value: customerFields.lastmodifieddate,
                                type: format.Type.DATETIMETZ,
                                timezone: format.Timezone.AUSTRALIA_SYDNEY
                            });
                        }
                        
                        if (lastModifiedDateCustomer > compareTime || lastModifiedDateContact > compareTime) {
                            customerArr.push(customerData);
                        }
                    } else if (updateAll && runtime.envType == 'PRODUCTION') {
                        customerArr.push(customerData);
                    }
                }

                return true;
            });
        }

        return customerArr;
    }

    /**
     * Executes when the map entry point is triggered and applies to each key/value pair.
     *
     * @param {MapSummary} context - Data collection containing the key/value pairs to process through the map stage
     * @since 2015.1
     */
    function map(context) {
        // log.debug('map context key', context.key);
        // log.debug('map context value', context.value);
        var contextValue = JSON.parse(context.value);
        context.write({
            key: contextValue.customer.internalid,
            value: contextValue
        });
    }

    function updateNSContact(id, data) {
        log.debug('data', data);
        try {
            record.submitFields({
                type: 'contact',
                id: id,
                values: data,
                options: {
                    enableSourcing: false,
                    ignoreMandatoryFields : true
                }
            })
        } catch (error) {
            log.error('error when update contact ' + id + ' ' + JSON.stringify(data), error);
        }
    }

    /**
     * Executes when the reduce entry point is triggered and applies to each group.
     *
     * @param {ReduceSummary} context - Data collection containing the groups to process through the reduce stage
     * @since 2015.1
     */
    function reduce(context) {
        log.debug('reduce context key', context.key);
        log.debug('reduce context value', context.values);

        var contextValue = {};
        var customerDetails = {
            customer: {
                // phone: phoneString,
                verified_email: false,
                // verified_email: true,
                addresses: [],
                // send_email_invite: true,
                // tags: contextValue.custentity_shopify_xds_customer_tags,
            }
        };
        var customerMetafields = [];
        var shopifyCustomerId = '';
        util.each(context.values, function(cv, index) {
            var cvObj = JSON.parse(cv);
            if (index == 0) {
                contextValue.sl = cvObj.sl;
                contextValue.customer_id_field = cvObj.customer_id_field;

                customerDetails.customer.last_name = cvObj.customer.entityid
                customerDetails.customer.first_name = cvObj.customer.company;
                customerDetails.customer.email = cvObj.customer.email;

                var tagArr = [];
                if (cvObj.customer.custentity_shopify_xds_customer_tags) {
                    tagArr.push(cvObj.customer.custentity_shopify_xds_customer_tags);
                }

                util.each(customerTags, function(ctv, ctk) {
                    if (cvObj.customer.hasOwnProperty(ctk) && cvObj.customer[ctk]) {
                        tagArr.push(ctv);
                    }
                });

                util.each(toggleTag, function(ctv, ctk) {
                    if (cvObj.customer.hasOwnProperty(ctk)) {
                        cvObj.customer[ctk] ? tagArr.push(ctv+'On') : tagArr.push(ctv+'Off');
                    }
                });


                log.debug('tagarr', tagArr);

                // add pricelevel tag
                var pltag = pricelevelTags[cvObj.customer.pricelevel]
                if (pltag) tagArr.push(pltag)

                // add overdue tag
                // allow to add status-overdue tag if creditholdoverride not OFF (ON, AUTO, or EMPTY)
                if (cvObj.customer.daysoverdue && cvObj.customer.creditholdoverride !== 'OFF') {
                    if ((parseFloat(cvObj.customer.daysoverdue) || 0) > 60 && tagArr.indexOf('Status-Overdue') < 0) {
                        log.audit('executed', 'executed')
                        tagArr.push('Status-Overdue')
                    }
                }

                if (tagArr.length > 0) {
                    customerDetails.customer.tags = tagArr.join(',');
                }

                shopifyCustomerId = cvObj.customer[cvObj.customer_id_field];
                customerMetafields.push({
                    "key": "customer_internalid",
                    "value": cvObj.customer.parent_customer_internalid,
                    // "value_type": "string",
                    "type": "string",
                    "namespace": "netsuite"
                })
            }

            var customerAddress = {};
            customerAddress.address1 = cvObj.customer.address1;
            var restAddress = '';

            if (cvObj.customer.address2) {
                restAddress += cvObj.customer.address2;
            }
            if (cvObj.customer.address3) {
                restAddress += cvObj.customer.address3;
            }

            if (restAddress.trim()) {
                customerAddress.address2 = restAddress.trim();
            }
            customerAddress.city = cvObj.customer.city;
            customerAddress.company = cvObj.customer.companyname;                
            customerAddress.country = cvObj.customer.country;
            customerAddress.country_code = cvObj.customer.countrycode;
            customerAddress.default = cvObj.customer.isdefaultshipping;
            // if (cvObj.customer.attention) {
            //     customerAddress.first_name = cvObj.customer.attention;
            //     customerAddress.last_name = cvObj.customer.addressee;
            // } else {
            //     customerAddress.first_name = cvObj.customer.addressee;
            //     customerAddress.last_name = '';
            // }
            customerAddress.first_name = cvObj.customer.attention || cvObj.customer.addressee;
            customerAddress.last_name = cvObj.customer.addressinternalid;
            // customerAddress.phone = phoneString;
            customerAddress.province = cvObj.customer.statedisplayname; // full name
            customerAddress.province_code = cvObj.customer.state; // code
            customerAddress.zip = cvObj.customer.zipcode;

            customerDetails.customer.addresses.push(customerAddress);
        });
        
        if (contextValue.sl.name && contextValue.sl.key && contextValue.sl.password) {
            var SL = new ShopifyLib(contextValue.sl.name, contextValue.sl.key, contextValue.sl.password);
        }
                
        log.debug('customerDetails', customerDetails);
        log.debug('customerMetafields', customerMetafields);
    
        // search customer with email address first
        // get existing customer id
        if (runtime.envType == 'PRODUCTION' && customerDetails.customer.email) {
        // if (customerDetails.customer.email) {
            var existingCustomerResp = SL.searchCustomer({email: customerDetails.customer.email});
            log.debug('exisintcusotmerresp', existingCustomerResp);
            if (existingCustomerResp && existingCustomerResp.errors) {
                log.error('search customer error', existingCustomerResp);
            } else if (existingCustomerResp.customers && existingCustomerResp.customers.length > 1) {
                log.error('duplicated customer email', 'notice management team');
                // notice email, notice duplicated
                SL.noticeEmail(
                    [16],
                    'duplicated customer for ' + SL.siteName,
                    'Please check the customer internalid ' + context.key + ' error: ' + JSON.stringify(existingCustomerResp)
                );
            } else if (existingCustomerResp.customers && existingCustomerResp.customers.length == 1) {
                var existingCustomerId = existingCustomerResp.customers[0].id.toString();

                // delete address with lastname is not number
                util.each(existingCustomerResp.customers[0].addresses, function (address) {
                    if (isNaN(parseFloat(address.last_name))) {
                        SL.deleteCustomerAddress(address.customer_id.toString(), address.id.toString())
                    }
                })

                // compare with customer id in NS, if not, update customer id in NS
                if (shopifyCustomerId != existingCustomerId) {
                    var data = {};
                    data[contextValue.customer_id_field] = existingCustomerId;
                    updateNSContact(context.key, data);
                }

                SL.updateCustomer(existingCustomerId, customerDetails);
                // update metafield sperately otherwise in hign chance will get error 
                // {"errors":{"metafields.key":["must be unique within this namespace on this resource"]}}
                var existingCustomerMetafields = SL.getMetafields({resource:'customers', id: existingCustomerId});
                if (existingCustomerMetafields) {
                    util.each(customerMetafields, function(mf) {
                        var existingMetafield = SL.find(existingCustomerMetafields.metafields, {namespace: mf.namespace, key: mf.key});
                        if (existingMetafield && existingMetafield.id) {
                            mf.id = existingMetafield.id;
                            SL.updateMetafield(mf)
                        } else {
                            SL.addMetafields({
                                resource: 'customers',
                                id: existingCustomerId,
                                metafield_data: mf
                            });
                        }
                    });
                }
            } else if (existingCustomerResp.customers && existingCustomerResp.customers.length == 0) {
                // create and update Netsuite
                customerDetails.customer.send_email_invite = true;
                customerDetails.customer.metafields = customerMetafields;
                var addCustomerResp = SL.addCustomer(customerDetails);
                if (addCustomerResp.errors) {
                    log.error('add customer error, customerDetails ', customerDetails);
                    log.error('add customer error, internalid ' + context.key, addCustomerResp.errors);
                    // notice email
                    SL.noticeEmail(
                        [386953],
                        'add customer error for ' + SL.siteName,
                        'Please check the customer internalid ' + context.key + ' error: ' + JSON.stringify(addCustomerResp.errors)
                    );
                } else {
                    log.debug('addcustomerresp', addCustomerResp);
                    var data = {};
                    data[contextValue.customer_id_field] = addCustomerResp.customer.id.toString();
                    updateNSContact(context.key, data);
                }
            }
        } else {
            log.debug('runtime envType', runtime.envType + ' - email: ' + customerDetails.customer.email)
        }
    }


    /**
     * Executes when the summarize entry point is triggered and applies to the result set.
     *
     * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
     * @since 2015.1
     */
    function summarize(summary) {
        log.debug('input summary', summary.inputSummary)
        log.error('input error', summary.inputSummary.error)

        summary.mapSummary.errors.iterator().each(function(key, value) {
            log.error('error in map stage ' + key, value);
            return true;
        });

        summary.reduceSummary.errors.iterator().each(function(key, value) {
            log.error('error in reduce stage ' + key, value);
            return true;
        });
    }

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    };
});
