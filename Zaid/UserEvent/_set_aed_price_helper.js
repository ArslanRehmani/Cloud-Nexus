/**
 * @NApiVersion 2.1
 */
define(['N/record', 'N/search', 'N/runtime'],
    /**
     * @param{record} record
     * @param{search} search
     * @param{runtime} runtime
     */
    (record, search, runtime) => {
        let scriptParams = {};
        const CONSTANTS = {
            SUBLIST_ID: {
                ITEM: 'item'
            },
            SUBLIST_FIELD: {
                ITEM: 'item',
                AED_PRICE : 'custcol_live_aed_price'
            }
        }

        const HELPERS = {
            getAEDBasePrice: (context) => {
                try {
                    let itemLineCount = context.newRecord.getLineCount({ sublistId: CONSTANTS.SUBLIST_ID.ITEM });
                    log.debug({
                        title: 'itemLineCount',
                        details: itemLineCount
                    });
                    for (let i = 0; i < itemLineCount; i++) {
                        let itemId = context.newRecord.getSublistValue({
                            sublistId: CONSTANTS.SUBLIST_ID.ITEM,
                            fieldId: CONSTANTS.SUBLIST_FIELD.ITEM,
                            line: i
                        });
                        if(itemId){
                            HELPERS.setAEDBasePrice(context, itemId, i);
                        }
                    }

                }
                catch (e) {
                    log.error('getAEDBasePrice Exception', e.message);
                }
            },
            setAEDBasePrice: (context, itemId, lineCount) => {
                try {
                    //Load Customer Record to reduce governance limit
                    let itemSearch = search.load({
                        type: record.Type.ITEM,
                        id: 3029
                    });
                    let internalIdFilter = search.createFilter({
                        name: 'internalid',
                        operator: 'anyof',
                        values: [itemId]
                    });
                    itemSearch.filters.push(internalIdFilter);
                    let searchResult = itemSearch.run().getRange({ start: 0, end: 1 });
                    let linecount = searchResult.length;
                    if (linecount > 0) {
                        var aedBasePrice = searchResult[0].getValue({
                            name: "unitprice",
                            join: "pricing"
                        });
                        if(aedBasePrice){
                            context.newRecord.setSublistValue({
                                sublistId: CONSTANTS.SUBLIST_ID.ITEM,
                                fieldId: CONSTANTS.SUBLIST_FIELD.AED_PRICE,
                                value: aedBasePrice,
                                line: lineCount
                            });
                        }
                    }
                }
                catch (e) {
                    log.error('setAEDBasePrice Exception', e.message);
                }
            },
            setAEDBasePriceCs: (context, itemId) => {
                try {
                    //Load Customer Record to reduce governance limit
                    let itemSearch = search.load({
                        type: record.Type.ITEM,
                        id: 3029
                    });
                    let internalIdFilter = search.createFilter({
                        name: 'internalid',
                        operator: 'anyof',
                        values: [itemId]
                    });
                    itemSearch.filters.push(internalIdFilter);
                    let searchResult = itemSearch.run().getRange({ start: 0, end: 1 });
                    let linecount = searchResult.length;
                    if (linecount > 0) {
                        var aedBasePrice = searchResult[0].getValue({
                            name: "unitprice",
                            join: "pricing"
                        });
                        if(aedBasePrice){
                            context.currentRecord.setCurrentSublistValue({
                                sublistId: CONSTANTS.SUBLIST_ID.ITEM,
                                fieldId: CONSTANTS.SUBLIST_FIELD.AED_PRICE,
                                value: aedBasePrice
                            });
                        }
                    }
                }
                catch (e) {
                    log.error('setAEDBasePrice Exception', e.message);
                }
            }

        }
        return { CONSTANTS, HELPERS }

    });