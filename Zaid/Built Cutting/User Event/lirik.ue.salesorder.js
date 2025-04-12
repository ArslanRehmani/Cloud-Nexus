/*******************************************************************
 *
 * Name: lirik.ue.salesorder.js
 *
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @version 1.0.2
 *
 * Author: Lirik, Inc.
 * Purpose: This script is used to add a button on Sales Order's item sublist.
 * Script: customscript_lirik_ue_salesorder
 * Deploy: customdeploy_lirik_ue_salesorder
 *
 * ******************************************************************* */

define(['N/runtime', 'N/url'], function (runtime, url) {

  /**
   * Executes whenever a read operation occurs on a record, and prior to returning the record or page.
   *
   * These operations include navigating to a record in the UI, reading a record in SOAP web services, and loading a record.
   *
   * The beforeLoad event cannot be used to source standard records. Use the pageInit client script for this purpose.
   *
   * beforeLoad user events cannot be triggered when you load/access an online form.
   * Data cannot be manipulated for records that are loaded in beforeLoad scripts. If you attempt to update a record loaded in beforeLoad, the logic is ignored.
   * Data can be manipulated for records created in beforeLoad user events.
   * Attaching a child custom record to its parent or detaching a child custom record from its parent
triggers an edit event.
   *
   * @param {object} scriptContext
   * @param {object} scriptContext.newRecord - New record
   * @param {string} scriptContext.type - Trigger type [create, edit, view, copy, print, email, quick view]
   * @param {object} scriptContext.form - Current form
   * @param {object} scriptContext.UserEventType - context.UserEventType enum
   * @Since 2015.2
   */
  function beforeLoad(scriptContext) {

    const title = 'beforeLoad';

    try {

      log.debug({ title, details: 'scriptContext.type ::' + scriptContext.type });

      if (scriptContext.type === scriptContext.UserEventType.CREATE || scriptContext.type === scriptContext.UserEventType.EDIT || scriptContext.type === scriptContext.UserEventType.COPY) {

        const nsScriptRec = runtime.getCurrentScript();
        const currUser = runtime.getCurrentUser();
        log.debug({ title, details: { 'Current User Role': currUser.role } });

        const buttons = nsScriptRec.getParameter({ name: 'custscript_ue_so_buttons_config' }) ? JSON.parse(nsScriptRec.getParameter({ name: 'custscript_ue_so_buttons_config' })) : null;
        log.debug({ title, details: { buttons } });

        if (buttons) {

          const nsForm = scriptContext.form;
            nsForm.clientScriptFileId = 6490;
         //nsForm.clientScriptModulePath = './lirik.cs.salesorder.popup.js';
          const nsFormSublist = nsForm.getSublist({ id: 'item' });

          for (let index = 0; index < buttons.length; index++) {

            const singleButton = buttons[index];

            if (singleButton.role && singleButton.role.indexOf(currUser.role) === -1) {
              continue;
            }
            log.debug({ title, details: '***' + singleButton.label + '***' });

            if (singleButton.id && singleButton.label && singleButton.scriptId && singleButton.deploymentId) {

              singleButton.width = Number(singleButton.width) || 1000;
              singleButton.height = Number(singleButton.height) || 500;

              singleButton.url = url.resolveScript({ scriptId: singleButton.scriptId, deploymentId: singleButton.deploymentId, returnExternalUrl: false });

              nsFormSublist.addButton({ id: "custpage_" + singleButton.id, label: singleButton.label, functionName: "popup('" + JSON.stringify(singleButton) + "');" });
            }
          }
        }
      }
    } catch (err) {
      log.error({ title: 'beforeLoad', details: err });
      throw err.message;
    }
  }

  return {
    beforeLoad: beforeLoad
  };
});