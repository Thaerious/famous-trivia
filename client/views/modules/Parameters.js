"use strict";
const AbstractFiles = require("./Authenticate.js");

class Parameters extends AbstractFiles{
    constructor() {
        super();
        this.param = {
            last_file : ""
        }
    }

    async create(dirToken){
        return new Promise((resolve, reject)=> {
            gapi.client.drive.files.create({
                name : Parameters.filename,
                parents: ['appDataFolder'],
                fields: "id"
            }).then(res=>{
                console.log(res);
                this.fileId = res.result.id;
                resolve(JSON.parse(res.body));
            }, function (error) {
                reject(error.message);
            });
        });
    }

    async read(){
        return new Promise((resolve, reject)=> {
            gapi.client.drive.files.get({
                fileId: this.fileId,
                alt: 'media'
            }).then(res=>{
                this.param = JSON.parse(res.body);
                resolve(res);
            }, function (error) {
                console.log(error);
                reject(error.message);
            });
        });
    }

    async write(){
        return new Promise((resolve, reject)=> {
            gapi.client.request({
                path : "upload/drive/v3/files/" + this.fileId,
                method : "PATCH",
                params : {
                    uploadType : "media"
                },
                headers : {
                    "Content-Type" : "application/json"
                },
                body : JSON.stringify(this.param)
            }).then(res=>{
                resolve(JSON.parse(res.body));
            }, function (error) {
                console.log(error);
                reject(error.message);
            });
        });
    }

    async exists(){
        return new Promise((resolve, reject)=> {
            gapi.client.drive.files.list({
                q: "name = 'settings.json'",
                spaces: 'appDataFolder'
            }).then(res=>{
                if (res.result.files.length > 0){
                    this.fileId = res.result.files[0].id;
                    resolve(true);
                }
                resolve(false);
            }, function (error) {
                reject(error.message);
            });
        });
    }
}

Parameters.filename = "settings.json";
export default Parameters;