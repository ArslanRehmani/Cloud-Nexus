/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/render', 'N/record', 'N/log', 'N/file', 'N/search', 'N/runtime'], (render, record, log, file, search, runtime) => {

    const onRequest = (context) => {

        const title = 'onRequest[::]';

        try {
            if (context.request.method !== 'GET') return;

            const itemFulfillmentId = context.request.parameters.fulfillmentId;

            log.debug({
                title: 'itemFulfillmentId',
                details: itemFulfillmentId
            });

            const ifTemplateId = runtime.getCurrentScript().getParameter({ name: 'custscript_waites_if_pdf' });

            if (!itemFulfillmentId) {

                log.error('Missing Parameter', 'fulfillmentId is required');

                context.response.write(`Missing Parameter: Please add IF PDF Template in parameters.`);

                return;
            }

            const fulfillmentRec = record.load({
                type: record.Type.ITEM_FULFILLMENT,
                id: itemFulfillmentId
            });

            const trandate = fulfillmentRec.getValue('trandate');

            const date = new Date(trandate);

            const formattedDate = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;

            const subsidiaryId = fulfillmentRec.getValue('subsidiary');

            const subsidiaryRec = record.load({ type: record.Type.SUBSIDIARY, id: subsidiaryId });

            const createdFromId = fulfillmentRec.getValue({ fieldId: 'createdfrom' });

            const trackingNumber = fulfillmentRec.getValue({ fieldId: 'custbodytracking_number' });

            const created_by = fulfillmentRec.getText({ fieldId: 'custbody_salora_created_by' });
            const created_by_ID = fulfillmentRec.getValue({ fieldId: 'custbody_salora_created_by' });

            const createdFromText = fulfillmentRec.getText({ fieldId: 'createdfrom' });

            let createdFromRec, employeeId, employeeName = '', employeeTitle = '', employeePhone = '', term = '', toShipAddress = '';

            if (createdFromId) {

                const isTransferOrder = createdFromText.includes('Transfer Order');

                createdFromRec = record.load({
                    type: isTransferOrder ? record.Type.TRANSFER_ORDER : record.Type.SALES_ORDER,
                    id: createdFromId
                });

                employeeId = createdFromRec.getValue({ fieldId: isTransferOrder ? 'employee' : 'salesrep' });

              locationID = createdFromRec.getValue({ fieldId: 'location' });
               log.debug({
                    title: 'locationID',
                    details: locationID
                });

             var locationRec = record.load({
                        type: 'location',
                        id: locationID
                    });

                    var addressLOc = locationRec.getValue({fieldId: 'mainaddress_text'}).replace(/&/g, '&amp;');

              log.debug({
                    title: 'addressLOc',
                    details: addressLOc
                });

                term = createdFromRec.getText({ fieldId: 'incoterm' }) || '';

                toShipAddress = ((createdFromRec.getValue({ fieldId: 'shipaddress' }) || '').replace(/\n/g, '<br/>')).replace(/&/g, "&amp;");

                if (created_by_ID) {

                    const empFields = search.lookupFields({
                        type: search.Type.EMPLOYEE,
                        id: created_by_ID,
                        columns: ['entityid', 'title', 'phone']
                    });
                    employeeName = (empFields.entityid || '').trim().replace(/&/g, '&amp;');
                    employeeTitle = (empFields.title || '').replace(/&/g, '&amp;');
                    employeePhone = empFields.phone || '';
                }
            }

            const itemArray = itemRelatedDataFun(itemFulfillmentId);
            log.debug({
                title: 'itemArray==',
                details: itemArray
            });


            const logoFileId = subsidiaryRec.getValue('logo');

            const shipFromAddress = ((subsidiaryRec.getValue({ fieldId: 'mainaddress_text' }) || '').replace(/\n/g, '<br/>')).replace(/&/g, '&amp;');

            const logoUrl = file.load({ id: logoFileId }).url.replace(/&/g, '&amp;');

            const customData = {
                logo: logoUrl,
                shipfrom: shipFromAddress,
                addressLOc: addressLOc,
                toship: toShipAddress,
                trackingNumber: trackingNumber,
                created_by: created_by,
                tranDate: formattedDate,
                lineItem: itemArray,
                term,
                commercialTerm: createdFromText,
                employeeName,
                employeeTitle,
                employeePhone
            };

            const myFile = render.create();

            myFile.setTemplateById({ id: ifTemplateId });

            myFile.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: "record",
                data: customData
            });

            const invoicePdf = myFile.renderAsPdf();

            context.response.writeFile(invoicePdf, true);
        } catch (e) {

            log.error(`${title}${e.name} - Error generating PDF`, e.message);

            context.response.write(`Error generating PDF: ${e.message || e.toString()}`);
        }
    };

    const itemRelatedDataFun = (id) => {
        const title = 'itemRelatedDataFun[::]';
        try {

            const itemfulfillmentSearchObj = search.create({
                type: "itemfulfillment",
                settings: [{ name: "consolidationtype", value: "ACCTTYPE" }],
                filters: [
                    ["type", "anyof", "ItemShip"],
                    "AND", ["internalid", "anyof", id],
                    "AND", ["cogs", "is", "F"],
                    "AND", ["shipping", "is", "F"],
                    "AND", ["taxline", "is", "F"]
                ],
                columns: [
                    search.createColumn({
                        name: "salesdescription",
                        join: "item",
                        label: "Description"
                    }),
                    search.createColumn({
                        name: "itemid",
                        join: "item",
                        label: "Name"
                    }),
                    search.createColumn({ name: "quantity", label: "Quantity" }),
                    search.createColumn({ name: "unit", label: "Units" }),
                    search.createColumn({
                        name: "countryofmanufacture",
                        join: "item",
                        label: "Manufacturer Country"
                    }),
                    search.createColumn({
                        name: "manufacturertariff",
                        join: "item",
                        label: "Manufacturer Tariff"
                    }),
                    search.createColumn({ name: "custcol_serp_individual_cost", label: "Individual Cost" })
                ]
            });

            const results = [];

            itemfulfillmentSearchObj.run().each(result => {
                results.push({
                    itemName: result.getValue({ name: 'itemid', join: 'item' }).replace(/&/g, "&amp;"),
                    description: result.getValue({ name: 'salesdescription', join: 'item' }).replace(/&/g, "&amp;"),
                    countryofmanufacture: result.getValue({ name: 'countryofmanufacture', join: 'item' }),
                    quantity: result.getValue({ name: 'quantity' }),
                    uom: result.getValue({ name: 'unit' }),
                    individual_cost: result.getValue({ name: 'custcol_serp_individual_cost' }),
                    manufacturertariff: result.getValue({ name: 'manufacturertariff', join: 'item' }),
                    itemid: result.getValue({ name: 'itemid', join: 'item' })
                    
                });

                return true;
            });

            return results;

            /*
            itemfulfillmentSearchObj.id="customsearch1757414707105";
            itemfulfillmentSearchObj.title="Custom Transaction Search 5 (copy)";
            var newSearchId = itemfulfillmentSearchObj.save();
            */

        } catch (e) {
            log.error(`${title}${e.name}`, e.message);
            return [];
        }
    };

    return { onRequest };
});
