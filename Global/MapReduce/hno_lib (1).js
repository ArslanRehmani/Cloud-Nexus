/**
 * hno_lib.js
 * @NApiVersion 2.x
 */

define([
    'N/sftp',
    'N/search',
    './libraryG2',
    '/SuiteScripts/G 2.0/moment-with-locales-timezones.min',
    '/SuiteScripts/G 2.0/lodash_amd_v4.17.10.min',
    'N/url',
    'N/email',
    'N/format',
    'N/record',
    'N/file',
    'N/encode',
    'N/https'
],

function (sftp, search, lg, moment, _, url, email, format, record, file, encode, https) {
    var emailReceipients = [
        'george@lifespanfitness.com.au',
        'hanna.p@gflgroup.com.au',
        'sam@gflgroup.com.au',
        'kane.t@gflgroup.com.au',
        'carmela.g@gflgroup.com.au',
        'may.s@gflgroup.com.au',
    ];
    var now = moment().tz('Australia/Melbourne');

    var dayAllowance = 2;
    var defaultDeliveryWorkDays = 20;

    var hnoLogRecord = {
        id: 'customrecord_hno_import_log',
        fields: [
            'internalid',
            'name',
            'isinactive',
            'custrecord_hno_import_log_file',
            'custrecord_hno_import_log_order_content',
            'custrecord_hno_import_log_ns_order_src',
            'custrecord_hno_import_log_ns_customer_sr',
            'custrecord_hno_import_log_customer',
            'custrecord_hno_import_log_salesorder',
            'custrecord_hno_import_log_fulfilled',
            'custrecord_hno_import_log_dispatch_conte',
            'custrecord_hno_import_log_cancel_file',
            'custrecord_hno_import_log_cancel_content',
            'custrecord_hno_import_log_return_file',
            'custrecord_hno_import_log_return_content',
            'custrecord_hno_import_log_order_ack_file',
            'custrecord_hno_import_log_cancel_ack_fil',
            'custrecord_hno_import_log_return_ack_fil',
            'custrecord_hno_import_log_order_ack_cont',
            'custrecord_hno_import_log_cancel_ack_con',
            'custrecord_hno_import_log_return_ack_con',
            'custrecord_hno_import_log_cancel_process',
            'custrecord_hno_import_log_return_process',
            'custrecord_hno_import_log_delivery_wdays',
            'custrecord_hno_import_log_exp_disp_date',
            'custrecord_hno_import_log_exp_deliv_date',
        ]
    }
    if (true) {
        var testFlag = 'n';
        var nsIncomingFolder = 6890153;
        var nsOutgoingFolder = 6890151;
        var nsErrorFolder = 6890152;
        var nsInventoryFolder = 6918208;
        var root = '/live/';
        var itemMapping = [
            { test_name: 'ACABLECURLBAR', real_name: 'ATTACHCABLECURLBAR' },
            { test_name: 'ADBAR', real_name: 'ATTACHDBAR' },
            { test_name: 'ALATPULLDOWNBAR', real_name: 'ATTACHLATPULLDOWNBAR' },
            { test_name: 'ARSTRAIGHTBAR', real_name: 'ATTACHREVOLVESTRAIGHTBAR' },
            { test_name: 'ASTIRRUPHANDLE', real_name: 'ATTACHDSTIRRUPHANDLE' },
            { test_name: 'ATRICEPROPE', real_name: 'ATTACHTRICEPROPE' },
            { test_name: 'ATRIPRESSBAR', real_name: 'ATTACHTRIPRESSBAR' },
            { test_name: 'BANDRESIST13MM', real_name: 'BANDRESIST-13mm' },
            { test_name: 'BANDRESIST21MM', real_name: 'BANDRESIST-21mm' },
            { test_name: 'BANDRESIST32MM', real_name: 'BANDRESIST-32mm' },
            { test_name: 'BANDRESIST-45MM', real_name: 'BANDRESIST-45mm' },
            { test_name: 'BANDRESIST-5MM', real_name: 'BANDRESIST-5mm'},
            { test_name: 'BANDRESISTHNDL', real_name: 'BANDRESISTHANDLE' },
            { test_name: 'BANDRESISTSET5', real_name: 'BANDRESIST-SET5' },
            { test_name: 'BANDSETHANDLE', real_name: 'BANDRESIST-SET5HANDLE' },
            { test_name: 'BFORTMINI2', real_name: 'PEBOUNCEFORT-MINI2' },
            { test_name: 'BFORTPLUS2', real_name: 'PEBOUNCEFORTPLUS2' },
            { test_name: 'BIKHUSTLEMATTBK', real_name: 'BIKHUSTLEMBK'},
            { test_name: 'PGFT-CRACKBK-17', real_name: 'BIKPCRACKER17BK2'},
            { test_name: 'PGFT-CRACKBU-17', real_name: 'BIKPCRACKER17BU2'},
            { test_name: 'PGFT-CRACKGR-17', real_name: 'BIKPCRACKER17GRN2'},
            { test_name: 'PGMT-TRAILGD-17', real_name: 'BIKPTRAILGOLD-17'},
            { test_name: 'PGMT-TRAILGD-19', real_name: 'BIKPTRAILGOLD-19'},
            { test_name: 'BYDOAKMONTSET', real_name: 'BYDOAKMONT-SET' },
            { test_name: 'BYDSKYFORTSET', real_name: 'BYDSKYFORT-SET' },
            { test_name: 'BYDSPRNGCOTSET', real_name: 'BYDSPRINGCOTTAGE-SET' },
            { test_name: 'CLIMBROCK3LGE', real_name: 'CLIMBINGROCK3-LGE' },
            { test_name: 'CLIMBROCK4SML', real_name: 'CLIMBINGROCK4-SML' },
            { test_name: 'CLIMBWALL1.3M', real_name: 'CLIMBINGWALL-1.3M' },
            { test_name: 'CLIMBWALL1.3SET', real_name: 'CLIMBINGWALL-1.3M-SET' },
            { test_name: 'CWBABYWALKBLCK', real_name: 'CWBABYWALKERBLOCKS' },
            { test_name: 'CWLEARNWALKER', real_name: 'CWLEARNINGWALKER' },
            { test_name: 'CWPK-SUPER', real_name: 'CWKITCHENSUPERIOR' },
            { test_name: 'DBADJUST525PAIR', real_name: 'DBADJUST52.5PAIR' },
            { test_name: 'DBADJUST525STND', real_name: 'DBADJUST52.5PAIR-STAND' },
            { test_name: 'FITNESSBALL65GY', real_name: 'FITNESSBALL65-GY' },
            { test_name: 'FITNESSBALL85GY', real_name: 'FITNESSBALL85-GY' },
            { test_name: 'HANDLEMETALBLU', real_name: 'HANDLEMETAL330-BLU' },
            { test_name: 'HANDLEMETALGRN', real_name: 'HANDLEMETAL330-GRN' },
            { test_name: 'HANDLEMETALRED', real_name: 'HANDLEMETAL330-RED' },
            { test_name: 'HANDLEMETALYEL', real_name: 'HANDLEMETAL330-YEL' },
            { test_name: 'HANDLEPLASTICBL', real_name: 'HANDLEPLASTIC-BLU' },
            { test_name: 'HANDLEPLASTICGR', real_name: 'HANDLEPLASTIC-GRN' },
            { test_name: 'HANDLEPLASTICRD', real_name: 'HANDLEPLASTIC-RED' },
            { test_name: 'HANDLEPLASTICYL', real_name: 'HANDLEPLASTIC-YEL' },
            { test_name: 'HNO-BYDSCE', real_name: 'BYDSCENICHEIGHTS-SET'},
            { test_name: 'HNO-FITBALL55', real_name: 'FITNESSBALL55-GY'},
            { test_name: 'HNO-FITBALL75', real_name: 'FITNESSBALL75-GY'},
            { test_name: 'HILLCRESTSET', real_name: 'BYDHILLCREST-SET' },
            { test_name: 'INVTBLQUANTUM2', real_name: 'INVERSIONTABLEQUANTUM2' },
            { test_name: 'KBSTANDARDSET6', real_name: 'KBSTANDARDSET6-16KG'},
            { test_name: 'KBVINYLSET412KG', real_name: 'KBVINYLSET4-12KG' },
            { test_name: 'KBVINYLSET420KG', real_name: 'KBVINYLSET4-20KG' },
            { test_name: 'MATGYM15SET16', real_name: 'MATGYM15-SET16' },
            { test_name: 'MATGYM15SET25', real_name: 'MATGYM15-SET25' },
            { test_name: 'MATGYM15SET36', real_name: 'MATGYM15-SET36' },
            { test_name: 'MATGYM15SET6', real_name: 'MATGYM15-SET6' },
            { test_name: 'MATGYM15SET9', real_name: 'MATGYM15-SET9' },
            { test_name: 'MONKEYSWINGRED', real_name: 'MONKEYSWING-RED' },
            { test_name: 'MONTICELLOSET', real_name: 'BYDMONTICELLO-SET' },
            { test_name: 'OLYCLLRLOCKJAW', real_name: 'OLYCOLLARS-LOCKJAW' },
            { test_name: 'OLYCURLBAR', real_name: 'OLYBBCBSCSET' },
            { test_name: 'OLYTRIBAR', real_name: 'OLYBBTRISCSET' },
            { test_name: 'PEAMBER3SET', real_name: 'PEAMBER3-SET' },
            { test_name: 'PEARCHIE-SET-GR', real_name: 'PEARCHIE-SET-GRN' },
            { test_name: 'PECAMIRASET', real_name: 'PECAMIRA-SET' },
            { test_name: 'PECOOPERSETGRN', real_name: 'PECOOPER-SET-GRN' },
            { test_name: 'PEFORDE2SET', real_name: 'PEFORDE2-SET' },
            { test_name: 'PEHOLT2SET', real_name: 'PEHOLT2-SET' },
            { test_name: 'PETABLESUNRISE', real_name: 'PEPICNICTABLESUNSET' },
            { test_name: 'PETEDDYFULL', real_name: 'PETEDDY-SET-FULL' },
            { test_name: 'PEWARRIGALGRN', real_name: 'PEWARRIGAL-SET-GRN' },
            { test_name: 'PEWESLEY2SET', real_name: 'PEWESLEY2-SET' },
            { test_name: 'PGRT-POMONMT-13', real_name: 'SHO-BIKPOMONAPETITE-MINT'},
            { test_name: 'PGRT-POMONMT-15', real_name: 'SHO-BIKPOMONAMINT-15' },
            { test_name: 'PGRT-POMONMT-17', real_name: 'SHO-BIKPOMONAMINT-17' },
            { test_name: 'PGRT-POMONBU-15', real_name: 'SHO-BIKPOMONARBLUE-15' },
            { test_name: 'PGRT-POMONBU-17', real_name: 'SHO-BIKPOMONARBLUE-17'},
            { test_name: 'PGRT-POMONRG-15', real_name: 'SHO-BIKPOMONARGOLD-15'},
            { test_name: 'PGRT-POMONRG-17', real_name: 'SHO-BIKPOMONARGOLD-17'},
            { test_name: 'PGMT-TRAILGD-19', real_name: 'BIKPTRAILGOLD-19'},
            { test_name: 'PGMT-TRAILGD-17', real_name: 'BIKPTRAILGOLD-17'},
            { test_name: 'PICNICTABLE', real_name: 'PEPICNICTABLEPEPPER' },
            { test_name: 'PLYOBOX3IN1', real_name: 'PLYOBOX-3IN1' },
            { test_name: 'PLYOBOXSOFTSET', real_name: 'PLYOBOXSOFT-SET'},
            { test_name: 'PTOWERGBH210', real_name: 'POWERTOWERGBH210' },
            { test_name: 'SANDPCOVERLG', real_name: 'SANDPCOVERLGEOCT' },
            { test_name: 'SANDPCOVERPFORT', real_name: 'SANDPCOVERPLAYFORT' },
            { test_name: 'SANDPITLARGESET', real_name: 'SANDPITLARGE-COVERSET'},
            { test_name: 'SANDPPFORT2', real_name: 'SANDPITPLAYFORT2' },
            { test_name: 'SANDPPFORT2SET', real_name: 'SANDPITPLAYFORT2-COVERSET' },
            { test_name: 'SCENICHEIGHTSET', real_name: 'BYDSCENICHEIGHTS-SET' },
            { test_name: 'SEESAWROCKA', real_name: 'SEESAW-ROCKA' },
            { test_name: 'SEESAWTWIRL15', real_name: 'SEESAWTWIRL-15'},
            { test_name: 'SLIDEJUMBOGRN', real_name: 'SLIDEJUMBO-SET-GRN' },
            { test_name: 'SLIDESLIPPERY3', real_name: 'SLIDESLIPPERY3-SET' },
            { test_name: 'SLIDESSHINEGRN', real_name: 'SLIDESUNSHINESET-GRN' },
            { test_name: 'SLIDESUNSHINEYL', real_name: 'SLIDESUNSHINESET-YEL' },
            { test_name: 'SKIPROPESIL2', real_name: 'SKIPROPE-SIL2'},
            { test_name: 'SKIPROPEBK', real_name: 'SKIPROPE-BK'},
            { test_name: 'SPCOVERCAPTAIN', real_name: 'SANDPCOVERCAPTAIN' },
            { test_name: 'SPCOVERMIGHTY', real_name: 'SANDPCOVERMIGHTY' },
            { test_name: 'SPCOVERWARRIGAL', real_name: 'SANDPCOVERWARRIGAL' },
            { test_name: 'SPIDEYSWING120', real_name: 'SPIDEYWEBSWING120' },
            { test_name: 'SPIDEYSWING60', real_name: 'SPIDEYWEBSWING60' },
            { test_name: 'SPIDEYWEB100', real_name: 'SPIDEYWEBSWING100' },
            { test_name: 'SPITCAPTAINSET', real_name: 'SANDPITCAPTAIN-COVERSET' },
            { test_name: 'SPITEXPLORER', real_name: 'SANDPITEXPLORER' },
            { test_name: 'SPITMIGHTYSET', real_name: 'SANDPITMIGHTY-COVERSET' },
            { test_name: 'SPSS-TRIORYEL', real_name: 'SPTRIOROCKER-YELLOW'},
            { test_name: 'SPSS-TRIORBLU', real_name: 'SPTRIOROCKER-BLUE'},
            { test_name: 'SPSS-TRIORPK', real_name: 'SPTRIOROCKER-PINK'},
            { test_name: 'SPCH-UNIMG', real_name: 'SPUNICORNMAGICALHOUSE'},
            { test_name: 'SPCH-GALVG', real_name: 'SPGALILEEVILLAGEHOUSE'},
            { test_name: 'SPCH-UNIMG', real_name: 'SPUNICORNMAGICALHOUSE'},
            { test_name: 'SPCH-GALVGPK', real_name: 'SPPINKGALILEEVILLAGEHOUSE'},
            { test_name: 'STEERWHEELYEL', real_name: 'STEERINGWHEEL-YEL' },
            { test_name: 'STUDIOWEIGHTSET', real_name: 'STUDIO-WEIGHTSET'},
            { test_name: 'HNO-BYDSUN', real_name: 'BYDSUNNYDALE-SET'},
            { test_name: 'TMEVEREST', real_name: 'TMEVEREST-SET'},
            { test_name: 'TPHILLTOPSET', real_name: 'TPHILLTOP-SET' },
            { test_name: 'TPTREETOPSSET', real_name: 'TPTREETOPS-SET' },
            { test_name: 'TPPK-MUDDYMKR', real_name: 'TPMUDDYMAKERKTN'},
            { test_name: 'WALLABY2SETGRN', real_name: 'PEWALLABY2-SET-GRN' },
            { test_name: 'WALLBALL10KG', real_name: 'WALLBALL-10KG' },
            { test_name: 'WALLBALL6KG', real_name: 'WALLBALL-6KG' },
            { test_name: 'WALLBALL8KG', real_name: 'WALLBALL-8KG' },
            { test_name: 'WARRIGALSETYEL', real_name: 'PEWARRIGAL-SET-YEL' },
            { test_name: 'WEIGHTVEST10KG', real_name: 'WEIGHTVEST-10KG' },
            { test_name: 'WEIGHTVEST20KG', real_name: 'WEIGHTVEST-20KG' },
            { test_name: 'WEIGHTVEST30KG', real_name: 'WEIGHTVEST-30KG' },
            { test_name: 'WOODWORX', real_name: 'PEWOODWORX' },
            { test_name: 'YOGASETMAT1PK', real_name: 'YOGASET-MAT14WHEEL-PK' },
            { test_name: 'YOGASETMATBLU', real_name: 'YOGASET-MAT14WHEEL-BLU' },
            { test_name: 'CHORKITTRAMPSET', real_name: 'ANCHORKITTRAMPSET' },
            { test_name: 'YCOLLARS-SPRING', real_name: 'OLYCOLLARS-SPRING' },
            { test_name: 'ETTLEBELLRACK2T', real_name: 'KETTLEBELLRACK2T' },
            { test_name: 'CKETBBTIMBERBR2', real_name: 'BRACKETBBTIMBERBR2' },
            { test_name: 'OUNCEFORT-MINI2', real_name: 'PEBOUNCEFORT-MINI2' },  
            { test_name: 'DEJUMBO-SET-YEL', real_name: 'SLIDEJUMBO-SET-YEL' },
            { test_name: 'CHORKITTRAMPSET', real_name: 'ANCHORKITTRAMPSET' },
            { test_name: 'ACKETBBMETALBR1', real_name: 'BRACKETBBMETALBR1' },
            { test_name: 'IMBINGROCK4-LGE', real_name: 'CLIMBINGROCK4-LGE' },
            { test_name: 'YCOLLARS-SPRING', real_name: 'OLYCOLLARS-SPRING' },
            { test_name: 'ANDRESIST-SET10', real_name: 'BANDRESIST-SET10' },
            { test_name: 'YOGAWHEELBLU', real_name: 'YOGAWHEEL-BLU' },
        ];
        var passwordGuid = '79cbd339811b4ea4a1c99cf109656c8b';
    } else {
        var testFlag = 'y';
        var nsIncomingFolder = 6416221;
        var nsOutgoingFolder = 6416222;
        var nsErrorFolder = 6416523;
        var root = '/uat/';
        var itemMapping = [{
            test_name: 'PRD1234',
            real_name: 'RB2'
        }];
        var passwordGuid = 'dc16e0140fd54d5fa4370a489386ce21';
    }

    function hnoSFTP() {
        this.edgeSFTPVersion = '6';

        this.incomingFolder = root + 'incoming/';
        this.outgoingFolder = root + 'outgoing/';
        this.inventoryFolder = root + 'inventory/';

        this.sftpConn = sftp.createConnection({
            url: 'v-source.co.uk',
            passwordGuid: passwordGuid,
            hostKey: 'AAAAB3NzaC1yc2EAAAADAQABAAABAQDRKNedrl1afFFkqMZCbf8Ig0r8z+gY8vzpVaEvl+6MBYbUZqOLOgB+SIILkrxgagqg6m+t4QqGQQx1fwGj/hUCy7T5fpGJAirWkqpMVYpvzlEFT/kEoXskc7KF3zpyjT3sRnoDI11GI5c1P+kdOxW/kZgTzMruipwet4rNT1oXt1vpJG6Pox3sKx68DU3oLTI9xCMfVtnMWpl5rr3wAVY7lY3X6NNPM+DSE1RZBwd6Qfegp8+23djLb8JMcHSUKlOBT1VSqFGWvASj72O5JSV6O94Ovp267T3Am9sFmrba50UBbgb747nc70Q+tdzBpRLm2tbhKu50LMwjJ8au51ff',
            username: 'hn_globalfitness',
            port: 22,
            hostKeyType: 'rsa',
            timeout: 20
        });
    }

    hnoSFTP.prototype.uploadInventory = function(fileObj) {
        this.uploadFile(fileObj, this.inventoryFolder);
    }

    hnoSFTP.prototype.uploadFile = function(fileObj, path, ignoreDone) {
        var uploadDone = true;
        if (ignoreDone) {
            uploadDone = false;
        }
        try {
            var dpath = path || this.outgoingFolder;
            var fileName = fileObj.name;
            this.sftpConn.upload({
                file: fileObj,
                filename: fileObj.name,
                directory: dpath
            });
            // upload done file
            if (uploadDone) {
                var doneFile = file.create({
                    name: fileName+'.DONE',
                    fileType: file.Type.PLAINTEXT,
                });
                this.sftpConn.upload({
                    file: doneFile,
                    directory: dpath
                });
            }  
        } catch (error) {
            log.error('upload Error ' + fileName, error);
            throw new Error('upload Error ' + fileName);
        }
    }
    hnoSFTP.prototype.downloadFile = function (remotePath, fileName, localFolder) {
        // log.debug('download file', this);
        localFolder = localFolder || nsIncomingFolder;
        var result = {};
        try {
            var downloadedFile = this.sftpConn.download({
                filename: fileName,
                directory: remotePath,
            });
            result.file = downloadedFile;
            
            if (localFolder && util.isNumber(localFolder)) {
                downloadedFile.folder = localFolder; // number only
                // downloadedFile.encoding = file.Encoding.UTF_8;
                // downloadedFile.fileType = file.Type.PLAINTEXT; // read only
                result.file_internalid = downloadedFile.save();
                result.file = downloadedFile; // update file obj
                result.file.internalid = result.file_internalid;
            }
        } catch (error) {
            log.error('downloadFile error', error);
            log.error('download file error', fileName+' in '+remotePath + ' cant be downloaded due to ' + error.message);
            result.error = error.message;

            // throw new Error(error.message);
            lg.emailNotice({
                recipients: emailReceipients,
                subject: '[notification][HNOL Error] Failed to download file ' + fileName, 
                body: 'Please check with SFTP to fix \n\n' + JSON.stringify(result)
            });
        }

        return result;
    }
    hnoSFTP.prototype.deleteFile = function (remoteFile) {
        try {
            this.sftpConn.removeFile({
                path: remoteFile
            });
        } catch (error) {
            log.error('deleteFile error', 'failed to delete ' + remoteFile + ' due to ' + error.message);
        }
    }
    hnoSFTP.prototype.moveFile = function(fPath, tPath) {
        var opt = {
            from: this.incomingFolder + fPath,
            to: this.incomingFolder + tPath
        }
        try {
            this.sftpConn.move(opt)
        } catch(error) {
            log.error('move file', opt)
        }
    }

    hnoSFTP.prototype.listIncoming = function (incomingFolderPath) {
        var listArr = [];
        var incomingFolder = incomingFolderPath || this.incomingFolder;
        var self = this;
        try {
            var list = this.sftpConn.list({
                path: incomingFolder
            });
            util.each(list, function(l) {
                // log.debug('l', l);
                var twoDays = new Date().getTime() - (new Date(l.lastModified).getTime() + 1000 * 60 * 60 * 24 * 1);
                // log.debug('2 days ago', twoDays);
                // if(!l.directory && l.name.indexOf('.DONE') > 0 && new Date() && twoDays <= 0) {
                if (!l.directory && l.name.indexOf('.DONE') > 0) {
                    var realFileName = l.name.replace('.DONE', '');
                    log.debug('realFileName', realFileName);
                    var downloaded = self.downloadFile(incomingFolder, realFileName);
                    if (downloaded.file) {
                        var orderObj = generateOrder(downloaded.file);
                        listArr.push(util.extend(downloaded, orderObj));
                        if (downloaded.file.internalid) {
                            // self.deleteFile(incomingFolder+realFileName);
                            // self.deleteFile(incomingFolder+l.name);
                        }
                    }
                }
            });

        } catch (error) {
            log.error('listIncoming error', error);
        }

        return listArr;
    }

    hnoSFTP.prototype.getErrors = function() {
        var listArr = [];
        var outgoingFolder = this.outgoingFolder;
        var self = this;
        try {
            var list = this.sftpConn.list({
                path: outgoingFolder
            });
            util.each(list, function(l) {
                if(!l.directory && l.name.indexOf('.err.DONE') > 0) {
                    var realFileName = l.name.replace('.DONE', '');
                    var originalFileName = realFileName.replace('.err', '');
                    var downloaded = self.downloadFile(outgoingFolder, realFileName, nsErrorFolder);
                    if (downloaded.file) {
                        var orderValues = downloaded.file.getContents();
                        if (!downloaded.file.isText && downloaded.file.fileType == 'MISCBINARY') {
                            orderValues = encode.convert({
                                string: orderValues,
                                inputEncoding: encode.Encoding.BASE_64,
                                outputEncoding: encode.Encoding.UTF_8,
                            })
                        }
                        log.debug(downloaded.file.fileType, downloaded.file.encoding + ' ' + downloaded.file.isText.toString() + typeof downloaded.file.getContents());
                        
                        var orderType = realFileName.split('-')[0];
                        log.debug('orderValues', orderValues);

                        listArr.push(util.extend(downloaded, {
                            order_type: orderType,
                            order: orderValues,
                        }));

                        if (downloaded.file_internalid) {
                            self.deleteFile(outgoingFolder+realFileName);
                            self.deleteFile(outgoingFolder+l.name);
                            self.deleteFile(outgoingFolder+originalFileName+'.failed');
                            self.deleteFile(outgoingFolder+originalFileName+'.DONE.failed');
                        }
                    }
                }
            });

        } catch (error) {
            log.error('outgoingFolder error', error);
        }

        return listArr;
    }

    function hnoLog(values) {
        this.internalid = values.internalid || null;
        this.values = values;
        
        if (this.internalid) {
            this.createUpdateLog(this.internalid);
        } else {
            var searchFilters = [
                ['isinactive', 'is', 'F']
            ];
    
            // if (values.file_name) {
            //     searchFilters.push('AND');
            //     searchFilters.push(['custrecord_hno_import_log_file.name', 'is', values.file_name]);
            // } else {
                if (this.values.name) {
                    searchFilters.push('AND');
                    searchFilters.push(['name', 'is', this.values.name]);
                }
            // }
            var existingLogs = this.getExistingLog(searchFilters);
            if (existingLogs.length > 1) {
                var lastId = existingLogs[existingLogs.length-1].internalid;
                log.error('duplicated log', 'update log' + lastId);
                log.error(
                    'duplicated log for ' + this.values.file_name || this.values.name,
                    'existing logs are' + _.join(_.map(existingLogs, 'internalid'), ',') + ' will update ' + lastId);
                
                this.createUpdateLog(lastId);
                // notice email
                lg.emailNotice({
                    recipients: emailReceipients,
                    subject: '[notification][HNOL Error] HNO duplicated log for ' + this.values.file_name || this.values.name, 
                    body: 'updated the log intenalid ' + lastId + '\n\n' + JSON.stringify(existingLogs) + '\n\n' + JSON.stringify(values),
                });
            } else if (existingLogs.length == 1) {
                // update log
                this.createUpdateLog(existingLogs[0].internalid);
            } else {
                // create log
                this.createUpdateLog();
            }
        }
    }
    hnoLog.prototype.createUpdateLog = function(id) {
        var logRec = lg.createUpdateRecord(hnoLogRecord.id, id, this.values);
        if(!logRec.error) {
            this.internalid = logRec.record_internalid;
            this.values = this.getExistingLog([['internalid', 'is', this.internalid]])[0];
        } else {
            throw new Error('failed to create / update log due to ' + logRec.error + ' for log values ' + JSON.stringify(this.value));
        }
    }
    hnoLog.prototype.getExistingLog = function (filters) {
        var existingLog = [];

        if (!_.isEmpty(filters)) {
            var logSearch = search.create({
                type: hnoLogRecord.id,
                filters: filters,
                columns: hnoLogRecord.fields,
            });
            logSearch.run().each(function(l) {
                var result = {};
                util.each(l.columns, function(c) {
                    result[c.name] = l.getValue(c);
                });
                result.file_name = l.getText('custrecord_hno_import_log_file');
                result.salesorder_number = l.getText('custrecord_hno_import_log_salesorder');
                result.cancel_file_name = l.getText('custrecord_hno_import_log_cancel_file');
                result.return_file_name = l.getText('custrecord_hno_import_log_return_file');

                existingLog.push(result);
    
                return true;
            });
        } else {
            log.error('missing filter for log search', this);
        }

        return existingLog;
    }

    function hnoOrder(order) {
        this.salesorder = null;
        this.customer = null;
        this.order_values = order.order;
        this.log_internalid = order.log_internalid;
        this.order_number = order.order.order_level.order_number;
        this.order_type = order.order_type;
        this.log_values = order.log_values.values;
        log.debug('hnoOrder log_value', this.log_values)

        // get lasted log values
        if (_.isEmpty(this.log_values)) {
            this.log_values = (new hnoLog({internalid: this.log_internalid})).values;
        }
        this.supplier_dispatch_date = this.log_values.custrecord_hno_import_log_exp_disp_date || '';
        this.supplier_delivery_date = this.log_values.custrecord_hno_import_log_exp_deliv_date || '';

        if (_.isEmpty(this.log_values.internalid) && !_.isEmpty(this.log_internalid)) this.log_values.internalid = this.log_internalid;

        // create sales order
        if (lg.isEmpty(this.log_values.custrecord_hno_import_log_salesorder)) {
            var salesorderInternalid = this.createRecord('salesorder');
            if (salesorderInternalid) {
                this.log_values.custrecord_hno_import_log_salesorder = salesorderInternalid;
                this.salesorder = salesorderInternalid;
            }
            log.debug('update log with salesorder', salesorderInternalid);
            new hnoLog(this.log_values);
        } else {
            this.salesorder = this.log_values.custrecord_hno_import_log_salesorder;
        }

        // create customer
        if (lg.isEmpty(this.log_values.custrecord_hno_import_log_customer)) {
            var customerInternalid = this.createRecord('customer');
            if (customerInternalid) {
                this.log_values.custrecord_hno_import_log_customer = customerInternalid;
                this.customer = customerInternalid;
            }
            log.debug('update log with customer', customerInternalid);
            new hnoLog(this.log_values);
        } else {
            this.customer = this.log_values.custrecord_hno_import_log_customer;
        }

        // set expected delivery days if empty
        if (this.salesorder && lg.isEmpty(this.log_values.custrecord_hno_import_log_delivery_wdays)) {
            var deliveryDays = getExpectedDays(this.order_values.order_level.shipping_postcode, this.order_values.order_level.shipping_address_2)
            log.debug('delivery days for ' + this.order_number, deliveryDays.toString());
            this.log_values.custrecord_hno_import_log_delivery_wdays = deliveryDays.toString();

            this.supplier_dispatch_date = getBusinessDayStr(now);
            this.log_values.custrecord_hno_import_log_exp_disp_date = this.supplier_dispatch_date;

            this.supplier_delivery_date = getBusinessDayStr(now, deliveryDays);
            this.log_values.custrecord_hno_import_log_exp_deliv_date = this.supplier_delivery_date;
            new hnoLog(this.log_values);
        }

        // generate and upload ack 
        if (this.log_values.custrecord_hno_import_log_salesorder && 
            this.log_values.custrecord_hno_import_log_customer && 
            _.isEmpty(this.log_values.custrecord_hno_import_log_order_ack_file
        )) {
            var ackLines = [['"order_number"','"supplier_ref"','"test_flag"']];
            ackLines.push(['"'+this.order_number+'"', '"8242499"', '"'+testFlag+'"']);
            ackLines.push(['"line_ref"','"part_number"','"quantity"','"comments"','"sub_status"','"supplier_dispatch_date"','"supplier_delivery_date"','"fulfillment_route"']);
            var self = this;
            util.each(this.order_values.line_level, function(line) {
                ackLines.push(['"'+line.line_ref+'"','"'+line.part_number+'"','"'+line.quantity+'"','""','""','"'+self.supplier_dispatch_date+'"','"'+self.supplier_delivery_date+'"','""']); // Direct to Customer
            });

            new hnoAck({
                log_internalid: this.log_internalid,
                order_number: this.order_number,
                lines: ackLines,
                type: this.order_type,
            })
        }
    }

    hnoOrder.prototype.createRecord = function(recordType) {
        
        if (recordType == 'salesorder') {
            var srckey = 'custrecord_hno_import_log_ns_order_src';
        } else if (recordType == 'customer') {
            var srckey = 'custrecord_hno_import_log_ns_customer_sr';
        }

        if (!_.isEmpty(this.log_values[srckey])) {
            recValues = JSON.parse(recValues);
        }else {
            recValues = this.getNSFieldValues(recordType)[recordType];
            this.log_values[srckey] = JSON.stringify(recValues);
        }
        var rec = lg.createUpdateRecord(recordType, null, recValues);
        if (rec.error) {
            var errMsg = 'failed to create ' + recordType + ' for ' + this.order_number + ' due to ' + rec.error;
            lg.emailNotice({
                recipients: emailReceipients,
                subject: '[notification][HNOL Error] HNOL order - faile to create SO for' + this.order_number, 
                body: errMsg + '\n\n' + this.log_values[srckey],
            });
            throw new Error(errMsg);
        } else {
            return rec.record_internalid;
        }
    }

    // return {salesorder: 'salesorder', customer: 'customer'}
    hnoOrder.prototype.getNSFieldValues = function(type) {
        var orderValues = this.order_values;
        var customerFullName = orderValues.order_level.shipping_full_name;
        var customerNameArr = customerFullName.split(' ');

        var addressData = {
            addressee: customerFullName,
            addr1: orderValues.order_level.shipping_address_1,
            addrphone: orderValues.order_level.shipping_phone,
            city: orderValues.order_level.shipping_address_2,
            state: lg.getStateShortName(orderValues.order_level.shipping_address_3), // must be short form
            zip: orderValues.order_level.shipping_postcode,
            country: 'AU' // must be short form
        }

        var itemArr = _.compact(_.map(orderValues.line_level, function(l) {
            if (l && l.part_number && l.quantity) {
                return {
                    sku: getRealItemFromTest(l.part_number),
                    qty: l.quantity,
                    sku_qty: getRealItemFromTest(l.part_number) + '*' + l.quantity
                }
            } else {
                return null;
            }
        }));
        log.debug('itemArr', itemArr)
        if (_.isEmpty(itemArr)) {
            lg.emailNotice({
                recipients: emailReceipients,
                subject: '[notification][HNOL Error] HNO order' + orderValues.order_level.order_number + ' missing item',
                body: 'Check if the orde in correct format \n\n' + JSON.stringify(orderValues),
            });

            throw new Error('missing item in ' + orderValues.order_level.order_number)
        }

        if (type == 'customer') {
            var customerObj = {
                category: '7',
                comments: orderValues.order_level.order_number,
                phone: orderValues.order_level.shipping_phone,
                firstname: _.join(_.initial(customerNameArr), ' ').slice(0, 32),
                lastname: _.last(customerNameArr).slice(0, 32),
                parent: '861', // 6580 ONSELLER,
                addressbook: [
                    // {
                    //     defaultbilling: false,
                    //     defaultshipping: true,
                    //     phone: '0312345678',
                    //     addrtext: 'John shipping\n3 Carson Dr\nBunya Queensland 4055\nAustralia' //doesn't work, Please enter value(s) for: Address
                    // },
                    {
                        defaultbilling: true,
                        defaultshipping: true,
                        addressbookaddress: addressData
                    },
                ]
            };
            if (customerFullName.length > 32) {
                customerObj.comments += '\n' + customerFullName
            }
            if (orderValues.order_level.shipping_email) {
                customerObj.email = orderValues.order_level.shipping_email;
            }
        } else if (type == 'salesorder') {
            var salesOrderObj = {
                customform: "118",
                entity: "2131138", // 145116 HARVEY NORMAN ONLINE
                externalid: "HNO|" + orderValues.order_level.order_number,
                // memo: orderValues.order_level.order_number,
                custbody1: orderValues.order_level.order_number + ' | ' + (orderValues.order_level.retailer_ref || orderValues.order_level.po_enduser) + ' | ' + orderValues.order_level.customer_ref,
                item: [],
                shippingcost: 0,
                shippingtaxcode: "7",
                shipmethod: "13712", // best available
                location: "15",
                shipaddresslist: null,
                shippingaddress: addressData
            }

            var zoneJSON = JSON.parse(file.load('./carrier_zones.json').getContents());
            var rateJSON = JSON.parse(file.load('./item_shipping_rates.json').getContents());
            var bulkInventoryUrl = url.resolveScript({
                scriptId: 'customscript_bulk_inventory',
                deploymentId: 'customdeploy1',
                params: {
                    item_key_type: 'sku',
                    // item_keys: _.map(itemArr, 'sku').join(','),
                    location: '15'
                },
                returnExternalUrl: true
            });
            // var bulkInventoryReq = https.get({url: bulkInventoryUrl});
            var bulkInventoryReq = https.post({
                url: bulkInventoryUrl,
                body: JSON.stringify({
                    item_keys: _.map(itemArr, 'sku').join(','),
                    fields: [
                        {name: 'custitem_fs_hnol_metro', summary: 'max', label: 'metro'},
                        {name: 'custitem_fs_hnol_rural', summary: 'max', label: 'rural'},
                        {name: 'custitem_fs_hnol_remote', summary: 'max', label: 'remote'}
                    ]
                })
            });
            //MW Commented Code
            if (bulkInventoryReq.code == 200) {
                var carrierNames = [];
                var carriers = [];
                var res = JSON.parse(bulkInventoryReq.body);
                util.each(itemArr, function(it) {
                    var foundItem = _.find(res.inventory, {sku: it.sku});
                    if (foundItem) {
                        salesOrderObj.item.push({
                            item: foundItem.internalid,
                            quantity: it.qty,
                            price: '40',
                            taxcode: 7,
                        });
                        carrierNames.push(foundItem.carrier);
                        if (foundItem.carrier_id) {
                            var currentCarrierFields = search.lookupFields({
                                type: 'customrecord_shipping_carrier',
                                id: foundItem.carrier_id,
                                columns: [
                                    'custrecord_shipping_carrier_shipitem',
                                    'custrecord_shipping_carrier_priority',
                                ]
                            });
                            carriers.push({
                                shipitem_id: currentCarrierFields.custrecord_shipping_carrier_shipitem[0].value,
                                priority: currentCarrierFields.custrecord_shipping_carrier_priority,
                            })
                            var carrierName = currentCarrierFields.custrecord_shipping_carrier_shipitem[0].text;
                            var carrierZones = zoneJSON[_.snakeCase(carrierName)];
                            log.debug('carrierZones', carrierZones);
                            if (_.isEmpty(carrierZones)) {
                                carrierZones = zoneJSON['allied_express']
                            }
                            if (!_.isEmpty(carrierZones)) {
                                var foundZone = _.find(carrierZones, function(zone) {
                                    return _.parseInt(addressData.zip, 10) == zone.postcode && (zone.suburb ? addressData.city == zone.suburb : true);
                                })
                                log.debug('foundZone', foundZone);
                                if (!_.isEmpty(foundZone)) {
                                    // var foundRate = _.find(rateJSON, function(rate) {
                                    //     return foundItem.internalid == rate.internalid;
                                    // });
                                    var foundRate = foundItem[_.toLower(foundZone.trizone)]
                                    log.debug('foundRate', foundRate);
                                    //MW
                                    /*
                                    if (!_.isNaN(parseFloat(foundRate))) {
                                        salesOrderObj.shippingcost += parseFloat(foundRate);
                                        if (salesOrderObj.shippingcost == 0) {
                                            var shippingcostError = 'Item ' + it.sku + 'HNO order ' + orderValues.order_level.order_number 
                                                + ' shipping cost is 0 while shipping to ' + addressData.city + ' ' + addressData.zip + ', please verify. Details:\n\n'
                                                + 'foundZone: ' + JSON.stringify(foundZone) + '\n\n'
                                                + 'foundItem: ' + JSON.stringify(foundItem);
                                            lg.emailNotice({
                                                recipients: emailReceipients,
                                                subject: '[notification][HNOL Error] HNOL order item - shipping cost is 0', 
                                                body: shippingcostError,
                                            });
                                        }
                                    } 
                                    
                                    else {
                                        var foundRateErrMsg = 'missing rate for ' + it.sku + ' in order ' + orderValues.order_level.order_number 
                                            + ' to ' + addressData.city + ' ' + addressData.zip;
                                        lg.emailNotice({
                                            recipients: emailReceipients,
                                            subject: '[notification][HNOL Error] HNOL order - faile to find rate for item ' + it.sku, 
                                            body: foundRateErrMsg,
                                        });
                                        throw new Error(foundRateErrMsg);
                                    }
                                    */
                                } 
                                //MU Commented
                                /*else {
                                    var foundZoneErrMsg = 'missing zone of ' + carrierName + ' for ' + it.sku + ' in order ' + orderValues.order_level.order_number 
                                        + ' to ' + addressData.city + ' ' + addressData.zip;
                                    lg.emailNotice({
                                        recipients: emailReceipients,
                                        subject: '[notification][HNOL Error] HNOL order - faile to find zone for item ' + it.sku, 
                                        body: foundZoneErrMsg,
                                    });
                                    // throw new Error(foundZoneErrMsg);
                                    }*/
                            } 
                            /*else {
                                var foundCarrierErrMsg = 'missing carrier for ' + it.sku + ' in order ' + orderValues.order_level.order_number 
                                    + ' to ' + addressData.city + ' ' + addressData.zip;
                                lg.emailNotice({
                                    recipients: emailReceipients,
                                    subject: '[notification][HNOL Error] HNOL order - faile to find carrier for item ' + it.sku, 
                                    body: foundCarrierErrMsg,
                                });
                                // throw new Error(foundCarrierErrMsg);
                            }*/
                        } 
                        /*else {
                            // item is missing carrier id
                            var itemCarrierIdError = 'missing carrier for ' + it.sku + ' , please verify the item has carrier in Weight & Cubic tab'
                            lg.emailNotice({
                                recipients: emailReceipients,
                                subject: '[notification][HNOL Error] item is missing carrier ' + it.sku,
                                body: itemCarrierIdError
                            })
                            // throw new Error(itemCarrierIdError)
                        }*/
                    } 
                    /*else {
                        var errMsg = 'cannot find item ' + it.sku + ' in order ' + orderValues.order_level.order_number;
                        lg.emailNotice({
                            recipients: emailReceipients,
                            subject: '[notification][HNOL Error] HNOL order - faile to map item ' + it.sku, 
                            body: errMsg,
                        });
                        log.error('fail to find item', errMsg);
                        salesOrderObj.item.push({});
                        // stoping from creating sales order missing items
                        throw new Error(errMsg);
                    }*/
                });
                var carrierFilter = [];
                util.each(carrierNames, function(cn) {
                    carrierFilter.push(['name', 'is', cn]);
                    carrierFilter.push('OR');
                })
                // get shipment
                // var shippingCarriers = lg.SearchExistingRecord('customrecord_shipping_carrier', [
                //     ['isinactive', 'is', 'F'],
                //     'AND',
                //     _.initial(carrierFilter)
                // ], [
                //     'custrecord_shipping_carrier_shipitem',
                //     'custrecord_shipping_carrier_priority',
                // ]);
                // var maxSC = _.max(shippingCarriers, function(sc) {return parseFloat(sc.custrecord_shipping_carrier_priority)});
                // var maxSC = _.max(carriers, function(sc) {return parseFloat(sc.priority)})
                // if (maxSC) {
                //     // override winning to allied, as winning is no longer supported by HNO
                //     salesOrderObj.shipmethod = maxSC.shipitem_id == '34261' ? '34247' : maxSC.shipitem_id;
                // }
            } else {
                throw new Error('Failed to execute bulk inventory request due to ' + bulkInventoryReq.body);
            }
            //MW Commented Code
    
            // var freightOptions = lg.getFreightOptions(null, _.map(itemArr, 'sku_qty').join(','), addressData.zip, addressData.city);
            // if (freightOptions) {
            //     util.each(itemArr, function(it) {
            //         var foundItem = _.find(freightOptions.item, {sku: it.sku});
            //         if (foundItem) {
            //             salesOrderObj.item.push({
            //                 item: foundItem.internalid,
            //                 quantity: it.qty,
            //                 price: '40',
            //                 taxcode: 7,
            //             })
            //         } else {
            //             var errMsg = 'cannot find item ' + it.sku + ' in order ' + orderValues.order_level.order_number;
            //             lg.emailNotice({
            //                 recipients: emailReceipients,
            //                 subject: '[notification][HNOL Error] HNOL order - faile to map item ' + it.sku, 
            //                 body: errMsg,
            //             });
            //             log.error('fail to find item', errMsg);
            //             salesOrderObj.item.push({});
            //             // stoping from creating sales order missing items
            //             throw new Error(errMsg);
            //         }
            //     });
            //     if (!_.isEmpty(freightOptions.regular_opts) && !_.isEmpty(freightOptions.regular_opts[0].rates)) {
            //         salesOrderObj.shippingcost = freightOptions.regular_opts[0].rates[0].rate;
            //         salesOrderObj.shipmethod = freightOptions.regular_opts[0].shipitem;
            //         if (!_.isEmpty(freightOptions.regular_opts[0].rates[0].location)) {
            //             salesOrderObj.location = freightOptions.regular_opts[0].rates[0].location.inventory_location_id;
            //         }
            //     }
            // }
    
            if (orderValues.order_level.comments) {
                salesOrderObj.custbody_dkd_special_instructions = orderValues.order_level.comments;
            }
        }
        //MW Commented Code
        /*if (salesOrderObj && salesOrderObj.shippingcost == 0) {
            var shippingcostError = 'HNO order ' + orderValues.order_level.order_number 
                + ' shipping cost is 0 while shipping to ' + addressData.city + ' ' + addressData.zip + ', please verify';
            lg.emailNotice({
                recipients: emailReceipients,
                subject: '[notification][HNOL Error] HNOL order - shipping cost is 0', 
                body: shippingcostError,
            });
            // throw new Error(shippingcostError);
        }*/

        return {
            salesorder: salesOrderObj || null,
            customer: customerObj || null,
        }
    }

    function hnoCancel(cancelObj) {
        this.log_internalid = cancelObj.log_internalid;
        this.order_number = cancelObj.order.order_level.order_number;
        this.cancel_values = cancelObj.order;
        this.order_type = cancelObj.order_type;

        var toAck = false;

        if (_.isEmpty(cancelObj.log_values.values)) {
            if (_.isEmpty(cancelObj.log_internalid)) {
                this.log_values = (new hnoLog({name: this.order_number})).values
            } else {
                this.log_values = (new hnoLog({internalid: cancelObj.log_internalid})).values
            }
        } else {
            this.log_values = cancelObj.log_values.values;
        }

        this.salesorder = this.log_values.custrecord_hno_import_log_salesorder;
        this.salesorder_number = this.log_values.salesorder_number;

        if (!_.isEmpty(this.log_values.custrecord_hno_import_log_cancel_file)) {
            if (this.log_values.custrecord_hno_import_log_cancel_process) {
                log.debug('Cancel processed', 'cancel request has been processed');
            } else {
                var existingOrder = {};
                try {
                    existingOrder = JSON.parse(this.log_values.custrecord_hno_import_log_order_content); 
                } catch (error) {
                    lg.emailNotice({
                        recipients: emailReceipients,
                        subject: '[notification][HNOL Error] HNO Failed to cancel ' + this.order_number,
                        body: 'Failed to cancel ' + this.order_number + ' please manually process! thank you!',
                    });
                    this.log_values.custrecord_hno_import_log_cancel_process = true;
                }
                // check the differece with sales order item line values
                if (!_.isEmpty(existingOrder)) {
                    var existingLines = _.map(existingOrder.line_level, function(line) {
                        return {sku: line.part_number, qty: line.quantity};
                    });
                    if (_.isEmpty(this.cancel_values)) {
                        this.cancel_values = JSON.parse(this.log_values.custrecord_hno_import_log_cancel_content);
                    }
        
                    var cancelLines = _.map(this.cancel_values.line_level, function(line) {
                        return {sku: line.part_number, qty: line.quantity};
                    });
        
                    if (!_.isEqual(existingLines, cancelLines)) {
                        if (this.salesorder) {
                            // update sales order
                            if (this.ifSalesOrderProcessed()) {
                                // notice email
                                this.emailNotice();
                            } else {
                                this.updateSalesorder(cancelLines);
                                toAck = true;
                            }
                        }
                    } else {
                        if (this.salesorder) {
                            if (this.ifSalesOrderProcessed()) {
                                // notice email
                                this.emailNotice();
                            } else {
                                // close order
                                this.closeOrder();
                                this.log_values.custrecord_hno_import_log_fulfilled = true;
                                toAck = true;
                            }
                        } else {
                            // put log inactive to avoid and cancel processed to true
                            this.log_values.isinactive = true;
                        }
                    }
                    this.log_values.custrecord_hno_import_log_cancel_process = true;
                }

                new hnoLog(this.log_values);

                if (toAck) {
                    var ackLines = [['"order_number"','"supplier_ref"','"test_flag"']];
                    ackLines.push(['"'+this.order_number+'"', '"8242499"', '"'+testFlag+'"']);
                    ackLines.push(['"line_ref"','"part_number"','"quantity"','"comments"']);
                    util.each(this.cancel_values.line_level, function(line) {
                        ackLines.push(['"'+line.line_ref+'"','"'+line.part_number+'"','"'+line.quantity+'"','""'])
                    });
                    new hnoAck({
                        log_internalid: this.log_internalid,
                        order_number: this.order_number,
                        lines: ackLines,
                        type: this.order_type,
                    });
                }
            }
        }
    }

    hnoCancel.prototype.emailNotice = function() {
        lg.emailNotice({
            recipients: emailReceipients,
            subject: '[notification][HNOL Error] HNO Failed to cancel ' + this.order_number,
            body: 'Failed to cancel ' + this.order_number + ' due to SO ' + this.salesorder_number + ' have been fulfilled, please manually process!',
        });
    }

    hnoCancel.prototype.updateSalesorder = function(cancelLines) {
        var rec = record.load({
            type: 'salesorder',
            id: this.salesorder,
            isDynamic: true
        });

        util.each(cancelLines, function(line) {
            var itemCount = rec.getLineCount('item');
            for (var i = 0; i < itemCount; i++) {
                var itemFullName = rec.getSublistText({
                    sublistId: 'item',
                    fieldId: 'item',
                    line: i,
                });
                var itemSku = lg.getSKU(itemFullName);
                var qty = rec.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'quantity',
                    line: i,
                });

                if (getRealItemFromTest(line.sku) == itemSku && line.qty == qty) {
                    //remove current line
                    rec.removeLine({sublistId: 'item', line: i, ignoreRecalc: false})
                } else if (getRealItemFromTest(line.sku) == itemSku && parseFloat(line.qty) > 0 && parseFloat(line.qty) < qty) {
                    rec.selectLine({sublistId: 'item', line: i});
                    rec.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'quantity',
                        value: qty - parseFloat(line.qty)
                    });
                    rec.commitLine({sublistId: 'item'});
                }
            }
        });
        rec.save({
            enableSourcing: true,
            ignoreMandatoryFields: true
        });
    }

    hnoCancel.prototype.closeOrder = function() {
        var rec = record.load({
            type: 'salesorder',
            id: this.salesorder,
            isDynamic: true
        });
        //myCode
        var rp_waves = rec.getValue({fieldId: 'custbody_rp_waves'});
        var IFandBillingData = IFandBillingSearch(this.salesorder);
        log.debug({
            title: 'IFandBillingData',
            details: IFandBillingData
        });
        log.debug({
            title: 'rp_waves',
            details: rp_waves
        });
        //endMyCode
        var itemCount = rec.getLineCount('item');
        for (var i = 0; i < itemCount; i++) {
            rec.selectLine({sublistId: 'item', line: i});
            rec.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'isclosed',
                value: true,
            });
            rec.commitLine({sublistId: 'item'});
        }

        // rec.setValue({
        //     fieldId: 'custbody_close_reason',
        //     value: 'request by HNO SFTP refer to file ' + this.log_values.cancel_file_name,
        // });
        //myCode
        if((rp_waves == false && IFandBillingData == false) || rp_waves == true){
            log.debug({
                title: 'BOTH conditions MEET',
                details: 'YES'
            });
            rec.setValue({
                fieldId: 'custbody_close_reason',
                value: 'Harvey Norman Operator requested cancellation',
            });
            rec.save({
                enableSourcing: true,
                ignoreMandatoryFields: true
            });
        }
        //endMyCode
    }

    hnoCancel.prototype.ifSalesOrderProcessed = function() {
        var rec = record.load({
            type: 'salesorder',
            id: this.salesorder,
            isDynamic: true,
        });
        var linkCount = rec.getLineCount('links');

        if (linkCount > 0) {
            return true;
        } else {
            return false;
        }
    }


    function hnoReturnRequest(returnReqObj) {
        this.log_internalid = returnReqObj.log_internalid;
        this.order_number = returnReqObj.order.order_level.order_number;
        this.return_req_values = returnReqObj.order;
        this.order_type = returnReqObj.order_type;

        if (_.isEmpty(returnReqObj.log_values.values)) {
            this.log_values = (new hnoLog({internalid: this.log_internalid, name: this.order_number})).values;
        } else {
            this.log_values = returnReqObj.log_values.values;
            this.salesorder_number = this.log_values.salesorder_number;
        }

        // if (!_.isEmpty(this.log_values.custrecord_hno_import_log_return_ack_fil) && 
        //     !this.log_values.custrecord_hno_import_log_return_process
        // ) {
        //     lg.emailNotice({
        //         recipients: emailReceipients,
        //         subject: '[notification][HNO Important] HNO return request to process ' + this.order_number,
        //         body: 'HNO request return for ' + this.order_number + ' ' + this.salesorder_number + ', please manually process!',
        //     });
        //     new hnoLog(this.log_values);
            
        //     var ackLines = [['"order_number"','"supplier_ref"','"test_flag"']];
        //     ackLines.push(['"'+this.order_number+'"', '"8242499"', '"'+testFlag+'"']);
        //     ackLines.push(['"line_ref"','"part_number"','"quantity"','"comments"']);
        //     util.each(this.return_req_values.line_level, function(line) {
        //         ackLines.push(['"'+line.line_ref+'"','"'+line.part_number+'"','"'+line.quantity+'"','""'])
        //     });
        //     new hnoAck({
        //         log_internalid: this.log_internalid,
        //         order_number: this.order_number,
        //         lines: ackLines,
        //         type: this.order_type,
        //     });
        // }

        if (!this.log_values.custrecord_hno_import_log_return_process) {
            lg.emailNotice({
                recipients: emailReceipients,
                subject: '[notification][HNO Important] HNO return request to process ' + this.order_number,
                body: 'HNO request return for ' + this.order_number + ' ' + this.salesorder_number + ', please manually process!',
            });
            new hnoLog(util.extend(this.log_values, {custrecord_hno_import_log_return_process: true}));
        }
    }


    function hnoDispatch(logObj) {
        // get item fulfillment and match it from existing sales order
        this.salesorder = logObj.custrecord_hno_import_log_salesorder;
        this.salesorder_number = logObj.salesorder_number;
        this.order_number = logObj.name;
        this.log_internalid = logObj.internalid;
        this.order_type = 'dispatch';
        this.order_values = JSON.parse(logObj.custrecord_hno_import_log_order_content);

        this.errors = [];

        var trackingDetails = this.getTrackingDetails();
        log.debug('trackingDetails', trackingDetails);

        if (trackingDetails.status == 'closed') {
            // cancel order
        } else if (trackingDetails.status == 'fullyBilled' || trackingDetails.status == 'pendingBilling') {
            var self = this;
            var ackLines = [['"order_number"','"supplier_ref"']];
            ackLines.push(['"'+this.order_number+'"', '"8242499"']);
            ackLines.push(['"line_ref"', '"part_number"', '"quantity"', '"dispatch_date"', '"supplier_delivery_date"', '"carrier"', '"service"', '"tracking_number"', '"tracking_url"'])
            util.each(trackingDetails.salesorder_tracking_details, function(tracking) {
                var found = _.find(self.order_values.line_level, {part_number: getTestItemFromTest(tracking.item_sku)});
                if (found) {
                    var trackingNumbers = tracking.custbody_avt_ifs_connote_num || tracking.trackingnumbers.replace('<BR>','');
                    if (_.toUpper(tracking.shipmethod_name).indexOf('SAME DAY') == 0) {
                        var matchedTrackingNumber = tracking.custbody8.match(/\d+/)
                        if (_.isEmpty(matchedTrackingNumber)) {
                            trackingNumbers = ''
                        } else {
                            trackingNumbers = matchedTrackingNumber[0]
                        }
                        
                    }
                    var ifsCarrier = self.getTrackingUrl(tracking.custbody_avt_ifs_shipcarrier || tracking.shipmethod, trackingNumbers, tracking.shipzip);
                    log.debug('ifsCarrier', ifsCarrier);
                    var dispatchDate = getDate(tracking.transhippeddate);
                    var supplierDeliveryDate = getBusinessDayStr(dispatchDate, _.parseInt(logObj.custrecord_hno_import_log_delivery_wdays) || defaultDeliveryWorkDays)
                    ackLines.push(['"'+found.line_ref+'"', '"'+found.part_number+'"', '"'+tracking.quantity+'"', 
                        '"'+dispatchDate+'"', '"'+supplierDeliveryDate+'"', '"'+(ifsCarrier ? ifsCarrier.name : '')+'"',
                        '""', '"'+trackingNumbers+'"', '"'+ (ifsCarrier ? ifsCarrier.tracking_url : '')+'"'
                    ]);

                } else {
                    // notice email
                    var errMsg = 'HNO Dispatch - Cannot find ' + tracking.item_sku + ' in ' + self.salesorder_number + ' for HNO order ' + self.order_number;
                    log.audit('Dispatch missed item', errMsg)
                    // lg.emailNotice({
                    //     recipients: emailReceipients,
                    //     subject: '[notification][HNOL Error] HNOL Dispatch - faile to map item ' + tracking.item_sku, 
                    //     body: errMsg,
                    // });
                    // throw new Error(errMsg);
                }
            });
            log.debug('ackLines', ackLines);

            new hnoAck({
                log_internalid: this.log_internalid,
                order_number: this.order_number,
                lines: ackLines,
                type: this.order_type,
            })
        }
        // order_number,supplier_ref,
        // line_ref, part_number, quantity, dispatch_date, supplier_delivery_date, carrier, service, tracking_number, tracking_url
    }

    hnoDispatch.prototype.getTrackingUrl = function(ifsCarrierId, trackingNumbers, shipzip) {
        var ifsCarrier = lg.getTrackingUrl(ifsCarrierId);
        if (_.isEmpty(ifsCarrier)) {
            if (ifsCarrierId == '34995') { // SAME DAY - VIC [ALLIED]
                return {
                    name: 'SAME DAY - VIC [ALLIED]',
                    tracking_url: 'https://track.aftership.com/trackings?courier=alliedexpress&tracking-numbers=' + trackingNumbers + '&tracking_postal_code=' + shipzip 
                }
            } else if (ifsCarrierId == '34261') { // Winning
                return {
                    name: 'Winning',
                    tracking_url: ''
                }
            } else if (ifsCarrierId == '34263') {
                return {
                    name: 'Same Day - VIC [Civic]',
                    tracking_url: ''
                }
            } else {
                return null;
            }
        } else {
            if (_.toUpper(ifsCarrier.name).indexOf('AUSTRALIA POST') == 0 || _.toUpper(ifsCarrier.name).indexOf('AUS POST') == 0) {
                return {
                    name: ifsCarrier.name,
                    tracking_url: ifsCarrier.custrecord_avt_ifs_carrier_web + trackingNumbers
                }
            } else {
                return {
                    name: ifsCarrier.name,
                    tracking_url: ifsCarrier.custrecord_avt_ifs_carrier_web + '&tracking-numbers=' + trackingNumbers + '&tracking_postal_code=' + shipzip
                }
            }
        }
    }

    hnoDispatch.prototype.getTrackingDetails = function () {
        var salesorderTrackingDetailsSearch = search.create({
            type: 'salesorder',
            filters: [
                ['internalid', 'is', this.salesorder],
                'AND',
                ['mainline', 'is', 'F'],
                'AND',
                ['shipping', 'is', 'F'],
                'AND',
                ['taxline', 'is', 'F']
            ],
            columns: [
                'tranid',
                'statusref',
                'item',
                'item.custitem_avt_total_packages',
                'quantity',
                'fulfillingtransaction',
                'quantityshiprecv',
                'line',
                'custbody8',
                'transhippeddate',
                'fulfillingtransaction.packagecount',
                'fulfillingtransaction.trackingnumbers',
                'fulfillingtransaction.lastmodifieddate',
                'fulfillingtransaction.shipmethod',
                'fulfillingtransaction.shipzip',
                'fulfillingtransaction.custbody_avt_ifs_tot_items_shipped',
                'fulfillingtransaction.custbody_avt_ifs_connote_num',
                'fulfillingtransaction.custbody_avt_ifs_shipcarrier',
            ]
        });

        var searchColumns = salesorderTrackingDetailsSearch.columns;
        var salesorderTrackingDetails = [];
        var salesOrderStatus = '';
        salesorderTrackingDetailsSearch.run().each(function(result) {
            salesOrderStatus = result.getValue('statusref');
            var resultObj = {};
            util.each(searchColumns, function(sc) {
                resultObj[sc.name] = result.getValue(sc);
            });
            resultObj.item_sku = lg.getSKU(result.getText('item'));
            resultObj.shipmethod_name = result.getText({name: 'shipmethod', join: 'fulfillingtransaction'});
            salesorderTrackingDetails.push(resultObj);
            return true;
        });
        log.debug('salesorderTrackingDetails', salesorderTrackingDetails);

        return {
            status: salesOrderStatus,
            salesorder_tracking_details: salesorderTrackingDetails
        };
    }

    function hnoError(type, values) {
        var fileNameField = null;
        var fileName = values.file.name.replace('.err', '');

        if (type == 'order_ack') {
            fileNameField = 'custrecord_hno_import_log_order_ack_file';
        } else if (type == 'dispatch') {
            fileNameField = 'custrecord_hno_import_log_dispatch_file';
        } else if (type == 'cancel_ack') {
            fileNameField = 'custrecord_hno_import_log_cancel_ack_fil';
        }
        if (fileNameField) {
            log.debug(type, fileName + ' ' + fileNameField);
            var results = lg.SearchExistingRecord(hnoLogRecord.id, [
                search.createFilter({
                    name: 'formulatext',
                    operator: search.Operator.IS,
                    values: fileName,
                    formula: '{' + fileNameField + '}'
                })],
                hnoLogRecord.fields
            );
            log.debug('results', results);
            if (results[0]) {
                var subject = '[notification][HNOL Error] HNO Failed to ' + type + ' for order ' + results[0].name;
                var body = 'Error happens when ' + type + ' hno order ' + results[0].name + ' due to ' + values.order;
                log.error(subject, body);
                lg.emailNotice({
                    recipients: emailReceipients,
                    subject: subject,
                    body: body
                });
            }
        } else {
            log.error('Failed find error type', 'fileNameField is null');
        }
    }

    function hnoInventory() {
        var bulkInventoryUrl = url.resolveScript({
            scriptId: 'customscript_bulk_inventory',
            deploymentId: 'customdeploy1',
            params: {
                filters: 'custitem_dealerstock_harveynormanonlin:is:T',
                location: '15:1:75p,10:1:75p'
                //location: '15:1:75p'
            },
            returnExternalUrl: true
        });
        log.debug('url check inv', bulkInventoryUrl)
        var bulkInventoryResp = https.get({url: bulkInventoryUrl});
        if (bulkInventoryResp.code == 200) {
            var bulkInventoryRespBody = JSON.parse(bulkInventoryResp.body);
            var csvString = 'part_number,supplier_free_stock,allocated_stock\n';
            var iventoryArr = _.map(bulkInventoryRespBody.inventory, function(invent) {
                var quantity = Math.floor(invent.quantity_available * 0.6);
                // ERGODESK-13735, TMWALKSTATIONB-12338, TMWALKSTATIONB-ERGODESK-16820
                if (['16820', '12338', '13735'].indexOf(invent.internalid)) {
                    quantity = Math.floor(invent.quantity_available * 0.8);
                }
                csvString += getTestItemFromTest(invent.sku) + ',' + quantity + ',' + quantity + '\n';
            });
            var inventFile = file.create({
                name: 'inventory-' + nowString() + '.csv',
                fileType: file.Type.PLAINTEXT,
                description: 'inventory',
                encoding: file.Encoding.UTF8,
                folder: nsInventoryFolder,
                contents: csvString
            });
            this.inventory_file_internalid = inventFile.save();
            this.inventory_file = inventFile;
            var sftpInventory = new hnoSFTP();
            sftpInventory.uploadInventory(inventFile);
        }
    }

    // options: {log_internalid, order_number, lines:[], type}
    function hnoAck(options) {
        var fileName = options.type + '-' + nowString();
        if (options.type == 'dispatch') {
            fileName += '.txt';
        } else {
            fileName += '.ack';
        }
        var ackFile = file.create({
            name: fileName,
            fileType: file.Type.PLAINTEXT,
            description: 'ack',
            encoding: file.Encoding.UTF8,
            folder: nsOutgoingFolder,
        });

        util.each(options.lines, function(line) {
            ackFile.appendLine({value: _.join(line, ',')})
        });
        ackFile.appendLine({value: '"' + options.lines.length.toString() + '"'});
        var sftpConn = new hnoSFTP();
        try {
            sftpConn.uploadFile(ackFile);
            var ackFileInternalid = ackFile.save();
            log.debug('upload ack ' + options.type, ackFileInternalid);

            var logValues = {
                internalid: options.log_internalid,
                name: options.order_number
            }
            if (options.type == 'order') {
                logValues.custrecord_hno_import_log_order_ack_file = ackFileInternalid;
                logValues.custrecord_hno_import_log_order_ack_cont = ackFile.getContents();
            } else if (options.type == 'cancel') {
                logValues.custrecord_hno_import_log_cancel_ack_fil = ackFileInternalid;
                logValues.custrecord_hno_import_log_cancel_ack_con = ackFile.getContents();
                logValues.custrecord_hno_import_log_cancel_process = true;
            } else if (options.type == 'return') {
                logValues.custrecord_hno_import_log_return_ack_fil = ackFileInternalid;
                logValues.custrecord_hno_import_log_return_ack_con = ackFile.getContents();
                logValues.custrecord_hno_import_log_return_process = true;
            } else if (options.type == 'dispatch') {
                logValues.custrecord_hno_import_log_dispatch_file = ackFileInternalid;
                logValues.custrecord_hno_import_log_dispatch_conte = ackFile.getContents();
                logValues.custrecord_hno_import_log_fulfilled = true;
            }
            log.debug('update log with ack ' + options.type, ackFileInternalid);
            new hnoLog(logValues);
        } catch(err) {
            var errM = 'upload ' + ackFile.name + ' error ';
            log.error(errM, err);
            throw new Error(errM + err.message);
        }
    }

    function generateOrder(fileObj, logInternalid) {
        var orderValues = getOrderValues(fileObj);
        var orderType = fileObj.name.split('-')[0];
        log.debug('orderValues', orderValues);
        // init log - create log
        var logValues = {
            name: orderValues.order_level.order_number,
        };
        if (logInternalid) {
            logValues.internalid = logInternalid;
        }
        if (orderType == 'order') {
            logValues.custrecord_hno_import_log_file = fileObj.internalid;
            logValues.custrecord_hno_import_log_order_content = JSON.stringify(orderValues);
            logValues.file_name = fileObj.name;
        } else if (orderType == 'cancel') {
            logValues.custrecord_hno_import_log_cancel_file = fileObj.internalid;
            logValues.custrecord_hno_import_log_cancel_content = JSON.stringify(orderValues);
        } else if (orderType == 'return') {
            logValues.custrecord_hno_import_log_return_file = fileObj.internalid;
            logValues.custrecord_hno_import_log_return_content = JSON.stringify(orderValues);
        }
        var logObj = new hnoLog(logValues);

        return {
            order_type: orderType,
            order: orderValues,
            log_internalid: logObj.internalid,
            log_values: logObj
        }
    }

    function getOrderValues(fileObj) {
        var orderValues = {};
        var linesArr = [];
        var actualLineCount = 0;
        fileObj.lines.iterator().each(function(line) {
            // log.debug('line', line);
            linesArr.push(_.map(line.value.split('","'), function(str) {return _.trim(str, '"')}));
            actualLineCount++;
            return true;
        });
        // log.debug('linesArr', linesArr);
        if (!_.isEmpty(linesArr)) {
            var lineCount = _.parseInt(_.last(linesArr));
            var orderFieldValues = _.zipObject(linesArr[0], linesArr[1]);
            // log.debug('orderFieldValues',orderFieldValues);
            orderValues.order_level = orderFieldValues;
            var lineFieldValues = [];
            for(var i = 3; i < lineCount; i++) {
                lineFieldValues.push(_.zipObject(linesArr[2], linesArr[i]));
            }
            // log.debug('lineFieldValues', lineFieldValues);
            orderValues.line_level = lineFieldValues;

            if (actualLineCount-1 != lineCount) {
                var errMsg = 'Incorrect file format, please check it from sftp server ' + fileObj.name + ' ' + orderFieldValues.order_number
                lg.emailNotice({
                    recipients: emailReceipients,
                    subject: '[notification][HNOL Error] order file ' + fileObj.name + ' incorrect format', 
                    body: errMsg
                });
                log.error('incorrect order format', errMsg)
                // throw new Error(errMsg)
            }
        }
        
        return orderValues;
    }

    function nowString() {
        return moment(new Date()).tz('Australia/Melbourne').format('YYYYMMDDHHmmssSSSSSS');
    }
    function getDate(datetimeString) {
        var dateObj = format.parse({
            value: datetimeString,
            // type: format.Type.DATETIME,
            type: format.Type.DATE,
            timezone: format.Timezone.AUSTRALIA_SYDNEY
        });
        log.debug('dateObj', dateObj);
        return moment(dateObj).tz('Australia/Melbourne').format('YYYY-MM-DD');
    }

    function getRealItemFromTest(partNumber) {
        var itemSKU = partNumber;
        if (!_.isEmpty(itemMapping)) {
            var found = _.find(itemMapping, {test_name: itemSKU});
            if (found) {
                itemSKU = found.real_name;
            }
        }
        return itemSKU;
    }
    function getTestItemFromTest(sku) {
        var itemSKU = sku;
        if (!_.isEmpty(itemMapping)) {
            var found = _.find(itemMapping, {real_name: itemSKU});
            if (found) {
                itemSKU = found.test_name;
            }
        }
        return itemSKU;
    }

    function getExpectedDays(postcode, suburb) {
        if (postcode && suburb) {
            var daysJSON = JSON.parse(file.load({id: './hno_expected_delivery_date.json'}).getContents());
            var foundDays = _.find(daysJSON, function(days) {
                return days.postcode == _.parseInt(postcode, 10) && _.indexOf(days.suburbs, _.toUpper(suburb)) >= 0;
            });
            if (foundDays) {
                return foundDays.days + dayAllowance;
            } else {
                log.error('failed to getExpectedDays', 'cannt find working days ' + postcode + ' ' + suburb + ' return '+defaultDeliveryWorkDays+' days as default');
                lg.emailNotice({
                    recipients: emailReceipients,
                    subject: '[notification][HNOL Error] failed to getExpectedDays', 
                    body: 'cannt find working days ' + postcode + ' ' + suburb + ' return '+defaultDeliveryWorkDays+' days as default',
                });
                return defaultDeliveryWorkDays;
            }
        } else {
            return defaultDeliveryWorkDays;
        }
    }

    function getBusinessDayStr(startDate, days) {
        if (days) {
            var time = Math.floor(days / 5);
            days = time * 7 + (days % 5);
        } else {
            days = 2;
        }
        if (util.isString(startDate) && startDate) {
            startDate = moment(startDate, 'YYYY-MM-DD').tz('Australia/Melbourne');
        } else {
            startDate = moment(new Date()).tz('Australia/Melbourne');
        }
        log.debug('business day', startDate.format('YYYY-MM-DD') + ' + ' + days.toString());
        var nextBusinessDay = startDate.add(days, 'days');
        if (nextBusinessDay.isoWeekday() == 6) {
            nextBusinessDay = nextBusinessDay.add(2, 'days');
        } else if (nextBusinessDay.isoWeekday() == 7) {
            nextBusinessDay = nextBusinessDay.add(1, 'days');
        }

        return nextBusinessDay.format('YYYY-MM-DD');
    }
    function IFandBillingSearch(id){
        var title = 'IFandBillingSearch(::)';
        var found;
        try {
            var salesorderSearchObj = search.create({
                type: "salesorder",
                filters:
                [
                   ["type","anyof","SalesOrd"], 
                   "AND", 
                   ["applyingtransaction","anyof","@NONE@"], 
                   "AND", 
                   ["billingtransaction","anyof","@NONE@"], 
                   "AND", 
                   ["internalid","anyof",id]
                ],
                columns:
                [
                   search.createColumn({name: "tranid", label: "Document Number"}),
                   search.createColumn({name: "applyingtransaction", label: "Applying Transaction"}),
                   search.createColumn({name: "billingtransaction", label: "Billing Transaction"})
                ]
             });
             salesorderSearchObj.run().each(function(result){
                var applyingTran = result.getValue({name: 'applyingtransaction'});
                var billingTran = result.getValue({name: 'billingtransaction'});
                if(!isEmpty(applyingTran) && !isEmpty(billingTran)){
                    found = true;
                }else{
                    found = false;
                }
                return true;
             });
        } catch (e) {
         log.debug('Exception ' + title, e.message);
        }
        return found;
    }
    function isEmpty(stValue) {

        if ((stValue === '') || (stValue == null) || (stValue == undefined) || (stValue.length == 0)) {
          return true;
        }
        return false;
      }
    return {
        sftp: hnoSFTP,
        _: _,
        order: hnoOrder,
        cancel: hnoCancel,
        return_req: hnoReturnRequest,
        hno_log_record: hnoLogRecord,
        dispatch: hnoDispatch,
        inventory: hnoInventory,
        error: hnoError,
        generate_order: generateOrder,
    };

});