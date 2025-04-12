/**
 * @NApiVersion 2.0
 * @NModuleScope SameAccount
 * @NAmdConfig ./amdConfig.json
 */

define(['N/currentRecord', 'N/ui/dialog', 'N/url', 'N/search', 'N/error', './Entity', 'blockUI'],

	/**
	 * @param {record} nsCurrentRecord
	 * @param {dialog} nsDialog
	 * @param {url} nsUrl
	 * @param {search} nsSearch
	 * @param {error} nsError
	 * @param entity
	 * @param blockUI
	 */
	function(nsCurrentRecord, nsDialog, nsUrl, nsSearch, nsError, entity, blockUI) {
		var _LOG_MODULE_NAME = '/avt-cubiic-integration-bundle/SendDataToCubiicCS.';

		function onBtnSendToCubiic() {
			var logFunctionName = _LOG_MODULE_NAME + 'onBtnSendToCubiic';
			console.log(logFunctionName+ ' - START');

			var currentRecord = null;
			var recordType = null;
			var processStatus = null;
			try{
				currentRecord = nsCurrentRecord.get();
				recordType = currentRecord.type.toLowerCase();
				if(currentRecord && recordType){
					var lookupResult = nsSearch.lookupFields({type: recordType, id: currentRecord.id, columns: [entity.FIELDS.TRANS_BODY_IMPORT_STATUS]});
					console.log('lookupResult=' +JSON.stringify(lookupResult));
					if(lookupResult && lookupResult.hasOwnProperty(entity.FIELDS.TRANS_BODY_IMPORT_STATUS) && lookupResult[entity.FIELDS.TRANS_BODY_IMPORT_STATUS].length > 0){
						processStatus = lookupResult[entity.FIELDS.TRANS_BODY_IMPORT_STATUS][0].value;
					}
				}
			} catch (e) {
				console.error(logFunctionName+ ' - ' +e);
			}
			console.log('recordType=' +recordType+ ' processStatus=' +processStatus);

			if(processStatus == entity.LISTS.STATUS.OPTIONS.SUCCESS){

				var options = {
					title: "Duplicated process",
					message: "This Item Fulfillment data has already sent to Cubiic. Press OK to re-send data to Cubiic"
				};

				nsDialog.confirm(options).then(_success).catch(_failure);

			}else{
				_sendDataToCubiic();
			}
		}

		function _success(result) {
			var logFunctionName = _LOG_MODULE_NAME + '_success';
			console.log(logFunctionName+ ' - START');
			console.log("result = " + result);

			if(result){
				_sendDataToCubiic();
			}
		}

		function _failure(reason) {
			console.log("Failure: " + reason);
			return false;
		}

		function _sendDataToCubiic() {
			var logFunctionName = _LOG_MODULE_NAME + '_sendDataToCubiic';
			console.log(logFunctionName+ ' - START');

			var currentRecord = null;
			var recordType = null;
			try{
				currentRecord = nsCurrentRecord.get();
				recordType = currentRecord.type.toLowerCase();
			} catch (e) {
				console.error(logFunctionName+ ' - ' +e);
			}
			console.log('recordType=' +recordType);

			try{
				var scriptUrl = null;

				switch(recordType){
					case 'itemfulfillment' :

						scriptUrl = nsUrl.resolveScript({
							scriptId: entity.SCRIPTS.SENDER_IF.ID,
							deploymentId: entity.SCRIPTS.SENDER_IF.DEPLOYMENT_ID
						});
						if(scriptUrl !== '') {
							scriptUrl += '&' +entity.SCRIPTS.SENDER_IF.URL_PARAMS.IF_ID+ '=' +currentRecord.id;
						}

						break;

					default:
						break;
				}
				console.log('scriptUrl = ' +scriptUrl);

				if(scriptUrl !== ''){

					var sendData = {};  //set data if it's needed

					_blockUI();

					$.ajax({
						url: scriptUrl,
						method: 'POST',
						data: JSON.stringify(sendData),
						dataType: 'json'
					}).done(function(data, textStatus) {
						if (data !== null && data !== '') {
							console.log('returned data = ' +JSON.stringify(data));

							if (data.succeed) {
								console.log('Succeed process.');
								location.reload();
							} else {
								console.error('Failed to process. ' +data.errorMessage);
								alert('Failed to process. ' +data.errorMessage);
							}
							_unblockUI();
						} else {
							_unblockUI();
							console.error('Failed to post data. Returned data is empty. ' +textStatus);
							alert('Failed to post data. Returned data is empty. ' +textStatus);
						}
					}).fail(function(xhr, textStatus, errorThrown) {
						_unblockUI();
						console.error('Failed to post data. ' +textStatus);
						alert('Failed to post data. ' +textStatus);
					});
				}
			} catch (e) {
				console.error(logFunctionName+ ' - ' +e);
			}
		}

		function _blockUI(){
			var logFunctionName = _LOG_MODULE_NAME + '_blockUI';

			$.blockUI({ css: {
				border: 'none',
				padding: '15px',
				backgroundColor: '#000',
				'-webkit-border-radius': '10px',
				'-moz-border-radius': '10px',
				opacity: .5,
				color: '#fff'
			} });
		}


		function _unblockUI(){
			var logFunctionName = _LOG_MODULE_NAME + '_unblockUI';

			$.unblockUI();
		}


		//Entry points
		return {
			onBtnSendToCubiic: onBtnSendToCubiic
		};
	}
);
