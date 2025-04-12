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
 * Name: lirik.wrapperclass.js
 *
 * @NApiVersion 2.x
 * @version: 3.3.2
 *
 * Author: Lirik, Inc.
 * Purpose: This script is used for warpper class over the screen.
 * Script: customscript_lirik_ss_beltcuttingscreen
 * Deploy: customdeploy_lirik_ss_beltcuttingscreen
 *
 * ******************************************************************* */

define(['N/search', '../lib/lirik.utils', '../lib/lodash_4.17.11_min'], function (search, utils, _) {

  function addSublist(params) {

    try {

      log.debug({ title: 'wrapper.addSublist', details: 'params.nsSublist ::' + params.nsSublist });

      if (params.nsSublist && params.sublist) { }

      return params.nsSublist;
    } catch (err) {
      log.error({ title: 'wrapper.addSublist', details: err });
      throw err;
    }
  }

  function addSublistData(params) {
    try {

      log.debug({ title: 'wrapper.addSublistData', details: 'params.nsSublist ::' + params.nsSublist });

      if (params.nsSublist && params.sublist) {

        var idSuffix = '';
        if (params.sublist.id === 'form_sl_sel_loc_items') {
          idSuffix = '_sel_loc';
        } else if (params.sublist.id === 'form_sl_other_loc_items') {
          idSuffix = '_other_loc';
        }
        utils.debug('wrapper.addSublistData', { idSuffix: idSuffix });

        var filters = [];
        filters.push(['isinactive', search.Operator.IS, 'F']);

        if (params.sublist.id === 'form_sl_other_loc_items') {

          if (params.request.parameters.form_fld_item) {
            filters.push('AND');
            filters.push(['internalidnumber', search.Operator.NOTEQUALTO, params.request.parameters.form_fld_item]);
          }
          if (params.request.parameters.form_fld_bands_ribs) {
            filters.push('AND');
            filters.push(['custitem_ddg_bands_rids', search.Operator.GREATERTHAN, params.request.parameters.form_fld_bands_ribs]);
          }
        }

        filters.push('AND');
        filters.push(['inventorylocation.custrecord_dnd_belt_cutting', search.Operator.IS, 'T']);
        filters.push('AND');
        filters.push(['inventorynumber.location', search.Operator.ANYOF, params.request.parameters.form_fld_item_location]);
        filters.push('AND');
        filters.push(['inventorynumber.quantityavailable', search.Operator.GREATERTHAN, 0]);
        filters.push('AND');
        filters.push(['inventorynumberbinonhand.binnumber', search.Operator.NONEOF, '@NONE@']);
        /*filters.push('AND');
        filters.push(['inventorylocation.internalid', search.Operator.ANYOF, params.request.parameters.form_fld_item_location]);*/

        if (params.request.parameters.form_fld_itembase) {
          filters.push('AND');
          filters.push(['custitem_ddg_base', search.Operator.IS, params.request.parameters.form_fld_itembase]);
        }
        utils.debug('wrapper.addSublistData', { filters: filters });

        var columns = [];
        columns.push(search.createColumn({ name: 'itemid' }));
        columns.push(search.createColumn({ name: 'custitem_ddg_bands_rids' }));
        columns.push(search.createColumn({ name: 'location', join: 'inventoryNumber', sort: search.Sort.ASC }));
        columns.push(search.createColumn({ name: 'internalid', join: 'inventoryNumber', sort: search.Sort.ASC }));
        columns.push(search.createColumn({ name: 'inventorynumber', join: 'inventoryNumber' }));
        columns.push(search.createColumn({ name: 'quantityavailable', join: 'inventoryNumber' }));
        columns.push(search.createColumn({ name: 'custitem_ddg_base' }));

        var nsSearchResultSet = search.create({ type: params.sublist.nsRecordSearchId, filters: JSON.parse(JSON.stringify(filters)), columns: columns }).run();
        var nsSearchResults = nsSearchResultSet.getRange({ start: 0, end: 1000 });
        utils.debug('wrapper.addSublistData', { 'nsSearchResults.length': nsSearchResults.length });

        var line = 0;
        if (Array.isArray(params.searchResults.nsSearchResults)) {
          line += params.searchResults.nsSearchResults.length;
        }
        utils.debug('wrapper.addSublistData', { line: line });

        for (var index = 0; index < nsSearchResults.length; index++, line++) {

          var nsSearchRes = nsSearchResults[index];

          params.nsSublist.setSublistValue({ id: 'form_sl' + idSuffix + '_col_internalid', line: index, value: nsSearchRes.id });
          params.nsSublist.setSublistValue({ id: 'form_sl' + idSuffix + '_col_itemid', line: index, value: nsSearchRes.getValue(columns[0]) });

          if (nsSearchRes.getValue(columns[1])) {
            params.nsSublist.setSublistValue({ id: 'form_sl' + idSuffix + '_col_item_bands_ribs', line: index, value: nsSearchRes.getValue(columns[1]) });
          }

          utils.debug('wrapper.addSublistData', { name: 'form_sl' + idSuffix + '_col_item_bands_ribs' });
          utils.debug('wrapper.addSublistData', { custitem_ddg_bands_rids: nsSearchRes.getValue(columns[1]) });

          params.nsSublist.setSublistValue({ id: 'form_sl' + idSuffix + '_col_location', line: index, value: nsSearchRes.getValue(columns[2]) });
          params.nsSublist.setSublistValue({ id: 'form_sl' + idSuffix + '_col_location_name', line: index, value: nsSearchRes.getText(columns[2]) });
          params.nsSublist.setSublistValue({ id: 'form_sl' + idSuffix + '_col_inv_number', line: index, value: nsSearchRes.getValue(columns[3]) });
          params.nsSublist.setSublistValue({ id: 'form_sl' + idSuffix + '_col_inv_number_name', line: index, value: nsSearchRes.getValue(columns[4]) });
          params.nsSublist.setSublistValue({ id: 'form_sl' + idSuffix + '_col_qty_available', line: index, value: nsSearchRes.getValue(columns[5]) });

          if (params.sublist.id === 'form_sl_other_loc_items') {
            params.nsSublist.setSublistValue({ id: 'form_sl' + idSuffix + '_col_quanity', line: index, value: '1' });
          }
        }
      }

      return true;
    } catch (err) {
      log.error({ title: 'wrapper.addSublistData', details: err });
      throw err;
    }
  }

  return {
    addSublist: addSublist,
    addSublistData: addSublistData
  };
});