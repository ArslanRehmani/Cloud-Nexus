/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       11 Aug 2016     G
 *
 */

/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */
function generateTMSCSV(request, response) {
    try {



        //get record Id
        var recordID = request.getParameter('id');
        var recordType = request.getParameter('type');
        nlapiLogExecution('DEBUG', 'recordid', recordID);
        var recordSO;

        //define static values
        var RecordStructureVersion = '1.0',
            sendingPartiesEmail = 'dispatch@gflgroup.com.au';

        //need to change W02 - Welshpool WA, Q02 - QLD
        var warehouseCode = '';

        //GFL contact info
        var GFLCode = 'GLO3PL',
            GFLContact = ' GFL Dispatch',
            GFLCompanyName = 'Global Fitness & Leisure Pty Ltd',
            GFLAddress1 = '23-25 Maygar Blvd',
            GFLAddress2 = '',
            GFLCity = 'Broadmeadows',
            GFLState = 'VIC',
            GFLPostcode = '3047',
            GFLCountryCode = 'AU',
            GFLCountryName = 'Australia',
            GFLUNLOCO = '',
            GFLPhone = '0393572166',
            GFLEmail = 'dispatch@gflgroup.com.au';

        //load record
        if (recordType == 'salesorder') {
            recordSO = nlapiLoadRecord('salesorder', recordID);
        } else if (recordType == 'transferorder') {
            recordSO = nlapiLoadRecord('transferorder', recordID);
        }

        nlapiLogExecution('DEBUG', 'REACHED HERE');

        //get data from sales order
        var orderNumber = recordSO.getFieldValue('tranid'),
            shipLocation = recordSO.getFieldText('location'),
            shipAddressee = recordSO.getFieldValue('shipaddressee'),
            shipAddr1 = recordSO.getFieldValue('shipaddr1'),
            shipAddr2 = recordSO.getFieldValue('shipaddr2'),
            shipCity = recordSO.getFieldValue('shipcity'),
            shipState = recordSO.getFieldValue('shipstate'),
            shipPostcode = recordSO.getFieldValue('shipzip'),
            shipPhone = recordSO.getFieldValue('shipphone'),
            pickupDate = recordSO.getFieldValue('custbody_pickup_date'), //missintg
            shipMethod = recordSO.getFieldText('shipmethod'),
            deliveryInstruction = _.toString(recordSO.getFieldValue('custbody_dkd_special_instructions')) //missing;

        //get data from customer
        if (recordType == 'salesorder') {
            var customerID = recordSO.getFieldValue('entity');
            customerInfoFields = ['firstname', 'lastname', 'companyname', 'phone', 'email'],
                customerInfo = nlapiLookupField('customer', customerID, customerInfoFields);
        } else if (recordType == 'transferorder') {
            //NOTE THIS PART
            var customerID = recordSO.getFieldValue('location');
            var customerInfo = {
                //firstname: '',
                //lastname: '',
                companyname: '',
                phone: '',
                email: ''
            }
            customerInfo.companyname = recordSO.getFieldText('location');
        }



        log('vars', orderNumber + " - " + pickupDate + " - " + shipMethod + " - " + shipLocation + " - " + customerID + " - " + JSON.stringify(customerInfo) + " - " + shipAddressee + " - " + shipAddr1 + " - " + shipAddr2 + " - " + shipCity + " - " + shipState + " - " + shipPostcode + " - " + shipPhone);
        log('now', new Date());
        var DateTime = moment().tz('Australia/Melbourne').locale('en-au');
        log('luxon datetime', DateTime.weekday() + "--" + DateTime.day() + "--" + DateTime.date() + "--" + DateTime.format('YYYYMMDD'));

        var requiredDate = '';

        if (DateTime.day() == 5) {
            requiredDate = DateTime.add(3, 'd').format('YYYYMMDD');
        } else if (DateTime.day() == 6) {
            requiredDate = DateTime.add(2, 'd').format('YYYYMMDD');
        } else {
            requiredDate = DateTime.add(1, 'd').format('YYYYMMDD');
        }

        if (pickupDate && _.upperCase(shipMethod).indexOf('PICKUP ') >= 0) {
            var pickupMoment = moment(pickupDate, 'DD-MM-YYYY').format('YYYYMMDD');
            log('pickup date', pickupMoment);
        }

        log('required date', requiredDate);
        /** 
        //set warehouse code
        switch (shipState) {
            
            case 'QLD':
                warehouseCode = 'Q02';
                break;

            case 'WA':
                warehouseCode = 'W03';
                break;

            case 'VIC':
                warehouseCode = 'V02';
                break;
        }
        */

        if (shipLocation.indexOf(' VIC') >= 0) {
            warehouseCode = 'V02';
        }
        if (shipLocation.indexOf(' QLD') >= 0) {
            warehouseCode = 'Q02';
        }
        if (shipLocation.indexOf(' WA') >= 0) {
            warehouseCode = 'W03';
        }

        //set shipping address
        shipAddr1 = trimCommaLineBreaker(shipAddr1);
        shipAddr2 = trimCommaLineBreaker(shipAddr2);

        //set delivery notice
        if (_.isEmpty(deliveryInstruction) || _.isNull(deliveryInstruction)) {
            deliveryInstruction = 'call ' + shipPhone + ' before delivery';
        } else {
            deliveryInstruction = trimCommaLineBreaker(deliveryInstruction);
        }
        /**
        var tmsCSV = "WOH," //col 0
            +
            RecordStructureVersion + "," +
            sendingPartiesEmail + "," +
            orderNumber + "," +
            orderNumber + ",," //col 4-5
            +
            "ORD" + ",," //col 6-7
            +
            (pickupMoment || requiredDate) + ",,,," //col 8-11
            +
            warehouseCode + ",,,,,,,,,,,,,,,,,,,,," //col 12-32
            +
            GFLCode + "," +
            GFLContact + "," +
            GFLCompanyName + "," +
            GFLAddress1 + ",," //col 36-37
            +
            GFLCity + "," +
            GFLState + "," +
            GFLPostcode + ",AU,Australia,," //col 40-43
            +
            GFLPhone + "," +
            GFLEmail + ",,," //col 45-47
            +
            customerID + ","
            // + shipAddressee + " " + customerInfo.lastname + "," 
            +
            shipAddressee + "," +
            customerInfo.companyname + "," +
            shipAddr1 + "," +
            shipAddr2 + "," +
            shipCity + "," +
            shipState + "," +
            shipPostcode + "," +
            "AU,Australia,," //col 56-58
            +
            shipPhone + "," +
            customerInfo.email + ",,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,," +
            deliveryInstruction + "\n";

            */
        // Adding Header Code Here
        // Add CSV headers
        var tmsCSV = "Distribution Center,WMS Code,Order No,Receiver Reference,Order Type,Receiver Type,Requested Dispatch Date (yyyy-MM-dd),SKU Code,Quantity,Batch,Expiration Date (yyyy-MM-dd),UOM,Receiver Code,Receiver Name,Receiver Address 1,Receiver Address 2,Receiver Suburb,Receiver Postcode,Receiver State Code,Receiver Country Code,Receiver Contact Name,Receiver Phone,Receiver Email,Track Notifications,Preferred Carrier Code,Priority,Delivery Option,Goods Handling Notes,Delivery Instructions,Agency,Connote Number,Hand Unload,Tail Gate,Signature Required,Authority to Leave,Insurance,Time Slot Booking,From Slot Date Time (yyyy-MM-dd HH:mm),To Slot Date Time (yyyy-MM-dd HH:mm),Third Party Pays,Account Code,Account Contact Name,Account Address 1,Account Address 2,Account Suburb,Account State Code,Account Postcode,Account Country Code,Account Phone,Account Email,Created From TMS\n";

        var tmsCSV = "Distribution Center,WMS Code,Order No,Receiver Reference,Order Type,Receiver Type,Requested Dispatch Date (yyyy-MM-dd),SKU Code,Quantity,Batch,Expiration Date (yyyy-MM-dd),UOM,Receiver Code,Receiver Name,Receiver Address 1,Receiver Address 2,Receiver Suburb,Receiver Postcode,Receiver State Code,Receiver Country Code,Receiver Contact Name,Receiver Phone,Receiver Email,Track Notifications,Preferred Carrier Code,Priority,Delivery Option,Goods Handling Notes,Delivery Instructions,Agency,Connote Number,Hand Unload,Tail Gate,Signature Required,Authority to Leave,Insurance,Time Slot Booking,From Slot Date Time (yyyy-MM-dd HH:mm),To Slot Date Time (yyyy-MM-dd HH:mm),Third Party Pays,Account Code,Account Contact Name,Account Address 1,Account Address 2,Account Suburb,Account State Code,Account Postcode,Account Country Code,Account Phone,Account Email,Created From TMS\n";

        tmsCSV += [
            "WOH",                                // Distribution Center
            RecordStructureVersion,              // WMS Code
            orderNumber,                         // Order No
            orderNumber,                         // Receiver Reference
            "ORD",                               // Order Type
            "",                                  // Receiver Type
            (pickupMoment || requiredDate),     // Requested Dispatch Date
            "",                                  // SKU Code
            "",                                  // Quantity
            "",                                  // Batch
            "",                                  // Expiration Date
            "",                                  // UOM
            "",                                  // Receiver Code
            shipAddressee,                       // Receiver Name
            shipAddr1,                           // Receiver Address 1
            shipAddr2,                           // Receiver Address 2
            shipCity,                            // Receiver Suburb
            shipPostcode,                        // Receiver Postcode
            shipState,                           // Receiver State Code
            "AU",                                // Receiver Country Code
            "",                                  // Receiver Contact Name
            shipPhone,                           // Receiver Phone
            customerInfo.email,                 // Receiver Email
            "",                                  // Track Notifications
            "",                                  // Preferred Carrier Code
            "",                                  // Priority
            "",                                  // Delivery Option
            "",                                  // Goods Handling Notes
            deliveryInstruction,                // Delivery Instructions
            "",                                  // Agency
            "",                                  // Connote Number
            "",                                  // Hand Unload
            "",                                  // Tail Gate
            "",                                  // Signature Required
            "",                                  // Authority to Leave
            "",                                  // Insurance
            "",                                  // Time Slot Booking
            "",                                  // From Slot Date Time
            "",                                  // To Slot Date Time
            "",                                  // Third Party Pays
            "",                                  // Account Code
            GFLContact,                          // Account Contact Name
            GFLCompanyName,                      // Account Address 1
            GFLAddress1,                         // Account Address 2
            GFLCity,                             // Account Suburb
            GFLState,                            // Account State Code
            GFLPostcode,                         // Account Postcode
            "",                                  // Account Country Code
            GFLPhone,                            // Account Phone
            GFLEmail,                            // Account Email
            ""                 // Created From TMS
        ].join(",") + "\n";


        //get line items
        var lineCount = recordSO.getLineItemCount('item');
        log('itemCount', lineCount);

        var orderLines = new Array();

        for (var i = 1; i <= lineCount; i++) {

            var itemID = recordSO.getLineItemValue('item', 'item', i),
                itemCode = recordSO.getLineItemText('item', 'item', i);
            //, itemCode = nlapiLookupField('item', itemID, 'itemid')
            var itemDescription = recordSO.getLineItemValue('item', 'description', i);
            if (itemDescription) {
                itemDescription = itemDescription.replace(/,/g, ' ');
            }
            //, itemDescription = nlapiLookupField('item', itemID, 'storedisplayname')
            var itemQuantity = recordSO.getLineItemValue('item', 'quantitycommitted', i),
                itemType = recordSO.getLineItemValue('item', 'itemtype', i);
            //, itemType2 = recordSO.getLineItemText('item', 'itemtype', i); //null

            //product Unit: UNT-units INR-inners & CTN-cartons
            var productUQ = "CTN";

            // if (itemCode.indexOf(" : ") > 0) {
            //     var itemCodeComponents = itemCode.split(' : ');
            //     itemCode = itemCodeComponents[itemCodeComponents.length - 1];
            // }


            log('line item', itemCode + " - " + itemDescription + " - " + itemQuantity + " - " + itemType);

            if (itemType == 'InvtPart') {
                if (itemCode.indexOf(" : ") > 0) {
                    var itemCodeComponents = itemCode.split(' : ');
                    itemCode = itemCodeComponents[itemCodeComponents.length - 1];
                }
                if (itemQuantity > 0) {
                    orderLines.push(
                        trimCommaLineBreaker(itemCode) + "," +
                        trimCommaLineBreaker(itemDescription) + "," +
                        trimCommaLineBreaker(itemCode) + "," +
                        trimCommaLineBreaker(itemDescription) + ",,,," //col 6-9
                        +
                        itemQuantity + "," +
                        itemQuantity + "," +
                        productUQ + ",,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,," //col 12-
                        +
                        "\n"
                    )
                }
            }

            if (itemType == 'Kit') {

                orderLines = orderLines.concat(getKitMembers(itemCode, i, itemQuantity));
            }
        }

        orderLines.sort();
        log('order lines', JSON.stringify(orderLines.sort()));
        //log('internalid', _.padStart('123456789000000', 8, ''));

        for (var k = 0; k < orderLines.length; k++) {
            tmsCSV +=
                "WOL," //col 0
                +
                (k + 1) + ",," //col 1-2
                +
                orderLines[k]
        }

        var fileName = orderNumber + ".csv";

        log('filename', fileName);

        response.setContentType('CSV', fileName, 'attachment');
        response.write(tmsCSV);
    } catch (e) {
        nlapiLogExecution('ERROR', 'error', e.message);
    }
}

