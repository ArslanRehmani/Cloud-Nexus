/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/https', 'N/url', '/SuiteScripts/G 2.0/lodash_amd_v4.17.10.min', 'N/search', 'N/record', 'N/file', '/SuiteScripts/G 2.0/papaparse.min'],

function(https, url, _, search, record, file, papaparse) {
   
    /**
     * Definition of the Suitelet script trigger point.
     *
     * @param {Object} context
     * @param {ServerRequest} context.request - Encapsulation of the incoming request
     * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
     * @Since 2015.2
     */
    function onRequest(context) {
        var freightOpitons = [];
        var requestHeaders = context.request.headers;
        // var shopDomainName = requestHeaders['x-shopify-shop-domain'] || requestHeaders['X-Shopify-Shop-Domain'];
        var shopDomainName = context.request.parameters['source'];
        log.debug('shopDomainName', shopDomainName);
        if (true || shopDomainName) {
            // var source = shopDomainName.split('.')[0];

            var customerShippingTag = '';
            var nonBikeItems = [];
            var bikeItems = [];
            var totalWeight = 0;
            var totalCubic = 0;
            var totalPackage = 0;

            var requestBody = context.request.body ? JSON.parse(context.request.body) : null;
            // get customer
            log.debug('requestbody', requestBody);

            if (_.isEmpty(requestBody)) {
                log.debug({
                    title: 'Empty',
                    details: 'YES'
                });
                context.response.setHeader({name: 'Content-Type', value: 'application/json'});
                context.response.write({output: JSON.stringify({error: 'missing request body'})});

                return;
            }
            var companyName = requestBody.rate.destination.company_name;

            var addressInternalid = null;
            var destinationName = requestBody.rate.destination.name;
            var addressInternalidArr = requestBody.rate.destination.name.match(/\d+$/);
            if (!_.isEmpty(addressInternalidArr)) {
                addressInternalid = addressInternalidArr[0];
                var destinationNameArr = requestBody.rate.destination.name.split(' ');
                destinationName = _.join(_.dropRight(destinationNameArr), ' ');
            }

            var itemArr = _.map(requestBody.rate.items, function(item) {
                return {
                    sku: item.sku,
                    qty: item.quantity
                }
            });

            var intersectionLocationArray = new Array();
            var intersectionPickupLocationArray = new Array();

            var stockUrl = url.resolveScript({
                scriptId: 'customscript_bulk_inventory',
                deploymentId: 'customdeploy1',
                returnExternalUrl: true,
                params: {
                    // location: '10,15',
                    location: '15',
                    item_key_type: 'sku',
                    item_keys: (_.map(itemArr, 'sku')).join(','),
                    // fields: 'custitem_b2bshopify_tags'
                }
            });
            log.debug('stockUrl', stockUrl);
            // var stockResp = https.get({url: stockUrl});
            // var stockResp = https.get({
            //     url: stockUrl,
            // });
            var stockResp = https.post({
                url: stockUrl,
                body: JSON.stringify({
                    fields:[
                        {name: 'custitem_b2bshopify_tags', summary: 'GROUP'}
                    ]
                })
            });
            var inventoryDetails = {};
            log.debug('stockResp', stockResp);
            if (stockResp.code == 200) {
                inventoryDetails = JSON.parse(stockResp.body);
            } else {
                log.error('Get Stock Error', 'Failed to get stock info!')
                throw new Error('Failed to get stock info!');
            }
            if (!_.isEmpty(inventoryDetails) && _.has(inventoryDetails, 'inventory') && inventoryDetails.inventory.length > 0) {

                var inventoryArray = inventoryDetails.inventory;
                var differentSku = _.differenceBy(inventoryArray, itemArr, 'sku');

                if (!_.isEmpty(differentSku)) {
                    log.error('Missing SKUs', 'Failed to get stock info for item SKUs : ' + _.join(_.map(differentSku, 'sku')));
                    throw new Error('Failed to get stock info for item SKUs : ' + _.join(_.map(differentSku, 'sku')));
                }
                // get all the skus matched from request
                // inventoryArray = _.filter(inventoryArray, function(ia) {
                //     return _.indexOf(_.map(itemArr, 'sku'), ia.sku) >= 0;
                // });

                //add available location
                _.map(inventoryArray, function(invtsa) {
                    var foundItem = _.find(itemArr, {sku: invtsa.sku});
                    invtsa.qty = foundItem.qty;

                    // for pickup available
                    invtsa['available_pickup_locations'] = _.filter(invtsa.inventory_original, function(li) { 
                        return li.location_quantity_available_original > 0
                    });
                    // var qtyAvailablePickupLocationArray = _.filter(invtsa.inventory_original, function(li) { 
                    //     return li.location_quantity_available_original > 0
                    // });
                    // invtsa['available_pickup_locations'] = _.map(qtyAvailablePickupLocationArray, function(q) {
                    //     return _.omit(q, 'location_quantity_available_original');
                    // });
    
                    // for online available, apply 5 unit rules by default
                    invtsa['available_locations'] = _.filter(invtsa.inventory, function(li) { 
                        return li.location_quantity_available > 0;
                    });
                    // var qtyAvailableLocationArray= _.filter(invtsa.inventory, function(li) { 
                    //     return li.location_quantity_available > 0;
                    // });
                    // invtsa['available_locations'] = _.map(qtyAvailableLocationArray, function(q) {
                    //     return _.omit(q, 'location_quantity_available');
                    // });
    
                    if (invtsa.custitem_b2bshopify_tags == 'ShipCalc') {
                        nonBikeItems.push(invtsa);
                    } else {
                        bikeItems.push(invtsa);
                    }
 
                    totalWeight += parseFloatDefault(invtsa.cubic_weight) * invtsa.qty;
                    totalCubic += parseFloatDefault(invtsa.total_cubic) * invtsa.qty;
                    totalPackage += parseFloatDefault(invtsa.package, 1) * invtsa.qty;
                });
    
                if (inventoryArray[0]) {
                    // find the same online available location
                    intersectionLocationArray = inventoryArray[0].available_locations;
                    for (var i = 1; i < inventoryArray.length; i++) {
                        intersectionLocationArray = _.intersectionBy(intersectionLocationArray, inventoryArray[i].available_locations, 'inventory_location_id');
                    }
                    // find the same pickup available location
                    intersectionPickupLocationArray = inventoryArray[0].available_pickup_locations;
                    for (var i = 1; i < inventoryArray.length; i++) {
                        intersectionPickupLocationArray = _.intersectionBy(intersectionPickupLocationArray, inventoryArray[i].available_pickup_locations, 'inventory_location_id');
                    }
                }
                log.debug('intersection dispatch location array final', intersectionLocationArray);
                // [{"inventory_location_id":"15","inventory_location_name":"Broadmeadows VIC","location_quantity_available":12}]
                log.debug('intersection pickup location array final', intersectionPickupLocationArray);
                // [{"inventory_location_id":"15","inventory_location_name":"Broadmeadows VIC","location_quantity_available_original":12}]	
            }

            // 9083 ACCOUNTS IBD - 60
            // var customerSearchFilters = [['isinactive', 'is', 'F'], 'AND', ['parent', 'is', '60']];
            var customerSearchFilters = [['isinactive', 'is', 'F']];
            if (companyName) {
                customerSearchFilters.push('AND');
                customerSearchFilters.push(['companyname', 'is', companyName]);
            }
            if (destinationName) {
                customerSearchFilters.push('AND');
                customerSearchFilters.push([
                    ['address.attention', 'is', destinationName],
                    'OR',
                    ['address.addressee', 'is', destinationName]
                ]);
            }

            var customerSearch = search.create({
                type: 'customer',
                filters: customerSearchFilters,
                columns: [
                    'address.internalid',
                    // 'address.externalid',
                    'address.addressinternalid',
                    'custentity_shopify_xds_customer_tags',
                    // 'contact.addressinternalid'
                ]
            });
            log.debug('customerSearch filters', customerSearch.filterExpression);
            var lastCustomerShippingTag = '';
            customerSearch.run().each(function(result) {
                log.debug('result', result);
                var resultAddressInternalid = result.getValue({name: 'addressinternalid', join: 'address'});
                if (addressInternalid &&
                    resultAddressInternalid && 
                    addressInternalid == resultAddressInternalid
                ) {
                    customerShippingTag = result.getValue('custentity_shopify_xds_customer_tags');
                }
                lastCustomerShippingTag = result.getValue('custentity_shopify_xds_customer_tags');
                return true;
            });
            if (_.isEmpty(customerShippingTag)) {
                customerShippingTag = lastCustomerShippingTag;
            }
            log.debug('customerShippingTag', customerShippingTag);
            if (customerShippingTag) {
                var rates = [];
                // bike dealer get bike rate with zone and none-bike rate based on boarders
                var ibdZoneFreight = getIBDZoneFreight();
                var bikeFreightRate = _.sum(_.map(bikeItems, function(bike) {
                    return getBikeRate(ibdZoneFreight, customerShippingTag, bike);
                }));

                if (!_.isEmpty(nonBikeItems)) {
                    var nonBikeRates = getNonBikeRates(_.sumBy(
                        nonBikeItems, 'cubic_weight'),
                        requestBody.rate.destination.postal_code, 
                        requestBody.rate.destination.city
                    );
                    // [{inventory_location_id: '15', rate: 1.111111}]
                    // or []
                    if (!_.isEmpty(nonBikeRates)) {
                        rates = _.map(nonBikeRates, function(nbr) {
                            if (nbr.rate) {
                                nbr.rate = nbr.rate + bikeFreightRate;
                            } else {
                                nbr.rate = bikeFreightRate;
                            }
                            return nbr; 
                        });
                    } else {
                        // forece set rates to emtpy array, if can't find rates for non bikes items
                        rates = [];
                    }
                } else {
                    rates.push({rate: bikeFreightRate, inventory_location_id: '15'});
                }
            } else {
                // get all item rates based on boarders
                var rates = getNonBikeRates(totalWeight, requestBody.rate.destination.postal_code, requestBody.rate.destination.city)
            }
            log.debug('total develivery rates', rates);
            if (!_.isEmpty(rates)) {
                // {rates: [{
                //     "service_name": "canadapost-overnight",
                //     "service_code": "ON",
                //     "total_price": "1295",
                //     "description": "This is the fastest option by far",
                //     "currency": "CAD",
                //     "min_delivery_date": "2013-04-12 14:48:45 -0400",
                //     "max_delivery_date": "2013-04-12 14:48:45 -0400"
                // }]}
                var dispatchLocations = ['15'];
                if (!_.isEmpty(intersectionLocationArray)) {
                    dispatchLocations = _.map(intersectionLocationArray, 'inventory_location_id'); 
                }

                _.forEach(rates, function(rate) {
                    if (_.has(rate, 'inventory_location_id')) {
                        if (_.indexOf(dispatchLocations, rate.inventory_location_id) >= 0) {
                            // 34253	Borders Express (Parcel) (New)
                            freightOpitons.push({
                                "service_name": "Ship to store",
                                "service_code": '34253-'+rate.inventory_location_id || '15',
                                "total_price": getPriceFormat(rate.rate),
                                "description": "Borders Express Parcel",
                                "currency": requestBody.rate.currency
                            });
                        }
                    }
                });
            }

            if (!_.isEmpty(intersectionPickupLocationArray)) {
                _.forEach(intersectionPickupLocationArray, function(location) {
                    if (location.inventory_location_id == '15') {
                        freightOpitons.push({
                            "service_name": "Pick Up " + location.inventory_location_name,
                            "service_code": '25032-'+location.inventory_location_id,
                            "total_price": 0,
                            "description": "Pick Up " + location.inventory_location_name,
                            "currency": requestBody.rate.currency
                        });
                    }
                });
            }
            log.debug('freightOpitons', freightOpitons);
            context.response.setHeader({name: 'Content-Type', value: 'application/json'});
            context.response.write({output: JSON.stringify({rates: freightOpitons})});
        } else {
            log.error('invalid shopify shop domain', shopDomainName);
        }

        function getBikeRate(ibdZoneFreight, customerTag, bike) {
            log.debug('getBikeRate arguments', arguments);
            log.debug('bike tag', bike.custitem_b2bshopify_tags);
            var rate = 0;
            var foundCustomerTag = _.find(ibdZoneFreight, {Zone: customerTag});
            if (foundCustomerTag) {
                if (_.has(foundCustomerTag, bike.custitem_b2bshopify_tags)) {
                    rate = parseFloatDefault(stripSpace(foundCustomerTag[bike.custitem_b2bshopify_tags]), 100);
                } else {
                    var errMsg = 'Failed to find big tag ' + bike.custitem_b2bshopify_tags + ' for customer tag ' + customerTag;
                    log.error('Find IBD zone Bike Tag Error', errMsg);
                }
            } else {
                var errMsg = 'Failed to find customer tag ' + customerTag;
                log.error('Find IBD Zone Error', errMsg);
            }
            log.debug('getBikeRate', rate);
            return rate * bike.qty;
        }

        function getIBDZoneFreight() {
            return _.dropRight(
                papaparse.parse(
                    file.load({id: './IBD Zoned Freight Table.csv'}).getContents(),
                    {header: true}
                ).data
            );
        }

        function getNonBikeRates(weight, postcode, suburb) {
            log.debug('getNonBikeRates arguments', arguments);
            var fuelPerc = 1.18;
            var rates = [];
            var zoneFileContent = file.load({id: './borders_zones.csv'}).getContents();
            var zoneArr = _.dropRight(papaparse.parse(zoneFileContent, {header: true}).data);

            var foundZone = _.find(zoneArr, function(zone) {
                return zone.postcode && postcode && zone.postcode == postcode &&
                stripSpace(zone.suburb) == stripSpace(suburb)
            });
            if (foundZone) {
                var postageFileContent = file.load({id: './borders_zone_postage_parcel.csv'}).getContents();
                var postageArr = _.dropRight(papaparse.parse(postageFileContent, {header: true}).data);

                var foundPostage = _.filter(postageArr, function(postage) {
                    return stripSpace(postage.zone) == stripSpace(foundZone.zone);
                });
                rates = _.map(foundPostage, function(fp) {
                    var basic = parseFloatDefault(fp.basic, 16);
                    var rate = parseFloatDefault(fp.rate, 1.5);
                    var minimum = parseFloatDefault(fp.minimum, 18);
                    var margin = parseFloatDefault(fp.margin, 0.1);

                    var baseRate = basic + rate * weight;
                    baseRate = baseRate > minimum ? baseRate : minimum;
                    
                    return {
                        inventory_location_id: fp.source_location,
                        rate: baseRate * 1.1 * fuelPerc / (1-margin)
                    };
                });
            } else {
                log.error('Find zone error', 'Failed to find the zone for ' + suburb + ' ' + postcode);
                // throw new Error('Failed to find the zone for ' + suburb + ' ' + postcode);
            }
            log.debug('getNonBikeRates', rates)
            return rates;
        }

        function getPriceFormat(price) {
            return Math.round(price * 100);
        }

        function stripSpace(str) {
            return _.toUpper(_.replace(str, /\s/g, ''));
        }

        function parseFloatDefault(stringVal, def) {
            var defaultValue = def || 0;
            return _.isNaN(parseFloat(stringVal)) ? defaultValue : parseFloat(stringVal);
        }
    }

    return {
        onRequest: onRequest
    };
    
});
