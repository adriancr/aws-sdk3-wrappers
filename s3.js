const AWS = require('aws-sdk');
const { S3Client, ListObjectsCommand, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");

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
            options.Prefix = dir;
        }
        
        try {
            const data = await this.s3.send(new ListObjectsCommand(options));
            let result = [];
            
            for(let i in data.Contents) {
                let fileName = filename(data.Contents[i].Key);
                
                if(fileName) {
                    result.push(fileName);
                }
            }
            
            return result;
            
        } catch (err) {
            console.log("CALLERR aws_s3.list(): ", err);
        }
    }
    
    
    //Absolute path with filename for both params
    async moveFile(file, newFile) {
        let fileContents = await this.getFile(file);
        
        await this.putFile(newFile, fileContents);
        
        await this.deleteFile(file);
    }
    
    
    
    async deleteFile(file) {
        let options = this.initOptions()
        options.Key = file;
        
        try {
            return await this.s3.send(new DeleteObjectCommand(options));            
        } catch (err) {
            console.log("Error", err);
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
    
    
    async putFile(filename, fileContents) {
        let options = this.initOptions();
        options.Key = filename;
        options.Body = fileContents;
        
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
