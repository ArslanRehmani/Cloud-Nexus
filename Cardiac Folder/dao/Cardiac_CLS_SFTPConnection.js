// eslint-disable-next-line no-undef
define(['N/sftp', 'N/log', 'N/runtime', '../dao/AB_CLS_SFTPConfiguration.js','N/file','../dao/AB_CLS_ErrorLogs.js'], function (sftp, log, runtime, CLSconfig,file,CLSErrorLogs) {
    return {


        /**
         * @param  {} {vartitle='downloadFile(
         * Detials : Download File From SFTP server using configuration custom record for details
         */
        downloadFile: function () {
            var title = 'downloadFile()::';
            var scriptObj = runtime.getCurrentScript();
            var configID = scriptObj.getParameter({
                name: "custscript_ab_sftp_config"
            }) || 1;
            var parms = CLSconfig.getConfig(configID);
            var InboundDirectory = parms.inboundDirectory;
            var connection = this.getConnection(parms,InboundDirectory);
            try {
                if(connection){
                    var fileList = connection.list({
                        path:'/IntegrationFTP/Export/Kodiak Cakes/Transaction/',
                        sort: sftp.Sort.SIZE
                    });
                }
            } catch (error) {
                CLSErrorLogs.create(error.name,error.message,title);
                log.error(title + error.name, error.message);
            }
            return fileList;
        },
        /**
         * @param  {} configID
         * @param  {} {vartitle='getConnection(
         * Detials : Build Connection with SFTP server 
         */
        getConnection: function (parms,directorypath) {
            var title = 'getConnection()::';
            try {
                // var parms = CLSconfig.getConfig(configID);
                log.debug(title+'parms', parms);
                var connection = sftp.createConnection({
                    username: parms.username,
                    passwordGuid: parms.passwordGuid,
                    url: parms.url,
                    port: parseInt(parms.port),
                    hostKey: parms.hostKey
                    // directory: directorypath
                });
                log.debug(title+"connection", connection);
            } catch (error) {
                CLSErrorLogs.create(error.name,error.message,title);
                log.error(title + error.name, error.message);
            }
            return connection;
        
        },
            /**
         * @param  {}
         * details : Return current date in format : year_month_day_time;
         */
        getSysDate: function getSysDate() {
                var now = new Date();
                var year = "" + now.getFullYear();
                var month = "" + (now.getMonth() + 1);
                if (month.length == 1) {
                    month = "0" + month;
                }
                var day = "" + now.getDate();
                if (day.length == 1) {
                    day = "0" + day;
                }
                // var time = now.getTime();
                // return year + month + day + '_' + time;
                return year + month + day;
        },
        downloadFileWithName: function (fileName) {
            var title = 'downloadFile()::';
            var scriptObj = runtime.getCurrentScript();
            var configID = scriptObj.getParameter({
                name: "custscript_ab_sftp_config"
            }) || 1;
            var parms = CLSconfig.getConfig(configID);
            var InboundDirectory = parms.inboundDirectory;
            var connection = this.getConnection(parms,InboundDirectory);
            try {
                if(connection){
                    var inboundFolder = parms.inboundFolderId;
                    var downloadedFile = connection.download({
                        filename: fileName,
                        directory: '/IntegrationFTP/Export/Kodiak Cakes/Transaction/',
                    });
                    downloadedFile.folder = inboundFolder;
                    var fileId = downloadedFile.save();
                    //move file to archive Folder
                    connection.move({
                        from: '/IntegrationFTP/Export/Kodiak Cakes/Transaction/'+fileName,
                        to: '/IntegrationFTP/Export/Kodiak Cakes/archive/'+fileName
                    });
                }
            } catch (error) {
                CLSErrorLogs.create(error.name,error.message,title);
                log.error(title + error.name, error.message);
            }
            return fileId;
        },
    };
});


