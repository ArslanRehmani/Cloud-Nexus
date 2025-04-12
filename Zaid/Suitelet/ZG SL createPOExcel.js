/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define([ 'N/file', 'N/record', 'N/search', 'N/url','N/encode'],
		/**
		 * @param {config} config
		 * @param {file} file
		 * @param {record} record
		 * @param {search} search
		 * @param {url} url
		 */
function( file, record, search, url,encode) {
	/**
	 * Definition of the Suitelet script trigger point.
	 *
	 * @param {Object} context
	 * @param {ServerRequest} context.request - Encapsulation of the incoming request
	 * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
	 * @Since 2015.2
	 */
	function onRequest(context) {

		if (context.request.method === 'GET') {

			var param=context.request.parameters;

			var id= param.id;
			var type=param.type;
			var searchId='customsearch_zg_po_excel';

			log.debug({
				title:'debug entry',
				details:id 

			});

			var filter = search.createFilter({
				name: 'internalid',
				operator: search.Operator.IS,
				values:id
			});

			var filters=[filter];
			var searchResult=largeSavedSearch(searchId,filters,search);
			log.debug({title:'searchREsult',details:searchResult.length});

			if(searchResult.length>0){
				POTranid=searchResult[0].getValue({
					name: 'tranid'
				});

				var fileID=createExcel (POTranid,searchResult);
				attachFile(id,fileID);
			}
			context.response.write('success') ;
		}
	}


	function attachFile(id,fileID){
		var rec​ord​Id = rec​ord​.at​tac​h({
			rec​ord​: {
				typ​e: 'file',
				id:fileID
			},
			to: {
				typ​e: 'purchaseorder',
				id:id
			}
		});
	} 

	function createExcel (POTranid,searchResult){


		var fileObj = file.create({
			name: POTranid,
			fileType: file.Type.EXCEL,
			contents: generateExcel(searchResult)
		});
		fileObj.folder = 60717;
		var id = fileObj.save();
		
            log.debug({title:'File Generated',details:id});
		return id;
	}


	function largeSavedSearch(id,filter,search){

		var search = search.load({
			id: id
		})
        if(filter.length>0){
        	
        	search.filters=search.filters.concat(filter)	
        }
		

		var start=0;
		var end=1000
		var searchResult=[]
		do{
			var searchResultSet=search.run().getRange({
				start:start,
				end:end});

			start=end;
			end+=1000;
			searchResult=searchResult.concat(searchResultSet);
			log.debug({title:'searchResult',details:start+' start '+end+' end '+searchResult.length})
		}while(searchResultSet.length==1000)

			return searchResult

	}


	function generateExcel(searchResult){

		var xmlString = '<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>'; 
		xmlString += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" ';
		xmlString += 'xmlns:o="urn:schemas-microsoft-com:office:office" ';
		xmlString += 'xmlns:x="urn:schemas-microsoft-com:office:excel" ';
		xmlString += 'xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" ';
		xmlString += 'xmlns:html="http://www.w3.org/TR/REC-html40">'; 

		xmlString += '<Worksheet ss:Name="Sheet1">';
		xmlString += '<Table>' ;

		var searchLength=searchResult.length;
		for(var i=0;i<searchLength;i++){

			if(i==0){
				var searchColumns=searchResult[i].columns;//Search.columns
				xmlString +=     '<Row>' ;
				for(var j in searchColumns){
					xmlString += '<Cell><Data ss:Type="String">'+searchColumns[j].label+'</Data></Cell>';//Column.label
				};

				xmlString +=     '</Row>' ;
			}

			xmlString +=     '<Row>' ;
			for(var j in searchColumns){
				var text=searchResult[i].getText(searchColumns[j]);
				var value=searchResult[i].getValue(searchColumns[j]);
				if(searchColumns[j].label=='Options'){
				log.debug({'title':' text value',details:text+' -> '+value})
				}
				if(!text||text=='null')
					text=value;
				xmlString += '<Cell><Data ss:Type="String">'+text+'</Data></Cell>';

			}
			xmlString +=     '</Row>' ;


		}

		xmlString += '</Table></Worksheet></Workbook>';

		
		var xmlString = encode.convert({
             string: xmlString,
             inputEncoding: encode.Encoding.UTF_8,
             outputEncoding: encode.Encoding.BASE_64
         });

		return xmlString
	}


	return {
		onRequest: onRequest
	};

});
