/**
 *@NApiVersion 2.0
 *@NScriptType UserEventScript
 */
define(['N/record','N/log'], function(record,log) {

    function afterSubmit(context) {
        var title = 'afterSubmit(::)'
        try {
            var nr = context.newRecord;
            var IFObj = record.load({
                type: nr.type,
                id: nr.id
            });
            // var cubicRequestData = IFObj.getValue({
            //     fieldId: 'custbody_avt_cubiic_data_request'
            // });
            var cubicRequestData = {"CustomerCode":"GFLGROUP","WarehouseCode":"3047","Reference":"SO686593","SenderAddress":{"CompanyName":"GLOBAL FITNESS & LEISURE PTY LTD","Address1":"23-25 MAYGAR BLVD","Address2":"","Suburb":"BROADMEADOWS","State":"VIC","Country":"","PostCode":"3047","Contact":"GFL Dispatch","Phone":"0393572166","Email":"dispatch@gflgroup.com.au"},"ReceiverAddress":{"CompanyName":"Ernest Bassingthwaighte","Address1":"146/19 Trading Post Road","Address2":"","Suburb":"Cooroy","State":"QLD","Country":"Australia","PostCode":"4563","Contact":" Ernest Bassingthwaighte","Phone":" 0438704463","Email":" toombabass1@bigpond.com"},"EmailTracking":["toombabass1@bigpond.com"],"ConnoteGoods":[{"ItemReference":"Exer-11","Qty":1,"Weight":"17","Length":"116","Width":"40","Height":"22","UnitOfMeasureName":"CARTON"}],"SpecialInstructions":" SO686593 Exer-11 +61438704463","saveAsDraft":false,"carrierCode":"DFE","serviceCode":"EXP","labelPrinter":"ZDesigner GK420d (P2)","isATL":false};
            log.debug({
                title: 'cubicRequestData',
                details: cubicRequestData
            });
            log.debug({
                title: 'cubicRequestData type',
                details: typeof cubicRequestData
            });
            var dangerousGoods = IFObj.getValue({
                fieldId: 'custbody_gfl_dangerous_goods'
            });
            log.debug({
                title: 'dangerousGoods',
                details: dangerousGoods
            });
            if(dangerousGoods == 'true' || dangerousGoods == true){
                // cubicRequestData.dangerousGood = 'true';
                IFObj.setValue({
                    fieldId: 'custbody_avt_cubiic_data_request',
                    value: JSON.stringify(cubicRequestData)
                });
                IFObj.save();
            }else{
                log.debug({
                    title: 'working',
                    details: 'NO'
                });
            }
        } catch (e) {
            log.error({ title: e.name, details: e.name });
        }
    }

    return {
        afterSubmit: afterSubmit
    }
});
