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
 * Name: lirik.cs.beltcuttingscreen.js
 *
 * @NAmdConfig ./configuration.json
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @version: 7.11.0
 *
 * Author: Lirik, Inc.
 * Purpose: Client script for Wire cutting screen.
 * Script: _
 * Deploy: _
 *
 * ******************************************************************* */

define(['N/https', './lib/lodash_4.17.11_min', 'jquery-ui'], function (https, _) {

  var sublistId = 'form_sl_other_loc_items';

  var nsTabBackgroundColor;
  var nsTextOnTabColor;

  var CurrentRecord;

  function pageInit(scriptContext) {

    addStyle('https://cdnjs.cloudflare.com/ajax/libs/jqueryui/1.11.4/jquery-ui.min.css', 'head');

    nsTabBackgroundColor = '#607799';
    nsTextOnTabColor = '#FFFFFF';

    CurrentRecord = scriptContext.currentRecord;

    // debugger;
    var itemBandsRibs = Number(CurrentRecord.getValue({ fieldId: 'form_fld_bands_ribs' }));
    itemBandsRibs = itemBandsRibs > 0 ? itemBandsRibs : 1;
    var lineCount = CurrentRecord.getLineCount({ sublistId: sublistId });
    var currSelectedItem;
    var adjustQuantity;
    var maxCutsPerItem;
    var maxCuts;
    for (var line = 0; line < lineCount; line++) {

      adjustQuantity = 1;
      currSelectedItem = { bandsRibs: 0, itemQuantityAvailable: 0 };

      currSelectedItem.bandsRibs = Number(CurrentRecord.getSublistValue({ sublistId: sublistId, fieldId: 'form_sl_other_loc_col_item_bands_ribs', line: line }));
      currSelectedItem.bandsRibs = currSelectedItem.bandsRibs > 0 ? currSelectedItem.bandsRibs : 1;

      currSelectedItem.itemQuantityAvailable = Number(CurrentRecord.getSublistValue({ sublistId: sublistId, fieldId: 'form_sl_other_loc_col_qty_available', line: line }));

      currSelectedItem.commited = Number(CurrentRecord.getSublistValue({ sublistId: sublistId, fieldId: 'form_sl_other_loc_col_quanity_commited', line: line })); // Added By Lalit on 28/06/2021
      /*if(currSelectedItem.itemQuantityAvailable <= currSelectedItem.commited)   // Added By Lalit on 28/06/2021
      {
        

        nsSublistField = CurrentRecord.getSublistField({ sublistId: sublistId, fieldId: 'form_sl_other_loc_col_select', line: line });
        
          if (nsSublistField) {
            nsSublistField.isDisabled = true;
          }
          nsSublistField = null;

          nsSublistField = CurrentRecord.getSublistField({ sublistId: sublistId, fieldId: 'form_sl_other_loc_col_quanity', line: line });
        
          if (nsSublistField) {
            nsSublistField.isDisabled = true;
          }
          nsSublistField = null;
      }     // // End of Lalit Block on 28/06/2021
*/

      if (currSelectedItem.bandsRibs > itemBandsRibs) {

        maxCutsPerItem = Math.floor(currSelectedItem.bandsRibs / itemBandsRibs);
        maxCuts = maxCutsPerItem * currSelectedItem.itemQuantityAvailable;

        CurrentRecord.selectLine({ sublistId: sublistId, line: line });
        CurrentRecord.setCurrentSublistValue({ sublistId: sublistId, fieldId: 'form_sl_other_loc_col_qty_max_cut', value: maxCuts, ignoreFieldChange: true });
      }

      var nsSublistField = CurrentRecord.getSublistField({ sublistId: sublistId, fieldId: 'form_sl_other_loc_col_qty_max_cut', line: line });
      if (nsSublistField) {
        nsSublistField.isDisabled = true;
      }
    }

    console.log('*** pageInit ***');

    // @ts-ignore
    jQuery(".lirik-overlay").fadeOut();
  }

  function addStyle(cssLink, pos) {
    var tag = document.getElementsByTagName(pos)[0];
    var addLink = document.createElement('link');
    addLink.setAttribute('type', 'text/css');
    addLink.setAttribute('rel', 'stylesheet');
    addLink.setAttribute('href', cssLink);
    tag.appendChild(addLink);
  }

  function customMarkAll() {

    try {

      CurrentRecord.setValue({ fieldId: 'form_fld_selected_items', value: '[]' });

      var lineCount = CurrentRecord.getLineCount({ sublistId: sublistId });
      for (var line = 0; line < lineCount; line++) {

        CurrentRecord.selectLine({ sublistId: sublistId, line: line });
        if (!CurrentRecord.getCurrentSublistValue({ sublistId: sublistId, fieldId: 'form_sl_other_loc_col_select' })) {
          CurrentRecord.setCurrentSublistValue({ sublistId: sublistId, fieldId: 'form_sl_other_loc_col_select', value: true, ignoreFieldChange: false, forceSyncSourcing: true });
        }
      }

    } catch (err) {
      log.error({ title: 'client.customMarkAll', details: err.name + ':' + err.message });
      throw err;
    }
  }

  function customUnmarkAll() {

    try {

      var lineCount = CurrentRecord.getLineCount({ sublistId: sublistId });
      for (var line = 0; line < lineCount; line++) {

        CurrentRecord.selectLine({ sublistId: sublistId, line: line });
        CurrentRecord.setCurrentSublistValue({ sublistId: sublistId, fieldId: 'form_sl_other_loc_col_select', value: false, ignoreFieldChange: false, forceSyncSourcing: true });
      }

      CurrentRecord.setValue({ fieldId: 'form_fld_item_quanity', value: '0' });
      CurrentRecord.setValue({ fieldId: 'form_fld_selected_items', value: '[]' });

    } catch (err) {
      log.error({ title: 'client.customUnmarkAll', details: err.name + ':' + err.message });
      throw err;
    }
  }

  function fieldChanged(scriptContext) {

    try {

      if (scriptContext.sublistId === sublistId) {

        var itemBandsRibs = Number(CurrentRecord.getValue({ fieldId: 'form_fld_bands_ribs' }));
        itemBandsRibs = itemBandsRibs > 0 ? itemBandsRibs : 1;

        var arrSelectedItems = JSON.parse(CurrentRecord.getValue({ fieldId: 'form_fld_selected_items' }));

        var currSelectedItem = {
          line: scriptContext.line,
          id: CurrentRecord.getSublistValue({ sublistId: sublistId, fieldId: 'form_sl_other_loc_col_internalid', line: scriptContext.line }),
          itemName: CurrentRecord.getSublistValue({ sublistId: sublistId, fieldId: 'form_sl_other_loc_col_itemid', line: scriptContext.line }),
          bandsRibs: Number(CurrentRecord.getSublistValue({ sublistId: sublistId, fieldId: 'form_sl_other_loc_col_item_bands_ribs', line: scriptContext.line }))
        };
        currSelectedItem.bandsRibs = currSelectedItem.bandsRibs > 0 ? currSelectedItem.bandsRibs : 1;
        currSelectedItem.location = CurrentRecord.getSublistValue({ sublistId: sublistId, fieldId: 'form_sl_other_loc_col_location', line: scriptContext.line });
        currSelectedItem.locationName = CurrentRecord.getSublistValue({ sublistId: sublistId, fieldId: 'form_sl_other_loc_col_location_name', line: scriptContext.line });
        currSelectedItem.inventoryNumberId = CurrentRecord.getSublistValue({ sublistId: sublistId, fieldId: 'form_sl_other_loc_col_inv_number', line: scriptContext.line });
        currSelectedItem.inventoryNumber = CurrentRecord.getSublistValue({ sublistId: sublistId, fieldId: 'form_sl_other_loc_col_inv_number_name', line: scriptContext.line });
        currSelectedItem.bin = CurrentRecord.getSublistValue({ sublistId: sublistId, fieldId: 'form_sl_other_loc_col_bin_number', line: scriptContext.line });
        currSelectedItem.binNumber = CurrentRecord.getSublistValue({ sublistId: sublistId, fieldId: 'form_sl_other_loc_col_bin_number_name', line: scriptContext.line });
        currSelectedItem.itemQuantityAvailable = Number(CurrentRecord.getSublistValue({ sublistId: sublistId, fieldId: 'form_sl_other_loc_col_qty_available', line: scriptContext.line }));
        currSelectedItem.itemMaxCuts = Number(CurrentRecord.getSublistValue({ sublistId: sublistId, fieldId: 'form_sl_other_loc_col_qty_max_cut', line: scriptContext.line }));
        currSelectedItem.itemQuantity = Number(CurrentRecord.getSublistValue({ sublistId: sublistId, fieldId: 'form_sl_other_loc_col_quanity', line: scriptContext.line }));

        var foundSelectedItem = _.find(arrSelectedItems, { line: currSelectedItem.line });

        if (scriptContext.fieldId === 'form_sl_other_loc_col_select') {

          if (CurrentRecord.getSublistValue({ sublistId: sublistId, fieldId: scriptContext.fieldId, line: scriptContext.line })) {

            arrSelectedItems.push(currSelectedItem);
          } else {

            if (foundSelectedItem) {
              _.remove(arrSelectedItems, { line: currSelectedItem.line });
            }
          }

        } else if (scriptContext.fieldId === 'form_sl_other_loc_col_quanity') {

          if (currSelectedItem.itemQuantity < 1) {

            alert('Qty. must be one or more.');
            if (foundSelectedItem) {

              CurrentRecord.setCurrentSublistValue({ sublistId: sublistId, fieldId: scriptContext.fieldId, value: foundSelectedItem.itemQuantity, ignoreFieldChange: true, forceSyncSourcing: true });
            } else {

              CurrentRecord.setCurrentSublistValue({ sublistId: sublistId, fieldId: scriptContext.fieldId, value: '1', ignoreFieldChange: true, forceSyncSourcing: true });
            }
            return;
          } else if (currSelectedItem.itemQuantity > currSelectedItem.itemMaxCuts) {

            alert('You can select max. ' + currSelectedItem.itemMaxCuts + ' Qty. for this item');
            if (foundSelectedItem) {

              CurrentRecord.setCurrentSublistValue({ sublistId: sublistId, fieldId: scriptContext.fieldId, value: foundSelectedItem.itemQuantity, ignoreFieldChange: true, forceSyncSourcing: true });
            } else {

              CurrentRecord.setCurrentSublistValue({ sublistId: sublistId, fieldId: scriptContext.fieldId, value: '1', ignoreFieldChange: true, forceSyncSourcing: true });
            }
            return;
          }

          if (foundSelectedItem) {
            _.remove(arrSelectedItems, { line: currSelectedItem.line });
            arrSelectedItems.push(currSelectedItem);
          }
        }

        var newItemQuantity = _.sumBy(arrSelectedItems, 'itemQuantity');
        if (newItemQuantity > 0) {
          CurrentRecord.setValue({ fieldId: 'form_fld_item_quanity', value: newItemQuantity.toString() });
        } else {
          CurrentRecord.setValue({ fieldId: 'form_fld_item_quanity', value: '0' });
        }

        CurrentRecord.setValue({ fieldId: 'form_fld_selected_items', value: JSON.stringify(arrSelectedItems) });
      }
    } catch (err) {
      log.error({ title: 'client.fieldChanged', details: err.name + ':' + err.message });
      throw err;
    }
  }

  function customCancel() {

    try {

      // @ts-ignore
      window.parent.Ext.WindowMgr.get('belt_cutting').close();

    } catch (err) {
      log.error({ title: 'client.customCancel', details: err.name + ':' + err.message });
      throw err;
    }
  }

  function customReset() {

    try {

      var lineCount = CurrentRecord.getLineCount({ sublistId: sublistId });
      for (var line = 0; line < lineCount; line++) {

        CurrentRecord.selectLine({ sublistId: sublistId, line: line });

        CurrentRecord.setCurrentSublistValue({ sublistId: sublistId, fieldId: 'form_sl_other_loc_col_quanity', value: '1', ignoreFieldChange: true, forceSyncSourcing: true });
        CurrentRecord.setCurrentSublistValue({ sublistId: sublistId, fieldId: 'form_sl_other_loc_col_select', value: false, ignoreFieldChange: true, forceSyncSourcing: true });
      }

      CurrentRecord.setValue({ fieldId: 'form_fld_item_quanity', value: '0' });
      CurrentRecord.setValue({ fieldId: 'form_fld_selected_items', value: '[]' });

    } catch (err) {
      log.error({ title: 'client.customReset', details: err.name + ':' + err.message });
      throw err;
    }
  }

  function customShowSummary() {

    try {

      var itemBandsRibs = Number(CurrentRecord.getValue({ fieldId: 'form_fld_bands_ribs' }));
      itemBandsRibs = itemBandsRibs > 0 ? itemBandsRibs : 1;

      var headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
      var body = {};
      body.item = CurrentRecord.getValue({ fieldId: 'form_fld_item' });
      body.itemLocation = CurrentRecord.getValue({ fieldId: 'form_fld_item_location' });
      body.selectedItems = JSON.parse(CurrentRecord.getValue({ fieldId: 'form_fld_selected_items' }));

      if (Array.isArray(body.selectedItems) && body.selectedItems.length > 0) {

        body.selectedItems = _.sortBy(body.selectedItems, 'line');

        var nsBtnCancel = CurrentRecord.getField({ fieldId: 'form_btn_cancel' });
        if (nsBtnCancel) {
          nsBtnCancel.isDisabled = true;
        }
        var nsBtnReset = CurrentRecord.getField({ fieldId: 'form_btn_reset' });
        if (nsBtnReset) {
          nsBtnReset.isDisabled = true;
        }
        var nsBtnSumbit = CurrentRecord.getField({ fieldId: 'form_btn_submit' });
        if (nsBtnSumbit) {
          nsBtnSumbit.isDisabled = true;
        }

        var summaryScrUrl = '/app/site/hosting/scriptlet.nl?script=customscript_lirik_ss_beltcuttingsummscr&deploy=customdeploy_lirik_ss_beltcuttingsummscr';

        var response = https.post({ url: summaryScrUrl, body: JSON.stringify(body.selectedItems), headers: headers });
        console.log('customShowSummary response.code ::' + response.code);
        // console.log('customShowSummary response.body ::' + response.body);

        if (response && (response.code === 200 || response.code === 201) && response.body) {

          // @ts-ignore
          jQuery('#data_summary ul').css({
            'list-style-type': 'none',
            'margin': '0',
            'padding': '0'
          });
          // @ts-ignore
          jQuery('#data_summary li').css({
            'display': 'inline'
          });

          // @ts-ignore
          jQuery('#data_summary').html(response.body);

          showDialog();

          // @ts-ignore
          var dialogElement = jQuery('#data_summary');

          // Code for changing css of dialog footer
          dialogElement.css({ backgroundColor: '#ffffff' });

          // Code for changing css of dialog buttons
          // @ts-ignore
          var dialogButtons = jQuery('.ui-dialog-buttonset').children();

          for (var numIndex = 0; numIndex < dialogButtons.length; numIndex++) {
            // @ts-ignore
            jQuery(dialogButtons[numIndex]).css({
              // background : '#eeeeee',
              color: '#333333'
            });
          }

          // Code for changing css of dialog header
          // @ts-ignore
          jQuery('div.ui-dialog-titlebar.ui-widget-header.ui-corner-all.ui-helper-clearfix')
            .css({
              background: nsTabBackgroundColor,
              border: '1px solid #dddddd',
              color: nsTextOnTabColor
            });

          // Code for changing css of dialog background
          // @ts-ignore
          jQuery('div.ui-dialog.ui-widget.ui-widget-content.ui-corner-all.ui-front.ui-dialog-titlebar-data_summary.ui-dialog-buttons')
            .css({
              background: '#ffffff',
              zIndex: 10000
            });

          // jQuery('#data_summary').dialog('option', 'width', '92%');
          // @ts-ignore
          jQuery('#data_summary').dialog('option', 'position', 'center');

          // Code for dialog close on background click
          // @ts-ignore
          jQuery('.ui-widget-overlay').click(function () {
            // @ts-ignore
            jQuery('.ui-dialog-titlebar-close').trigger('click');
          });
          // END jquery on 1st Jan 2015
        }
      } else {
        alert("Please select 'Items' first.");
        return;
      }
    } catch (err) {
      log.error({ title: 'client.customShowSummary', details: err.name + ':' + err.message });
      throw err;
    }
  }

  function showDialog() {

    try {

      showAccordion();

      // @ts-ignore
      jQuery('#data_summary').dialog({
        // jQuery.ui.version :1.11.4
        dialogClass: 'ui-dialog-titlebar-data_summary',
        zIndex: 10000,
        position: {
          my: 'center top',
          of: '#main_form'
        },
        draggable: true,
        resizable: false,
        height: 400,
        width: 750,
        modal: true,
        closeOnEscape: true,
        closeText: 'Click to close',
        show: {
          effect: 'fade',
          duration: 500
        },
        hide: {
          effect: 'fade',
          duration: 500
        },
        buttons: [{
          text: 'Edit',
          click: function () {
            // @ts-ignore
            jQuery(this).dialog('close');
          }
        }, {
          text: 'Confirm',
          click: function () {
            // @ts-ignore
            jQuery(".lirik-overlay").fadeIn();
            // @ts-ignore
            jQuery.when(jQuery(this).dialog('destroy')).done(setTimeout(function () { customSubmit(); }, 1000));
          }
        }],
        close: function (event, ui) {
          summaryCancel();
          // @ts-ignore
          jQuery(this).dialog('destroy');
        }
      });
    } catch (err) {
      console.log('client.showDialog ::' + err);
      alert('client.showDialog ::' + err);
    }
  }

  function showAccordion() {

    try {

      // @ts-ignore
      jQuery(function () {
        // @ts-ignore
        jQuery('#item_name_accordion,#location_name_accordion').accordion({
          header: '> div > h3',
          collapsible: true,
          active: false,
          heightStyle: 'content'
        }).sortable({
          axis: 'y',
          handle: 'h3',
          stop: function (event, ui) {
            // IE doesn't register the blur when sorting
            // so trigger focusout handlers to remove .ui-state-focus
            ui.item.children('h3').triggerHandler('focusout');

            // Refresh accordion to handle new order
            // @ts-ignore
            jQuery(this).accordion('refresh');
          }
        });
      });
    } catch (err) {
      console.log('client.showAccordion ::' + err);
      alert('client.showAccordion ::' + err);
    }
  }

  function customSubmit() {

    try {

      var beltCuttingProcessUrl = '/app/site/hosting/scriptlet.nl?script=customscript_lirik_ss_beltcuttingprocess&deploy=customdeploy_lirik_ss_beltcuttingprocess';
      var parentCurrentRecordSO = window.parent.require('N/currentRecord').get();
      var headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
      var body = {};
      body.itemBase = CurrentRecord.getValue({ fieldId: 'form_fld_itembase' });
      body.item = CurrentRecord.getValue({ fieldId: 'form_fld_item' });
      body.itemBandsRibs = Number(CurrentRecord.getValue({ fieldId: 'form_fld_bands_ribs' }));
      body.itemBandsRibs = body.itemBandsRibs > 0 ? body.itemBandsRibs : 1;
      body.itemLocation = CurrentRecord.getValue({ fieldId: 'form_fld_item_location' });
      body.soid = parentCurrentRecordSO.getValue({ fieldId: 'tranid' });
      body.selectedItems = JSON.parse(CurrentRecord.getValue({ fieldId: 'form_fld_selected_items' }));
      //My Code
      var array = JSON.parse(CurrentRecord.getValue({ fieldId: 'form_fld_selected_items' }));
      var itemName = array[0].itemName;
      var subString = itemName.substring(12, itemName.length);
      console.log('subString',subString);
      // var qty = array[0].itemQuantity;
      var qty = array[0].itemQuantityAvailable;
      var notes = parentCurrentRecordSO.getCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_amcan_orderlinenotes' });
      console.log('notes',notes);
      if (notes) {
        if(subString == '-01 BELT'){
          var msg = notes + ' Cut From: ' + itemName + ' [ ' + qty +' ]';
          parentCurrentRecordSO.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_amcan_orderlinenotes', value: msg, forceSyncSourcing: true });
        }else {
          var msg = notes + ' Cut From: ' + itemName;
          parentCurrentRecordSO.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_amcan_orderlinenotes', value: msg, forceSyncSourcing: true });
        }
      }else{
        if(subString == '-01 BELT'){
          var msg = 'Cut From: ' + itemName + ' [ ' + qty +' ]';
          parentCurrentRecordSO.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_amcan_orderlinenotes', value: msg, forceSyncSourcing: true });
        }else {
          var msg = 'Cut From: ' + itemName;
          parentCurrentRecordSO.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_amcan_orderlinenotes', value: msg, forceSyncSourcing: true });
        }
      }
      //END My Code
      var response = https.post({ url: beltCuttingProcessUrl, body: JSON.stringify(body), headers: headers });
      // console.log('customSubmit response.code ::' + response.code);
      // console.log('customSubmit response.body ::' + response.body);

      if (response && (response.code === 200 || response.code === 201) && response.body) {

        var resBody = JSON.parse(response.body);

        if (resBody.tranid) {

          // @ts-ignore
          window.parent.require('N/currentRecord');
          // @ts-ignore
          var parentCurrentRecord = window.parent.require('N/currentRecord').get();

          var quantity = parentCurrentRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'quantity' });

          //parentCurrentRecord.cancelLine({ sublistId: sublistId });

         // parentCurrentRecord.selectNewLine({ sublistId: 'item' });
          parentCurrentRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'item', value: body.item, forceSyncSourcing: true });
          parentCurrentRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'location', value: body.itemLocation, forceSyncSourcing: true });
          parentCurrentRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'quantity', value: quantity, forceSyncSourcing: true });

          alert("Inventory Adjustment #" + resBody.tranid + " has created.");
        } else if (resBody.err && resBody.err.message) {
          alert(resBody.err.message);
        }
      }

      // @ts-ignore
      window.parent.Ext.WindowMgr.get('belt_cutting').close();
    } catch (err) {
      log.error({ title: 'client.customSubmit', details: err.name + ':' + err.message });

      // @ts-ignore
      window.parent.Ext.WindowMgr.get('belt_cutting').close();
      throw err;
    }
  }

  function summaryCancel() {

    try {

      var nsBtnCancel = CurrentRecord.getField({ fieldId: 'form_btn_cancel' });
      if (nsBtnCancel) {
        nsBtnCancel.isDisabled = false;
      }
      var nsBtnReset = CurrentRecord.getField({ fieldId: 'form_btn_reset' });
      if (nsBtnReset) {
        nsBtnReset.isDisabled = false;
      }
      var nsBtnSumbit = CurrentRecord.getField({ fieldId: 'form_btn_submit' });
      if (nsBtnSumbit) {
        nsBtnSumbit.isDisabled = false;
      }

    } catch (err) {
      log.error({ title: 'client.summaryCancel', details: err.name + ':' + err.message });
      throw err;
    }
  }

  return {
    pageInit: pageInit,
    customReset: customReset,
    customCancel: customCancel,
    customShowSummary: customShowSummary,
    customMarkAll: customMarkAll,
    customUnmarkAll: customUnmarkAll,
    fieldChanged: fieldChanged
  };
});
