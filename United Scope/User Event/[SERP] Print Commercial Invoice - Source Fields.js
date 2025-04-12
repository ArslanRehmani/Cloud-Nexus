/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/search', 'N/ui/serverWidget'],
    /**
 * @param{record} record
 * @param{search} search
 * @param{serverWidget} serverWidget
 */
    (record, search, serverWidget) => {
        /**
         * Defines the function definition that is executed before record is loaded.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @param {Form} scriptContext.form - Current form
         * @param {ServletRequest} scriptContext.request - HTTP request information sent from the browser for a client action only.
         * @since 2015.2
         */
         let isProcessed = false;
         let itemArray = [];
        const beforeLoad = (scriptContext) => {
            try {

                var newRecord = scriptContext.newRecord;
                var form = scriptContext.form;
                var lineItemCount = newRecord.getLineCount({ sublistId: 'item' });
                var itemSublist = form.getSublist({ id: 'item' });

                var discountTotalHeader = newRecord.getValue({ fieldId: 'discounttotal' });
                var taxTotalHeader = newRecord.getValue({ fieldId: 'taxtotal' }) || 0;
                var taxTotalHeader2 = newRecord.getValue({ fieldId: 'tax2total' }) || 0;
                log.debug({
                    title: 'taxTotalHeader2===',
                    details: taxTotalHeader2
                });


                itemSublist.addField({
                    id: 'custpage_htscode',
                    type: serverWidget.FieldType.TEXT,
                    label: 'HTS CODE'
                });

                var subtotalField = form.addField({
                    id: 'custpage_subtotal',
                    type: serverWidget.FieldType.FLOAT,
                    label: '[SERP] SUBTOTAL'
                });

                var taxTotalField = form.addField({
                    id: 'custpage_taxtotal',
                    type: serverWidget.FieldType.FLOAT,
                    label: '[SERP] TAX TOTAL'
                });
                var discountTotalField = form.addField({
                    id: 'custpage_discounttotal',
                    type: serverWidget.FieldType.FLOAT,
                    label: '[SERP] DISCOUNT TOTAL'
                });

                var subtotal = 0;
                var taxTotal = 0;
                var discountTotal = 0;

                discountTotal += Number(discountTotalHeader);
                taxTotal += Number(taxTotalHeader);
                taxTotal += Number(taxTotalHeader2);


                for (var i = 0; i < lineItemCount; i++) {
                    var item = newRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'item',
                        line: i
                    });
                    var itemType = newRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'itemtype',
                        line: i
                    });

                    var amount = newRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'amount',
                        line: i
                    });
                    if(isProcessed == false){
                    itemArray = itemListToAddTaxTotal();
                    }

                    if (itemType == 'InvtPart' || itemType == 'Assembly' || itemType == 'Kit') {

                        subtotal += Number(amount);

                    } else if (itemType == 'Discount') {

                        discountTotal += Number(amount);

                    } else {

                        for (var l = 0; l <= itemArray.length; l++) {

                            var data = itemArray[l];
                            
                            if (data) {

                                if (item == data.item) {

                                    taxTotal += Number(amount);

                                }
                            }

                        }

                    }

                    var htsCode = lookUpItem(item);
                    log.debug('htsCode', htsCode);

                    itemSublist.setSublistValue({
                        id: 'custpage_htscode',
                        line: i,
                        value: htsCode
                    });

                }

                log.debug('discountTotal', discountTotal);

                subtotalField.defaultValue = subtotal.toFixed(2);
                taxTotalField.defaultValue = taxTotal.toFixed(2);
                discountTotalField.defaultValue = discountTotal.toFixed(2);


            } catch (e) {
                log.error('beforeLoad error', e);
            }
        }

        function lookUpItem(itemID) {

            var myItemLookup = search.lookupFields({
                type: search.Type.ITEM,
                id: itemID,
                columns: ['custitem_hts_code']
            });

            log.debug('This is my lookup', myItemLookup);

            if (myItemLookup.custitem_hts_code.length != 0) {
                return myItemLookup.custitem_hts_code[0].text
            } else {
                return null;
            }
        }
        function itemListToAddTaxTotal() {
            var title = 'itemListToAddTaxTotal[::]';
            try {
                var searchResults = search.load({
                    id: 'customsearch4717'
                });
                var array = [];
                var obj;

                searchResults.run().each(function (result) {
                    obj = {};
                    var itemId = result.id;
                    if (itemId) {
                        obj.item = itemId;
                        array.push(obj);
                    }
                    return true;
                });
            } catch (e) {
                log.error(title + e.name, e.message);
            }
            isProcessed = true;
            return array || [];
        }



        return { beforeLoad }

    });
