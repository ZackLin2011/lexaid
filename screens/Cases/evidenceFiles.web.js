// web version: expo-file-system is not available in the browser,
// so saving photos is skipped here. the snack web preview can still
// open the app, it just can not store evidence photos.
export function savePhotoToAppDir(tempUri) {
    return null;
}

export function deletePhotoFile(uri) {
    // nothing to delete on web
}
