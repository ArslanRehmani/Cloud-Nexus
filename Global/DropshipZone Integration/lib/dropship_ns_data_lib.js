/**
 * @NApiVersion 2.1
 */
define(['N/log', 'N/record', 'N/runtime', 'N/search', 'N/file', 'N/email'],
    /**
     * @param{log} log
     * @param{record} record
     * @param{runtime} runtime
     * @param{search} search
     * @param{file} file
     */
    (log, record, runtime, search, file, email) => {

        const HELPERS = {

            customerFound: (name) => {
                var title = 'customerFound[::]';
                try {
                    var ID;
                    var customerSearchObj = search.create({
                        type: "customer",
                        filters:
                            [
                                ["entityid", "is", name],
                                "AND",
                                ["parentcustomer.entityid", "is", "Newaim Pty Ltd Trading as DropshipZone"]
                            ],
                        columns:
                            [
                                search.createColumn({ name: "entityid", label: "ID" }),
                                search.createColumn({ name: "altname", label: "Name" }),
                                search.createColumn({ name: "email", label: "Email" }),
                                search.createColumn({ name: "phone", label: "Phone" }),
                                search.createColumn({ name: "address", label: "Address" })
                            ]
                    });
                    customerSearchObj.run().each(function (result) {
                        ID = result.id;
                        return true;
                    });
                    return ID || 0;
                } catch (e) {
                    log.error(title + e.name, e.message);
                }
            },
            itemIdSearch: (item) => {
                var title = 'itemIdSearch[::]';
                try {
                    var itemID;
                    var itemSearchObj = search.create({
                        type: "item",
                        filters:
                            [
                                // ["name", "contains", item]
                                ["name", "is", item]
                            ],
                        columns:
                            [
                                search.createColumn({ name: "itemid", label: "Name" }),
                                search.createColumn({ name: "displayname", label: "Display Name" }),
                                search.createColumn({ name: "salesdescription", label: "Description" }),
                                search.createColumn({ name: "type", label: "Type" }),
                                search.createColumn({ name: "baseprice", label: "Base Price" }),
                                search.createColumn({ name: "custitem9", label: "Specifications" }),
                                search.createColumn({ name: "custitemrrp_price_bikes", label: "RRP" })
                            ]
                    });
                    itemSearchObj.run().each(function (result) {
                        itemID = result.id;
                        return true;
                    });
                    return itemID || 0;
                } catch (e) {
                    log.error(title + e.name, e.message);
                }
            },
            createSalesOrder: (data, id, emailRecepient) => {
                var title = 'createSalesOrder[::]';
                try {
                    log.debug({
                        title: 'emailRecepient + createSalesOrder',
                        details: emailRecepient
                    });
                    // var todayDSZorder = HELPERS.isToday(data.created_at);
                    // if (todayDSZorder == 'true' || todayDSZorder == true) {
                    var orderExistInNS = HELPERS.checkSOCreatedinNS(data.order_id);
                    if (orderExistInNS == 0) {// No Order Exist in NS
                        var salesOrderObj = record.create({
                            type: 'salesorder',
                            isDynamic: true
                        });
                        salesOrderObj.setValue({ fieldId: 'entity', value: parseInt(id) });
                        salesOrderObj.setValue({ fieldId: 'trandate', value: new Date(data.created_at) });
                        salesOrderObj.setValue({ fieldId: 'orderstatus', value: 'B' });//Pending Fulfillment
                        salesOrderObj.setValue({ fieldId: 'shipmethod', value: 34248 });// Australia Post
                        salesOrderObj.setValue({ fieldId: 'shippingcost', value: parseFloat(data.items[0].shipping_amount) });
                        // salesOrderObj.setValue({ fieldId: 'custbody_gfl_dropship_order_no', value: data.order_id });
                        salesOrderObj.setValue({ fieldId: 'custbody1', value: data.order_id });

                        //set Line Level Data
                        var lineCount = data.items.length;
                        if (lineCount && lineCount > 0) {
                            for (var m = 0; m < lineCount; m++) {
                                var intemInternalId = HELPERS.itemIdSearch(data.items[m].sku);
                                if (intemInternalId != 0) {
                                    log.debug({
                                        title: 'intemInternalId',
                                        details: intemInternalId
                                    });
                                    var title = 'DropShipItem[::]';
                                    try {
                                        salesOrderObj.selectNewLine({
                                            sublistId: 'item'
                                        });
                                        salesOrderObj.setCurrentSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'item',
                                            value: parseInt(intemInternalId),
                                            line: m,
                                            forceSyncSourcing: true
                                        });
                                        salesOrderObj.setCurrentSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'price',
                                            line: m,
                                            value: 89,//custom
                                            // value: 'Custom',//custom
                                            forceSyncSourcing: true
                                        });
                                        salesOrderObj.setCurrentSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'rate',
                                            line: m,
                                            value: data.items[m].price,
                                            forceSyncSourcing: true
                                        });
                                        salesOrderObj.setCurrentSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'quantity',
                                            line: m,
                                            value: data.items[m].qty,
                                            forceSyncSourcing: true
                                        });
                                        salesOrderObj.commitLine({
                                            sublistId: 'item'
                                        });
                                    } catch (e) {
                                        log.error(title + e.name, e.message);
                                        // send email if Item does not contain DropshipZone Price Level
                                        email.send({
                                            // author: 11342794,//SB
                                            author: 11923863,//PRD
                                            recipients: 'james.h@gflgroup.com.au',//PRD
                                            // recipients: 'muhammad.w@gflgroup.com.au',// SB
                                            subject: 'Item does not contain DropshipZone Price Level',
                                            body: e.message + '\n [SKU] has an invalid price level for DropshipZhone \n \n Order number ['+data.order_id+']'
                                        });
                                    }
                                } else {
                                    log.debug({
                                        title: 'NO Item available in NS',
                                        details: 'NO Data'
                                    });
                                    return true;
                                }
                            }
                            var salesOrderID = salesOrderObj.save({
                                ignoreMandatoryFields: true
                            });
                            log.debug({
                                title: 'salesOrderID',
                                details: salesOrderID
                            });
                        } else {
                            log.debug({
                                title: 'NO Item Selected',
                                details: 'Item NOT Exist in NS'
                            });
                        }
                    } else {
                        log.debug({
                            title: 'Sales Order already Exist in NS',
                            details: 'YES'
                        });
                    }
                    // } else {
                    //     log.debug({
                    //         title: 'Not Today"s Order',
                    //         details: 'This Orderid ' + data.order_id + 'is not toadys order'
                    //     });
                    // }

                } catch (e) {
                    log.error(title + e.name, e.message);
                    email.send({
                        // author: 11342794,//SB
                        author: 11923863,//PRD
                        recipients: emailRecepient,
                        subject: 'Drop Ship Zone'+ e.name,
                        body: e.message
                    });
                }
            },
            createCustomerRecord: (name, obj, emailRecepient) => {
                var title = 'createCustomerRecord[::]';
                try {
                    log.debug({
                        title: 'emailRecepient===',
                        details: emailRecepient
                    });
                    var stateObj = {
                        'Australian Capital Territory': 'ACT',
                        'New South Wales': 'NSW',
                        'Northern Territory': 'NT',
                        'Queensland': 'QLD',
                        'South Australia': 'SA',
                        'Tasmania': 'TAS',
                        'Victoria': 'VIC',
                        'Western Australia': 'WA',
                    }
                    //create Customer Record
                    var customerRecord = record.create({
                        type: 'customer',
                        isDynamic: true
                    });
                    customerRecord.setValue({ fieldId: 'companyname', value: name });
                    customerRecord.setValue({ fieldId: 'entitystatus', value: 13 }); // CUSTOMER-Closed Won
                    // customerRecord.setValue({ fieldId: 'parent', value: 11355710 });// SB // Newaim Pty Ltd Trading as DropshipZone
                    customerRecord.setValue({ fieldId: 'parent', value: 11840835 }); // PRD // Newaim Pty Ltd Trading as DropshipZone
                    customerRecord.setValue({ fieldId: 'subsidiary', value: 1 }); // GFL
                    customerRecord.setValue({ fieldId: 'email', value: obj.email });
                    //set Default Address
                    var region = obj.region;
                    customerRecord.selectLine({
                        sublistId: 'addressbook',
                        line: 0
                    });
                    var addressSubrecord = customerRecord.getCurrentSublistSubrecord({
                        sublistId: 'addressbook',
                        fieldId: 'addressbookaddress'
                    });
                    addressSubrecord.setValue({
                        fieldId: 'addressee',
                        value: name
                    });
                    addressSubrecord.setValue({
                        fieldId: 'addr1',
                        value: obj.street
                    });
                    addressSubrecord.setValue({
                        fieldId: 'city',
                        value: obj.city
                    });
                    addressSubrecord.setValue({
                        fieldId: 'state',
                        value: stateObj[region]
                    });
                    // Ensure postcode is a 4-digit string
                    var postCode;
                    if (typeof obj.postcode === "number" || typeof obj.postcode === "string") {
                        postCode = obj.postcode.toString().padStart(4, '0');
                    }
                    addressSubrecord.setValue({
                        fieldId: 'zip',
                        value: postCode
                    });
                    addressSubrecord.setValue({
                        fieldId: 'addrphone',
                        value: obj.telephone
                    });
                    addressSubrecord.commit();
                    customerRecord.commitLine({
                        sublistId: 'addressbook'
                    });
                    var custRecordId = customerRecord.save({
                        enableSourcing: true,
                        ignoreMandatoryFields: true
                    });
                    return custRecordId;
                } catch (e) {
                    log.error(title + e.name, e.message);
                    email.send({
                        // author: 11342794,//SB
                        author: 11923863,//PRD
                        recipients: emailRecepient,
                        subject: 'Drop Ship Zone'+ e.name,
                        body: e.message
                    });
                }
            },
            checkSOCreatedinNS: (orderid) => {
                var title = 'checkSOCreatedinNS[::]';
                try {
                    var Id;
                    var salesorderSearchObj = search.create({
                        type: "salesorder",
                        settings: [{ "name": "consolidationtype", "value": "ACCTTYPE" }],
                        filters:
                            [
                                ["type", "anyof", "SalesOrd"],
                                "AND",
                                // ["custbody_gfl_dropship_order_no", "equalto", orderid],
                                ["custbody1", "is", orderid],
                                "AND",
                                ["mainline", "is", "T"]
                            ],
                        columns:
                            [
                                search.createColumn({ name: "tranid", label: "Document Number" })
                            ]
                    });
                    salesorderSearchObj.run().each(function (result) {
                        Id = result.id;
                        return true;
                    });
                    return Id || 0;
                } catch (e) {
                    log.error(title + e.name, e.message);
                }
            },
            isToday: (dateString) => {
                var providedDate = new Date(dateString);
                var today = new Date();

                // Adjust provided date to match local time zone
                var localProvidedDate = new Date(providedDate.getTime() + providedDate.getTimezoneOffset() * 60000);

                return localProvidedDate.getDate() === today.getDate() &&
                    localProvidedDate.getMonth() === today.getMonth() &&
                    localProvidedDate.getFullYear() === today.getFullYear();
            }
        }

        return { HELPERS }

    });