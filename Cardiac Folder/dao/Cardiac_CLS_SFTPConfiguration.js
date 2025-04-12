// eslint-disable-next-line no-undef
define(['N/record','N/log'], function (record,log) {
    return {
        internalid : 'customrecord_cardiac_sftp_configuration',
        fields : {
            username:'custrecord_cardiac_sftp_user_name',
            passwordGuid:'custrecord_cardiac_sftp_password_guid',
            url:'custrecord_cardiac_sftp_url_host_name',
            port:'custrecord_cardiac_sftp_port',
            hostkey:'custrecord_cardiac_sftp_host_key'
        },
        /**
         * @param  {} configId
         * @param  {} {vartitle='getConfig(
         * @param  {configId} id
         * @param  {true}} isDynamic
         * Detials : To Get Configuration custom record data Object
         */
        getConfig: function (configId) {
            var title = 'getConfig()::';
            var obj ={};
            try {
               var rec = record.load({
                    type: this.internalid,
                    id: configId,
                    isDynamic: true
                });
                obj.username = rec.getValue(this.fields.username);
                obj.passwordGuid = rec.getValue(this.fields.passwordGuid);
                obj.url = rec.getValue(this.fields.url);
                obj.port = rec.getValue(this.fields.port);
                obj.hostKey = rec.getValue(this.fields.hostkey);
            } catch (error) {
                log.error(title + error.name, error.message);
            }
            return obj || {};
        }
    };
});