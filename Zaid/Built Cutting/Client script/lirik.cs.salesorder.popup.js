/*******************************************************************
 *
 * Name: lirik.cs.salesorder.popup.js
 *
 * @NApiVersion 2.x
 * @NModuleScope SameAccount
 * @version 1.0.1
 *
 * Author: Lirik, Inc.
 * Purpose: This script is used to open a popup on a click of a item sublist button of a SalesOrder.
 *
 * ******************************************************************* */

 define(['N/url', 'N/https', 'N/search', 'N/currentRecord', 'N/ui/dialog', 'N/ui/message', 'N/runtime', 'N/record',], function (url, https, search, currentRecord, dialog, message, runtime, record) {

  var CurrentRecord;

  var sublistId = 'item';

  function popup(params) {

    try {
      // console.log('client.popup ::' + params);
      params = JSON.parse(params);

      // debugger;
      if (params.id && params.label && params.url) {

        CurrentRecord = currentRecord.get();

        if (!checkValidations(params)) {
          return;
        }

        params = wrapper(params);

        nlExtOpenWindow(params.url, params.id, params.width, params.height, '', true, params.label);
      }
    } catch (err) {
      console.log('client.popup ::' + err);
    }
  }

  function checkValidations(params) {

    try {

      // console.log('client.checkValidations ::' + params);

      if (!CurrentRecord.getValue({ fieldId: 'entity' })) {
        alert("Please select a 'Customer' first.");
        return false;
      }
      if (!CurrentRecord.getValue({ fieldId: 'subsidiary' })) {
        alert("'Subsidiary' field has invalid value.");
        return false;
      }

      if (params.id === 'belt_cutting' || params.id === 'timing_belt_cutting') {
        if (!CurrentRecord.getCurrentSublistValue({ sublistId: sublistId, fieldId: sublistId })) {
          alert("Please select an 'Item' first.");
          return false;
        } else if (!CurrentRecord.getCurrentSublistValue({ sublistId: sublistId, fieldId: 'custcol_ddg_item_base' })) {
          alert("Item must have Base for 'Belt Cutting'.");
          return false;
        } else if (!CurrentRecord.getCurrentSublistValue({ sublistId: sublistId, fieldId: 'location' })) {
          alert("Please provide a location for the selected 'Item'.");
          return false;
        }
      }
      if (params.id === 'stock_availability' || params.id === 'sales_history' || params.id==='sales_history_customer' || params.id==='available_to_build' || params.id==='open_quotes') {
        if (!CurrentRecord.getCurrentSublistValue({ sublistId: sublistId, fieldId: sublistId })) {
          alert("Please select an 'Item' first.");
          return false;
        }

        if(params.id==='available_to_build')
        {
            //alert("test"+CurrentRecord.getCurrentSublistValue({ sublistId: sublistId, fieldId: 'itemtype' }));
            if (CurrentRecord.getCurrentSublistValue({ sublistId: sublistId, fieldId: 'itemtype' }) != "Assembly") {
              alert("Please select an Assembly item type.");
              return false;
            }
        }
      }

      return true;
    } catch (err) {
      console.log('client.checkValidations ::' + err);
    }
  }

  function wrapper(params) {
    try {

      // console.log('client.wrapper ::' + JSON.stringify(params));

      if ((params.id === 'belt_cutting' || params.id === 'timing_belt_cutting') && params.url) {

        params.url += '&form_fld_item_location=' + CurrentRecord.getCurrentSublistValue({ sublistId: sublistId, fieldId: 'location' });
        params.url += '&form_fld_item_location_name=' + encodeURIComponent(CurrentRecord.getCurrentSublistText({ sublistId: sublistId, fieldId: 'location' }));
        params.url += '&form_fld_item=' + CurrentRecord.getCurrentSublistValue({ sublistId: sublistId, fieldId: sublistId });
        params.url += '&form_fld_item_name=' + encodeURIComponent(CurrentRecord.getCurrentSublistText({ sublistId: sublistId, fieldId: sublistId }));
        params.url += '&form_fld_itembase=' + CurrentRecord.getCurrentSublistValue({ sublistId: sublistId, fieldId: 'custcol_ddg_item_base' });

        var itemBandsRibs = Number(CurrentRecord.getCurrentSublistValue({ sublistId: sublistId, fieldId: 'custcol_ddg_bands_ribs' })) > 0 ? Number(CurrentRecord.getCurrentSublistValue({ sublistId: sublistId, fieldId: 'custcol_ddg_bands_ribs' })) : 1;
        params.url += '&form_fld_bands_ribs=' + itemBandsRibs;
      } else if (params.id === 'add_multiple_items' && params.url) {
        var custPriceLevel = CurrentRecord.getValue({ fieldId: 'custbody_ddg_customer_price_level' }) ? CurrentRecord.getValue({ fieldId: 'custbody_ddg_customer_price_level' }) : 1;
        params.url += '&form_fld_cust_price_level=' + custPriceLevel;
      }
      else if(params.id === 'stock_availability' && params.url) {
        params.url += '&form_fld_item=' + CurrentRecord.getCurrentSublistValue({ sublistId: sublistId, fieldId: sublistId });
        params.url += '&form_fld_item_name=' + escape(CurrentRecord.getCurrentSublistText({ sublistId: sublistId, fieldId: sublistId }));
      }
      else if(params.id === 'sales_history' && params.url) {
        params.url += '&form_fld_item=' + CurrentRecord.getCurrentSublistValue({ sublistId: sublistId, fieldId: sublistId });
        params.url += '&form_fld_item_name=' + escape(CurrentRecord.getCurrentSublistText({ sublistId: sublistId, fieldId: sublistId }));
        params.url += '&form_fld_subsidiary=' + CurrentRecord.getText({ fieldId: 'subsidiary' });
        params.url += '&form_fld_subsidiary_name=' + CurrentRecord.getValue({ fieldId: 'subsidiary' });
      }
      else if(params.id === 'sales_history_customer' && params.url) {
        params.url += '&form_fld_item=' + CurrentRecord.getCurrentSublistValue({ sublistId: sublistId, fieldId: sublistId });
        params.url += '&form_fld_item_name=' + escape(CurrentRecord.getCurrentSublistText({ sublistId: sublistId, fieldId: sublistId }));
        params.url += '&form_fld_customer=' + CurrentRecord.getValue({ fieldId: 'entity' });
        params.url += '&form_fld_customer_name=' + CurrentRecord.getText({ fieldId: 'entity' });
      }
       else if(params.id === 'available_to_build' && params.url) {
        params.url += '&form_fld_item=' + CurrentRecord.getCurrentSublistValue({ sublistId: sublistId, fieldId: sublistId });
        params.url += '&form_fld_item_name=' + escape(CurrentRecord.getCurrentSublistText({ sublistId: sublistId, fieldId: sublistId }));
        params.url += '&form_fld_customer=' + CurrentRecord.getValue({ fieldId: 'entity' });
        params.url += '&form_fld_customer_name=' + CurrentRecord.getText({ fieldId: 'entity' });
        params.url += '&form_fld_subsidiary=' + CurrentRecord.getText({ fieldId: 'subsidiary' });
        params.url += '&form_fld_subsidiary_name=' + CurrentRecord.getValue({ fieldId: 'subsidiary' });
      }
      else if(params.id === 'open_quotes' && params.url) {
        params.url += '&form_fld_item=' + CurrentRecord.getCurrentSublistValue({ sublistId: sublistId, fieldId: sublistId });
        params.url += '&form_fld_item_name=' + escape(CurrentRecord.getCurrentSublistText({ sublistId: sublistId, fieldId: sublistId }));
        params.url += '&form_fld_customer=' + CurrentRecord.getValue({ fieldId: 'entity' });
        params.url += '&form_fld_customer_name=' + CurrentRecord.getText({ fieldId: 'entity' });
        params.url += '&form_fld_subsidiary=' + CurrentRecord.getText({ fieldId: 'subsidiary' });
        params.url += '&form_fld_subsidiary_name=' + CurrentRecord.getValue({ fieldId: 'subsidiary' });
      }

      return params;
    } catch (err) {
      console.log('client.wrapper ::' + err);
    }
  }


  return {
    popup: popup
  };
});
