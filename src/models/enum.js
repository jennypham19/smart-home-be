'use strict'

/**
 * createEnum: Định nghĩa "kiểu enum" dùng chung cho toàn bộ model.
 *
 * Nhận vào một value mô tả theo dạng: { KEY: value }
 * Trả về một object đã được đóng băng (Object.freeze) gồm:
 *   - Các khoá hằng số:  enum.KEY            -> 'value'   (dùng khi so sánh trong code)
 *   - values:            enum.values         -> ['value', ...]  (đổ thẳng vào DataTypes.ENUM)
 *   - isValid(value):    Kiểm tra một giá trị có thuộc enum hay không (dùng ở tầng validation)
 *
 * Lưu ý: khoá hằng số viết HOA_GACH_DUOI, các helper viết thường nên không đụng độ tên nhau.
 */
const createEnum = (definition) => {
    const entries = Object.entries(definition)
    

    // Map khoá hằng số -> giá trị lưu trong database. VD: GUEST -> 'guest'
    const constants = {}

    for (const [key, value] of entries) {
        constants[key] = value
    }

    const values = entries.map(([, item]) => item)

    return Object.freeze({
        ...constants,
        values: Object.freeze(values),
        isValid: (value) => values.includes(value),
    })
}

/**
 * user_role_enum: Vai trò của người dùng trong hệ thống (bảng users, cột role).
 * Thứ tự khai báo đi từ quyền thấp đến quyền cao.
 */
const user_role_enum = createEnum({
    GUEST: 'guest',
    CUSTOMER: 'customer',
    AFFILIATE: 'affiliate',
    COLLABORATOR: 'collaborator',
    SUPPORT: 'support',
    SALES: 'sales',
    EDITOR: 'editor',
    ADMIN: 'admin'
})

/**
 * user_status_enum: Trạng thái tài khoản người dùng trong hệ thống (bảng users, cột status).
 * Thứ tự khai báo đi từ trạng thái bình thường đến trạng thái bị hạn chế. 
 */
const user_status_enum = createEnum({
    PENDING_VERIFICATION: 'pending_verification',
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    SUSPENDED: 'suspended',
    BLOCKED: 'blocked',
    BANNED: 'banned'
})

/**
 * gender_enum: Giới tính của người dùng trong hệ thống (bảng users, cột gender).
 * Thứ tự khai báo đi từ giới tính phổ biến đến giới tính ít phổ biến hơn.
 */
const gender_enum = createEnum({
    MALE: 'male',
    FEMALE: 'female',
    OTHER: 'other',
    UNDISCLOSED: 'undisclosed',
    UNDETERMINDED: 'undeterminded'
})

/**
 * loyalty_tier_enum: Hạng khách hàng thân thiết trong hệ thống (bảng users, cột loyalty_tier)
 * Thứ tự khai báo đi từ hạng đồng lên hạng bạch kim
 */
const loyalty_tier_enum = createEnum({
    BRONZE: 'bronze',
    SILVER: 'silver',
    GOLD: 'gold',
    PLATINUM: 'platinum'
})

module.exports = {
    createEnum,
    user_role_enum,
    user_status_enum,
    gender_enum,
    loyalty_tier_enum
}
