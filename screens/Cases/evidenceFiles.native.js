import { File, Directory, Paths } from 'expo-file-system';

// native version: actually copy the photo into the app documents folder.
// used on real devices / Expo Go, where the file system exists.
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
