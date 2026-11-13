const { StatusCodes } = require('http-status-codes');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { v2: cloudinary } = require('cloudinary')

const uploadImageSingle = catchAsync(async (req, res) => {
        try {
            // Nếu không có file
            if(!req.file) {
                throw new ApiError(StatusCodes.BAD_REQUEST, 'Vui lòng chọn một file để upload.');
            }

            // ⚠️ log raw error
            if (!req.file.path) {
                console.error("Cloudinary upload failed. Full file object:", req.file);
                throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, "Upload lên Cloudinary thất bại.");
            }

            const imageUrl = req.file.path; // link ảnh Cloudinary
            const folder = req.body.type || 'smart-device' // folder đã lưu
            const fileName = req.file.filename; // lấy tên ảnh
            const originalname = req.file.originalname; 
            // Sau khi upload thành công, multer-storage-cloudinary sẽ trả về link tại req.file.path
            res.status(StatusCodes.OK).send({
                success: true,
                message: 'Upload file thành công',
                data: {
                    file: {
                        imageUrl,
                        fileName,
                        originalname
                    },
                    folder,
                }
            })
        } catch (error) {
            if(error instanceof ApiError) throw error;
            console.error("Upload error:", error); // log cụ thể lỗi
            throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Đã có lỗi xảy ra ' + error.message);
        }
});

const uploadVideoSingle = catchAsync(async (req, res) => {
        try {
            // Nếu không có file
            if(!req.file) {
                throw new ApiError(StatusCodes.BAD_REQUEST, 'Vui lòng chọn một file để upload.');
            }

            // ⚠️ log raw error
            if (!req.file.path) {
                console.error("Cloudinary upload failed. Full file object:", req.file);
                throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, "Upload lên Cloudinary thất bại.");
            }

            const videoUrl = req.file.path; // link video Cloudinary
            const folder = req.body.type || 'smart-device' // folder đã lưu
            const fileName = req.file.filename; // lấy tên video
            const originalname = req.file.originalname; 
            // ✅ LẤY METADATA VIDEO
            const resource = await cloudinary.api.resource(fileName, {
                resource_type: "video",
                media_metadata: true,
            });
            const duration = resource.duration; // giây (number)
            // Sau khi upload thành công, multer-storage-cloudinary sẽ trả về link tại req.file.path
            res.status(StatusCodes.OK).send({
                success: true,
                message: 'Upload file thành công',
                data: {
                    file: {
                        videoUrl,
                        fileName,
                        originalname,
                        duration
                    },
                    folder,
                }
            })
        } catch (error) {
            if(error instanceof ApiError) throw error;
            console.error("Upload error:", error); // log cụ thể lỗi
            throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Đã có lỗi xảy ra ' + error.message);
        }
});

const uploadEmployeeImageMultiple = catchAsync(async (req, res) => {
        try {
            if(!req.files || req.files.length === 0){
                throw new ApiError(StatusCodes.BAD_REQUEST, 'Vui lòng chọn một file để upload.');
            }
            const files = req.files.map(file => ({
                url: file.path,
                name: file.filename,
                originalname: Buffer.from(file.originalname, "latin1").toString("utf8")
            }));
            const folder = req.body.type || 'smart-device' // folder đã lưu
            res.status(StatusCodes.OK).send({
                success: true,
                message: 'Upload file thành công',
                data: {
                    files,
                    folder,
                }
            })
        } catch (error) {
            throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Đã có lỗi xảy ra ' + error.message);
        }
});

const uploadFiles = catchAsync(async (req, res) => {
        try {
            const files = req.uploadedFiles.map(file => ({
                url: file.url,
                name: file.filename,
                originalname: Buffer.from(file.originalname, "latin1").toString("utf8")   // Sửa lỗi font Multer (latin1 → utf8)
            }));
            const folder = req.body.type || 'smart-device' // folder đã lưu
            res.status(StatusCodes.OK).send({
                success: true,
                message: 'Upload file thành công',
                data: {
                    files,
                    folder,
                }
            })
        } catch (error) {
            throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Đã có lỗi xảy ra ' + error.message);
        }
});

module.exports = {
    uploadImageSingle,
    uploadVideoSingle,
    uploadEmployeeImageMultiple,
    uploadFiles
}