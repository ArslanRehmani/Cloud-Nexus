/**
 * @NApiVersion 2.x
 * @NScriptType suitelet
 * 
 * By Kyle Steslicki
 * 
*/
define(['N/search', 'N/record', 'N/runtime', 'N/render', 'N/ui/serverWidget', 'N/url', 'N/format/i18n', 'N/format'],
    function (search, record, runtime, render, serverWidget, url, format, format2) {
        var METALTYPE = runtime.getCurrentScript().getParameter({ name: 'custscript_metal_material_type' })

        function printCommercialInvoice(context) {
            var sourceid = context.request.parameters.fulfillmentid

            var renderer = render.create();
            renderer.setTemplateByScriptId({
                scriptId: "CUSTTMPL_COMMERCIAL_INVOICE"
            })
            var fulfillment = record.load({
                type: record.Type.ITEM_FULFILLMENT,
                id: sourceid
            });

            var subrec = fulfillment.getSubrecord({
                fieldId: 'shippingaddress'
            });

            var phone = subrec.getValue({
                fieldId: 'addrphone'
            });
            log.debug({
                title: 'phone',
                details: phone
            });
            renderer.addRecord({
                templateName: 'fulfillment',
                record: fulfillment
            });

            var salesorder = record.load({
                type: record.Type.SALES_ORDER,
                id: fulfillment.getValue('createdfrom'),
            })

            var exchangerate = salesorder.getValue('exchangerate') > 0 ? salesorder.getValue('exchangerate') : 1
            var subTotal = salesorder.getValue('custpage_subtotal') > 0 ? salesorder.getValue('custpage_subtotal') : 1
            var taxTotal = salesorder.getValue('custpage_taxtotal');
            var duties = salesorder.getValue('custbody_serp_custom_duties');
            var shippingcost = salesorder.getValue('shippingcost');
            var discountTotal = salesorder.getValue('custpage_discounttotal');
            var fulfillmentlinecount = fulfillment.getLineCount({
                sublistId: 'item'
            })
            var salesorderlinecount = salesorder.getLineCount({
                sublistId: 'item'
            })
            // log.debug({
            //     title: 'FULLFILMENT LINE COUNT',
            //     details: fulfillmentlinecount 
            // })
            // log.debug({
            //     title: 'SALESORDER LINE COUNT',
            //     details: salesorderlinecount
            // })

            var fulfillmenttotal = 0
            var TotalInvoiceValueofGoods = 0;
            var fulfillmentitems_extrainfo = []
            for (var i = 0; i < fulfillmentlinecount; i++) {
                var found = false
                var fulfillmentitem = fulfillment.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'item',
                    line: i
                })
                var fulfillmentitemname = fulfillment.getSublistText({
                    sublistId: 'item',
                    fieldId: 'itemname',
                    line: i
                })
                var fulfillmentdescription = fulfillment.getSublistText({
                    sublistId: 'item',
                    fieldId: 'description',
                    line: i
                })
                var fulfillmentqty = fulfillment.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'quantity',
                    line: i
                })
                var etailOrderLineId = fulfillment.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_celigo_etail_order_line_id',
                    line: i
                })

                var htscodelookup = search.lookupFields({
                    type: search.Type.ITEM,
                    id: fulfillmentitem,
                    columns: ['custitem_hts_code']
                });
                log.debug({ title: 'etailOrderLineId', details: etailOrderLineId })
                // log.debug({title:'DEBUG', details: htscodelookup})
                var htscode = (htscodelookup && htscodelookup.custitem_hts_code && htscodelookup.custitem_hts_code[0]) ? htscodelookup.custitem_hts_code[0].text : ''

                var extrainfo = {
                    item: fulfillmentitem,
                    itemname: fulfillmentitemname,
                    fulfillmentdescription: fulfillmentdescription.replace(/&/g, "&amp;"),
                    fulfillmentqty: fulfillmentqty,
                    etailOrderLineId: etailOrderLineId,
                    htscode: htscode,
                    subTotal: ((subTotal ? subTotal : 0).toFixed(2) + '').replace(/\B(?=(\d{3})+(?!\d))/g, ","),
                    taxTotal: ((taxTotal ? taxTotal : 0).toFixed(2) + '').replace(/\B(?=(\d{3})+(?!\d))/g, ","),
                    duties: ((duties ? duties : 0).toFixed(2) + '').replace(/\B(?=(\d{3})+(?!\d))/g, ","),
                    shippingcost: ((shippingcost ? shippingcost : 0).toFixed(2) + '').replace(/\B(?=(\d{3})+(?!\d))/g, ","),
                    discountTotal: discountTotal,
                }

                for (var j = 0; j < salesorderlinecount; j++) {

                    var salesorderitem = salesorder.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'item',
                        line: j
                    })
                    var salesorderqty = salesorder.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'quantity',
                        line: j
                    })
                    var isclosed = salesorder.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'isclosed',
                        line: j
                    })


                    // log.debug({
                    //     title: 'COMPARING',
                    //     details: fulfillmentitem + ' vs ' + salesorderitem
                    // })

                    // full match
                    if ((fulfillmentitem == salesorderitem) && (fulfillmentqty == salesorderqty) && (etailOrderLineId != '') && (isclosed == 'F' || isclosed == false)) {

                        var itemtype = salesorder.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'item_display',
                            line: j + 1
                        })

                        var rate = salesorder.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'rate',
                            line: j
                        }) * exchangerate

                        var rate1 = salesorder.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'rate',
                            line: j + 1
                        }) * exchangerate
                        var soAmount = salesorder.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'amount',
                            line: j
                        })
                        // log.debug({
                        //     title: 'DEBUG',
                        //     details: 'FOUND! Rate: ' + rate
                        // })


                        if (itemtype == 'Sales Order Discount') {
                            var newRate = (soAmount + rate1) / salesorderqty;
                            log.debug("newRate", newRate);
                            //  var extrate = newRate * fulfillmentqty
                            extrainfo.rate = (newRate.toFixed(2) + '').replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                            extrainfo.extrate = ((soAmount + rate1).toFixed(2) + '').replace(/\B(?=(\d{3})+(?!\d))/g, ",")

                            TotalInvoiceValueofGoods += (soAmount + rate1);
                        } else {
                            var extrate = rate * fulfillmentqty;
                            extrainfo.rate = (rate.toFixed(2) + '').replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                            extrainfo.extrate = (extrate.toFixed(2) + '').replace(/\B(?=(\d{3})+(?!\d))/g, ",")

                            // log.debug("TotalInvoiceValueofGoods BEFORE", TotalInvoiceValueofGoods);
                            TotalInvoiceValueofGoods += extrate;
                            // log.debug("TotalInvoiceValueofGoods AFTER", TotalInvoiceValueofGoods);
                        }

                        found = true;
                        break;
                    } 
                    // else if(fulfillmentitem == salesorderitem && etailOrderLineId != '') { // partial match

                    //     var itemtype = salesorder.getSublistValue({
                    //         sublistId: 'item',
                    //         fieldId: 'item_display',
                    //         line: j + 1
                    //     });

                    //     var rate = salesorder.getSublistValue({
                    //         sublistId: 'item',
                    //         fieldId: 'rate',
                    //         line: j
                    //     }) * exchangerate;

                    //     var rate1 = salesorder.getSublistValue({
                    //         sublistId: 'item',
                    //         fieldId: 'rate',
                    //         line: j + 1
                    //     }) * exchangerate;

                    //     var soAmount = salesorder.getSublistValue({
                    //         sublistId: 'item',
                    //         fieldId: 'amount',
                    //         line: j
                    //     });
                    //     // log.debug({
                    //     //     title: 'DEBUG',
                    //     //     details: 'FOUND PARTIAL! Rate: ' + rate
                    //     // })

                    //     if (itemtype == 'Sales Order Discount') {
                    //         var newRate = (soAmount + rate1) / salesorderqty;
                    //         log.debug("newRate", newRate);
                    //         //  var extrate = newRate * fulfillmentqty
                    //         extrainfo.rate = (newRate.toFixed(2) + '').replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                    //         extrainfo.extrate = ((soAmount + rate1).toFixed(2) + '').replace(/\B(?=(\d{3})+(?!\d))/g, ",")

                    //         TotalInvoiceValueofGoods += (soAmount + rate1);

                    //     } else {
                    //         log.debug("j 123", j);
                    //         log.debug("rate 123", rate);
                    //         log.debug({
                    //             title: 'fulfillmentqty 123',
                    //             details: fulfillmentqty
                    //         });
                    //         var extrate = rate * fulfillmentqty
                    //         log.debug({
                    //             title: 'extrate 123',
                    //             details: extrate
                    //         });
                    //         extrainfo.rate = (rate.toFixed(2) + '').replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                    //         extrainfo.extrate = (extrate.toFixed(2) + '').replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                    //         log.debug("TotalInvoiceValueofGoods BEFORE 12", TotalInvoiceValueofGoods);

                    //         TotalInvoiceValueofGoods += extrate;

                    //         log.debug("TotalInvoiceValueofGoods AFTER 12", TotalInvoiceValueofGoods);
                    //     }
                    //     found = true;

                    //     // keep going in case it finds full match
                    // }
                }

                if (found)
                    fulfillmentitems_extrainfo.push(extrainfo)
            }
            var fulfillmenttotal = (parseFloat(subTotal) || 0) + (parseFloat(taxTotal) || 0) + (parseFloat(duties) || 0) + (parseFloat(shippingcost) || 0) + (parseFloat(discountTotal) || 0);
            var grandTotal = (fulfillmenttotal.toFixed(2) + '').replace(/\B(?=(\d{3})+(?!\d))/g, ",")
            //  var formattedTotal = fulfillmenttotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            log.debug({
                title: 'fulfillmentitems_extrainfo',
                details: fulfillmentitems_extrainfo
            })
            log.debug({
                title: 'TotalInvoiceValueofGoods',
                details: TotalInvoiceValueofGoods
            })

            renderer.addCustomDataSource({
                alias: 'JSON',
                format: render.DataSource.OBJECT,
                data: {
                    //currentdate: (new Date()).toLocaleDateString(),
                    currentdate: ((new Date()).getMonth() + 1) + '/' + ((new Date()).getDate()) + '/' + ((new Date()).getFullYear()),
                    itemsextrainfo: fulfillmentitems_extrainfo,
                    fulfillmenttotal: grandTotal,
                    TotalInvoiceValueofGoods: (TotalInvoiceValueofGoods.toFixed(2) + '').replace(/\B(?=(\d{3})+(?!\d))/g, ","),
                    phone: phone

                },
            })

            var newfile = renderer.renderAsPdf()

            return newfile
        }

        var validRequests = {
            api_printCommercialInvoice: function (context) {
                var newfile = printCommercialInvoice(context)
                context.response.writeFile(newfile, true);
                //context.response.write(JSON.stringify(newfile), true);
            },
        }

        function APIRequestRouter(context) {
            // log.debug({title: 'REQUEST', details: 'PROCESSING PRINTING REQUEST'})
            // add api_ prefix to make sure you can't run default functions like valueOf for security
            if (typeof validRequests['api_' + context.request.parameters.functionname] === 'function') {
                return validRequests['api_' + context.request.parameters.functionname](context)
            }
            return false
        }

        return {
            onRequest: APIRequestRouter,
        }
    }
)