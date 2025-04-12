define(['N/https'], function(https) {
    return{
        getRespose: function(link, headers){
            var response = https.get({
                url: link,
                headers: headers
            });
            return response || {};
        },
        test: function(){

        }

    };
});