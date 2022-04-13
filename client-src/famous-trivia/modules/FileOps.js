"use strict";
// see https://developers.google.com/drive/api/v3/quickstart/js?hl=en
// <script type="text/javascript" src="https://apis.google.com/js/api.js" async defer></script>

class FileOps {
    async load(){
        await this.loadGAPI();
        await this.loadClient();
        await this.loadDrive();
    }

    loadGAPI(){
        return new Promise((resolve, reject) => {
            gapi.load("client", () => resolve());
        });
    }

    // initGAPI(){
    //     // return gapi.client.init({
    //     //     apiKey: "AIzaSyABcdLmT6HH_7Go82q_IBGI3jm6UL4w4Q0",
    //     //     clientId: "158823134681-1ohik01n1e6v41ntngg9mg3vmluo7v8j.apps.googleusercontent.com",
    //     //     scope: "https://www.googleapis.com/auth/drive.file",
    //     //     discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
    //     // });
    // }

    loadClient() {
        return new Promise((resolve, reject) => {
            gapi.load('client', () => resolve());
        });
    }

    loadDrive() {
        return new Promise((resolve, reject) => {
            gapi.client.load('drive', 'v3', () => resolve());
        });
    }

    async create(filename = "Game Name.json"){
        return new Promise((resolve, reject)=> {
            gapi.client.drive.files.create({
                name : filename,
                parents: ['appDataFolder'],
                fields: "id"
            }).then(res=>{
                resolve(res.result.id);
            }, function (error) {
                reject(error);
            });
        });
    }

    async delete(fileId){
        return new Promise((resolve, reject)=> {
            gapi.client.drive.files.delete({
                fileId : fileId
            }).then(res=>{
                resolve(res.result);
            }, function (error) {
                reject(error);
            });
        });
    }

    async list(){
        return new Promise((resolve, reject)=> {
            gapi.client.drive.files.list({
                // q: `name contains '.json'`,
                spaces: 'appDataFolder',
                fields: 'files/name,files/id,files/modifiedTime'
            }).then(res=>{
                resolve(res.result.files);
            }, function (error) {
                reject(error);
            });
        });
    }

    async get(fileId){
        return new Promise((resolve, reject)=> {
            gapi.client.drive.files.get({
                fileId: fileId,
                alt: 'media'
            }).then(res=>{
                resolve(res);
            }, function (error) {
                console.log(error);
                reject(error.message);
            });
        });
    }

    async setBody(fileId, body){
        return new Promise((resolve, reject)=> {
            gapi.client.request({
                path : "upload/drive/v3/files/" + fileId,
                method : "PATCH",
                params : {
                    uploadType : "media"
                },
                headers : {
                    "Content-Type" : "application/json"
                },
                body : body
            }).then(res=>{
                resolve(JSON.parse(res.body));
            }, function (error) {
                console.log(error);
                reject(error.message);
            });
        });
    }

    async rename(fileId, filename){
        return new Promise((resolve, reject)=> {
            gapi.client.drive.files.update({
                fileId: fileId,
                name: filename
            }).then(res=>{
                resolve(JSON.parse(res.body));
            }, function (error) {
                console.log(error);
                reject(error.message);
            });
        });
    }
}

export default FileOps;