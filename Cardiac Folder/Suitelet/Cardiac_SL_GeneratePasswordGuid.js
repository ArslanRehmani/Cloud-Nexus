/**
 * @NApiVersion 2.0
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
 define(['N/ui/serverWidget', 'N/task', 'N/file','N/runtime','N/record','N/log','N/redirect','N/sftp'],
 /**
  * @param {serverWidget} serverWidget
  */
 function(serverWidget, task, file, runtime,record,log,redirect,sftp) {
    
     /**
      * Definition of the Suitelet script trigger point.
      *
      * @param {Object} context
      * @param {ServerRequest} context.request - Encapsulation of the incoming request
      * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
      * @Since 2015.2
      */
     function onRequest(context) {
        var reqParam = context.request.parameters;
        var hostName = reqParam.hostname;
        var recid = reqParam.recId;
        if (context.request.method === 'GET') {
          var scriptsRestriction = reqParam.scriptsRestriction ;
          scriptsRestriction = JSON.parse(scriptsRestriction);
 
        log.debug("hostName", hostName);
        log.debug("scriptsRestriction", scriptsRestriction);
        if(!hostName){
            context.response.write("ERROR : Host Name Is not Defined in Current Configuration");
            return ;
        }
       // Create a GUID form
       var form = serverWidget.createForm({
 
       title: "SFTP - GUID Form",
 
       });

      var parentfield = form.addField({
 
        id: 'recid',
 
        type: serverWidget.FieldType.TEXT,
 
        label: 'parent record Id'
 
        });
        
        parentfield.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.HIDDEN
        });
        parentfield.defaultValue = recid;
       var credField = form.addCredentialField({
           id : 'password',
           label : 'Password',
           restrictToDomains : hostName,
           restrictToScriptIds : scriptsRestriction,
           restrictToCurrentUser : false,
       });
       credField.maxLength = 64;
       form.addSubmitButton({
 
        label: 'Submit Button'
 
        });
        // var sftpConnection = sftp.createConnection({
        //     username: '000_0ry94_netsuite',
        //     passwordGuid: 'c^2Xx)6Lg^9So!2L',
        //     url: 'sftp.paycomonline.net',
        //     port: 22,
        //     hostKey: 'ssh-rsa 2048 sVM7Q5EKsEDa24sBfjDs3goev7jfXLtKD47t9McgjIs'
        //   });
        
        //   log.debug('sftpConnection', sftpConnection);
       context.response.writePage(form);

       return;
       
      }else {
 
       var requset = context.request;
 
       var myPwdGuid = requset.parameters.password;
       var parentRec = requset.parameters.recid;
 
       log.debug("myPwdGuid", myPwdGuid);
 
       var recId =  record.submitFields({
           type: 'customrecord_cardiac_sftp_configuration',
           id: parentRec,
           values:{'custrecord_cardiac_sftp_password_guid':myPwdGuid},
        });
        log.debug("recId", recId);
        context.response.write("Password GUID Generated");
        context.response.write("<script>window.close();</script>");
       }  

     }
 
     return {
         onRequest: onRequest
     };
     
 });