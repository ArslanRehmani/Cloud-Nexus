/*******************************************************************
 *
 * Name: lirik.screenConfig.js
 *
 * @NApiVersion 2.x
 * @NModuleScope SameAccount
 * @version: 5.6.3
 *
 * Author: Lirik, Inc.
 * Purpose: This file contains configuration for Suitelet screen.
 * Script:
 * Deploy:
 *
 * ******************************************************************* */

define(['N/ui/serverWidget', 'N/search'], function (serverWidget, search) {

  return {
    clientScriptModulePath: './lirik.cs.timingbeltcuttingscreen.js',
    // clientScriptFileId: 12819,
    form: {
      title: 'Timing Belt Cutting Process',
      hideNavBar: false
    },
    buttons: [
      { id: 'form_btn_cancel', label: 'Cancel', functionName: 'customCancel' },
      { id: 'form_btn_reset', label: 'Reset', functionName: 'customReset' },
      { id: 'form_btn_submit', label: 'Submit', functionName: 'customShowSummary' }
    ],
    fieldsGroups: [
      { id: 'form_fldgrp_general_filters', label: 'Selected Item', tab: undefined }
    ],
    fields: [
      { id: 'form_fld_item_name', label: 'Item', type: serverWidget.FieldType.TEXT, displayType: serverWidget.FieldDisplayType.INLINE, container: 'form_fldgrp_general_filters', retainValue: true },
      { id: 'form_fld_bands_ribs', label: 'Bands Ribs', type: serverWidget.FieldType.TEXT, displayType: serverWidget.FieldDisplayType.INLINE, container: 'form_fldgrp_general_filters', retainValue: true },
      { id: 'form_fld_item_location_name', label: 'Item Location', type: serverWidget.FieldType.TEXT, displayType: serverWidget.FieldDisplayType.INLINE, container: 'form_fldgrp_general_filters', retainValue: true },
      { id: 'form_fld_item_quanity', label: 'Quantity', type: serverWidget.FieldType.TEXT, displayType: serverWidget.FieldDisplayType.INLINE, container: 'form_fldgrp_general_filters', defaultValue: '0', retainValue: true },
      { id: 'form_fld_selected_items', label: 'Selected Items', type: serverWidget.FieldType.LONGTEXT, displayType: serverWidget.FieldDisplayType.HIDDEN, defaultValue: '[]' }
    ],
    filterFields: [
      { id: 'form_fld_item', label: 'Item', type: serverWidget.FieldType.TEXT, displayType: serverWidget.FieldDisplayType.HIDDEN, container: 'form_fldgrp_general_filters' },
      { id: 'form_fld_item_location', label: 'Item Location Id', type: serverWidget.FieldType.TEXT, displayType: serverWidget.FieldDisplayType.HIDDEN, container: 'form_fldgrp_general_filters' },
      { id: 'form_fld_itembase', label: 'Base', type: serverWidget.FieldType.TEXT, displayType: serverWidget.FieldDisplayType.INLINE, container: 'form_fldgrp_general_filters' },
      { id: 'form_fld_msg_to_cutter', label: 'Message to Cutter', type: serverWidget.FieldType.TEXT, displayType: serverWidget.FieldDisplayType.ENTRY, container: 'form_fldgrp_general_filters' }
    ],
    subtabs: [
      { id: 'form_subtab_other_loc', label: 'Available Items' }
    ],
    sublists: [{
      id: 'form_sl_other_loc_items',
      label: 'Available Items',
      type: serverWidget.SublistType.LIST,
      tab: 'form_subtab_other_loc',
      columns: [
        { id: 'form_sl_other_loc_col_select', label: 'Select', type: serverWidget.FieldType.CHECKBOX },
        {
          id: 'form_sl_other_loc_col_internalid',
          label: 'Internal Id',
          type: serverWidget.FieldType.TEXT,
          displayType: serverWidget.FieldDisplayType.HIDDEN,
          width: 3,
          search: { name: 'internalid' }
        },
        {
          id: 'form_sl_other_loc_col_itemid',
          label: 'Name',
          type: serverWidget.FieldType.TEXT,
          width: 3,
          search: { name: 'itemid' }
        },
        {
          id: 'form_sl_other_loc_col_item_bands_ribs',
          label: 'Bands Ribs',
          type: serverWidget.FieldType.TEXT,
          width: 3,
          search: { name: 'custitem_ddg_bands_rids' }
        },
        {
          id: 'form_sl_other_loc_col_location',
          label: 'Location Id',
          type: serverWidget.FieldType.TEXT,
          displayType: serverWidget.FieldDisplayType.HIDDEN,
          search: { name: 'location', join: 'inventorynumber' }
        },
        {
          id: 'form_sl_other_loc_col_location_name',
          label: 'Location',
          type: serverWidget.FieldType.TEXT,
          search: { name: 'location', join: 'inventorynumber', isText: true }
        },
        {
          id: 'form_sl_other_loc_col_inv_number',
          label: 'Inventory Number Id',
          type: serverWidget.FieldType.TEXT,
          displayType: serverWidget.FieldDisplayType.HIDDEN,
          height: 3,
          width: 50,
          search: { name: 'inventorynumber', join: 'inventorynumber' }
        },
        {
          id: 'form_sl_other_loc_col_inv_number_name',
          label: 'Inventory Number',
          type: serverWidget.FieldType.TEXT,
          height: 3,
          width: 50,
          search: { name: 'inventorynumber', join: 'inventorynumber', isText: true }
        },
        {
          id: 'form_sl_other_loc_col_bin_number',
          label: 'Bin',
          type: serverWidget.FieldType.TEXT,
          displayType: serverWidget.FieldDisplayType.HIDDEN,
          height: 3,
          width: 50,
          search: { name: 'binnumber', join: 'inventoryNumberBinOnHand' }
        },
        {
          id: 'form_sl_other_loc_col_bin_number_name',
          label: 'Bin Number',
          type: serverWidget.FieldType.TEXT,
          height: 3,
          width: 50,
          search: { name: 'binnumber', join: 'inventoryNumberBinOnHand', isText: true }
        },
        {
          id: 'form_sl_other_loc_col_qty_available',
          label: 'Qty. Available',
          type: serverWidget.FieldType.TEXT,
          width: 1,
          search: { name: 'quantityavailable', join: 'inventorynumber' }
        },
        {
          id: 'form_sl_other_loc_col_total_qty_available',
          label: 'Total Qty. Available',
          type: serverWidget.FieldType.TEXT,
          width: 1,
          search: { name: 'quantityavailable', join: 'inventorynumber' }
        },
        /*{
          id: 'form_sl_other_loc_col_net_qty_available',
          label: 'Net Qty. Available',
          type: serverWidget.FieldType.TEXT,
          width: 1,
          search: { name: 'locationquantityavailable' }
        },*/
        {
          id: 'form_sl_other_loc_col_qty_max_cut',
          label: 'Max. Qty. Cuts',
          type: serverWidget.FieldType.INTEGER,
          displayType: serverWidget.FieldDisplayType.ENTRY
        },
        {
          id: 'form_sl_other_loc_col_quanity',
          label: 'Selected Item Qty.',
          type: serverWidget.FieldType.INTEGER,
          displayType: serverWidget.FieldDisplayType.ENTRY,
          width: 5,
          search: { defaultValue: '1' }
        }
        /*{
          id: 'form_sl_other_loc_col_quanity_commited',
          label: 'Commited Qty.',
          type: serverWidget.FieldType.INTEGER,
          displayType: serverWidget.FieldDisplayType.TEXT,
          width: 5,
          search: { name: 'quantitycommitted' }
        }*/
      ],
      nsRecordSearchId: 'inventoryitem',
      filters: {
        default: [
          ["isinactive", "is", "F"],
          "AND",
          ["type", "anyof", "InvtPart"],
          "AND",
          ["inventorynumber.quantityavailable", "greaterthan", "0"],
          "AND",
          ["inventorynumberbinonhand.binnumber", "noneof", "@NONE@"]
        ],
        request: [
          { id: 'form_fld_itembase', searchField: 'custitem_ddg_base', searchOperator: search.Operator.IS },
          'AND',
          { id: 'form_fld_item', searchField: 'internalidnumber', searchOperator: search.Operator.NOTEQUALTO },
          'AND',
          { id: 'form_fld_item_location', searchField: 'inventorynumber.location', searchOperator: search.Operator.IS },
          'AND',
          [
            { id: 'form_fld_bands_ribs', searchField: 'custitem_ddg_bands_rids', searchOperator: search.Operator.GREATERTHAN },
            'OR',
            { id: 'form_fld_bands_ribs_1', searchField: 'custitem_ddg_bands_rids', searchOperator: search.Operator.EQUALTO, defaultValue: 1 }
          ]
        ]
      },
      dataOnFirstLoad: true,
      dataLoadFilterField: true,
      buttons: [
        { id: 'form_sl_other_loc_btn_markall', label: 'Mark All', functionName: 'customMarkAll' },
        { id: 'form_sl_other_loc_btn_unmarkall', label: 'Unmark All', functionName: 'customUnmarkAll' }
      ]
    }],
    summary: {
      scriptId: 'customscript_lirik_ss_timingbeltcutsumm',
      scriptDeployId: 'customdeploy_lirik_ss_timingbeltcutsumm',
      id: 'items_accordion',
      groupBy: [{ property: 'itemName', secondHeader: { property: 'itemQuantity' } },
      { property: 'locationName', secondHeader: { property: 'itemQuantity' } }
      ],
      columns: {
        itemName: { id: 'item_name', label: 'Item Name', displayType: serverWidget.FieldDisplayType.HIDDEN },
        locationName: { id: 'location_name', label: 'Location Name', displayType: serverWidget.FieldDisplayType.HIDDEN },
        inventoryNumber: { id: 'inventory_number', label: 'Inventory Number', width: '20%' },
        binNumber: { id: 'bin_number', label: 'Bin Number', width: '20%' },
        itemQuantityAvailable: { id: 'item_quantity_available', label: 'Qty. Available', width: '10%' },
        itemMaxCuts: { id: 'item_max_cuts', label: 'Max. Qty. Cuts', width: '15%' },
        itemQuantity: { id: 'item_quantity', label: 'Selected Item Qty.', width: '20%' }
      }
    }
  };
});
