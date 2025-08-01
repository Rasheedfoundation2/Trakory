// src/utils/GoogleAuth.ts
import { gapi } from 'gapi-script';

const CLIENT_ID = '760530532776-8sb3421jn2epufsekjvk9lqcg2tpmqsv.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive';

export const initGoogleAuth = () => {
  return new Promise<void>((resolve, reject) => {
    gapi.load('client:auth2', () => {
      gapi.client
        .init({
          clientId: CLIENT_ID,
          scope: SCOPES,
        })
        .then(() => resolve())
        .catch((err: any) => reject(err));
    });
  });
};

export const signInWithGoogle = async () => {
  await initGoogleAuth();
  const GoogleAuth = gapi.auth2.getAuthInstance();
  const user = await GoogleAuth.signIn();
  return user.getBasicProfile();
};

export const createGoogleFile = async (mimeType: string, fileName: string) => {
  try {
    const fileMetadata = {
      name: fileName,
      mimeType: mimeType,
    };

    const response = await gapi.client.drive.files.create({
      resource: fileMetadata,
      fields: 'id',
    });

    return response.result.id;
  } catch (error) {
    console.error('Error creating file:', error);
    throw error;
  }
};


export const getGoogleFileURL = (fileId: string, type: 'doc' | 'sheet' | 'ppt') => {
  if (type === 'doc') return `https://docs.google.com/document/d/${fileId}/edit`;
  if (type === 'sheet') return `https://docs.google.com/spreadsheets/d/${fileId}/edit`;
  if (type === 'ppt') return `https://docs.google.com/presentation/d/${fileId}/edit`;
};
