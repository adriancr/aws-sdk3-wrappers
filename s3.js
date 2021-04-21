const AWS = require('aws-sdk');
const { S3Client, ListObjectsCommand, GetObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3");

module.exports = class aws_s3 {
    
    constructor(bucket, region=process.env.AWS_REGION) {
        this.region = region;
        this.bucket = bucket;
        
        this.s3 = new S3Client({ region: this.region });
    }
    
    
    async list(dir=null) {
        let options = this.initOptions()
        
        if(dir) {
            dir = dir.replace(/^\/|\/$/g, '');
            options.Marker = dir;
        }
        
        try {
            const data = await this.s3.send(new ListObjectsCommand(options));
            let result = [];
            
            for(let i in data.Contents) {
                let filename = data.Contents[i].Key.replace(dir + '/', '');
                
                if(filename) {
                    result.push(filename);
                }
            }
            
            return result;
            
        } catch (err) {
            console.log("CALLERR aws_s3.list(): ", err);
        }
    }
    
    
    async getFile(file) {
        let options = this.initOptions();
        options.Key = file;
        
        try {
            const data = await this.s3.send(new GetObjectCommand(options));
            
            let contents = '';
            for await (const chunk of data.Body) {
                contents += chunk;
            }
            
            return contents;
            
        } catch (err) {
            console.log("Error", err);
        }
    }
    
    
    async putFile(filename, file_contents) {
        let options = this.initOptions();
        options.Key = filename;
        options.Body = file_contents;
        
        try {
            const data = await this.s3.send(new PutObjectCommand(options));
            
            return true;
            
        } catch (err) {
            console.log("Error", err);
        }
    }
    
    initOptions() {
        return {Bucket: this.bucket};
    }
    
}
