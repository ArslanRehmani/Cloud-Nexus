/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */

/************SCRIPT INFORMATION***********************
+-------------------------------------------------------------------------------------------------------------------------------+
|   Version |   Author                           |      Date            |       Remarks                                         |
+-------------------------------------------------------------------------------------------------------------------------------+
|   1.0     |                                    |                      |       Initial version                                 |
|   2.0     |   IAS                              |      09-Apr-2022     |       Refine & Update logic                           |
+-------------------------------------------------------------------------------------------------------------------------------+
*/

define(['N/log', 'N/record', 'N/redirect'],
/**
 * @param {log} log
 * @param {record} record
 */
function(log, record, redirect) {

  /**
   * Definition of the Suitelet script trigger point.
   *
   * @param {Object} context
   * @param {ServerRequest} context.request - Encapsulation of the incoming request
   * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
   * @Since 2015.2
   */
  function onRequest(context) {
    var requestparam = context.request.parameters;

    log.debug({
      title: 'Parameter: eventType',
      details: requestparam.eventType
    });
    log.debug({
      title: 'Parameter: donationRecord',
      details: requestparam.donationRecord
    });
    log.debug({
      title: 'Parameter: recordType',
      details: requestparam.recordType
    });

    var transactionRecord = record.load({
      type: requestparam.recordType,
      id: requestparam.donationRecord
    });

    // Refresh Entity record
    var donorRecord = record.load({
      type: record.Type.CUSTOMER,
      id: transactionRecord.getValue({
        fieldId: 'entity'
      })
    });
    donorRecord.save();

    if (requestparam.recordType == "cashsale") {

      var softCreditsCount = transactionRecord.getLineCount({
        sublistId: 'recmachcustrecord_npo_sc_btid'
      });

      // Save and Load all Donors listed under the Soft Credit tab of the Donation record.
      for (var index = 0; index < softCreditsCount; index++) {

        var y = transactionRecord.getSublistValue({
          sublistId: 'recmachcustrecord_npo_sc_btid',
          fieldId: 'custrecord_npo_sc_constituent',
          line: index
        });

        var donorRecord = record.load({
          type: record.Type.CUSTOMER,
          id: transactionRecord.getSublistValue({
            sublistId: 'recmachcustrecord_npo_sc_btid',
            fieldId: 'custrecord_npo_sc_constituent',
            line: index
          })
        });
        donorRecord.save();
      }
    }

    //This will redirect the suitelet back to the View Mode of the Cash Sale Record
    redirect.toRecord({
      type : requestparam.recordType,
      id : requestparam.donationRecord,
      isEditMode: false
    });
  }

  return {
    onRequest: onRequest
  };
});
