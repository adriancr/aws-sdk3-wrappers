module.exports = function() { 
    this.trim_slashes = function(str) { 
        return str.replace(/^\/|\/$/g, '');
    };
    
    
    this.today_date = function(days_diff=0, use_server_tz=true) {
        let today_date = this.now_datetime(days_diff, use_server_tz);
        return today_date.substring(0, today_date.indexOf('T'));
    }
    
    
    this.now_datetime = function(days_diff=0, use_server_tz=true) {
        // Date object with timeZone offset calculated, if any specified
        let options = use_server_tz ? {timeZone: process.env.SERVER_TZ } : null;
        let init_date = new Date().toLocaleString("en-US", options);
        
        // New Date object based on string above, which includes timeZone offset
        let date = new Date(init_date);

        // Nice little convenient day diff feature
        if(days_diff) {
            date.setDate(date.getDate() + days_diff);
        }
        
        // console.log(date.toISOString());
        return date.toISOString();
    }
    
    
    this.filename = function(filename) {
        if(!filename || filename === undefined) {
            return '';
        }
        
        let filename_parts = filename.split('/');
        return filename_parts[filename_parts.length -1];
    }
    
    
    this.str_alphanumeric = function(str) {
        return str.replace(/[^0-9a-z]/gi, '');
    }
    
    
    this.str_snake_case = function(str) {
        return str
            .toLowerCase() //All lower
            .repalce(/  +/g, ' ')// Change multiple whitespace for single whitespace
            .repalce(' ', '_')// Change whitespace for underscore
            .replace(/[^0-9a-z _]/gi, '') // Only alphanumeric and underscores allowed
    }
    
}

