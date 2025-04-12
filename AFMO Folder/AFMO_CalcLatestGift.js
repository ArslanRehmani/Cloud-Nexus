/**
 * Copyright (c) 1998-2014 NetSuite, Inc.
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
 *
 */

STR_LOG_TITLE = "Calc Latest Gift Transaction";

//**************************************************************
function calcLatestGift()
{
// Search for latest gift

nlapiLogExecution('DEBUG', STR_LOG_TITLE, '***** Started *****');

var ctx = nlapiGetContext() ;

var rec = nlapiGetNewRecord() ;

// Initiate return value to zero
var retVal = null ;

nlapiLogExecution('DEBUG', STR_LOG_TITLE, 'Customer ID: ('+rec.getId()+')');

if ( rec.getId() != null ) 
{
	var results = getLatestGift(rec.getId()) ; 
	
	nlapiLogExecution('DEBUG', STR_LOG_TITLE, 'Results.length: ('+results.length+')');
	
	if ( results )
	{
		retVal = results[0].getValue('internalid');
	}
	
}

nlapiLogExecution('DEBUG', STR_LOG_TITLE, 'Return Value: ('+retVal+')');
return retVal ;

}


//**************************************************************

function getLatestGift(recID)
{

	var arrFilters = new Array();
	arrFilters.push(new nlobjSearchFilter('entity', null, 'anyof', recID));

	var arrColumns = new Array();
	arrColumns.push(new nlobjSearchColumn('internalid'));
	
	return getAllResults('transaction', 'customsearch_afmo_latest_gift_tx', arrFilters, arrColumns);

}

function getAllResults(stRecordType,stSavedSearch,arrFilters,arrColumns)
{
  var arrResult = [];

  var count = 1000;
  var init  = true;
  var min   = 0;
  var max   = 1000;
  if(stSavedSearch)
  {
      var search = nlapiLoadSearch(stRecordType, stSavedSearch);
      if(arrFilters) search.addFilters(arrFilters);
      if(arrColumns) search.addColumns(arrColumns);
  }
  else
  {
      var search = nlapiCreateSearch(stRecordType, arrFilters, arrColumns);
  }
                                 
  var rs = search.runSearch();
      
  while (count == 1000 || init)
  {
      var resultSet = rs.getResults(min, max);
      arrResult = arrResult.concat(resultSet);
      min = max;
      max += 1000;

      init  = false;
      count = resultSet.length;
  }

  return arrResult;
}

