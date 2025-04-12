/*******************************************************************
 *
 * Name: lirik.ss.timingbeltcuttingprocess.js
 *
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @version: 7.0.1
 *
 * Author: Lirik, Inc.
 * Purpose: Timing Belt cutting process.
 * Script: customscript_lirik_ss_timingbeltcutprc
 * Deploy: customdeploy_lirik_ss_timingbeltcutprc
 *
 * ******************************************************************* */

define(['N/error', 'N/record', 'N/runtime', 'N/search', './lib/date-fns_1.30.1_min', './lib/lodash_4.17.11_min'], function (error, record, runtime, search, dateFns, _) {

  const sublistId = 'inventory';
  const subRecordSublistId = 'inventoryassignment';

  /**
   * Definition of the Suitelet script trigger point.
   *
   * @param {object} params
   * @param {object} params.request - Encapsulation of the incoming request
   * @param {object} params.response - Encapsulation of the Suitelet response
   * @Since 2015.2
   */
  function onRequest(params) {

    const title = 'onRequest';
    const output = {};

    try {

      log.debug({ title, details: 'body ::' + params.request.body });

      if (params.request.body) {

        const body = JSON.parse(params.request.body);
        // updateOrderLineNotesOnSalesOrderLine(body);

        if (body.itemLocation) {

          const _nsScriptRec = runtime.getCurrentScript();

          const subsidiary = _nsScriptRec.getParameter({ name: 'custscript_ss_tbcp_subsidiary' });
          const account = _nsScriptRec.getParameter({ name: 'custscript_ss_tbcp_account' });
          log.debug({ title, details: { subsidiary, account } });

          let nsRecord = record.create({ type: record.Type.INVENTORY_ADJUSTMENT, isDynamic: true });
          nsRecord.setValue({ fieldId: 'subsidiary', value: subsidiary });
          nsRecord.setValue({ fieldId: 'account', value: account });
          nsRecord.setValue({ fieldId: 'custbody_ddg_status', value: '1' });
          nsRecord.setValue({ fieldId: 'memo', value: 'Created through automated Timing Belt Cutting process & Sales Order ID: ' + body.soid});
          nsRecord.setValue({ fieldId: 'adjlocation', value: body.itemLocation });  // added by lalit on 08/11/2021 requested by Sami

          adjustCutItems({ nsRecord: nsRecord, item: body.item, itemBase: body.itemBase, itemLocation: body.itemLocation, itemBandsRibs: body.itemBandsRibs, cutItems: body.selectedItems });

          const nsRecordIdInvAdjust = nsRecord.save();
          log.debug({ title, details: { nsRecordIdInvAdjust } });

          nsRecord = record.load({ type: record.Type.INVENTORY_ADJUSTMENT, id: nsRecordIdInvAdjust });

          output.id = nsRecordIdInvAdjust;
          output.tranid = nsRecord.getValue({ fieldId: 'tranid' });
          log.debug({ title, details: { output } });

          params.response.setHeader({ name: 'Content-Type', value: 'application/json' });
          params.response.write({ output: JSON.stringify(output) });
        }
      }
    } catch (err) {
      log.error({ title: 'onRequest', details: err });
      // throw err;
      output.err = { name: err.name, message: err.message };
      log.error({ title: 'onRequest', details: 'output ::' + JSON.stringify(output) });

      params.response.setHeader({ name: 'Content-Type', value: 'application/json' });
      params.response.write({ output: JSON.stringify(output) });
    }
  }

  /**
   * Adds lineitems for items that need to be cut.
   *
   * @param {object} params
   * @param {object} params.nsRecord - Inventory Adjustment Record
   * @param {object} params.item - Selected Item
   * @param {object} params.itemBase - Selected Item's Base
   * @param {object} params.itemLocation - Selected Item's Location
   * @param {object} params.itemBandsRibs - Selected Item's Band Ribs
   * @param {object[]} params.cutItems - Array of items that need to be cut
   */
  const adjustCutItems = (params) => {

    const title = 'adjustCutItems';

    try {

      log.debug({ title, details: { item: params.item, itemBase: params.itemBase, itemLocation: params.itemLocation, itemBandsRibs: params.itemBandsRibs, cutItems: params.cutItems } });

      const bandRibsItemMap = {};

      const dtToday = new Date();
      const inventoryNumber = dateFns.format(dtToday, 'YYMMDDHHmmss');

      for (let index = 0; index < params.cutItems.length; index++) {

        let adjustQuantity = 1;
        let maxCutsPerItem = 0;
        const currCutItem = params.cutItems[index];
        log.debug({ title, details: { currCutItem } });

        var bandsize = currCutItem.bandsRibs;
        if (bandsize == '1') {
          let adjustQuantity = params.itemBandsRibs;

          maxCutsPerItem = currCutItem.bandsRibs / params.itemBandsRibs;
          log.debug({ title, details: { maxCutsPerItem } });
          while ((maxCutsPerItem * adjustQuantity) < currCutItem.itemQuantity) {
            adjustQuantity++;
          }

          //! Code for removing inventory
          log.debug({ title, details: '*** Removing Inventory ***' });
          selectNewLine({ nsRecord: params.nsRecord, item: currCutItem.id, location: currCutItem.location, quantity: -adjustQuantity });

          let nsSubRecordInvDetail = params.nsRecord.getCurrentSublistSubrecord({ sublistId, fieldId: 'inventorydetail' });
          addInventoryDetail({ nsSubRecord: nsSubRecordInvDetail, inventoryNumber: currCutItem.inventoryNumberId, bin: currCutItem.bin, quantity: -adjustQuantity });
          nsSubRecordInvDetail.commitLine({ sublistId: subRecordSublistId });

          params.nsRecord.commitLine({ sublistId });

        }
        else {

          maxCutsPerItem = Math.floor(currCutItem.bandsRibs / params.itemBandsRibs);
          while ((maxCutsPerItem * adjustQuantity) < currCutItem.itemQuantity) {
            adjustQuantity++;
          }


          //! Code for removing inventory
          log.debug({ title, details: '*** Removing Inventory ***' });
          selectNewLine({ nsRecord: params.nsRecord, item: currCutItem.id, location: currCutItem.location, quantity: -adjustQuantity });

          let nsSubRecordInvDetail = params.nsRecord.getCurrentSublistSubrecord({ sublistId, fieldId: 'inventorydetail' });
          addInventoryDetail({ nsSubRecord: nsSubRecordInvDetail, inventoryNumber: currCutItem.inventoryNumberId, bin: currCutItem.bin, quantity: -adjustQuantity });
          nsSubRecordInvDetail.commitLine({ sublistId: subRecordSublistId });

          params.nsRecord.commitLine({ sublistId });

        }   // End of if(bandsize == '1')
        log.debug({ title, details: { maxCutsPerItem } });

        //! Code for adding inventory
        log.debug({ title, details: '*** Adding Inventory ***' });
        selectNewLine({ nsRecord: params.nsRecord, item: params.item, location: params.itemLocation, quantity: currCutItem.itemQuantity, memo: 'Against ' + adjustQuantity + ' Qty. of ' + currCutItem.itemName });

        nsSubRecordInvDetail = params.nsRecord.getCurrentSublistSubrecord({ sublistId, fieldId: 'inventorydetail' });
        addInventoryDetail({ nsSubRecord: nsSubRecordInvDetail, inventoryNumber: currCutItem.inventoryNumber, quantity: currCutItem.itemQuantity });
        nsSubRecordInvDetail.commitLine({ sublistId: subRecordSublistId });

        params.nsRecord.commitLine({ sublistId: sublistId });


        //! Code for adding remaining Bands Ribs inventory
        log.debug({ title, details: '*** Adding Remaining Inventory ***' });
        log.debug({ title, details: { adjustQuantity } });

        const singleBandRibItem = searchItembyBandsRibs({ itemBase: params.itemBase, bandsRibs: 1 });



        if (adjustQuantity - 1 > 0) {

          log.debug({ title, details: '***More than 1 Leftover***' });

          const leftOverSize = currCutItem.bandsRibs % params.itemBandsRibs;
          log.debug({ title, details: { leftOverSize } });

          if (leftOverSize > 0) {

            if (!bandRibsItemMap[leftOverSize]) {
              bandRibsItemMap[leftOverSize] = singleBandRibItem;
            }
            selectNewLine({ nsRecord: params.nsRecord, item: bandRibsItemMap[leftOverSize], location: currCutItem.location, quantity: leftOverSize * (adjustQuantity - 1), memo: 'Against remaning Bands Ribs of ' + currCutItem.itemName });

            nsSubRecordInvDetail = params.nsRecord.getCurrentSublistSubrecord({ sublistId, fieldId: 'inventorydetail' });
            addInventoryDetail({ nsSubRecord: nsSubRecordInvDetail, inventoryNumber: inventoryNumber + '_A', quantity: leftOverSize * (adjustQuantity - 1) });
            nsSubRecordInvDetail.commitLine({ sublistId: 'inventoryassignment' });

            params.nsRecord.commitLine({ sublistId });
          }
        }

        log.debug({ title, details: '***Last Leftover***' });
        const lastLeftOverSize = currCutItem.bandsRibs - ((currCutItem.itemQuantity - ((adjustQuantity - 1) * maxCutsPerItem)) * params.itemBandsRibs);
        log.debug({ title, details: { lastLeftOverSize } });

        if (lastLeftOverSize > 1) {

          if (!bandRibsItemMap[lastLeftOverSize]) {
            bandRibsItemMap[lastLeftOverSize] = singleBandRibItem;
          }
          selectNewLine({ nsRecord: params.nsRecord, item: bandRibsItemMap[lastLeftOverSize], location: currCutItem.location, quantity: lastLeftOverSize, memo: 'Against remaning Bands Ribs of ' + currCutItem.itemName });

          nsSubRecordInvDetail = params.nsRecord.getCurrentSublistSubrecord({ sublistId, fieldId: 'inventorydetail' });

          log.audit({ title, details: '*** ZG Tweak Inventory Number ***' });
          // addInventoryDetail({ nsSubRecord: nsSubRecordInvDetail, inventoryNumber, quantity: lastLeftOverSize });

          addInventoryDetail({ nsSubRecord: nsSubRecordInvDetail, inventoryNumber: inventoryNumber + '_Z', quantity: lastLeftOverSize });
          nsSubRecordInvDetail.commitLine({ sublistId: 'inventoryassignment' });

          params.nsRecord.commitLine({ sublistId });
        }

      }
    } catch (err) {
      log.error({ title: 'adjustCutItems', details: err });
      throw err;
    }
  }

  /**
   * Add a new lineitems on NetSuite's Inventory Adjustment record.
   *
   * @param {object} params
   * @param {object} params.nsRecord - Inventory Adjustment Record
   * @param {string} params.item - Item Id
   * @param {number} params.quantity
   * @param {string} params.location
   * @param {string=} params.memo
   */
  const selectNewLine = (params) => {

    const title = 'selectNewLine';

    try {

      log.debug({ title, details: { item: params.item, location: params.location, adjustqtyby: params.quantity, memo: params.memo } });

      params.nsRecord.selectNewLine({ sublistId });

      params.nsRecord.setCurrentSublistValue({ sublistId, fieldId: 'item', value: params.item });
      params.nsRecord.setCurrentSublistValue({ sublistId, fieldId: 'location', value: params.location });
      params.nsRecord.setCurrentSublistValue({ sublistId, fieldId: 'adjustqtyby', value: params.quantity });

      if (params.memo) {
        params.nsRecord.setCurrentSublistValue({ sublistId, fieldId: 'memo', value: params.memo });
      }

    } catch (err) {
      log.error({ title: 'selectNewLine', details: err });
      throw err;
    }

  }

  /**
   * Add a new lineitems on NetSuite's Inventory Detail subrecord.
   *
   * @param {object} params
   * @param {object} params.nsSubRecord - Inventory Detail subrecord
   * @param {string} params.inventoryNumber - Item Id
   * @param {string=} params.bin
   * @param {number} params.quantity
   */
  const addInventoryDetail = (params) => {

    const title = 'addInventoryDetail';

    try {

      log.debug({ title, details: { inventoryNumber: params.inventoryNumber, bin: params.bin, quantity: params.quantity } });

      params.nsSubRecord.selectNewLine({ sublistId: subRecordSublistId });

      if (params.quantity < 0) {
        params.nsSubRecord.setCurrentSublistValue({ sublistId: subRecordSublistId, fieldId: 'issueinventorynumber', value: params.inventoryNumber });
      } else if (params.quantity > 0) {
        params.nsSubRecord.setCurrentSublistValue({ sublistId: subRecordSublistId, fieldId: 'receiptinventorynumber', value: params.inventoryNumber });
      }

      if (params.bin) {
        params.nsSubRecord.setCurrentSublistValue({ sublistId: subRecordSublistId, fieldId: 'binnumber', value: params.bin });
      }

      params.nsSubRecord.setCurrentSublistValue({ sublistId: subRecordSublistId, fieldId: 'quantity', value: params.quantity });
    } catch (err) {
      log.error({ title: 'addInventoryDetail', details: err });
      throw err;
    }
  }

  const searchItembyBandsRibs = (params) => {

    const title = 'searchItembyBandsRibs';

    try {

      const filters = [];
      filters.push(['isinactive', search.Operator.IS, 'F']);
      filters.push('AND');
      filters.push(['custitem_ddg_base', search.Operator.IS, params.itemBase]);
      filters.push('AND');
      filters.push(['custitem_ddg_bands_rids', search.Operator.EQUALTO, params.bandsRibs]);
      log.debug({ title, details: { filters } });

      const columns = [];
      columns.push(search.createColumn({ name: 'itemid' }));
      columns.push(search.createColumn({ name: 'custitem_ddg_base' }));
      columns.push(search.createColumn({ name: 'custitem_ddg_bands_rids' }));

      const nsSearchResultSet = search.create({ type: search.Type.INVENTORY_ITEM, filters: JSON.parse(JSON.stringify(filters)), columns: columns }).run();
      const nsSearchResults = nsSearchResultSet.getRange({ start: 0, end: 1000 });
      log.debug({ title, details: { 'nsSearchResults.length': nsSearchResults.length } });

      if (nsSearchResults && nsSearchResults.length === 1) {

        const nsSearchRes = nsSearchResults[0];
        return nsSearchRes.id;
      } else if (nsSearchResults && nsSearchResults.length > 1) {
        throw error.create({ name: 'MULTIPLE_REMAINING_BANDSRIBS_ITEM_FOUND', message: 'Multiple items found with Base "' + params.itemBase + '" & Bands Ribs "' + params.bandsRibs + '"', notifyOff: true });
      } else {
        throw error.create({ name: 'REMAINING_BANDSRIBS_ITEM_NOT_FIND', message: 'Did not find an item with Base "' + params.itemBase + '" & Bands Ribs "' + params.bandsRibs + '"', notifyOff: true });
      }
    } catch (err) {
      log.error({ title: 'searchItembyBandsRibs', details: err });
      throw err;
    }
  }
  const updateOrderLineNotesOnSalesOrderLine = (body) => {

    const title = 'updateOrderLineNotesOnSalesOrderLine';
    try {
      log.debug({
        title: 'updateOrderLineNotesOnSalesOrderLine',
        details: 'YES YES'
      });
      const soId = body.currentSOid;
      const selectedItemId = body.item;
      const array = body.selectedItems;
      const itemName = array[0].itemName;
      const qty = array[0].itemQuantity;
      const SOObj = record.load({
        type: 'salesorder',
        id: parseInt(soId)
      });
      const lineNumber = SOObj.findSublistLineWithValue({
        sublistId: 'item',
        fieldId: 'item',
        value: selectedItemId
      });
      if (lineNumber != -1) {
        var notes = SOObj.getSublistValue({
          sublistId: 'item',
          fieldId: 'custcol_amcan_orderlinenotes',
          line: lineNumber
        });
        log.debug({
          title: 'notes',
          details: notes
        });
        if (notes) {
          const msg = notes + ' Cut From: ' + itemName + 'QTY: ' + qty;
          SOObj.setSublistValue({
            sublistId: 'item',
            fieldId: 'custcol_amcan_orderlinenotes',
            line: lineNumber,
            value: msg
          });
        } else {
          const msg = 'Cut From: ' + itemName + 'QTY: ' + qty;
          SOObj.setSublistValue({
            sublistId: 'item',
            fieldId: 'custcol_amcan_orderlinenotes',
            line: lineNumber,
            value: msg
          });
        }
      }
      const id = SOObj.save();
      log.debug({
        title: 'SO ID',
        details: id
      });
    } catch (err) {
      log.error({ title: 'updateOrderLineNotesOnSalesOrderLine', details: err });
      throw err;
    }
  }
  return {
    onRequest: onRequest
  };
});