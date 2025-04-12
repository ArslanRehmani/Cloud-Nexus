/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

/************SCRIPT INFORMATION***********************
+-------------------------------------------------------------------------------------------------------------------------------+
|   Version |   Author                           |      Date            |       Remarks                                         |
+-------------------------------------------------------------------------------------------------------------------------------+
|   1.0     |   IAS                              |      10-Apr-2022     |       Initial Version                                 |
+-------------------------------------------------------------------------------------------------------------------------------+
*/

define(['N/record', 'N/redirect', 'N/log', 'N/task'],

function(record, redirect, log, task) {

  /**
   * Function definition to be triggered before record is loaded.
   *
   * @param {Object} scriptContext
   * @param {Record} scriptContext.newRecord - New record
   * @param {string} scriptContext.type - Trigger type
   * @param {Form} scriptContext.form - Current form
   * @Since 2015.2
   */
  function beforeLoad(scriptContext) {

  }

  /**
   * Function definition to be triggered before record is loaded.
   *
   * @param {Object} scriptContext
   * @param {Record} scriptContext.newRecord - New record
   * @param {Record} scriptContext.oldRecord - Old record
   * @param {string} scriptContext.type - Trigger type
   * @Since 2015.2
   */
  function beforeSubmit(scriptContext) {

  }

  /**
   * Function definition to be triggered before record is loaded.
   *
   * @param {Object} scriptContext
   * @param {Record} scriptContext.newRecord - New record
   * @param {Record} scriptContext.oldRecord - Old record
   * @param {string} scriptContext.type - Trigger type
   * @Since 2015.2
   */
  function afterSubmit(scriptContext) {
	try{
      log.debug('afterSubmit', 'eventType = ' + scriptContext.type);

      // get record values
      var newRec = scriptContext.newRecord;
      log.debug('newRec - ' + newRec.id, newRec.type);

      var donorId = newRec.getValue({fieldId: 'custrecord_npo_sc_constituent'});

      // call scheduled script
      var scriptTask = task.create({
        taskType: task.TaskType.SCHEDULED_SCRIPT,
        scriptId: 'customscript_ias_ss_reload_donor',
        deploymentId: 'customdeploy_ias_ss_reload_donor',
        params: {'custscript_ias_ss_event_type': scriptContext.type,
                 'custscript_ias_ss_rec_type': newRec.type,
                 'custscript_ias_ss_rec_id': newRec.id,
                 'custscript_ias_ss_donor_id': donorId,
                 'custscript_ias_ss_sc_donor_ids': null }
      });
      var scriptTaskId = scriptTask.submit();

      log.debug('checkifscheduled', 'scriptTaskId = ' + scriptTaskId);
    }catch(e){
      log.error('ERROR', e);
    }
  }

  return {
    // beforeLoad: beforeLoad,
    // beforeSubmit: beforeSubmit,
    afterSubmit: afterSubmit
  };

});
