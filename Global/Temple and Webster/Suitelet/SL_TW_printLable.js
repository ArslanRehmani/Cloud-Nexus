/**
 *@NApiVersion 2.0
 *@NScriptType Suitelet
 */
define(['../lib/temple_and_webster_lib', 'N/redirect', 'N/record', 'N/search','N/ui/serverWidget'], function (tempWebLIB, redirect, record, search, serverWidget) {

    function onRequest(context) {
        var title = 'onRequest[::]';
        try {
            var recId = context.request.parameters.SOID;
            log.debug({
                title: 'recId======',
                details: recId
            });

            var twOrderId = search.lookupFields({
                type: search.Type.SALES_ORDER,
                id: recId,
                columns: ['custbody1']
            }).custbody1;

            log.debug({
                title: 'twOrderId',
                details: twOrderId
            });

            // var data = tempWebLIB.printLable(twOrderId);
            var data = tempWebLIB.printLable(recId, twOrderId);

            log.debug({
                title: "CS Print Lable Data",
                details: data
            });

            var printLableLink = data.data.resource_carrier_label;
            log.debug({
                title: 'printLableLink',
                details: printLableLink
            });

            // var printLableLink = "https://partners.templeandwebster.com.au/v/order/document/label?ref=JITE0x%2FDX0e3rkQm51GdtTgLLktRSHJnQWzYSCk%2BsG8%3D";

            if (printLableLink) {

                // log.debug({
                //     title: "data.data.resource_carrier_label SL",
                //     details: data.data.resource_carrier_label
                // });

                // Redirect the user to the Lable URL
                redirect.redirect({
                    url: printLableLink
                });

                //Set Print Lable Check Box true and set Link in Print Lable Field
                record.submitFields({
                    type: record.Type.SALES_ORDER,
                    id: recId,
                    values: {
                        'custbody_gfl_print_lable': true,
                        'custbody_gfl_print_lablelink': printLableLink
                    }
                });

                //call Manifest API to set Order Ready For PickUp
                // var manifiestOrder = tempWebLIB.updateManifiestOrder(twOrderId);

            } else {
                var form = serverWidget.createForm({
                    title: 'Print Status'
                });

                form.addField({
                    id: 'custpage_message',
                    type: serverWidget.FieldType.INLINEHTML,
                    label: 'Message'
                }).defaultValue = '<h2>Bad Request. This order is not an unshipped order</h2>';

                context.response.writePage(form);
            }
        } catch (e) {
            log.error(title + e.name, e.message);
        }
    }

    return {
        onRequest: onRequest
    }
});
