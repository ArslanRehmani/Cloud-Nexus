/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 */

define(['N/file', 'N/format', 'xlsx'], function (file, format, XLSX) {

    function onRequest(context) {
        try {
            var parsedData = parsePDFContent();

            // Create an Excel workbook
            var wb = XLSX.utils.book_new();

            // Create a worksheet
            var ws = XLSX.utils.aoa_to_sheet(parsedData.data);

            // Apply formatting to the worksheet as needed
            XLSX.utils.sheet_add_json(ws, [], {
                header: parsedData.format,
                skipHeader: true,
                origin: -1
            });

            XLSX.utils.book_append_sheet(wb, ws, "Purchase Order");

            // Convert workbook to binary XLSX data
            var xlsxData = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });

            // Create file object
            var fileName = 'purchase_order.xlsx';
            var fileObj = file.create({
                name: fileName,
                fileType: file.Type.EXCEL,
                contents: xlsxData,
                description: 'Purchase Order Excel File',
                folder: 13401800
            });

            // Save file to the file cabinet
            var fileId = fileObj.save();

            if (fileObj) {
                context.response.writeFile({
                    file: fileObj,
                    isInline: false
                });
            } else {
                context.response.write("Error generating Excel file.");
            }
        } catch (error) {
            log.error('Error', error);
        }
    }
    function parsePDFContent() {
        // Sample parsed data
        var parsedData = {
            data: [
                ["China(HK) Global Company Limited"],
                ["Suite 223-226, Level 2, Office Building, Redwood Town East Street, Gongming, Shenzhen"],
                ["518106, China"],
                ["PO8321"],
                ["1 of 1"],
                ["Purchase Order"],
                ["TO: GALAXY BICYCLE CO.,LTD TEL: 123"],
                ["ATN: Kevin FAX: 123"],
                ["Order number: PO1262", "Signing Date: 2020-10-13"],
                ["FOB: Shenzhen", "Delivery Date: Please confirm the delivery date as soon as possible"],
                ["No", "Item Description", "QTY (Set)", "Unit", "Unit Price/USD", "Amount"],
                ["1", "Item Name", "Item Description", "Qty", "Unit", "Unit price", "Amount"],
                ["Total:", "123", "Total Amount"],
                ["Total amount/USD (uppercase):", "$100.00"],
                ["Buyer:China (Hong Kong) Global Co., Ltd.", "Seller:GALAXY BICYCLE CO.,LTD"],
                ["Representative (Signature):Cindy", "Representative (signature):sign"]
            ],
            format: [
                { s: { r: 0, c: 0 }, e: { r: 0, c: 2 }, style: { font: { bold: true }, alignment: { horizontal: 'center' } } },
                { s: { r: 1, c: 0 }, e: { r: 1, c: 2 }, style: { font: { bold: true }, alignment: { horizontal: 'center' } } },
                { s: { r: 2, c: 0 }, e: { r: 2, c: 2 }, style: { font: { bold: true }, alignment: { horizontal: 'center' } } }
            ]
        };

        return parsedData;
    }

    return {
        onRequest: onRequest
    };
});