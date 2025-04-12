/**
 *@NApiVersion 2.0
 *@NScriptType ClientScript
 */
// eslint-disable-next-line no-undef
define(['N/log', 'N/currentRecord', 'N/record', 'N/ui/dialog', 'N/search','N/https','N/url','N/runtime'], function (log, currentRecord, record, dialog, search,https,urlmodule,runtime) {


    function generateGUID(e) {
        var title = 'generateGUID()::';
        var scriptObj = runtime.getCurrentScript();
        var restrictedScript = scriptObj.getParameter({name: "custscript_ab_restrict_script"});
        var scriptsRestriction = [];
        try {
            var rec = currentRecord.get();
            log.debug(title + 'rec.id', rec.id);
            var searchlookup = search.lookupFields({
                type: 'customrecord_cardiac_sftp_configuration',
                id: rec.id,
                columns: ['custrecord_cardiac_sftp_user_name','custrecord_cardiac_connection_script']
            });
            log.debug(title + 'searchlookup', searchlookup);
            var hostname = searchlookup.custrecord_cardiac_sftp_user_name;
            var scriptsObject = searchlookup.custrecord_cardiac_connection_script;
            if(scriptsObject.length){
               for (var x = 0; x < scriptsObject.length; x++) {
                scriptsRestriction.push(scriptsObject[x].value);
               }
            }
            scriptsRestriction = scriptsRestriction.length ? getScriptIds(scriptsRestriction) : restrictedScript;
            log.debug(title + 'scriptsRestriction', JSON.stringify(scriptsRestriction));
            log.debug(title + 'hostname', hostname);
            scriptsRestriction= JSON.stringify(scriptsRestriction);
 //production
        //    var popUp = window.open('/app/site/hosting/scriptlet.nl?script=860&deploy=1&hostname=' + hostname+ '&recId='+rec.id+ '&scriptsRestriction='+scriptsRestriction, 'SFTP GUID', 'width=1200px,height=600px');
 //sandbox    
           var popUp = window.open('/app/site/hosting/scriptlet.nl?script=956&deploy=1&hostname=' + hostname+ '&recId='+rec.id+ '&scriptsRestriction='+scriptsRestriction, 'SFTP GUID', 'width=1200px,height=600px');
            var timer = setInterval(function() {   
                if(popUp.closed) {  
                    clearInterval(timer);
                    windowClose();  
                }  
            }, 1000); 

            // log.debug(title+'popupwindow',popupwindow);
            // dialog.alert({
            //     title:title+'GenerateGuid',
            //     message: "Button is Working"
            // });
        } catch (error) {
            log.error(title + error.name, error.message);
        }
    }


    function getScriptIds(scriptIds){
        var title = 'getScriptIds()::';
        var scriptIdArray = [];
        log.debug(title+'scriptIds',scriptIds);
         try{
            var scriptSearchObj = search.create({
                type: "script",
                filters:
                [
                   ["internalid","anyof",scriptIds]
                ],
                columns:
                [
                   search.createColumn({name: "scriptid", label: "Script ID"})
                ]
             });
             scriptSearchObj.run().each(function(result){
                scriptIdArray.push(result.getValue({name: "scriptid"}));
                return true;
             });
            }catch(error){
                log.error(title+error.name,error.message);
        } 
        return scriptIdArray;
    }
    function windowClose() {
        window.location.reload();
    }

    function sftpConnection(){
        var title = 'sftpConnection()::';
        var requiredFieldArray = [];
         try{
            var rec = currentRecord.get();
            var configId = rec.id;
            var config = record.load({
                type: 'customrecord_cardiac_sftp_configuration',
                id: configId
            });
            var passwordGuid= config.getValue('custrecord_cardiac_sftp_password_guid');
            var username= config.getValue('custrecord_cardiac_sftp_user_name');
            var url= config.getValue('custrecord_cardiac_sftp_url_host_name');
            var port= config.getValue('custrecord_cardiac_sftp_port');
            var hostKey= config.getValue('custrecord_cardiac_sftp_host_key');
            if(!passwordGuid){
                requiredFieldArray.push("PASSWORD GUID");
            }
            if(!username){
                requiredFieldArray.push("USER NAME");
            }
            if(!url){
                requiredFieldArray.push("HOST NAME");
            }
            if(!port){
                requiredFieldArray.push("PORT");
            }
            if(!hostKey){
                requiredFieldArray.push("HOST KEY");
            }
            if(requiredFieldArray.length){
                dialog.alert({
                title:title+'Required fields Are missing',
                message: "Please Set All Missing Required Fields : "+JSON.stringify(requiredFieldArray)
            });
            }else{
                // open connection


                var suiteletURL = urlmodule.resolveScript({
                    scriptId: 'customscript957',
                    deploymentId: 'customdeploy1',
                    returnExternalUrl: false,
                    params: {
                        'passwordGuid': passwordGuid,
                        'username': username,
                        'url': url,
                        'port': port,
                        'hostKey': hostKey
                    }
                });

                https.get.promise({
                    url: suiteletURL
                }).then(function (response) {
                    dialog.alert({
                        title:title+'Connected',
                        message: "Connection Created Successfully"
                    });
                }).catch(function (reason) {
                    dialog.alert({
                        title:title+'Connected',
                        message: "Error Function:"+reason
                    });  
                });
                // dialog.alert({
                //     title:title+'Connected',
                //     message: "Connection Object: "+connection
                // });
            }
            }catch(error){
                log.error(title+error.name,error.message); 
        } 
    }

    function pageInit(context) {
        var title = 'pageInit()::';
        try {

        } catch (error) {
            log.error(title + error.name, error.message);
        }
    }


    return {
        pageInit: pageInit,
        generateGUID: generateGUID,
        windowClose:windowClose,
        sftpConnection:sftpConnection
    }
});