function getKitMembers(itemCode, lineNum, quantity) {

    var tmsLineKitMembers = new Array();

    var kitMembers = nlapiSearchRecord(
        'kititem',
        null, [new nlobjSearchFilter('itemid', null, 'is', itemCode)], [
        new nlobjSearchColumn('memberitem'),
        new nlobjSearchColumn('memberquantity'),
        new nlobjSearchColumn('description', 'memberitem'),
        new nlobjSearchColumn('type', 'memberitem')
    ]);

    nlapiLogExecution('ERROR', 'kit members', JSON.stringify(kitMembers));

    for (var j = 0; j < kitMembers.length; j++) {
        var memberItemType = kitMembers[j].getValue(new nlobjSearchColumn('type', 'memberitem'));
        var memberItemCode = getItemCode(kitMembers[j].getText(new nlobjSearchColumn('memberitem')));
        var memberItemDesc =
            kitMembers[j].getValue(
                new nlobjSearchColumn('description', 'memberitem')
            ).replace(/,/g, ' ');

        var memberitemQty = kitMembers[j].getValue(new nlobjSearchColumn('memberquantity'));

        if (memberItemType == "InvtPart") {
            tmsLineKitMembers.push(
                trimCommaLineBreaker(memberItemCode) + "," +
                trimCommaLineBreaker(memberItemDesc) + "," +
                trimCommaLineBreaker(memberItemCode) + "," +
                trimCommaLineBreaker(memberItemDesc) + ",,,," //col 6-9
                +
                quantity * memberitemQty + "," +
                quantity * memberitemQty + "," +
                'CTN' + ",,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,," //col 12-
                +
                "\n"
            )
        }

        if (memberItemType == "Kit") {
            tmsLineKitMembers = tmsLineKitMembers.concat(getKitMembers(memberItemCode, lineNum + j, quantity * memberitemQty))
        }
    }

    return tmsLineKitMembers;
}

function getItemCode(longName) {
    var longNameArr = longName.split(' : ');

    return longNameArr[longNameArr.length - 1];
}

function log(name, value) {
    nlapiLogExecution('ERROR', name, value);
}

//remove comma and line breaker for description field
function trimCommaLineBreaker(orignal) {

    //trim comma
    var after = orignal.replace(/,/g, ".");
    //remove line breaker
    after = after.replace(/(\n|\r|\r\n)/gm, ".");

    return after;
}