    /*
    ***********************************************************************
    *
    * The following javascript code is created by AlphaBOLD Inc.,
    * a NetSuite Partner. It is a SuiteCloud component containing custom code
    * intended for NetSuite (www.netsuite.com) and use the SuiteScript API.
    * The code is provided "as is": AlphaBOLD shall not be liable
    * for any damages arising out the intended use or if the code is modified
    * after delivery.
    *
    * Company:     AlphaBOLD Inc., www.alphabold.com
    * Author:      hriaz@alphabold.com
    * File:        AB_MR_createShipmentStatus.js
    * Date:        10/25/2022
    *
    *
    ***********************************************************************/
/**
 *@NApiVersion 2.0
 *@NScriptType MapReduceScript
 */
// eslint-disable-next-line no-undef
define(['N/log','N/record','N/search','../dao/AB_CLS_SFTPConnection.js','../Common/AB_Lib_Common.js','../dao/AB_CLS_shipmentStatus.js','N/file'], function(log,record,search,CLS_SFTPConnection,LIB_Common,CLS_shipmentStatus,file) {

    function getInputData() {
        var title = 'getInputData()::';
         try{
            var fileNameArray = CLS_SFTPConnection.downloadFile();
            }catch(error){
                log.error(title+error.name,error.message);
        }
        return fileNameArray || [];
    }

    function map(context) {
        var title = 'map()::';
        try{
            var lineData = JSON.parse(context.value);
            if(!!lineData){
                var fileName = lineData['name'];
                var fileId = CLS_SFTPConnection.downloadFileWithName(fileName);
                if(fileId){
                    var linesArr = LIB_Common.getCSVLines(fileId);
                    var shipingRecId = CLS_shipmentStatus.create(linesArr);
                    log.debug(title+'shipingRecId',shipingRecId);
                }
            }
           }catch(error){
               log.error(title+error.name,error.message);
       } 
    }


    return {
        getInputData: getInputData,
        map: map
    };
});
