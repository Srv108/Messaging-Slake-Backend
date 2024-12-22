import multer from "multer";
import multerS3 from 'multer-s3';

import { s3 } from './awsConfig.js';
import { AWS_BUCKET_NAME } from "./serverConfig.js";

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export const uploader = multer({
    storage: multerS3({
        s3: s3,
        bucket: AWS_BUCKET_NAME,
        key: function (req,file,cb){
            if(!file){
                console.log(file);
                return cb(new Error('File not found! '));
            }
            if(!ACCEPTED_IMAGE_TYPES.includes(file.mimetype)){
                return cb(new Error("File type not Supported! "));
            }
            const suffix = Date.now() + " " + Math.round(Math.random()*1e9);

            cb(null,file.fieldname + "-" + suffix+ "." + file.mimetype.split('/')[1]);
        },
    })
});

export const deleter = async (fileKey) => {
    const params = {
        Bucket: AWS_BUCKET_NAME,
        Key: fileKey 
    };

    try {
        await s3.deleteObject(params).promise();
        console.log('File deleted successfully:');
    } catch (error) {
        console.error('Error deleting file:', error);
        throw new Error('Error deleting file from S3'); 
    }
}           