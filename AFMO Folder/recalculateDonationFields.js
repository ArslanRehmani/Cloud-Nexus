/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
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

define(['N/log', 'N/record', 'N/search'],
/**
 * @param {log} log
 * @param {record} record
 * @param {search} search
 */
function(log, record, search) {

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
  function beforeSubmit(context) {

    var donor = context.newRecord;
    var donorId = donor.getValue({fieldId: 'id'});
    log.debug('donorId', donorId);

    /**
     *  Individual Giving and Sub constituents Total Calculation Start
     */
    log.debug('Individual Giving', 'Start');

    var allTransSearch = search.load({
      type: search.Type.TRANSACTION,
      id: 'customsearch_get_all_donor_transactions'   // Type: Pledge, Donation, Historic Gift
    });
    var currExpression = allTransSearch.filterExpression;

    // 'custbody_donor' : Historic Gift, Pledge, Soft Pledge
    currExpression.push("AND", [[ "custbody_donor", "anyof", donorId ], "OR", [ "customersubof", "anyof", donorId]]);
    allTransSearch.filterExpression = currExpression;

    // var additionalFilter = search.createFilter({
    //    name: 'customersubof',
    //    join: null,
    //    operator: search.Operator.ANYOF,
    //    values: [donorId]
    // });
    // allTransSearch.filters.push(additionalFilter);

    // var donorGroupColumn = search.createColumn({
    //    name: 'custbody_donor'
    // });
    // allTransSearch.columns.push(donorGroupColumn);

    var individualGivingTotal = 0;
    var subconstituentsTotal = 0;
    var latestTransactionId = "";
    var currentLatestDate = "";
    var firstTransactionId = "";
    var currentFirstDate = "";
    var largestTransactionId = "";
    var currentLargestAmount = 0;
    var numberOfGifts = 0;

    var latestPledgeId = "";
    var latestPledgeDate = "";
    var latestTransWPledgeId = "";
    var latestTransWPledgeDate = "";

    allTransSearch.run().each(function(result) {

      var internalId = result.getValue({name: 'internalid'});
      var amount = parseFloat(result.getValue({name: 'amount'}));
      var donor = result.getValue({name: 'custbody_donor'});
      var date = new Date(result.getValue({name: 'trandate'}));
      var type = result.getValue({name: 'type'});

      if (type != "CustInvc") { // Donation, Historic Gift

        numberOfGifts++;

        if (donor == donorId) { individualGivingTotal += amount; }
        else { subconstituentsTotal += amount; }

        // Get First Gift
        if (currentFirstDate == "" || date < currentFirstDate) {
          currentFirstDate = date;
          firstTransactionId = internalId;
        }

        // Get Latest Gift
        if (currentLatestDate == "" || date > currentLatestDate) {
          currentLatestDate = date;
          latestTransactionId = internalId;
        }
      }
      else { // Pledge

        // Get Latest Pledge
        if (latestPledgeDate == "" || date > latestPledgeDate) {
          latestPledgeDate = date;
          latestPledgeId = internalId;
        }
      }

      // Get largest Gift
      if (currentLargestAmount == 0 || amount > currentLargestAmount) {
        currentLargestAmount = amount;
        largestTransactionId = internalId;
      }

      // Get Latest Transaction with Pledges
      if (latestTransWPledgeDate == "" || date > latestTransWPledgeDate) {
        latestTransWPledgeDate = date;
        latestTransWPledgeId = internalId;
      }

      return true;
    });

    donor.setValue({
      fieldId: 'custentity_sub_constituents_total',
      value: subconstituentsTotal
    });
    donor.setValue({
      fieldId: 'custentity_individual_giving_total',
      value: individualGivingTotal
    });

    /**
     *  Soft Credit Total Calculation Start
     */
    log.debug('Soft Credit start', 'numberOfGifts = ' + numberOfGifts);

    var softcreditsSearch = search.load({
      type: 'customrecord_npo_soft_credit',
      id: 'customsearch_atlas_soft_credit_sblst_2'  // "ACS - Constituent Soft Credits"
    });

    var getParent = search.createColumn({
      name: 'parent',
      join: 'custrecord_npo_sc_constituent',
    });
    softcreditsSearch.columns.push(getParent);

    var subconsituentFilter = search.createFilter({
      name: 'parent',
      join: 'custrecord_npo_sc_constituent',
      operator: search.Operator.ANYOF,
      values: [donorId]
    });

    softcreditsSearch.filters.push(subconsituentFilter);
    var currentSoftCreditTotal = 0

    softcreditsSearch.run().each(function(result) {

      numberOfGifts++;

      var billingTranId = result.getValue({name: 'custrecord_npo_sc_btid'});
      var date = new Date(result.getValue({name: 'custrecord1'}));
      var amount = parseFloat(result.getValue({name: 'custrecord_npo_sc_amount'}));
      currentSoftCreditTotal += amount;

      // Get First Gift
      if (currentFirstDate == "" || date < currentFirstDate) {
        currentFirstDate = date;
        firstTransactionId = billingTranId;
      }

      // Get Latest Gift
      if (currentLatestDate == "" || date > currentLatestDate) {
        currentLatestDate = date;
        latestTransactionId = billingTranId;
      }

      // Get Latest Transaction with Pledges
      if (latestTransWPledgeDate == "" || date > latestTransWPledgeDate) {
        latestTransWPledgeDate = date;
        latestTransWPledgeId = billingTranId;
      }

      // Get largest Gift
      if (currentLargestAmount == 0 || amount > currentLargestAmount) {
        currentLargestAmount = amount;
        largestTransactionId = billingTranId;
      }

      return true;
    });

    donor.setValue({
      fieldId: 'custentity_soft_giving_total',
      value: currentSoftCreditTotal
    });

    /**
     *  Gift Fields Calculation Start
     */
    log.debug('Gift Fields', 'start');

    donor.setValue({
      fieldId: 'custentity_afmo_num_gift',
      value: numberOfGifts
    });
    donor.setValue({
      fieldId: 'custentity_afmo_first_gift_tx',
      value: firstTransactionId
    });
    donor.setValue({
      fieldId: 'custentity_afmo_latest_gift_tx',
      value: latestTransactionId
    });
    donor.setValue({
      fieldId: 'custentity_afmo_max_gift_tx',
      value: largestTransactionId
    });
    donor.setValue({
      fieldId: 'custentity_last_transaction',
      value: latestTransWPledgeId
    });
    donor.setValue({
      fieldId: 'custentity_last_pledge',
      value: latestPledgeId
    });

    var giftArr = ['custentity_afmo_first_gift_tx', 'custentity_afmo_latest_gift_tx','custentity_afmo_max_gift_tx', 'custentity_last_transaction', 'custentity_last_pledge'];
    var giftAmountFields = ['custentity_first_donation_amount', 'custentity_last_donation_amount', 'custentity_largest_donation_amount', 'custentity_last_transaction_amount', 'custentity_last_pledge_amount'];

    for (var i = 0; i < giftArr.length; i++) {

      var tranId = donor.getValue({
        fieldId: giftArr[i]
      });

      if (tranId != "" && tranId != null) {

        var amount = search.lookupFields({
          type: search.Type.TRANSACTION,
          id: tranId,
          columns: ['amount']
        }).amount;

        donor.setValue({
          fieldId: giftAmountFields[i],
          value: parseFloat(amount)
        });
      }
    }

    /**
     *  Pledges Calculation Start
     */
    log.debug('Pledges', 'start');

    var pledgeSearch = search.load({
      type: search.Type.TRANSACTION,
      id: 'customsearchpledges'
    });
    var originalColumns = pledgeSearch.columns;

    var newColumns=[];
    for (var c = 0; c < originalColumns.length; c++) {

      if (originalColumns[c].name == "internalid") {

        newColumns.push(search.createColumn({
          name: 'entity',
          summary: search.Summary.GROUP
        }));

        newColumns.push(search.createColumn({
          name: "internalid",
          summary: search.Summary.COUNT
        }));
      }
      else if (!(originalColumns[c].name == "trandate" || originalColumns[c].name == "tranid")) {

        newColumns.push(search.createColumn({
          name: originalColumns[c].name,
          summary: search.Summary.SUM
        }));
      }
    }
    pledgeSearch.columns = newColumns;

    pledgeSearch.filters.push(search.createFilter({
      name: 'customersubof',
      join: null,
      operator: search.Operator.ANYOF,
      values: [donorId]
    }));

    var pledgeResults = pledgeSearch.run().getRange({
      start: 0,
      end: 1
    });

    var pledgeTotal = 0;
    var pledgePaid  = 0;
    var pledgeDue = 0;
    var pledgeCtr = 0;

    if (pledgeResults.length == 1) {

      pledgeTotal = pledgeResults[0].getValue({
        name: 'total',
        summary: search.Summary.SUM
      });
      pledgePaid = pledgeResults[0].getValue({
        name: 'amountpaid',
        summary: search.Summary.SUM
      });
      pledgeDue = pledgeResults[0].getValue({
        name: 'amountremaining',
        summary: search.Summary.SUM
      });
      pledgeCtr = pledgeResults[0].getValue({
        name: 'internalid',
        summary: search.Summary.COUNT
      });
    }

    donor.setValue({
      fieldId: 'custentity_pledge_total',
      value: parseFloat(pledgeTotal)
    });
    donor.setValue({
      fieldId: 'custentity_pledge_received',
      value: parseFloat(pledgePaid)
    });
    donor.setValue({
      fieldId: 'custentity_pledge_due',
      value: parseFloat(pledgeDue)
    });
    donor.setValue({
      fieldId: 'custentity_total_pledge_payments',
      value: pledgeCtr
    });

    /**
     *  Total Giving  Calculation Start
     */
    log.debug('Total Giving', 'start');

    if (donorId == 11236 || donorId == 11711 || donorId == 598 || donorId == 12567) {
      donor.setValue({
        fieldId: 'custentity_afmo_life_giving',
        value: parseFloat(individualGivingTotal) + parseFloat(currentSoftCreditTotal) + parseFloat(subconstituentsTotal)
      });
    }
    else {
      donor.setValue({
        fieldId: 'custentity_afmo_life_giving',
        value: parseFloat(individualGivingTotal) + parseFloat(currentSoftCreditTotal) + parseFloat(subconstituentsTotal) + parseFloat(pledgeTotal)
      });
    }
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

  }

  return {
    // beforeLoad: beforeLoad,
    beforeSubmit: beforeSubmit,
    // afterSubmit: afterSubmit
  };
});