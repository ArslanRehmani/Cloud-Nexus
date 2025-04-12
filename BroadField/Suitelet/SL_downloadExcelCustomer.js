/**
 *@NApiVersion 2.0
 *@NScriptType Suitelet
 */
define(['N/search', 'N/log', 'N/file'], function (search, log, file) {

    function onRequest(context) {
        var title = 'onRequest[::]';
        try {
            var selectedCustomer = context.request.parameters.selectedCustomer;
            // log.debug({
            //     title: 'selectedCustomer',
            //     details: selectedCustomer
            // });
            var selectedVendor = context.request.parameters.selectedVendor;
            // log.debug({
            //     title: 'selectedVendor',
            //     details: selectedVendor
            // });
            var selectedItem = context.request.parameters.selectedItem;
            // log.debug({
            //     title: 'selectedItem',
            //     details: selectedItem
            // });
            var currentPage = context.request.parameters.currentPage;
            // log.debug({
            //     title: 'currentPage',
            //     details: currentPage
            // });
            var pageSize = context.request.parameters.pageSize;
            // log.debug({
            //     title: 'pageSize',
            //     details: pageSize
            // });


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

            var startIndex = (parseInt(currentPage) - 1) * parseInt(pageSize);
            var endIndex = parseInt(startIndex) + parseInt(pageSize);
            var pageResults = filteredResults.slice(startIndex, endIndex);
            // log.debug({
            //     title: 'SL+++++ pageResults',
            //     details: pageResults
            // });

            // Create CSV file content
            var csvContent = 'Item Number,Vendor MPN,UPC Code,Item Description,Price Level,Unit Price,MSRP Price,MAP Price\n';

            pageResults.forEach(function (item) {
                csvContent += item.itemid + ',' + item.vendorname + ',' + item.upccode + ',' + (item.displayname).replace(/,/g, '') + ',' +
                    item.pricelevel + ',' + item.unitprice + ',' + item.msrpPrice + ',' + item.mapPrice + '\n';
            });

            // Create the file
            var csvFile = file.create({
                name: 'Customer Pricing '+endIndex+'.csv',
                fileType: file.Type.CSV,
                contents: csvContent
            });

            // Set file encoding
            csvFile.encoding = file.Encoding.UTF8;

            // Set file to be downloadable
            context.response.writeFile({
                file: csvFile,
                isInline: false // This will download the file
            });
        } catch (e) {
            log.error(title + e.name, e.message);
        }
    }

    return {
        onRequest: onRequest
    }
});
