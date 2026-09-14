// web version: there is no file system in the browser, so these
// return null and the screen shows a message about using the phone.
// this keeps the snack web preview from crashing on import.

export function savePhotoToAppDir(tempUri) {
    return null;
}

export function deletePhotoFile(uri) {
    // nothing to delete on web
}

export function writeExportFile(jsonData) {
    return null;
}
