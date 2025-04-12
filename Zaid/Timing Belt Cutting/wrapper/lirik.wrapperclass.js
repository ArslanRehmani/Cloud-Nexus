/*******************************************************************
 *
 *
 * Name: lirik.wrapperclass.js
 * Script Type: scriptType
 * @version: 3.4.0
 *
 * @NApiVersion 2.x
 * @NModuleScope SameAccount
 *
 * Author: Lirik Inc.
 * Purpose: This script is used for warpper class over the screen.
 * Script:
 * Deploy:
 *
 *
 * ******************************************************************* */

define(['N/search', '../lib/lirik.utils', '../lib/lodash_4.17.11_min'], wrapper);

function wrapper(search, utils, _) {

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

        utils.debug('wrapper.addSublistData my loggggg', { idSuffix: params.request.parameters.form_fld_item_location });

        var seaBandRibsFilter = [];
        var seaFilters = [];
        seaFilters.push(['isinactive', search.Operator.IS, 'F']);
        seaFilters.push('AND');
        seaFilters.push(['inventorynumber.quantityavailable', search.Operator.GREATERTHAN, 0]);
        seaFilters.push('AND');
        seaFilters.push(['inventorynumberbinonhand.binnumber', search.Operator.NONEOF, '@NONE@']);
        seaFilters.push('AND');
        seaFilters.push(['inventorynumber.location', search.Operator.ANYOF, params.request.parameters.form_fld_item_location]);

        if (params.request.parameters.form_fld_itembase) {
          seaFilters.push('AND');
          seaFilters.push(['custitem_ddg_base', search.Operator.IS, params.request.parameters.form_fld_itembase]);
        }

        if (params.sublist.id === 'form_sl_other_loc_items') {

          if (params.request.parameters.form_fld_item) {
            seaFilters.push('AND');
            seaFilters.push(['internalidnumber', search.Operator.NOTEQUALTO, params.request.parameters.form_fld_item]);
          }

          seaBandRibsFilter.push(['custitem_ddg_bands_rids', search.Operator.EQUALTO, '1']);
          if (params.request.parameters.form_fld_bands_ribs) {
            seaBandRibsFilter.push('OR');
            seaBandRibsFilter.push(['custitem_ddg_bands_rids', search.Operator.GREATERTHAN, params.request.parameters.form_fld_bands_ribs]);
          }

          seaFilters.push('AND');
          seaFilters.push(seaBandRibsFilter);
        }
        utils.debug('wrapper.addSublistData', { seaFilters: seaFilters });

        var seaColumns = [];
        seaColumns.push(search.createColumn({ name: 'itemid' }));
        seaColumns.push(search.createColumn({ name: 'custitem_ddg_bands_rids' }));
        seaColumns.push(search.createColumn({ name: 'location', join: 'inventoryNumber', sort: search.Sort.ASC }));
        seaColumns.push(search.createColumn({ name: 'internalid', join: 'inventoryNumber', sort: search.Sort.ASC }));
        seaColumns.push(search.createColumn({ name: 'inventorynumber', join: 'inventoryNumber' }));
        seaColumns.push(search.createColumn({ name: 'quantityavailable', join: 'inventoryNumber' }));
        seaColumns.push(search.createColumn({ name: 'custitem_ddg_base' }));

        var nsSearchResultSet = search.create({ type: params.sublist.nsRecordSearchId, filters: JSON.parse(JSON.stringify(seaFilters)), columns: seaColumns }).run();
        var nsSearchResults = nsSearchResultSet.getRange({ start: 0, end: 1000 });
        utils.debug('wrapper.addSublistData', { 'nsSearchResults.length': nsSearchResults.length });

        var line = 0;
        if (Array.isArray(params.searchResults.nsSearchResults)) {
          line += params.searchResults.nsSearchResults.length;
        }
        utils.debug('wrapper.addSublistData', { line: line });

        for (var index = 0; index < nsSearchResults.length; index++ , line++) {

          var nsSearchRes = nsSearchResults[index];

          params.nsSublist.setSublistValue({ id: 'form_sl' + idSuffix + '_col_internalid', line: index, value: nsSearchRes.id });
          params.nsSublist.setSublistValue({ id: 'form_sl' + idSuffix + '_col_itemid', line: index, value: nsSearchRes.getValue(seaColumns[0]) });

          if (nsSearchRes.getValue(seaColumns[1])) {
            params.nsSublist.setSublistValue({ id: 'form_sl' + idSuffix + '_col_item_bands_ribs', line: index, value: nsSearchRes.getValue(seaColumns[1]) });
          }

          utils.debug('wrapper.addSublistData', { name: 'form_sl' + idSuffix + '_col_item_bands_ribs' });
          utils.debug('wrapper.addSublistData', { custitem_ddg_bands_rids: nsSearchRes.getValue(seaColumns[1]) });

          params.nsSublist.setSublistValue({ id: 'form_sl' + idSuffix + '_col_location', line: index, value: nsSearchRes.getValue(seaColumns[2]) });
          params.nsSublist.setSublistValue({ id: 'form_sl' + idSuffix + '_col_location_name', line: index, value: nsSearchRes.getText(seaColumns[2]) });
          params.nsSublist.setSublistValue({ id: 'form_sl' + idSuffix + '_col_inv_number', line: index, value: nsSearchRes.getValue(seaColumns[3]) });
          params.nsSublist.setSublistValue({ id: 'form_sl' + idSuffix + '_col_inv_number_name', line: index, value: nsSearchRes.getValue(seaColumns[4]) });
          params.nsSublist.setSublistValue({ id: 'form_sl' + idSuffix + '_col_qty_available', line: index, value: nsSearchRes.getValue(seaColumns[5]) });

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
}
