/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/log', 'N/record', 'N/runtime', 'N/search', 'N/ui/serverWidget'],
    /**
 * @param{log} log
 * @param{record} record
 * @param{runtime} runtime
 * @param{search} search
 * @param{serverWidget} serverWidget
 */
    (log, record, runtime, search, serverWidget) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {
            var title = 'onRequest[::]'
            try {
                var request = scriptContext.request;
                var response = scriptContext.response;
                createSuiteletFrom(response);
            } catch (e) {
                log.error({ title: title + ' ' + e.name, details: e.message });
            }
        }
        function createSuiteletFrom(response) {
            var title = 'createSuiteletFrom[::]';
            try {
                var form = serverWidget.createForm({
                    title: 'Reallocate Items Form',
                });
                form.clientScriptModulePath = './reallocateItems.js';

                var item = form.addField({
                    id: 'custpage_item',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Item',
                    source: 'item',
                });

                var location = form.addField({
                    id: 'custpage_location',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Location',
                    source: 'location',
                });

                var quantity = form.addField({
                    id: 'custpage_quantity',
                    type: serverWidget.FieldType.INTEGER,
                    label: 'Quantity',
                });

                var quantityOnHand = form.addField({
                    id: 'custpage_quantity_on_hand',
                    type: serverWidget.FieldType.INTEGER,
                    label: 'Quantity On Hand',
                });

                var quantityCommitted = form.addField({
                    id: 'custpage_quantity_committed',
                    type: serverWidget.FieldType.INTEGER,
                    label: 'Quantity Committed',
                });


                var quantityRequired = form.addField({
                    id: 'custpage_quantity_required',
                    type: serverWidget.FieldType.INTEGER,
                    label: 'Quantity Required',
                });

                var quantityPicked = form.addField({
                    id: 'custpage_quantity_picked',
                    type: serverWidget.FieldType.INTEGER,
                    label: 'Quantity Picked',
                });

                var units = form.addField({
                    id: 'custpage_units',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Units',
                });

                quantity.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.INLINE,
                });

                quantityOnHand.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.INLINE,
                });

                quantityCommitted.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.INLINE,
                });

                quantityRequired.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.INLINE,
                });

                quantityPicked.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.INLINE,
                });

                units.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.INLINE,
                });

                var sublist = form.addSublist({
                    id: 'custpage_items_sublist',
                    type: serverWidget.SublistType.INLINEEDITOR,
                    label: 'Items',
                });
                sublist.addField({
                    id: 'custpage_checkbox',
                    type: serverWidget.FieldType.CHECKBOX,
                    label: 'Checkbox',
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.NORMAL,
                });

                sublist.addField({
                    id: 'custpage_order_date',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Order Date',
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED,
                });

                sublist.addField({
                    id: 'custpage_expected_ship_date',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Expected Ship Date',
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED,
                });

                sublist.addField({
                    id: 'custpage_order_no',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Order No.',
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED,
                });

                sublist.addField({
                    id: 'custpage_comment',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Comment',
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED,
                });

                sublist.addField({
                    id: 'custpage_special_order',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Special Order',
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED,
                });

                sublist.addField({
                    id: 'custpage_customer',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Customer',
                    source: 'customer',
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED,
                });

                sublist.addField({
                    id: 'custpage_quantity_ordered',
                    type: serverWidget.FieldType.INTEGER,
                    label: 'Quantity Ordered',
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED,
                });

                sublist.addField({
                    id: 'custpage_quantity_remaining',
                    type: serverWidget.FieldType.INTEGER,
                    label: 'Quantity Remaining',
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED,
                });

                sublist.addField({
                    id: 'custpage_quantity_received',
                    type: serverWidget.FieldType.INTEGER,
                    label: 'Quantity Received',
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED,
                });

                sublist.addField({
                    id: 'custpage_commit',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Commit',
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED,
                });

                sublist.addField({
                    id: 'custpage_numbered_quantity_remaining',
                    type: serverWidget.FieldType.INTEGER,
                    label: 'Numbered Quantity Remaining',
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED,
                });

                sublist.addField({
                    id: 'custpage_quantity_committed_sublist',
                    type: serverWidget.FieldType.INTEGER,
                    label: 'Quantity Committed',
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.NORMAL,
                });

                form.addSubmitButton({
                    label: 'Submit',
                });
                response.writePage(form);
            } catch (error) {
                log.error({
                    title: "error Message " + title,
                    details: error,
                });
            }

        }
        return { onRequest }

    });
