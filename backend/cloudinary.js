require('dotenv').config();

const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Recibe la imagen en memoria, la sube y devuelve lo que responde Cloudinary
// (trae secure_url)
module.exports = function subirACloudinary(buffer) {
    return new Promise((resolve, reject) => {
        const flujo = cloudinary.uploader.upload_stream(
            {
                folder: 'wut-force-armour/productos',
                transformation: [
                    {
                        width: 1200,
                        crop: 'limit'
                    }
                ]
            },
            (error, resultado) => (
                error ? reject(error) : resolve(resultado)
            )
        );

        flujo.end(buffer);
    });
};