// Cloudinary upload helper for mobile
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`;

export interface CloudinaryUploadResult {
    secure_url: string;
    public_id: string;
    width: number;
    height: number;
}

export const uploadImageToCloudinary = async (
    imageUri: string,
    folder: string = 'profiles'
): Promise<CloudinaryUploadResult> => {
    try {
        // Prepare form data
        const formData = new FormData();

        // @ts-ignore - React Native FormData handles this differently
        formData.append('file', {
            uri: imageUri,
            type: 'image/jpeg',
            name: 'upload.jpg',
        });

        formData.append('upload_preset', process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '');
        formData.append('folder', folder);

        // Upload
        const response = await fetch(CLOUDINARY_UPLOAD_URL, {
            method: 'POST',
            body: formData,
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        if (!response.ok) {
            throw new Error('Upload failed');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        throw error;
    }
};

export const deleteImageFromCloudinary = async (publicId: string): Promise<void> => {
    // Note: Deletion requires API secret, so it should be done server-side
    // For MVP, we can skip deletion or implement via Supabase Edge Function
    console.log('Delete not implemented for client-side');
};
