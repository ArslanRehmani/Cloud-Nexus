define(['N/record','N/search','N/log','N/error'], function (record,search,log,error) {
    // var NAScriptedCSVImportJQ;
    return {
        // NAScriptedCSVImportJQ = (function () {
            // return {
                Internalid: 'customrecord_scsvijq',
                Fields: {
                    RecordType: {id: 'custrecord_jqrecordtype', source: 'recordtype', setDynamic: true},//Record Type
                    File: {id: 'custrecord_jqfile', source: 'file', setDynamic: true},//File
                    ProcessStatus: {id: 'custrecord_jqprocessstatus', source: 'processstatus', setDynamic: true},//Process Status
                    ProcessNote: {id: 'custrecord_jqprocessnote', source: 'processnote', setDynamic: false},  //Process Note
                    ProcessLogFile: {id: 'custrecord_plogfile', source: 'processlogfile', setDynamic: true},  //Process Log File
                    Requester: {id: 'custrecord_qrequester', source: 'requester', setDynamic: true}   //Requester
                },
                //Get list of Package Contents  for a ItemFulfillment
                getList: function (processStatus, userId, sortByDateCreated) {
                    var recs = null;
                    var filters = [];
                    var cols = [];
                    var result = [];
                    if (!!processStatus) {
                        search.createFilter({
                            name: this.Fields.ProcessStatus.id,
                            operator: search.Operator.IS,
                            values: processStatus
                        });
                    }
        
                    if (!!userId) {
                        search.createFilter({
                            name: this.Fields.Requester.id,
                            operator: search.Operator.IS,
                            values: userId
                        });
                    }
        
                    cols.push(search.createColumn({name: this.Fields.RecordType.id}));
                    cols.push(search.createColumn({name: this.Fields.File.id}));
                    cols.push(search.createColumn({name: this.Fields.ProcessStatus.id}));
                    cols.push(search.createColumn({name: this.Fields.ProcessNote.id}));
                    cols.push(search.createColumn({name: this.Fields.ProcessLogFile.id}));
                    cols.push(search.createColumn({name: 'created'}));
                    if (sortByDateCreated) {
                        cols[cols.length - 1].setSort(true);
                    }
        
                    recs = search.create({
                        type: this.Internalid,
                        columns: [
                            cols
                        ],
                        filters: [
                            filters
                        ]
                    });
        
                    if (!!recs && recs.length > 0) {
                        for (var i = 0; i < recs.length; i++) {
                            result.push({
                                id: recs[i].getId(),
                                recordtype: recs[i].getValue(this.Fields.RecordType.id),
                                file: recs[i].getValue(this.Fields.File.id),
                                processlogfile: recs[i].getValue(this.Fields.ProcessLogFile.id),
                                processstatus: recs[i].getValue(this.Fields.ProcessStatus.id),
                                processnote: recs[i].getValue(this.Fields.ProcessNote.id),
                                created: recs[i].getValue('created')
        
                            });
                        }
                    }
        
                    return result;
                },
        
                //Upsert function to create/update records
                upsert: function (dataObject) {
                    var nsObject, id, processNote;
        
                    if (!!dataObject) {
                        if (!!dataObject.id) {
                            nsObject = record.load({
                                type: this.Internalid,
                                id: dataObject.id,
                                isDynamic: true
                               });
                        } else {
                            nsObject = record.create({
                                type: this.Internalid,
                                isDynamic: true
                            });
                            log.debug({
                                title: 'test',
                                details: 'test'
                            });
                        }
        
                        for (var f in this.Fields) {
                            if (!!this.Fields[f].source && this.Fields[f].setDynamic) {
        
                                log.debug({
                                    title: this.Fields[f].id + '  ' + this.Fields[f].source,
                                    details: dataObject[this.Fields[f].source]
                                });
        
                                if (!!dataObject[this.Fields[f].source]) {
                                    nsObject.setValue({field: this.Fields[f].id, value:dataObject[this.Fields[f].source]});
                                }
                            }
                        }
                        processNote = nsObject.getValue({ field: this.Fields.ProcessNote.id});
                        nsObject.setValue({field:this.Fields.ProcessNote.id, value:
                            dataObject['processnote'] + (!!processNote ? '\n' + processNote : '')});
        
        
                        id = nsObject.save({
                            enableSourcing: true,
                            ignoreMandatoryFields: true
                        });
        
                    } else {
                        // throw new nlapiCreateError('INVALID_DATA', 'Invalid Data Object to Create/Update record ' + this.Internalid);
                        throw error.create({
                            name: 'INVALID_DATA',
                            message: 'Invalid Data Object to Create/Update record ' + this.Internalid,
                            notifyOff: false
                        });
                    }
                    return id;
                }
            // };
        // })()

    };
});