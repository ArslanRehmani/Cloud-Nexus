/**
 *@NApiVersion 2.0
 *@NScriptType MapReduceScript
 */
 define(['N/log', 'N/record', 'N/search', '/SuiteScripts/Lib-NS/lodash-4.13.1.min', '/SuiteScripts/glib/glib'], function (log, record, search, _, libG) {

    function getInputData() {
        var title = 'getInputData[::]';
        try {
            var searchData = search.load({
                id: 'customsearch4634'
            });
        } catch (e) {
            log.error(title + e.name, e.message);
        }
        return searchData || [];
    }

    function map(context) {
        var title = 'map[::]';
        try {
            var data = JSON.parse(context.value);
            log.debug({
                title: 'data',
                details: data
            });

            var currentRecord = record.load({
                type: data.recordType,
                id: data.id
            });

            var itemName = currentRecord.getValue({ fieldId: 'itemid' });

            log.audit('type', data.recordType + ' -- ' + data.id + ' -- ' + itemName);

            var error = new Array();
            var finalCarrierId = '';
            var finalChargeWeight;
            if (data.recordType.toLowerCase() == 'inventoryitem' || data.recordType.toLowerCase() == 'kititem') {

                var width = currentRecord.getValue({ fieldId: 'custitem_avt_total_width' }),
                    length = currentRecord.getValue({ fieldId: 'custitem_avt_total_length' }),
                    height = currentRecord.getValue({ fieldId: 'custitem_avt_total_height' }),
                    deadWeight = currentRecord.getValue({ fieldId: 'weight' });

                var package = currentRecord.getValue({ fieldId: 'custitem_avt_total_packages' }) || '1';
                var cubage = currentRecord.getValue({ fieldId: 'custitem_avt_ifs_cubic_volume' });

                if (width && length && height) {
                    var calcub = calCubage(width, length, height);

                    if (cubage == null || cubage == '' || cubage != calcub) {
                        cubage = calcub;

                        currentRecord.setValue('custitem_avt_ifs_cubic_volume', parseFloat(cubage));
                        //currentRecord.setValue('custitem_avt_ifs_cubic_volume', decimal3(cubage));
                    }

                    // always calculater carrier
                    if (deadWeight) {
                        finalChargeWeight = getChargeWeight(cubage, 250, deadWeight); // base on cubic value 250
                        var carriers = libG.getCarriers4(width, length, height, deadWeight, cubage, package, finalChargeWeight, 0, data.type);
                        log.debug('carriers available', carriers);

                        if (!_.isEmpty(carriers)) {
                            carrierValue = carriers.single_carrier.custrecord_shipping_carrier_cubic_value || 250;

                            finalCarrierId = carriers.single_carrier.internalid
                            currentRecord.setValue('custitem_cubic_carrier_express', (carriers.express_carrier && carriers.express_carrier.internalid) || '');

                            var chargeWeight = getChargeWeight(cubage, carrierValue, deadWeight);
                            log.debug('charge weight', chargeWeight);
                            currentRecord.setValue('custitem_cubic_charge_weight', chargeWeight);
                        }
                    } else {
                        error.push('failed to get Carrier due to item ' + itemName + ' Missing deadWeight <br>');
                    }
                } else {
                    if (data.recordType.toLowerCase() != 'kititem') {
                        log.error(itemName, 'missing dimensions (width: ' + width + ') (length: ' + length + ') (height: ' + height + ' )')
                    }
                    error.push('missing dimensions ' + itemName);
                }
            }
            //log.debug('finalChargeWeight', finalChargeWeight)

            var found = findOverride(data.id);
            if (found.carrier) {
                log.debug('found override', found);
                finalCarrierId = found.carrier
            }
            if (found.package) {
                currentRecord.setValue('custitem_avt_total_packages', found.package);
            }

            log.debug('finalCarrierId after', finalCarrierId)
            try {
                currentRecord.setValue('custitem_cubic_carrier', finalCarrierId)
                currentRecord.save({
                    ignoreMandatoryFields: true
                });
            } catch (e) {
                log.error('error saving record ' + data.id + ', ' + itemName, e);
            }

            // send notice email
            if (error.length > 0) {
                // email.send({
                //     author: 16,
                //     recipients: ['reece@gflgroup.com.au', 'peter@gflgroup.com.au'],
                //     subject: '[Notification] Weight Cubic weight update error',
                //     body: error.join('<br>')
                // });
            }

            var logFound = findLog(data.id);

            log.debug('find log', JSON.stringify(logFound));

            if (_.isEmpty(logFound) && error.length > 0) {
                createLog(data.id, error);
            } else if (!_.isEmpty(logFound) && error.length == 0) {
                deleteLog(logFound.internalid)
            }
        } catch (e) {
            log.error(title + e.name, e.message);
        }
    }

    function reduce(context) {

    }

    function summarize(summary) {

    }
    function findOverride(itemid) {
        var overrideSearch = search.create({
            type: 'customrecord_item_carrier_override',
            filters: [
                ['isinactive', 'is', 'F'],
                'AND',
                ['custrecord_item_carrier_override_item', 'is', itemid]
            ],
            columns: [
                'custrecorditem_carrier_override_carrier',
                'custrecord_item_carrier_override_package'
            ]
        });

        var found = {};
        overrideSearch.run().each(function (result) {
            found.carrier = result.getValue('custrecorditem_carrier_override_carrier');
            found.package = result.getValue('custrecord_item_carrier_override_package');
        });

        return found;
    }

    function decimal3(x) {
        // return parseFloat(x).toFixed(3);
        // log.debug('decimal3', parseFloat(x).toFixed(3));
        return parseFloat(x);
    }

    function deleteLog(logid) {
        record.delete({
            type: 'customrecord_weight_cubic_update_log',
            id: logid
        });
    }

    function createLog(itemid, error) {
        var logRecord = record.create({
            type: 'customrecord_weight_cubic_update_log'
        });

        logRecord.setValue({
            fieldId: 'custrecord_weight_cubic_update_log_item',
            value: itemid
        });

        logRecord.setValue({
            fieldId: 'custrecord_weight_cubic_update_log_error',
            value: _.join(error, '\r\n')
        })

        logRecord.save();
    }

    function findLog(itemid) {
        var found = {};

        var logSearch = search.create({
            type: 'customrecord_weight_cubic_update_log',
            filters: [
                ['custrecord_weight_cubic_update_log_item', 'anyof', [itemid]]
            ],
            columns: ['internalid', 'custrecord_weight_cubic_update_log_item']
        });

        var logSearchResult = logSearch.run().getRange({ start: 0, end: 10 });

        if (logSearchResult.length > 0) {
            found = {
                internalid: logSearchResult[0].getValue('internalid'),
                itemid: itemid,
                itemName: logSearchResult[0].getText('custrecord_weight_cubic_update_log_item')
            }
        }

        return found;
    }

    function getKitCubicWeight(itemid) {

        var totalCubage = 0;
        var totalWeight = 0;
        var cartonWeight = [];
        var totalChargeWeight = 0;
        var totalCarrier = new Array();
        var totalCarrierPreview = new Array();
        var totalExpressCarrier = new Array();
        var allLength = new Array();
        var allHeight = new Array();
        var allWidth = new Array();
        var packageOver110 = new Array();

        var error = new Array();

        var kitMemberSearch = search.create({
            type: search.Type.KIT_ITEM,
            filters: [
                ['internalid', 'is', itemid]
            ],
            columns: [
                'memberitem.type',
                'memberitem.internalid',
                'memberitem.custitem_avt_total_length',
                'memberitem.custitem_avt_total_height',
                'memberitem.custitem_avt_total_width',
                'memberitem.custitem_cubic_carrier',
                'memberitem.custitem_cubic_carrier_express',
                'memberitem.custitem_avt_ifs_cubic_volume',
                'memberitem.weight',
                'memberitem.custitem_cubic_charge_weight',
                'memberitem.custitem_cubic_carrier_perview',
                'memberquantity'
            ]
        });

        kitMemberSearch.run().each(function (member) {
            log.debug('member', JSON.stringify(member));
            var memberType = member.getValue({ name: 'type', join: 'memberitem' });
            var memberItemId = member.getValue({ name: 'internalid', join: 'memberitem' });
            log.debug('member type', memberType);
            if (memberType == 'Group' || memberType == 'Kit') {

                var details = getKitCubicWeight(memberItemId);
                totalCubage += details.cubage;
                totalWeight += details.weight;
                cartonWeight = _.concat(cartonWeight, details.carton_weight);
                totalChargeWeight += details.chargeWeight;
                totalCarrier = _.concat(totalCarrier, details.carrier);
                totalCarrierPreview = _.concat(totalCarrierPreview, details.carrier_preview);
                totalExpressCarrier = _.concat(totalExpressCarrier, details.express_carrier);
                allHeight = _.concat(allHeight, details.allHeight);
                allLength = _.concat(allLength, details.allLength);
                allWidth = _.concat(allWidth, details.allWidth);
                packageOver110 = _.concat(packageOver110, details.package_over_110);
                error.push(details.error);
            } else if (memberType == 'InvtPart') {
                var memberCubage = parseFloat(member.getValue({ name: 'custitem_avt_ifs_cubic_volume', join: 'memberitem' }));
                var memberWeight = parseFloat(member.getValue({ name: 'weight', join: 'memberitem' }));
                var memberChargeWeight = parseFloat(member.getValue({ name: 'custitem_cubic_charge_weight', join: 'memberitem' }));
                var memberCarrier = member.getValue({ name: 'custitem_cubic_carrier', join: 'memberitem' });
                var memberCarrierPreview = member.getValue({ name: 'custitem_cubic_carrier_perview', join: 'memberitem' });
                var memberExpressCarrier = member.getValue({ name: 'custitem_cubic_carrier_express', join: 'memberitem' });
                var memberQty = parseFloat(member.getValue('memberquantity'));

                var memberLength = parseFloat(member.getValue({ name: 'custitem_avt_total_length', join: 'memberitem' }));
                var memberHeight = parseFloat(member.getValue({ name: 'custitem_avt_total_height', join: 'memberitem' }));
                var memberWidth = parseFloat(member.getValue({ name: 'custitem_avt_total_width', join: 'memberitem' }));

                if (_.isNaN(memberCubage) || _.isNaN(memberWeight) || _.isNaN(memberChargeWeight) || _.isEmpty(memberCarrier)) {
                    error.push('one of members of kit (internal id is ' + memberItemId + ') is missing cubage or carrier or weight or charge weight');
                } else {
                    totalCubage += memberCubage * memberQty;
                    totalWeight += memberWeight * memberQty;
                    cartonWeight.push(memberWeight);
                    totalChargeWeight += memberChargeWeight * memberQty;
                    totalCarrier.push(getCarrierValue(memberCarrier));
                    totalCarrierPreview.push(getCarrierValue(memberCarrierPreview))
                    totalExpressCarrier.push(getCarrierValue(memberExpressCarrier));
                    allLength.push(memberLength);
                    allHeight.push(memberHeight);
                    allWidth.push(memberWidth);

                    if (memberLength > 110 || memberHeight > 110 || memberWidth > 110) {
                        packageOver110.push({ internalid: memberItemId, qty: memberQty });
                    }

                }
            }

            return true;
        });

        return {
            cubage: totalCubage,
            weight: totalWeight,
            carton_weight: cartonWeight,
            chargeWeight: totalChargeWeight,
            carrier: _.compact(totalCarrier),
            carrier_preview: _.compact(totalCarrierPreview),
            express_carrier: _.compact(totalExpressCarrier),
            length: allLength,
            height: allHeight,
            width: allWidth,
            error: error,
            package_over_110: _.compact(packageOver110)
        }
    }

    // if element is empty null or '', the output is empty, if not  use _.compact
    // when kit set carrier based on max priority of sub items
    function noneVaule() {

    }

    function getChargeWeight(cubage, carrierValue, deadWeight) {
        //log.debug('cubage ' + typeof cubage, cubage);
        //log.debug('carrier value', carrierValue);
        //log.debug('dead weight ' + typeof deadWeight, deadWeight);

        var cubicWeight = cubage * carrierValue;
        //log.debug('cubic weight', cubicWeight);

        // if (deadWeight < 1 && cubicWeight < 1) {
        //     return deadWeight > cubicWeight ? deadWeight.toFixed(2) : cubicWeight.toFixed(2);
        // } else {
        //     return deadWeight > cubicWeight ? _.ceil(deadWeight) : _.ceil(cubicWeight);
        // }
        var returnWeight = deadWeight > cubicWeight ? deadWeight : cubicWeight;
        //log.audit('returned chargeWeight 1', returnWeight);
        //returnWeight = returnWeight > 0.1 ? _.ceil(returnWeight, 1) : 0.1 // ceil for Lodash is removing number after comma according to parameter
        // Item <0.5 charge weight should round up to 0.5
        // between 0.5 and 1.0, round up to 1.0
        // Round up to nearest integer for > 1.0
        var chargeWeight = 0;
        if (returnWeight <= 0.5) {
            chargeWeight = 0.5
        } else if (returnWeight > 0.5 && returnWeight <= 1.0) {
            chargeWeight = 1;
        } else {
            chargeWeight = Math.ceil(returnWeight)
        }

        return chargeWeight;
    }

    function calCubage(length, height, width) {
        return (width * length * height / 1000000);
    }

    function getCarrierValue(carrierId) {
        if (carrierId) {
            // var carrierSearch = search.create({
            //     type: 'customrecord_weight_cubic_carrier'
            //     , columns: ['name', 'custrecord_weight_cubic_carrier_value', 'custrecord_weight_cubic_carrier_priority']
            //     , filters: [
            //         ['internalid', 'is', carrierId]
            //     ]
            // });

            var carrierSearch = search.create({
                type: 'customrecord_shipping_carrier'
                , columns: ['name', 'custrecord_shipping_carrier_cubic_value', 'custrecord_shipping_carrier_priority']
                , filters: [
                    ['internalid', 'is', carrierId]
                ]
            });

            var carrierSearchResults = carrierSearch.run().getRange({ start: 0, end: 1 });
            var carrierValue = {
                carrier_id: carrierId,
                cubic_value: carrierSearchResults[0].getValue({ name: 'custrecord_shipping_carrier_cubic_value' }),
                priority: carrierSearchResults[0].getValue({ name: 'custrecord_shipping_carrier_priority' })
            };

            return carrierValue;
        } else {
            return null;
        }
    }
    function roundNumber(num) {
        try {
            var rounded = Number(num.toFixed(6));
            if (Math.abs(num - rounded) < Number.EPSILON) {
                return rounded;
            }
        }
        catch (e) {
            log.error('roundNumber Exception', e.message);
        }
        return num;
    }

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    }
});
