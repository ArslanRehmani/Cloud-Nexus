/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record','N/task','N/ui/serverWidget'],

		function(record,task,serverWidget) {

	/**
	 * Function definition to be triggered before record is loaded.
	 *
	 * @param {Object} scriptContext
	 * @param {Record} scriptContext.newRecord - New record
	 * @param {string} scriptContext.type - Trigger type
	 * @param {Form} scriptContext.form - Current form
	 * @Since 2015.2
	 */
	function beforeLoad(scriptContext) {

		var type=scriptContext.type

		log.debug('type',type)
		
		if(type=='edit'){

			var form=scriptContext.form;
			var itemTO=form.getSublist({id: 'item'}).getField({id: 'custcol_trigger_to'});
			log.debug('triggerTo',itemTO)
			/*itemTO.updateDisplayType({
			    displayType: serverWidget.FieldDisplayType.DISABLED
			});*/
		}

		if(type=='copy'){

			try{

				var rec=scriptContext.newRecord
				var lineCount=rec.getLineCount('item')
				for (var i=0;i< lineCount;i++){
					rec.setSublistValue({sublistId:'item',fieldId:"custcol_trigger_to",line:i,value:''});
					rec.setSublistValue({sublistId:'item',fieldId:"custcol_to_created",line:i,value:''});
					rec.setSublistValue({sublistId:'item',fieldId:"custcol_inv_loc1",line:i,value:''});
					rec.setSublistValue({sublistId:'item',fieldId:"custcol_inv_loc2",line:i,value:''});
					rec.setSublistValue({sublistId:'item',fieldId:"custcol_inv_loc3",line:i,value:''});
					rec.setSublistValue({sublistId:'item',fieldId:"custcol_location_1_tf_qty",line:i,value:''});
					rec.setSublistValue({sublistId:'item',fieldId:"custcol_location_2_tf_qty",line:i,value:''});
					rec.setSublistValue({sublistId:'item',fieldId:"custcol_location_3_tf_qty",line:i,value:''});				
					rec.setSublistValue({sublistId:'item',fieldId:"custcol_loc1_tf_notes",line:i,value:''});
					rec.setSublistValue({sublistId:'item',fieldId:"custcol_loc2_tf_notes",line:i,value:''});
					rec.setSublistValue({sublistId:'item',fieldId:"custcol_loc3_tf_notes",line:i,value:''});
					rec.setValue({fieldId:'custbody_related_transfer_order',value:''})
					rec.setValue({fieldId:'custbody_related_so_inv',value:''})


				}

			}catch(error){

				log.error('error',error)
			}
		}
	}

	/**
	 * Function definition to be triggered before record is loaded.
	 *
	 * @param {Object} scriptContext
	 * @param {Record} scriptContext.newRecord - New record
	 * @param {Record} scriptContext.oldRecord - Old record
	 * @param {string} scriptContext.type - Trigger type
	 * @Since 2015.2
	 */
	function beforeSubmit(scriptContext) {

		var rec=scriptContext.newRecord
		var oldRec=scriptContext.oldRecord
		var type=scriptContext.type
				
		var SoHold = rec.getValue({ fieldId: 'custbody_zg_hold_order' });

		log.debug('SoHold',SoHold)
		log.debug('type',type)
		
		if((type=='create'||type=='edit')&&!SoHold){

			try{


				var lineCount=rec.getLineCount('item')
				for (var i=0;i< lineCount;i++){

					var createTo=rec.getSublistValue({sublistId:'item',fieldId:"custcol_trigger_to",line:i});
					var toCreated=rec.getSublistValue({sublistId:'item',fieldId:"custcol_to_created",line:i});

					var loc3qty=rec.getSublistValue({sublistId:'item',fieldId:"custcol_location_3_tf_qty",line:i});
					var loc2qty=rec.getSublistValue({sublistId:'item',fieldId:"custcol_location_2_tf_qty",line:i});
					var loc1qty=rec.getSublistValue({sublistId:'item',fieldId:"custcol_location_1_tf_qty",line:i});

					if(!(loc3qty||loc1qty||loc2qty)){
						createTo=''
					}

					if(createTo&&!toCreated){
						rec.setSublistValue({sublistId:'item',fieldId:"custcol_to_created",line:i,value:'In Progress'});
					}
				}

			}catch(error){

			}
		}

	}

	/**
	 * Function definition to be triggered before record is loaded.
	 *
	 * @param {Object} scriptContext
	 * @param {Record} scriptContext.newRecord - New record
	 * @param {Record} scriptContext.oldRecord - Old record
	 * @param {string} scriptContext.type - Trigger type
	 * @Since 2015.2
	 */
	function afterSubmit(scriptContext) {

		var rec=scriptContext.newRecord
		var SoHold = rec.getValue({ fieldId: 'custbody_zg_hold_order' });


		var type=scriptContext.type
		try{
			log.debug('type',type)

		if((type=='create'||type=='edit')&&!SoHold){

				var lineCount=rec.getLineCount('item')

				var JsonArray={
					"subsidiary":rec.getValue('subsidiary'),
					"transferlocation":rec.getValue('location'),
					"soId":rec.id,
					"recType":rec.type
				}

				log.debug('rec.id',rec.id)
				var tempItemArray=[]


				for (var i=0;i< lineCount;i++){



					var item=rec.getSublistValue({sublistId:'item',fieldId:"item",line:i});




					var createTo=rec.getSublistValue({sublistId:'item',fieldId:"custcol_trigger_to",line:i});
					createTo=createTo=='1'?true:false;

					var toCreated=rec.getSublistValue({sublistId:'item',fieldId:"custcol_to_created",line:i});

					if(type=='edit'){

						var oldRec=scriptContext.oldRecord

						var toCreatedOld=oldRec.getSublistValue({sublistId:'item',fieldId:"custcol_to_created",line:i});
						log.debug('tos',toCreated+':'+toCreatedOld)
						toCreated=toCreatedOld
					}

					log.debug('to',createTo+':'+toCreated)

					if(type=='create'){
						toCreated=''
					}
					if(!createTo||toCreated){
						continue
					}
					log.debug('to1',createTo+' '+toCreated)

					var loc1=rec.getSublistValue({sublistId:'item',fieldId:"custcol_inv_loc1",line:i});
					var loc1qty=rec.getSublistValue({sublistId:'item',fieldId:"custcol_location_1_tf_qty",line:i});
					
					if(loc1&&loc1qty){
						var loc1Desc=rec.getSublistValue({sublistId:'item',fieldId:"custcol_loc1_tf_notes",line:i});

						tempItemArray.push({"item":item,"location":loc1,"quantity":loc1qty,"line":i,"loc1Desc":loc1Desc})
					}
					var loc2=rec.getSublistValue({sublistId:'item',fieldId:"custcol_inv_loc2",line:i});
					var loc2qty=rec.getSublistValue({sublistId:'item',fieldId:"custcol_location_2_tf_qty",line:i});

					if(loc2&&loc2qty){

						var loc2Desc=rec.getSublistValue({sublistId:'item',fieldId:"custcol_loc2_tf_notes",line:i});

						tempItemArray.push({"item":item,"location":loc2,"quantity":loc2qty,"line":i,"loc2Desc":loc2Desc})
					}

					var loc3=rec.getSublistValue({sublistId:'item',fieldId:"custcol_inv_loc3",line:i});
					var loc3qty=rec.getSublistValue({sublistId:'item',fieldId:"custcol_location_3_tf_qty",line:i});

					if(loc3&&loc3qty){

						var loc3Desc=rec.getSublistValue({sublistId:'item',fieldId:"custcol_loc3_tf_notes",line:i});

						tempItemArray.push({"item":item,"location":loc3,"quantity":loc3qty,"line":i,"loc3Desc":loc3Desc})
					}





					//rec.setSublistValue({sublistId:'item',fieldId:"custcol_trigger_to",line:i,value:''});

					//rec.setSublistValue({sublistId:'item',fieldId:"custcol_to_created",line:i,value:'In Progress'});

				}


				if(tempItemArray.length>0){

					JsonArray["lineLevel"]=tempItemArray

					var recd = record.create({
						type: 'customrecord_so_to',
						isDynamic: true
					});
					recd.setValue({
						fieldId: 'custrecord_so_to_json',
						value: JSON.stringify(JsonArray)
					});

					recd.setValue({
						fieldId: 'custrecord_so_to_salesorder',
						value: rec.id
					});

					var recordId = recd.save()

					log.debug('customrecord_so_to RecId',recordId);

					var mrTask = task.create({
						taskType: task.TaskType.MAP_REDUCE,
						scriptId: "customscript_abc_mr_so_to_to",
						deploymentId: "customdeploy2"
					});

					var mrTaskId = mrTask.submit();

				}

			}

		}catch(error){

			log.error('error',error)
		}

	}

	return {
		beforeLoad: beforeLoad,
		beforeSubmit: beforeSubmit,
		afterSubmit: afterSubmit
	};

});
