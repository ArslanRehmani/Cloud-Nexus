/*
 * Copyright (C) 2020 D&D Global, Inc.
 * https://ddglobal.com/
 * All rights reserved
 * Developed for D&D Global, Inc. by:
 *
 * Lirik, Inc.
 * http://lirik.io
 * hello@lirik.io
 */

/*******************************************************************
 *
 * Name: lirik.ss.beltcuttingprocess.js
 *
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @version: 5.3.1
 *
 * Author: Lirik, Inc.
 * Purpose: Belt cutting process.
 * Script: customscript_lirik_ss_beltcuttingprocess
 * Deploy: customdeploy_lirik_ss_beltcuttingprocess
 *
 * ******************************************************************* */

define(['N/error', 'N/record', 'N/runtime', 'N/search', './lib/lodash_4.17.11_min'], function (error, record, runtime, search, _) {

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

        if (body.itemLocation) {

          const _nsScriptRec = runtime.getCurrentScript();

          const subsidiary = _nsScriptRec.getParameter({ name: 'custscript_ss_bcp_subsidiary' });
          const account = _nsScriptRec.getParameter({ name: 'custscript_ss_bcp_account' });

          const nsRecord = record.create({ type: record.Type.INVENTORY_ADJUSTMENT, isDynamic: true });
          nsRecord.setValue({ fieldId: 'subsidiary', value: subsidiary });
          nsRecord.setValue({ fieldId: 'account', value: account });
          nsRecord.setValue({ fieldId: 'custbody_ddg_status', value: '1' });
          nsRecord.setValue({ fieldId: 'memo', value: 'Created through Automated Belt Cutting process & Sales Order ID: ' + body.soid});
          nsRecord.setValue({ fieldId: 'adjlocation', value: body.itemLocation });  // Added by lalit on 08/11/2021 requested by Sami

          adjustCutItems({ nsRecord, item: body.item, itemBase: body.itemBase, itemLocation: body.itemLocation, itemBandsRibs: body.itemBandsRibs, cutItems: body.selectedItems });

          const nsRecordIdInvAdjust = nsRecord.save();
          log.debug({ title, details: { nsRecordIdInvAdjust } });

          const fields = search.lookupFields({ type: search.Type.INVENTORY_ADJUSTMENT, id: nsRecordIdInvAdjust, columns: 'tranid' });

          output.id = nsRecordIdInvAdjust;
          output.tranid = fields.tranid;
          log.debug({ title, details: { output } });

          params.response.setHeader({ name: 'Content-Type', value: 'application/json' });
          params.response.write({ output: JSON.stringify(output) });
        }
      }
    } catch (err) {
      log.error({ title: 'onRequest', details: err });
      // throw err;
      output.err = { name: err.name, message: err.message };
      log.error({ title: 'onRequest', details: { output } });

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

      log.debug({ title, details: { params } });

      const sublistId = 'inventory';

      const bandRibsItemMap = {};

      for (let index = 0; index < params.cutItems.length; index++) {

        let adjustQuantity = 1;

        const currCutItem = params.cutItems[index];
        log.debug({ title, details: { currCutItem } });

        const maxCutsPerItem = Math.floor(currCutItem.bandsRibs / params.itemBandsRibs);
        while ((maxCutsPerItem * adjustQuantity) < currCutItem.itemQuantity) {
          adjustQuantity++;
        }


        //! Code for removing inventory
        selectNewLine({ nsRecord: params.nsRecord, item: currCutItem.id, location: currCutItem.location, quantity: -adjustQuantity });

        let nsSubRecordInvDetail = params.nsRecord.getCurrentSublistSubrecord({ sublistId, fieldId: 'inventorydetail' });
        addInventoryDetail({ nsSubRecord: nsSubRecordInvDetail, inventoryNumber: currCutItem.inventoryNumberId, bin: currCutItem.bin, quantity: -adjustQuantity });
        nsSubRecordInvDetail.commitLine({ sublistId: 'inventoryassignment' });

        params.nsRecord.commitLine({ sublistId });


        //! Code for adding inventory
        selectNewLine({ nsRecord: params.nsRecord, item: params.item, location: params.itemLocation, quantity: currCutItem.itemQuantity, memo: 'Against ' + adjustQuantity + ' Qty. of ' + currCutItem.itemName });

        nsSubRecordInvDetail = params.nsRecord.getCurrentSublistSubrecord({ sublistId, fieldId: 'inventorydetail' });
        addInventoryDetail({ nsSubRecord: nsSubRecordInvDetail, inventoryNumber: currCutItem.inventoryNumber,bin: currCutItem.bin, quantity: currCutItem.itemQuantity });
        nsSubRecordInvDetail.commitLine({ sublistId: 'inventoryassignment' });

        params.nsRecord.commitLine({ sublistId });


        //! Code for adding remaining Bands Ribs inventory
        log.debug({ title, details: { adjustQuantity } });
        if (adjustQuantity - 1 > 0) {

          log.debug({ title, details: '***More than 1 Leftover***' });

          const leftOverSize = currCutItem.bandsRibs % params.itemBandsRibs;
          log.debug({ title, details: { leftOverSize } });

          if (leftOverSize > 0) {

            if (!bandRibsItemMap[leftOverSize]) {
              bandRibsItemMap[leftOverSize] = searchItembyBandsRibs({ itemBase: params.itemBase, bandsRibs: leftOverSize });
            }
            selectNewLine({ nsRecord: params.nsRecord, item: bandRibsItemMap[leftOverSize], location: currCutItem.location, quantity: adjustQuantity - 1, memo: 'Against remaning Bands Ribs of ' + currCutItem.itemName });

            nsSubRecordInvDetail = params.nsRecord.getCurrentSublistSubrecord({ sublistId, fieldId: 'inventorydetail' });
            addInventoryDetail({ nsSubRecord: nsSubRecordInvDetail, inventoryNumber: currCutItem.inventoryNumber,bin: currCutItem.bin, quantity: adjustQuantity - 1 });
            nsSubRecordInvDetail.commitLine({ sublistId: 'inventoryassignment' });

            params.nsRecord.commitLine({ sublistId });
          }
        }

        log.debug({ title, details: '***Last Leftover***' });
        const lastLeftOverSize = currCutItem.bandsRibs - ((currCutItem.itemQuantity - ((adjustQuantity - 1) * maxCutsPerItem)) * params.itemBandsRibs);
        log.debug({ title, details: { lastLeftOverSize } });

        if (lastLeftOverSize > 1) {

          if (!bandRibsItemMap[lastLeftOverSize]) {
            bandRibsItemMap[lastLeftOverSize] = searchItembyBandsRibs({ itemBase: params.itemBase, bandsRibs: lastLeftOverSize });
          }
          selectNewLine({ nsRecord: params.nsRecord, item: bandRibsItemMap[lastLeftOverSize], location: currCutItem.location, quantity: 1, memo: 'Against remaning Bands Ribs of ' + currCutItem.itemName });

          nsSubRecordInvDetail = params.nsRecord.getCurrentSublistSubrecord({ sublistId, fieldId: 'inventorydetail' });
          addInventoryDetail({ nsSubRecord: nsSubRecordInvDetail, inventoryNumber: currCutItem.inventoryNumber,bin: currCutItem.bin, quantity: 1 });
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

      const sublistId = 'inventory';

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

      const sublistId = 'inventoryassignment';

      params.nsSubRecord.selectNewLine({ sublistId });

      if (params.quantity < 0) {
        params.nsSubRecord.setCurrentSublistValue({ sublistId, fieldId: 'issueinventorynumber', value: params.inventoryNumber });
      } else if (params.quantity > 0) {
        params.nsSubRecord.setCurrentSublistValue({ sublistId, fieldId: 'receiptinventorynumber', value: params.inventoryNumber });
      }

      if (params.bin) {
        params.nsSubRecord.setCurrentSublistValue({ sublistId, fieldId: 'binnumber', value: params.bin });
      }

      params.nsSubRecord.setCurrentSublistValue({ sublistId, fieldId: 'quantity', value: params.quantity });
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

      const nsSearchResultSet = search.create({ type: search.Type.INVENTORY_ITEM, filters: JSON.parse(JSON.stringify(filters)), columns }).run();
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

  return {
    onRequest: onRequest
  };
});
