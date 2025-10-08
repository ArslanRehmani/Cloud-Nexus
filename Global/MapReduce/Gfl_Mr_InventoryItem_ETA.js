/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define([
    'N/search', 'N/record', 'N/format', 'N/email',
    '/SuiteScripts/G 2.0/lodash_amd_v4.17.10.min',
    '/SuiteScripts/Sales order Init/sales_order_plugins_v2.x'
], function (search, record, format, email, _, soPlugins) {

    const recipients = ['16', '769'];

    //For All Dynamic
    // function getInputData() {
    //     return search.load({ id: 'customsearch1582' });
    // }

    //For 2 Items

    function getInputData(context) {
    return search.create({
        type: 'item',
        filters: [
          ['internalid', 'anyof', ['84258']]
          // ['internalid', 'anyof', ['85899', '85900']]
        ],
        columns: [
            'internalid'
        ]
    });
}

  function getPOSearch(itemId) {
    return search.create({
        type: 'purchaseorder',
        filters: [
            ['type', 'anyof', 'PurchOrd'],
            'AND',
            ['mainline', 'is', 'F'],
            'AND',
            ['item', 'anyof', itemId],
            'AND',
            ['custbody_eta', 'isnotempty', '']
        ],
        columns: [
            search.createColumn({ name: 'internalid', sort: search.Sort.ASC }),
            'tranid',
            'custbody_eta',
            'quantity',
            'quantityshiprecv'
        ]
    });
}

function getInboundPO(itemId) {
    const inboundSearch = search.create({
        type: 'inboundshipment',
        filters: [
            ['item', 'anyof', itemId],
            'AND',
            ['status', 'noneof', 'CLOSED'], // adjust if needed
            'AND',
            ['expecteddeliverydate', 'onorafter', 'today']
        ],
        columns: [
            search.createColumn({
                name: 'expecteddeliverydate',
                sort: search.Sort.ASC
            }),
            'internalid',
            'shipmentnumber'
        ]
    });

    let inboundPOId = null;

    inboundSearch.run().each(function (res) {
        inboundPOId = res.getValue('internalid');
        return false; // Only take the first (earliest) result
    });

    return inboundPOId;
}

  function map(context) {
    const startTime = new Date();
    log.debug('Start Time', startTime);

    try {
        const searchResult = JSON.parse(context.value);
        const itemId = searchResult.id;
        const recordType = searchResult.recordType;

        if (!itemId || !recordType) {
            log.error('Missing item ID or record type', searchResult);
            return;
        }

        log.debug('START map for item', itemId);

        const itemFields = search.lookupFields({
            type: recordType,
            id: itemId,
            columns: [
                'quantitybackordered', 'itemid', 'quantityavailable', 'quantityonorder',
                'custitem_eta_consumer', 'custitem_eta_po', 'custitem43'
            ]
        });
        log.debug('item Fields', itemFields);

        let quantityBackOrdered = parseFloat(itemFields.quantitybackordered) || 0;
        const quantityAvailable = parseFloat(itemFields.quantityavailable) || 0;
        const quantityOnOrder = parseFloat(itemFields.quantityonorder) || 0;
        const consumerETA = itemFields.custitem_eta_consumer || '';
        const poAvailable = !!itemFields.custitem_eta_po ? itemFields.custitem_eta_po[0].value : '';
        const itemETA = itemFields.custitem43 || '';

        if (quantityBackOrdered || quantityOnOrder) {
            const poSearch = getPOSearch(itemId);
            const ETADates = [];
            const poList = [];

            poSearch.run().each(function (res) {
                const eta = res.getValue('custbody_eta');
                const received = parseFloat(res.getValue({ name: 'quantityshiprecv' })) || 0;
                const quantity = parseFloat(res.getValue({ name: 'quantity' })) || 0;
                const currentPO = res.getValue('tranid');

                poList.push({ po: currentPO, eta, quantity, received });

                const remaining = quantity - received;

                if (quantityBackOrdered >= remaining) {
                    quantityBackOrdered -= remaining;
                } else if (eta) {
                    const etaDate = format.parse({ type: format.Type.DATE, value: eta });
                    ETADates.push({
                        po_id: res.getValue({ name: 'internalid' }),
                        po_name: currentPO,
                        eta: etaDate,
                        remain: remaining - quantityBackOrdered
                    });
                    quantityBackOrdered = 0;
                }

                return true;
            });

            if ((parseFloat(itemFields.quantitybackordered) || 0) === quantityBackOrdered && ETADates.length === 0) {
                log.error(itemFields.itemid, 'No PO with ETA found');
                setRecordValue({ type: recordType, id: itemId }, {}, consumerETA, poAvailable, itemETA);
            } else {
                let minETADate = _.minBy(ETADates, 'eta');

                const inboundPO = getInboundPO(itemId);
                if (inboundPO) {
                    const matched = _.find(ETADates, { po_id: inboundPO });
                    if (matched) {
                        minETADate = matched;
                    }
                }

                const fieldValues = {
                    custitem43: new Date(minETADate.eta),
                    custitem_eta_po: minETADate.po_id,
                    custitem_next_po_remaining_qty: parseInt(minETADate.remain, 10).toString(),
                    custitem_eta_consumer: soPlugins.getCustomerETA(new Date(minETADate.eta)) || '',
                    itemETA
                };

                setRecordValue({ type: recordType, id: itemId }, fieldValues, consumerETA, poAvailable, itemETA);
            }
        } else {
            log.debug(itemFields.itemid, 'No backorder or on order quantity. Clearing ETA.');
            setRecordValue({ type: recordType, id: itemId }, {}, consumerETA, poAvailable, itemETA);
        }
    } catch (e) {
        log.error('MAP ERROR', e.message);
    }

    const endTime = new Date();
    log.debug('End Time', endTime);

    const timeTaken = (endTime - startTime) / 1000;
    log.debug('Time taken', timeTaken);
}


//With out Time taken functionality
//   function map(context) {
//     try {
//         const searchResult = JSON.parse(context.value);
//         const itemId = searchResult.id;
//         const recordType = searchResult.recordType;

//         if (!itemId || !recordType) {
//             log.error('Missing item ID or record type', searchResult);
//             return;
//         }

//         log.debug('START map for item', itemId);

//         const itemFields = search.lookupFields({
//             type: recordType,
//             id: itemId,
//             columns: [
//                 'quantitybackordered', 'itemid', 'quantityavailable', 'quantityonorder',
//                 'custitem_eta_consumer', 'custitem_eta_po', 'custitem43'
//             ]
//         });
//         log.debug('item Fields', itemFields);

//         let quantityBackOrdered = parseFloat(itemFields.quantitybackordered) || 0;
//         const quantityAvailable = parseFloat(itemFields.quantityavailable) || 0;

//         const quantityOnOrder = parseFloat(itemFields.quantityonorder) || 0;
//         const consumerETA = itemFields.custitem_eta_consumer || '';
//         const poAvailable = !!itemFields.custitem_eta_po ? itemFields.custitem_eta_po[0].value : '';
//         // const poAvailable = itemFields.custitem_eta_po?.[0]?.value || '';
//         const itemETA = itemFields.custitem43 || '';

//         if (quantityBackOrdered || quantityOnOrder) {
//             const poSearch = getPOSearch(itemId);
//             const ETADates = [];
//             const poList = [];

//             poSearch.run().each(function (res) {
//                 const eta = res.getValue('custbody_eta');
//                 const received = parseFloat(res.getValue({ name: 'quantityshiprecv' })) || 0;
//                 const quantity = parseFloat(res.getValue({ name: 'quantity' })) || 0;
//                 const currentPO = res.getValue('tranid');

//                 poList.push({ po: currentPO, eta, quantity, received });

//                 const remaining = quantity - received;

//                 if (quantityBackOrdered >= remaining) {
//                     quantityBackOrdered -= remaining;
//                 } else if (eta) {
//                     const etaDate = format.parse({ type: format.Type.DATE, value: eta });
//                     ETADates.push({
//                         po_id: res.getValue({ name: 'internalid' }),
//                         po_name: currentPO,
//                         eta: etaDate,
//                         remain: remaining - quantityBackOrdered
//                     });
//                     quantityBackOrdered = 0;
//                 }

//                 return true;
//             });

//             if ((parseFloat(itemFields.quantitybackordered) || 0) === quantityBackOrdered && ETADates.length === 0) {
//                 log.error(itemFields.itemid, 'No PO with ETA found');
//                 setRecordValue({ type: recordType, id: itemId }, {}, consumerETA, poAvailable, itemETA);
//             } else {
//                 let minETADate = _.minBy(ETADates, 'eta');

//                 const inboundPO = getInboundPO(itemId);
//                 if (inboundPO) {
//                     const matched = _.find(ETADates, { po_id: inboundPO });
//                     if (matched) {
//                         minETADate = matched;
//                     }
//                 }

//                 const fieldValues = {
//                     custitem43: new Date(minETADate.eta),
//                     custitem_eta_po: minETADate.po_id,
//                     custitem_next_po_remaining_qty: parseInt(minETADate.remain, 10).toString(),
//                     custitem_eta_consumer: soPlugins.getCustomerETA(new Date(minETADate.eta)) || '',
//                     itemETA
//                 };

//                 setRecordValue({ type: recordType, id: itemId }, fieldValues, consumerETA, poAvailable, itemETA);
//             }
//         } else {
//             log.debug(itemFields.itemid, 'No backorder or on order quantity. Clearing ETA.');
//             setRecordValue({ type: recordType, id: itemId }, {}, consumerETA, poAvailable, itemETA);
//         }
//     } catch (e) {
//         log.error('MAP ERROR', e.message);
//     }
// }
        /**
         * Submits field updates to the item record.
         *
         * @param {Object} params - Mass update params (type, id).
         * @param {Object} fieldValues - Values to update.
         * @param {string} consumerETA - Original consumer ETA value.
         * @param {string} poAvailable - Existing PO internal ID from lookup.
         */
  
        function setRecordValue(params, fieldValues, consumerETA, poAvailable) {
            var defaultValues = { custitem43: '', custitem_eta_po: '', custitem_next_po_remaining_qty: '', custitem_eta_consumer: '' }
            log.debug('set record value', fieldValues)
            log.debug('util.extend', util.extend({}, {}))
            try {
                if (typeof fieldValues !== undefined && !!fieldValues) {
                    checkETA(fieldValues, consumerETA, poAvailable, params);
                }
            }
            catch (e) { log.error('exception', e.message) }
            record.submitFields({
                type: params.type,
                id: params.id,
                values: _.isEmpty(fieldValues) ? defaultValues : util.extend(defaultValues, fieldValues),
                options: {
                    enableSourcing: false,
                    ignoreMandatoryFields: true
                }
            });
        }


  //Mass Update Logic

  function checkETA(fieldValues, consumerETA, poAvailable, params) {
        try {
            var itemETA = fieldValues.itemETA;
            var newEtaPoValue = fieldValues.custitem_eta_po; 
            log.debug('itemETA', itemETA);
          log.debug('New ETa PO Value', newEtaPoValue);
          var newEta = fieldValues.custitem43;
          log.debug('New ETA',newEta);

            // Load the current record
            var currentRecord = record.load({
                type: params.type,
                id: params.id,
                isDynamic: true
            });

            // Get the previous value of the custom field 'custitem_eta_po'
            var previousEtaPoValue = currentRecord.getValue('custitem_eta_po');
            log.debug('Previous ETA PO', previousEtaPoValue);

           

            // Fetch the new value
           // var newEtaPoValue = itemFields.custitem_eta_po[0].value;
            log.debug('Values','New ETA PO: '+ newEtaPoValue + ', Old value: ' + previousEtaPoValue);

            // Compare the previous and new values
            if (previousEtaPoValue !== newEtaPoValue) {
                log.debug('ETA PO value has changed!', {
                    previous: previousEtaPoValue,
                    new: newEtaPoValue
                });
                // Update 'custitem_eta_consumer' based on the change
                fieldValues.custitem_eta_consumer = getCustomerETA(fieldValues.custitem43);
                log.debug('Updated custitem_eta_consumer', fieldValues.custitem_eta_consumer);
            } else {
                log.debug('No change in ETA PO value');
            }

            // Additional logic for consumer ETA
            if (fieldValues.custitem43 && consumerETA) {
                consumerETA = format.parse({
                    type: format.Type.DATE,
                    value: consumerETA
                });
                log.debug('consumerETA', consumerETA);

                if (fieldValues.custitem_eta_po == poAvailable) {
                    fieldValues.custitem_eta_consumer = consumerETA;
                    log.debug('first condition fulfill');
                } 
                /**
                 * else if (new Date(previousEtaPoValue) <= new Date(consumerETA)) {
                    log.debug('No changes');
                    //fieldValues.custitem_eta_consumer = consumerETA;
                } 
                    */
                   else if (new Date(newEta) > new Date(consumerETA)) {
                   // fieldValues.custitem_eta_consumer = previousEtaPoValue;
                   fieldValues.custitem_eta_consumer = newEta;
                   log.debug('Consumer Eta change');
                }
            } else if (fieldValues.custitem43 && !consumerETA) {
                itemETA = format.parse({
                    type: format.Type.DATE,
                    value: itemETA
                });
                log.debug('itemETA', itemETA);
                log.debug('fieldValues.custitem43', fieldValues.custitem43);

                if (itemETA != fieldValues.custitem43) {
                    fieldValues.custitem_eta_consumer = getCustomerETA(fieldValues.custitem43);
                    log.debug('Updated custitem_eta_consumer (fallback)', fieldValues.custitem_eta_consumer);
                }
            }
        } catch (e) {
            log.error('checkETA Exception', e.message);
        }
    }
  
     //Mass Update Logic
        /**
         * Returns calculated customer ETA based on business rules.
         * Adds buffer based on time remaining.
         */
        function getCustomerETA(itemETA) {

            let updatedEtaDate;

            try {

                const etaDate = new Date(itemETA);
                log.debug('etaDate', etaDate)

                const currentDate = new Date();
                log.debug('currentDate', currentDate)
                const daysLeft = Math.ceil((etaDate - currentDate) / (1000 * 60 * 60 * 24));
                // const daysLeft = Math.ceil((currentDate - etaDate) / (1000 * 60 * 60 * 24));
                log.debug('daysLeft', daysLeft)
                const weekLeft = Math.floor(daysLeft / 7);
                log.debug('weekLeft', weekLeft)

                if (daysLeft >= 14) {

                    if (daysLeft >= 63 && weekLeft >= 9) {

                        updatedEtaDate = addDays(etaDate, 7);
                        log.debug('updatedEtaDate', updatedEtaDate)
                    } else if (daysLeft <= 62) {

                        if (daysLeft < 30) {

                            updatedEtaDate = addDays(etaDate, 14);
                            log.debug('updatedEtaDate', updatedEtaDate)
                        } else if (daysLeft >= 30) {

                            updatedEtaDate = addDays(etaDate, 21);
                            log.debug('updatedEtaDate', updatedEtaDate)
                        }
                    }
                } else {

                    if (daysLeft > 0) {

                        if (daysLeft >= 7) {

                            updatedEtaDate = addDays(etaDate, 7);
                            log.debug('updatedEtaDate', updatedEtaDate)
                        } else {

                            updatedEtaDate = addDays(etaDate, 3);
                            log.debug('updatedEtaDate', updatedEtaDate)
                        }
                    }
                }

            }
            catch (e) {
                log.error('getCustomerETA Exception', e.message);
            }
            log.debug('updatedEtaDate', updatedEtaDate)
            return updatedEtaDate || '';
        }

        /**
         * Adds number of days to a given Date object.
         * 
         * @param {Date} date
         * @param {number} days
         * @returns {Date}
         */
        function addDays(date, days) {
            try {

                const result = new Date(date);
                log.debug('result', result)

                result.setDate(result.getDate() + days);

                return result;
            }
            catch (e) {

                log.error('addDays Exception', e.message);

            }
        }
        return {
            getInputData: getInputData,
            map: map
        };
});