/**
 * @NApiVersion 2.0
 * @NScriptType UserEventScript
 */
define(['N/search', 'N/record'],
  /**
   * @param{search} search
   * @param{record} record
   */
  function (search, record) {
    function beforeSubmit(context) {
      var title = 'beforeSubmit(::)';
      try {
        var currentRecord = context.newRecord;
        var notRequiredDate = currentRecord.getValue('custbody2');
        var keyCustomer = currentRecord.getValue('custbody17');
        var willCustomerAcceptEarlyDelivery = currentRecord.getValue('custbody16');
        var willCustomerAcceptPartShip = currentRecord.getValue('custbody15');
        var leadTime = currentRecord.getValue('custbody14');//does not matter
        log.debug('notRequiredDate', notRequiredDate);
        log.debug('keyCustomer', keyCustomer);
        log.debug('willCustomerAcceptEarlyDelivery', willCustomerAcceptEarlyDelivery);
        log.debug('willCustomerAcceptPartShip', willCustomerAcceptPartShip);
        log.debug('leadTime', leadTime);
        //key customer id = 8
        //Lead Time - Early Delivery - No Partial id = 4
        //Lead Time or NRB , No Early But Partial Deliveries id = 7
        //No Partial, but Early Delivery id = 6
        //NRB - No Partial or Early id = 5
        //Partial & Early Delivery = 3
      
        // if (!!notRequiredDate) {
          var itemCount = currentRecord.getLineCount({
            sublistId: 'item'
          });
          log.debug('item count', itemCount);
          for (var i = 0; i < itemCount; i++) {
            log.debug('Working');
            var data = currentRecord.getSublistValue({
              sublistId: 'item',
              fieldId: 'defaultorderallocationstrategy',
              line: i,
              // value: 2,
              // ignoreFieldChange: true
            });
            log.debug('data', data);
          }
        // }
      } catch (e) {
        log.debug('Exception ' + title, e.message);
      }
    }
    return {
      beforeSubmit: beforeSubmit
    }

  });