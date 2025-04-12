// eslint-disable-next-line no-undef
define(['N/log','N/record','N/search'], function(log,record,search) {
    return {
        internalid: 'customrecord810',
        fields: {
            refNo:'custrecorddoc_ref',
            date:'custrecord157',
            time:'custrecord158',
            carrieAlphaCode:'custrecord143',
            referenceSONo:'custrecord144',
            referenceINVNo:'custrecord145',
            shipmentAppointmentStatusCode:'custrecord146',
            shipmentAppointmentReasonCode:'custrecord147',
            itemFulfillmentNo:'custrecord148',
            order:'custrecord149',
            shipmentIdentificationNum:'custrecord156',
            statusCode:'custrecord159',
            custOrderNum:'custrecord160',
        },
        

        create:function create(lineData){
            var title = 'create()::';
            log.debug(title+"lineData",lineData); 
            var Data = lineData[0];          
            try{
                if(Data['Staus Code'] == "X1" || Data['Staus Code'] == "D1"){
                    var shipmentRec = record.create({
                        type: this.internalid,
                        isDynamic: true
                    });
                    shipmentRec.setValue({
                        fieldId: this.fields.refNo,
                        value: Data['Carrier Pro #']
                    });
                    shipmentRec.setValue({
                        fieldId: this.fields.shipmentIdentificationNum,
                        value: Data['Master BOL #']
                    });
                    shipmentRec.setValue({
                        fieldId: this.fields.carrieAlphaCode,
                        value: Data['SCAC']
                    });
                    shipmentRec.setValue({
                        fieldId: this.fields.referenceSONo,
                        value: Data['Sales Order #']
                    });
                    shipmentRec.setValue({
                        fieldId: this.fields.referenceINVNo,
                        value: Data['Purchase Order #']
                    });
                    shipmentRec.setValue({
                        fieldId: this.fields.shipmentAppointmentStatusCode,
                        value: Data['Staus Code']
                    });
                    shipmentRec.setValue({
                        fieldId: this.fields.shipmentAppointmentReasonCode,
                        value: Data['Status Reason']
                    });
                    shipmentRec.setValue({
                        fieldId: this.fields.date,
                        value: String(Data['Date'])
                    });
                    shipmentRec.setValue({
                        fieldId: this.fields.time,
                        value: String(Data['Time'])
                    });
                    var itemfulfillmentID = this.itemFulfillmentInternalID(Data['Customer Order #']);
                    if(itemfulfillmentID != 0){
                        shipmentRec.setValue({
                            fieldId: this.fields.itemFulfillmentNo,
                            value: parseInt(itemfulfillmentID)
                        });
                    }else{
                        shipmentRec.setValue({
                            fieldId: this.fields.itemFulfillmentNo,
                            value: ''
                        });
                    }
                    var soID = this.salesOrderInternalID(Data['Sales Order #']);
                    if(soID != 0){
                        shipmentRec.setValue({
                            fieldId: this.fields.order,
                            value: parseInt(soID)
                        });
                    }else{
                        shipmentRec.setValue({
                            fieldId: this.fields.order,
                            value: ''
                        });
                    }
                    shipmentRec.setValue({
                        fieldId: this.fields.statusCode,
                        value: Data['Staus Code']
                    });
                    shipmentRec.setValue({
                        fieldId: this.fields.custOrderNum,
                        value: Data['Customer Order #']
                    });
                    var shipmentRecId = shipmentRec.save();
                }
                }catch(error){
                    log.error(title+error.name,error.message);
            }
            return shipmentRecId; 
        }, 
        itemFulfillmentInternalID: function itemFulfillmentInternalID(id){
            var title = 'itemFulfillmentInternalID(::)';
            var ID;
            try{
                var itemfulfillmentSearchObj = search.create({
                    type: "itemfulfillment",
                    filters:
                    [
                       ["type","anyof","ItemShip"], 
                       "AND", 
                       ["custbodyhj_tc_fulfill_po","contains",id],  
                       "AND", 
                       ["mainline","is","T"]
                    ],
                    columns:
                    [
                       search.createColumn({name: "internalid", label: "Internal ID"})
                    ]
                 });
                 itemfulfillmentSearchObj.run().each(function(result){
                    ID = result.id;
                    return true;
                 });
                 
            } catch(e) {
                log.debug('Exception ' +title, e.message);
            }
            return ID || '';
        },
        salesOrderInternalID: function salesOrderInternalID(id){
            var title = 'salesOrderInternalID(::)';
            var soID;
            try{
                var salesorderSearchObj = search.create({
                    type: "salesorder",
                    filters:
                    [
                       ["type","anyof","SalesOrd"], 
                       "AND", 
                       ["numbertext","contains",id], 
                       "AND", 
                       ["mainline","is","T"]
                    ],
                    columns:
                    [
                       search.createColumn({name: "internalid", label: "Internal ID"})
                    ]
                 });
                 salesorderSearchObj.run().each(function(result){
                    soID = result.id;
                    return true;
                 });
            } catch(e) {
                log.debug('Exception ' +title, e.message);
            }
            return soID || '';
        },
        formateDate :function formateDate(trandate) {
            var date = new Date(trandate);
            var day = date.getDay();
            var month = date.getMonth() + 1;
            var year = date.getFullYear();
            var formateDate = month+'/'+day+'/'+year;
            return formateDate;
        }
    };
});