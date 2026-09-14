import { File, Directory, Paths } from 'expo-file-system';

// native helpers for anything that touches the file system.
// only works on real devices / expo go, not in the browser.

export function savePhotoToAppDir(tempUri) {
    const evidenceDir = new Directory(Paths.document, 'evidence');
    evidenceDir.create({ intermediates: true, idempotent: true });
    const dest = new File(evidenceDir, `evidence_${Date.now()}.jpg`);
    new File(tempUri).copy(dest);
    return dest.uri;
}

export function deletePhotoFile(uri) {
    if (!uri) return;
    new File(uri).delete();
}

export function writeExportFile(jsonData) {
    const exportFile = new File(Paths.document, 'lexaid_export.json');
    exportFile.create({ overwrite: true });
    exportFile.write(jsonData);
    return exportFile.uri;
}
