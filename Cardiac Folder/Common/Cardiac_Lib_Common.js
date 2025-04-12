// eslint-disable-next-line no-undef
define(['N/log', 'N/file', 'N/runtime', '../dao/AB_CLS_SFTPConfiguration.js'], function (log, file, runtime, CLS_Config) {
    return {




        /**
         * @param  {} searchResult
         * @param  {} {return allresult of search in an array form }
         */
        searchAll: function searchAll(searchResult) {
            var title = 'searchAll()::';
            try {


                var allResults = [];
                var startIndex = 0;
                var RANGECOUNT = 1000;
                do {
                    var resultset = searchResult.run();
                    var pagedResults = resultset.getRange({
                        start: parseInt(startIndex),
                        end: parseInt(startIndex + RANGECOUNT)
                    });

                    allResults = allResults.concat(pagedResults);

                    var pagedResultsCount = pagedResults != null ? pagedResults.length : 0;
                    startIndex += pagedResultsCount;

                }
                while (pagedResultsCount == RANGECOUNT);
            } catch (error) {
                log.error(title + error.name, error.message);
            }
            return allResults;
        },

        /**
         * @param  {} fileId
         * @param  {} {vartitle='getCSVLines(
         */
        getCSVLines: function getCSVLines(fileId) {
            var title = 'getCSVLines()::';
            try {
                var csvFile = file.load({
                    id: fileId
                });
                var contents = csvFile.getContents();
                var jsonArr = this.ConvertCSVtoJSON(contents);
            } catch (error) {
                log.error(title + error.name, error.message);
            }
            return jsonArr || [];
        },

        /**
         * @param  {} csv
         * @param  {} {vartitle='csvJSON(
         * Details : Convert CSV content into JSON
         */
        ConvertCSVtoJSON: function ConvertCSVtoJSON(csv) {
            var title = 'csvJSON()::';
            try {

                var lines = csv.split("\r");
                log.debug(title + 'Lines', lines.length);
                var result = [];

                // NOTE: If your columns contain commas in their values, you'll need
                // to deal with those before doing the next step
                // (you might convert them to &&& or something, then covert them back later)
                // jsfiddle showing the issue https://jsfiddle.net/
                var headers = lines[0].split(",");

                for (var i = 1; i < lines.length; i++) {

                    var obj = {};
                    var currentline = lines[i].replace('\n', '').split(",");

                    for (var j = 0; j < headers.length; j++) {
                        if (headers[j] && currentline[j]) {
                            headers[j] = headers[j].trim().toString();
                            obj[headers[j]] = currentline[j];
                        }
                    }
                    if (Object.keys(obj).length) {

                        result.push(obj);
                    }

                }

                //return result; //JavaScript object
            } catch (error) {
                log.error(title + error.name, error.message);
            }
            return result || []; //JSON
        }
    };
});