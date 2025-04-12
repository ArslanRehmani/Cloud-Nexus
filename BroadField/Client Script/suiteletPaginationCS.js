/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/url', 'N/ui/message'], function (url, message) {

    function pageInit(context) {
        try {
            window.onbeforeunload = null;
        }
        catch (e) {
            console.log('Pageinit Exception', e.message);
        }
    }

    function fieldChanged(context) {
        try {
            var fieldId = context.fieldId;
            var customerField = context.currentRecord.getValue({ fieldId: 'custpage_customer' });
            var vendorField = context.currentRecord.getValue({ fieldId: 'custpage_vendor' });
            var item = context.currentRecord.getValue({ fieldId: 'custpage_item' });

            if (fieldId === 'custpage_customer') {
                if (customerField) {
                    applyFilters(customerField, null);
                } else {
                    message.create({
                        title: 'Missing Customer',
                        message: 'Please select a customer first.',
                        type: message.Type.ERROR
                    }).show();
                }
            }

            if (fieldId === 'custpage_vendor' || fieldId === 'custpage_item') {
                if (customerField) {
                    applyFilters(customerField, vendorField, item);
                } else {
                    message.create({
                        title: 'Customer Required',
                        message: 'Please select a customer',
                        type: message.Type.ERROR
                    }).show();
                 
                }
            }
        } catch (e) {
            alert('Error in fieldChanged: ' + e.message);
        }
    }

    function applyFilters(customerId, vendorId, itemId) {
        try {
            var suiteletUrl = url.resolveScript({
                scriptId: 'customscript3340',
                deploymentId: 'customdeploy1',
                returnExternalUrl: false
            });

            if (customerId) {
                suiteletUrl += '&customer=' + customerId;
            }
            if (vendorId) {
                suiteletUrl += '&vendor=' + vendorId;
            }
          if (itemId) {
                suiteletUrl += '&item=' + itemId;
            }

            window.location.href = suiteletUrl;
        } catch (e) {
            alert('Error in applying filters: ' + e.message);
        }
    }

    function setPage(pageNum) {
        try {
            var suiteletUrl = url.resolveScript({
                scriptId: 'customscript3340',
                deploymentId: 'customdeploy1',
                returnExternalUrl: false
            });
            suiteletUrl += '&page=' + pageNum;
            window.location.href = suiteletUrl;
        } catch (e) {
            alert('Error in setPage: ' + e.message);
        }
    }
    function downloadExcel(selectedCustomer, selectedVendor, selectedItem, currentPage, pageSize) {
        var title = 'downloadExcel[::]';
        try {
            // console.log({
            //     title: 'selectedCustomer',
            //     details: selectedCustomer
            // });
            // console.log({
            //     title: 'selectedVendor',
            //     details: selectedVendor
            // });
            var scriptURL = url.resolveScript({
                scriptId: 'customscript_sl_downloadcust_data',
                deploymentId: 'customdeploy_sl_downloadcust_data',
                params: {
                    'selectedCustomer': selectedCustomer,
                    'selectedVendor': selectedVendor,
                    'selectedItem': selectedItem,
                    'currentPage': currentPage,
                    'pageSize': pageSize
                },
                returnExternalUrl: false
            });

            newWindow = window.open(scriptURL);
        } catch (e) {
            console.log(title + e.name, e.message);
        }
    }

    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged,
        setPage: setPage,
        downloadExcel: downloadExcel
    };
});
