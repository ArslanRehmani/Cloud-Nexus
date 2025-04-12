/**
 * Copyright (c) 1998-2020 Oracle - NetSuite
 * 2955 Campus Drive, Suite 100, San Mateo, CA, USA 94403-2511
 * All Rights Reserved.
 *
 * This software is the confidential and proprietary information of NetSuite, Inc. ("Confidential Information").
 * You shall not disclose such Confidential Information and shall use it only in accordance with the terms of the license agreement
 * you entered into with NetSuite.
 */

/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       05 Mar 2020     mcicchelli
 * 2.00       11 Apr 2022     IAS
 */

STR_LOG_TITLE = "Calc Number of Gifts";


function calcNumOfGifts() {

  // Search for number of gifts
  nlapiLogExecution('DEBUG', STR_LOG_TITLE, '***** Started *****');

  var ctx = nlapiGetContext() ;
  var rec = nlapiGetNewRecord() ;

  // Initiate return value to zero
  var retVal = 0 ;
  nlapiLogExecution('DEBUG', STR_LOG_TITLE, 'Customer ID: (' + rec.getId() + ')');

  if ( rec.getId() != null ) {
  	var results = getNumOfGifts(rec.getId()) ;

  	nlapiLogExecution('DEBUG', STR_LOG_TITLE, 'Results.length: (' + results.length + ')');

  	if ( results ) {
  		retVal = results[0].getValue('internalid', null, 'count');
  	}

    // get Soft credits
    retVal = parseInt(retVal) + getNumOfSoftCredits(rec.getId());
  }

  nlapiLogExecution('DEBUG', STR_LOG_TITLE, 'Return Value: (' + retVal + ')');
  return parseInt(retVal) + '';
}

function getNumOfSoftCredits(recID) {

  nlapiLogExecution('DEBUG', 'getNumOfSoftCredits');

  var arrFilters = new Array();
  arrFilters.push(new nlobjSearchFilter('parent', 'custrecord_npo_sc_constituent', 'anyof', recID));

  var arrColumns = new Array();
  arrColumns.push(new nlobjSearchColumn('parent', 'custrecord_npo_sc_constituent'));

  var search = nlapiLoadSearch('customrecord_npo_soft_credit', 'customsearch_atlas_soft_credit_sblst_2');
  search.addFilters(arrFilters);
  search.addColumns(arrColumns);

  var rs = search.runSearch();

  var retVal = 0;
  var count = 1000;
  var init  = true;
  var min   = 0;
  var max   = 1000;

  while (count == 1000 || init) {

    var resultSet = rs.getResults(min, max);
    min = max;
    max += 1000;

    init  = false;
    count = resultSet.length;
    retVal = retVal + count;
  }
  return retVal;
}

function getNumOfGifts(recID) {

	var arrFilters = new Array();
	arrFilters.push(new nlobjSearchFilter('entity', null, 'anyof', recID));

	var arrColumns = new Array();
	arrColumns.push(new nlobjSearchColumn('internalid',null,'count'));

	return getAllResults('transaction', 'customsearch_afmo_num_of_gifts', arrFilters, arrColumns);
}

function getAllResults(stRecordType, stSavedSearch, arrFilters, arrColumns) {

  var arrResult = [];

  var count = 1000;
  var init  = true;
  var min   = 0;
  var max   = 1000;

  if (stSavedSearch) {

    var search = nlapiLoadSearch(stRecordType, stSavedSearch);
    if(arrFilters) search.addFilters(arrFilters);
    if(arrColumns) search.addColumns(arrColumns);
  }
  else {
    var search = nlapiCreateSearch(stRecordType, arrFilters, arrColumns);
  }

  var rs = search.runSearch();

  while (count == 1000 || init) {

    var resultSet = rs.getResults(min, max);
    arrResult = arrResult.concat(resultSet);
    min = max;
    max += 1000;

    init  = false;
    count = resultSet.length;
  }

  return arrResult;
}