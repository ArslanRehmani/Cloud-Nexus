/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/search', 'N/log'], function (serverWidget, search, log) {

    function onRequest(context) {
        try {
            var pageSize = 100;
            var currentPage = parseInt(context.request.parameters.page) || 1;
            var selectedCustomer = context.request.parameters.customer || '36853';
            var selectedVendor = context.request.parameters.vendor || null;
            var selectedItem = context.request.parameters.item || null;

            var form = serverWidget.createForm({ title: 'Customer Pricing' });

            var customerField = form.addField({
                id: 'custpage_customer',
                type: serverWidget.FieldType.SELECT,
                label: 'Customer',
                source: 'customer'
            });
            customerField.isMandatory = true;
            customerField.defaultValue = selectedCustomer;

            var vendorField = form.addField({
                id: 'custpage_vendor',
                type: serverWidget.FieldType.SELECT,
                label: 'Vendor',
                source: 'vendor'
            });
            vendorField.defaultValue = selectedVendor;

            var item = form.addField({
                id: 'custpage_item',
                type: serverWidget.FieldType.SELECT,
                label: 'Item',
                source: 'item'
            });
            item.defaultValue = selectedItem;

            var sublist = form.addSublist({
                id: 'custpage_items',
                type: serverWidget.SublistType.LIST,
                label: 'Items'
            });

            sublist.addField({
                id: 'custpage_item_number',
                type: serverWidget.FieldType.TEXT,
                label: 'Item Number'
            });
            sublist.addField({
                id: 'custpage_vendor_mpn',
                type: serverWidget.FieldType.TEXT,
                label: 'Vendor MPN'
            });
            sublist.addField({
                id: 'custpage_upc_code',
                type: serverWidget.FieldType.TEXT,
                label: 'UPC Code'
            });
            sublist.addField({
                id: 'custpage_item_description',
                type: serverWidget.FieldType.TEXT,
                label: 'Item Description'
            });
            sublist.addField({
                id: 'custpage_unit_price',
                type: serverWidget.FieldType.TEXT,
                label: 'Unit Price'
            });
            sublist.addField({
                id: 'custpage_price_level',
                type: serverWidget.FieldType.TEXT,
                label: 'Price Level'
            });
            sublist.addField({
                id: 'custpage_msrp_price',
                type: serverWidget.FieldType.TEXT,
                label: 'MSRP Price'
            });
            sublist.addField({
                id: 'custpage_map_price',
                type: serverWidget.FieldType.TEXT,
                label: 'MAP Price'
            });

            var customerFilters = [["internalid", "anyof", selectedCustomer]];

            var customerSearchObj = search.create({
                type: "customer",
                filters: customerFilters,
                columns: ["grouppricinglevel"]
            });

            var groupPricingLevelResult = customerSearchObj.run().getRange({ start: 0, end: 1000 });
            var groupPricingLevels = [];

            groupPricingLevelResult.forEach(function (result) {
                var pricingLevel = result.getValue("grouppricinglevel");
                if (pricingLevel && pricingLevel !== '0') {
                    groupPricingLevels.push(pricingLevel);
                }
            });

            if (groupPricingLevels.length === 0) {
                context.response.writePage(form);
                return;
            }

            var itemFilters = [["type", "anyof", "Kit", "InvtPart"]];
            if (selectedVendor) {
                itemFilters.push("AND", ["vendor.internalid", "anyof", selectedVendor]);
            }
            if (selectedItem) {
                itemFilters.push("AND", ["internalid", "anyof", selectedItem]);
            }

            var itemSearchObj = search.create({
                type: "item",
                filters: itemFilters,
                columns: [
                    "itemid",
                    "displayname",
                    "upccode",
                    search.createColumn({ name: "pricelevel", join: "pricing" }),
                    search.createColumn({ name: "unitprice", join: "pricing" }),
                    "vendorname"
                ]
            });

            var pagedData = itemSearchObj.runPaged({ pageSize: 1000 });
            var allResults = [];
            pagedData.pageRanges.forEach(function (pageRange) {
                var page = pagedData.fetch({ index: pageRange.index });
                page.data.forEach(function (result) {
                    allResults.push(result);
                });
            });

            var msrpPrice = {};
            var mapPrice = {};

            allResults.forEach(function (result) {
                var itemId = result.getValue('itemid');
                var priceLevel = result.getText({ name: 'pricelevel', join: 'pricing' });
                var unitPrice = result.getValue({ name: 'unitprice', join: 'pricing' });

                if (priceLevel === 'MSRP') {
                    msrpPrice[itemId] = unitPrice;
                }
                if (priceLevel === 'MAP') {
                    mapPrice[itemId] = unitPrice;
                }
            });

            var filteredResults = [];
            var seenItems = [];

            allResults.forEach(function (result) {
                var itemId = result.getValue('itemid');
                if (seenItems.indexOf(itemId) === -1) {
                    var priceLevel = result.getText({ name: 'pricelevel', join: 'pricing' });
                    var unitPrice = result.getValue({ name: 'unitprice', join: 'pricing' });

                    groupPricingLevels.forEach(function (groupPricingLevel) {
                        if (priceLevel === groupPricingLevel && unitPrice) {
                            filteredResults.push({
                                itemid: itemId,
                                vendorname: result.getValue('vendorname'),
                                upccode: result.getValue('upccode'),
                                displayname: result.getValue('displayname'),
                                pricelevel: priceLevel,
                                unitprice: unitPrice,
                                msrpPrice: msrpPrice[itemId] || null,
                                mapPrice: mapPrice[itemId] || null
                            });
                            seenItems.push(itemId);
                            return false;
                        }
                    });
                }
            });

            var startIndex = (currentPage - 1) * pageSize;
            var endIndex = startIndex + pageSize;
            var pageResults = filteredResults.slice(startIndex, endIndex);

            for (var index = 0; index < pageResults.length; index++) {
                var result = pageResults[index];
                sublist.setSublistValue({ id: 'custpage_item_number', line: index, value: result.itemid || null });
                sublist.setSublistValue({ id: 'custpage_vendor_mpn', line: index, value: result.vendorname || null });
                sublist.setSublistValue({ id: 'custpage_upc_code', line: index, value: result.upccode || null });
                sublist.setSublistValue({ id: 'custpage_item_description', line: index, value: result.displayname || null });
                sublist.setSublistValue({ id: 'custpage_unit_price', line: index, value: result.unitprice || null });
                sublist.setSublistValue({ id: 'custpage_price_level', line: index, value: result.pricelevel || null });
                sublist.setSublistValue({ id: 'custpage_msrp_price', line: index, value: result.msrpPrice || null });
                sublist.setSublistValue({ id: 'custpage_map_price', line: index, value: result.mapPrice || null });
            }
            var pageField = form.addField({
                id: 'custpage_page',
                type: serverWidget.FieldType.TEXT,
                label: 'Page'
            }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
            pageField.defaultValue = currentPage;

            if (currentPage > 1) {
                form.addButton({
                    id: 'custpage_prev',
                    label: 'Previous',
                    functionName: 'setPage(' + (currentPage - 1) + ')'
                });
            }

            if (filteredResults.length > startIndex + pageSize) {
                form.addButton({
                    id: 'custpage_next',
                    label: 'Next',
                    functionName: 'setPage(' + (currentPage + 1) + ')'
                });
            }
            form.addButton({
                id: 'custpage_downloadexcel',
                label: 'Download Excel',
                functionName: 'downloadExcel(' + selectedCustomer + ', ' + selectedVendor + ', ' + selectedItem + ', ' + currentPage + ', ' + pageSize + ')'
            });

            form.clientScriptModulePath = './suiteletPaginationCS.js';
            context.response.writePage(form);

        } catch (e) {
            log.error('Error in Suitelet', e.message);
            context.response.write('An error occurred: ' + e.message);
        }
    }

    return {
        onRequest: onRequest
    };
});