// eslint-disable-next-line no-undef
define(['N/log','N/record'], function(log,record) {
    return {
        internalid: 'customrecord_ab_error_log',
        fields: {
            errorName:'custrecord_ab_error_name',
            errorMessage:'custrecord_ab_error_msg',
            errorFunction:'custrecord_ab_error_function_name',
        },
        
        /**
         * @param  {} errName
         * @param  {} errMsg
         * @param  {} errtitle
         * @param  {} {vartitle='create(
         * Details : Create Error Log custom record 
         */
        create:function create(errName,errMsg,errtitle){
            var title = 'create()::';
            log.debug(title+"errName | errMsg | errtitle",errName+' | '+errMsg + ' | '+errtitle);           
            try{
                var errRec = record.create({
                    type: this.internalid,
                    isDynamic: true
                });
                errRec.setValue({
                    fieldId: this.fields.errorName,
                    value: errName
                });
                errRec.setValue({
                    fieldId: this.fields.errorMessage,
                    value: errMsg
                });
                errRec.setValue({
                    fieldId: this.fields.errorFunction,
                    value: errtitle
                });
                errRec.save();
                }catch(error){
                    log.error(title+error.name,error.message);
            } 
        },   
    };
});