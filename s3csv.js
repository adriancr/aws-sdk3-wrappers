const AWS = require('aws-sdk');
const { S3Client, GetObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3");
const papaparse = require("papaparse");
require('./helpers')();


module.exports = class s3csv {
    
    constructor(bucket, region, defaultRowsPerPart) {
        this.bucket = bucket;
        this.region = region;
        this.defaultRowsPerPart = 2;
        
        this.s3 = new S3Client({ region: this.region });
    }
    
    
    
    async load(s3file) {
        //Setup S3 request data
        const options = {
            Bucket: this.bucket,
            Key: s3file
        };
            
        try {
            //Get command result object
            const filedata = await this.s3.send(new GetObjectCommand(options));
        
            // Setup promise to return
            return new Promise((resolve, reject) => {
                
                papaparse.parse(filedata.Body, {
                    header: true,
                    // step: function (row, stream) {
                    // },
                    complete: function (results) {
                        resolve(results.data);
                    },
                    // transformHeader: function (header) {
                    //     return header.replace(/[^0-9a-z]/gi, '');
                    // },
                    error: function (error) {
                        reject(error);
                    }
                    
                }); //papaparse.parse
                
            });//new Promise
                
        } catch (err) {
            console.log("Error", err);
        }
    }
    
    
    
    async create(s3filename, jsonRows) {
        const options = {
            Bucket: this.bucket,
            Key: s3filename,
            Body: papaparse.unparse(jsonRows)
        };
        
        try {
            const data = await this.s3.send(new PutObjectCommand(options));
            
            return true;
            
        } catch (err) {
            console.log("Error", err);
        }
    }
    
    
    
    async split(s3sourceFile, s3partsDir, rowsPerPart=this.defaultRowsPerPart) {
        //Setup S3 request data
        const options = {
            Bucket: this.bucket,
            Key: s3sourceFile
        };
        
        let rowCounter = 0, partsCreated = [];
        let rows = [];
        let self = this;
            
        //Get command result object
        const filedata = await this.s3.send(new GetObjectCommand(options));
    
        // Setup promise to return
        return new Promise((resolve, reject) => {
            
            papaparse.parse(filedata.Body, {
                header: true,
                step: async function (row, parser) {
                    try {
                        rowCounter++;
                        rows.push(row.data);
                        
                        if(rowCounter%rowsPerPart === 0) {
                            parser.pause();
                            console.log("New part needed after " + rowCounter + " rows.");
                            
                            let new_filename = await self.makeAndUploadPart(s3sourceFile, s3partsDir, partsCreated.length+1, rows);
                            partsCreated.push(new_filename);
                            
                            rowCounter = 0;
                            rows = [];
                            parser.resume();
                        }
                        
                        //Don't return row so we don't save it in memory (we already saved the row data)
                        // return row;
                        
                    } catch (err) {
                        console.log("Error", err);
                    }
                },
                complete: async function (results) {
                    let new_filename = await self.makeAndUploadPart(s3sourceFile, s3partsDir, partsCreated.length+1, rows);
                    partsCreated.push(new_filename);
                            
                    resolve({
                        parts: partsCreated
                    });
                },
                // transformHeader: function (header) {
                //     //remove non alphanumeric from headers
                //     return str_alphanumeric(header);
                // },
                error: function (error) {
                    reject(error);
                }
                
            }); //papaparse.parse
            
        });//new Promise
                
           
    }//split
    
    
    async makeAndUploadPart(s3sourceFile, s3partsDir, rowPageCounter, rows) {
        let fileName = filename(s3sourceFile);
        let newFilename = s3partsDir + '/' + fileName.replace('.csv', '_part' + rowPageCounter + '.csv');
        
        await this.create(newFilename, rows);
        return newFilename;
    }
    
    
}
