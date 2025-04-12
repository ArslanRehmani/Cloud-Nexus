/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define(['N/runtime','N/search','N/record'],

		function(runtime,search,record) {

	/**
	 * Marks the beginning of the Map/Reduce process and generates input data.
	 *
	 * @typedef {Object} ObjectRef
	 * @property {number} id - Internal ID of the record instance
	 * @property {string} type - Record type id
	 *
	 * @return {Array|Object|Search|RecordRef} inputSummary
	 * @since 2015.1
	 */
	function getInputData() {


		var scriptObj = runtime.getCurrentScript();
		var searchId="customsearchso_to_to";
		var deployment=scriptObj.deploymentId;


		if(searchId){

			var salesorderSearchObj = search.load({
				id:searchId
			});

		}else{
			var salesorderSearchObj=[]

			log.error('missing deployment')
		}
		return salesorderSearchObj

	}

	/**
	 * Executes when the map entry point is triggered and applies to each key/value pair.
	 *
	 * @param {MapSummary} context - Data collection containing the key/value pairs to process through the map stage
	 * @since 2015.1
	 */
	function map(context) {

		try{
			//log.debug('value',context.value)
			var value=JSON.parse(context.value);
			var values=value.values
			var soDetails=values['custrecord_so_to_salesorder']
			var values=JSON.parse(values['custrecord_so_to_json'])
			log.debug('value',value)
			log.debug('value',value.id+' '+value.recordType)

			log.debug('values',values)

			var uniqueLoc={}
			var array=values.lineLevel
			for(var i in array) {
				uniqueLoc[array[i].location.split(":")[0]] = null;
			}
			var array=[]
			var errorMsg=''
				var lineObj={}
			var uniqueLoc=Object.keys(uniqueLoc)
			log.debug('uniqueLoc',uniqueLoc)

			var recIdArray=[] 
			for(var i =0;i<uniqueLoc.length;i++){

				try{
					var lineLevel=values['lineLevel'].filter(function(value) {return value.location.split(":")[0]==uniqueLoc[i]})
					log.debug('lineLevel',lineLevel)

					var tempLineArray=[]
					var rec = record.create({
						type: 'transferorder',
						isDynamic: false
					});
					log.debug("item")

					rec.setValue({
						fieldId: 'subsidiary',
						value: values.subsidiary
					});

					rec.setValue({
						fieldId: 'orderstatus',
						value: 'B'
					});
					rec.setValue({
						fieldId: 'incoterm',
						value: 2
					});
					rec.setValue({
						fieldId: 'transferlocation',
						value: values.transferlocation
					});
					rec.setValue({
						fieldId: 'location',
						value: uniqueLoc[i].split("-")[0]
					});
					rec.setValue({
						fieldId: 'custbody_amcan_sales_order',
						value: values.soId
					});

					for(var j =0;j<lineLevel.length;j++){


						rec.setSublistValue({sublistId:'item',fieldId:'item',value:lineLevel[j].item,line:j})
						rec.setSublistValue({sublistId:'item',fieldId:'quantity',value:lineLevel[j].quantity,line:j})
						var loc1Desc=lineLevel[j].loc1Desc||''
						var loc2Desc=lineLevel[j].loc2Desc||''
						var loc3Desc=lineLevel[j].loc3Desc||''

						rec.setSublistValue({sublistId:'item',fieldId:'custcol_loc1_tf_notes',value:loc1Desc,line:j});
						rec.setSublistValue({sublistId:'item',fieldId:'custcol_loc2_tf_notes',value:loc2Desc,line:j});
						rec.setSublistValue({sublistId:'item',fieldId:'custcol_loc3_tf_notes',value:loc3Desc,line:j});


						tempLineArray.push(lineLevel[j].line)

					}

					var recId=rec.save({
						enableSourcing: true,
						ignoreMandatoryFields: true
					});
					log.debug({
						title: 'Transfer Order Id',
						details: recId
					});
					var tranNo=search.lookupFields({
						type: search.Type.TRANSFER_ORDER,
						id: recId,
						columns: ['tranid']
					})['tranid'];

					for(var k in tempLineArray){

						if(lineObj[tempLineArray[k]]){
							lineObj[tempLineArray[k]].push(tranNo)
							//lineObj[tempLineArray[k]].push('<a class="dottedlink" href="/app/accounting/transactions/transaction.nl?id='+recId+'">'+tranNo+'</a>')

						}else{
							lineObj[tempLineArray[k]]=[tranNo]
							//lineObj[tempLineArray[k]]=['<a class="dottedlink" href="/app/accounting/transactions/transaction.nl?id='+recId+'">'+tranNo+'</a>']

						}		
					}
					recIdArray.push(recId)
					log.debug("recId",recId)
				}catch(error){
					log.error('error',error)
					errorMsg=error
				}
			}

			log.debug('lineObj',lineObj)

			log.debug('recIdArray',recIdArray)

			/*
		var temp=record.submitFields({

			type: record.Type.SALES_ORDER,
			id:values.soId ,
			values: {
				'custbody_related_transfer_order': recIdArray


			}})*/


			var tempRec=record.load({
				type: values.recType,
				id:values.soId ,
				isDynamic: false
			})

			//tempRec.getValue({fieldId:"custbody_related_transfer_order"})

			tempRec.setValue({fieldId:"custbody_related_transfer_order",value:recIdArray.concat(tempRec.getValue({fieldId:"custbody_related_transfer_order"}))})

			for (var i in lineObj ){

				tempRec.setSublistValue({sublistId:'item',fieldId:'custcol_to_created',value:lineObj[i].join(','),line:i})
				//tempRec.setSublistValue({sublistId:'item',fieldId:'custcol_to_created',value:'<a>href=""a</a>',line:i})

			}

			tempRec.save({
				enableSourcing: true,
				ignoreMandatoryFields: true
			})



			log.debug('SoUpdated',recIdArray)


			if(!errorMsg){
				var customRec = record.delete({
					type: value.recordType,
					id: value.id,
				});
				log.debug('customRecDeleted',value.id+' '+value.recordType)

			}else{
				var temp=record.submitFields({

					type: value.recordType,
					id:value.id ,
					values: {
						'custrecord_so_to_error': errorMsg


					}})


			}
		}catch(error){

			log.error('error',error)

			var temp=record.submitFields({

				type: value.recordType,
				id:value.id ,
				values: {
					'custrecord_so_to_error': error


				}})
		}
	}
	/**
	 * Executes when the reduce entry point is triggered and applies to each group.
	 *
	 * @param {ReduceSummary} context - Data collection containing the groups to process through the reduce stage
	 * @since 2015.1
	 */

	function reduce(context) {

	}


	/**
	 * Executes when the summarize entry point is triggered and applies to the result set.
	 *
	 * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
	 * @since 2015.1
	 */
	function summarize(summary) {
		log.debug('summarize',JSON.stringify(summary))
		log.debug('Input Summary: ', JSON.stringify(summary.inputSummary));
		log.debug('Map Summary: ', JSON.stringify(summary.mapSummary));
		log.debug('Reduce Summary: ', JSON.stringify(summary.reduceSummary));
		var mapKeys = 0;
		var reduceKeysSuccess=0;
		var reduceKeysFailed=0;
		var reduceKeysPending=0;
		var reduceTotalKeys=0;

		var reduceKey=[];
		summary.mapSummary.keys.iterator().each(function (key, executionCount, completionState){
			if(completionState=='COMPLETE'){
				//a={};
				//a[key]={state:completionState,execution:executionCount}
				mapKeys++;	
			}

			return true;
		});

		log.debug({
			title: 'Map stage keys',
			details: mapKeys
		});

		summary.reduceSummary.keys.iterator().each(function (key, executionCount, completionState){
			reduceTotalKeys++;
			if(completionState=='COMPLETE'){

				reduceKeysSuccess++;	

			}else if(completionState=='FAILED'){

				reduceKeysFailed++
				a={};
				a[key]={state:completionState,execution:executionCount}
				//reduceKey.push(a)
			}else {
				reduceKeysPending++;
			}

			return true;
		});

		log.debug({
			title: 'reduce stage keys',
			details: 'Total'+reduceTotalKeys+' Completed:'+reduceKeysSuccess+' Failed:'+reduceKeysFailed+' Pending:'+reduceKeysPending
		});



	}

	return {
		getInputData: getInputData,
		map: map,
		reduce: reduce,
		summarize: summarize
	};

});
