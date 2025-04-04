// utils/storage.ts
import { Storage } from "@google-cloud/storage";

const storage = new Storage({
  projectId: process.env.GCS_PROJECT_ID,
  credentials: {
    client_email: process.env.GCS_CLIENT_EMAIL,
    private_key: process.env.GCS_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  },
});

const bucket = storage.bucket(process.env.GCS_BUCKET_NAME as string);

// export const uploadFile = (file: Express.Multer.File) => {
//   return new Promise((resolve, reject) => {
//     const blob = bucket.file(file.originalname);
//     const blobStream = blob.createWriteStream();

//     blobStream.on("error", (err) => reject(err));
//     blobStream.on("finish", () => {
//       const publicUrl = ` https://storage.googleapis.com/${bucket.name}/${blob.name}`;
//       resolve(publicUrl);
//     });

//     blobStream.end(file.buffer);
//   });
// };

export const generateSignedUrl = async (filename: string) => {
  if (!filename.endsWith(".pdf")) {
    filename = `${filename}.pdf`;
  }
  const [url] = await bucket.file(filename).getSignedUrl({
    version: "v4",
    action: "read",
    expires: Date.now() + 15 * 60 * 1000, // 15 minutes
  });

  return url;
};
