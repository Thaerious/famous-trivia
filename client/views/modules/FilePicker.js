import Picker from "./Picker.js";

class FilePicker extends Picker{
    // Create and render a Picker object for searching images.
    createPicker() {
        let view = new google.picker.DocsView(google.picker.ViewId.FOLDERS)
            .setIncludeFolders(true)
            .setParent('root')
            .setMimeTypes("json");
        ;

        if (this.pickerApiLoaded && this.oauthToken) {
            let picker = new google.picker.PickerBuilder()
                .enableFeature(google.picker.Feature.NAV_HIDDEN)
                .addView(view)
                .setAppId(this.appId)
                .setOAuthToken(this.oauthToken)
                .setDeveloperKey(this.developerKey)
                .setCallback(this.pickerCallback)
                // .addView(new google.picker.DocsUploadView())
                .build();
            picker.setVisible(true);
        }
    }

    // A simple callback implementation.
    // Override this method on use.
    pickerCallback(data) {
        if (data.action === google.picker.Action.PICKED) {
            var fileId = data.docs[0].id;
            window.location = `editor.html?action=load&fileId=${fileId}`;
        }
    }
}

export default FilePicker;

