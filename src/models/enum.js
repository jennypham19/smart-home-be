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
/* ------------------------ 1. MODULE NGƯỜI DÙNG ------------------------ */

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
 * address_type_enum: Loại địa chỉ giao hàng cho người dùng trong hệ thống
 */
const address_type_enum = createEnum({
    HOME: 'home',
    OFFICE: 'office',
    OTHER: 'other'
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

/**
 * otp_purpose_enum: Mục đích sử dụng mã OTP khi người dùng dùng đến mã OTP
 */
const otp_purpose_enum = createEnum({
    REGISTRATION: 'registration',
    LOGIN: 'login',
    RESET_PASSWORD: 'reset_password',
    CHANGE_PHONE: 'change_phone',
    CHANGE_EMAIL: 'change_email'
})

/**
 * loyalty_txn_type_enum: Loại biến động điểm thưởng của người dùng + CTV
 */
const loyalty_txn_type_enum = createEnum({
    EARN_PURCHASE: 'earn_purchase',
    EARN_SIGNUP: 'earn_signup',
    EARN_REVIEW: 'earn_review',
    EARN_REFERRAL: 'earn_referral',
    EARN_PROMOTION: 'earn_promotion',
    REDEEM_ORDER: 'redeem_order',
    EXPIRE: 'expire',
    ADJUST_MANUAL: 'adjust_manual',
    REVOKE_REFUND: 'revoke_refund'
})

/* ------------------------ 2. MODULE DANH MỤC SẢN PHẨM ------------------------ */
/**
 * product_status_enum: Trạng thái kinh doanh sản phẩm
 */
const product_status_enum = createEnum({
    DRAFT: 'draft',
    ACTIVE: 'active',
    HIDDEN: 'hidden',
    OUT_OF_STOCK: 'out_of_stock',
    DISCONTINUED: 'discontinued'
})

/**
 * attribute_display_enum: Cách render bộ chọn thuộc tính trên UI
 */
const attribute_display_enum = createEnum({
    DROPDOWN: 'dropdown',
    BUTTON: 'button',
    SWATCH: 'swatch',
    IMAGE: 'image'
})

/**
 * inventory_txn_type_enum: Loại biến động tồn kho
 */
const inventory_txn_type_enum = createEnum({
    PURCHASE_IN: 'purchase_in',
    SALE_OUT: 'sale_out',
    RETURN_IN: 'return_in',
    ADJUSTMENT: 'adjustment',
    DAMAGED_OUT: 'damaged_out',
    RESERVE: 'reserve',
    RELEASE: 'release'
})

/* ------------------------ 3. MODULE MUA HÀNG & ĐƠN HÀNG ------------------------ */
/**
 * discount_type_enum: Hình thức giảm giá
 */
const discount_type_enum = createEnum({
    PERCENT: 'percent',
    FIXED: 'fixed',
    FREE_SHIPPING: 'free_shipping'
})

/**
 * coupon_scope_enum: Phạm vi áp dụng mã giảm giá
 */
const coupon_scope_enum = createEnum({
    ALL: 'all',
    CATEGORY: 'category',
    PRODUCT: 'product',
    BRAND: 'brand'
})

/**
 * order_status_enum: Trạng thái đơn hàng
 */
const order_status_enum = createEnum({
    PENDING: 'pending',
    AWAITING_PAYMENT: 'awaiting_payment',
    PAYMENT_EXPIRED: 'payment_expired',
    PAID: 'paid',
    CONFIRMED: 'confirmed',
    PROCESSING: 'processing',
    SHIPPING: 'shipping',
    DELIVERED: 'delivered',
    RETURN_REQUESTED: 'return_requested',
    RETURNED: 'returned',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    REFUNDED: 'refunded'
})

/**
 * payment_method_enum: Phương thức thanh toans
 */
const payment_method_enum = createEnum({
    CREDIT_CARD: 'credit_card',
    QR_TRANSFER: 'qr_transfer',
    E_WALLET: 'e_wallet',
    BANK_CARD: 'bank_card',
    COD: 'cod'
})

/**
 * payment_status_enum : Trạng thái phiên thanh toán
 */
const payment_status_enum = createEnum({
    PENDING: 'pending',
    PROCESSING: 'processing',
    PAID: 'paid',
    UNDERPAID: 'underpaid',
    OVERPAID: 'overpaid',
    FAILED: 'failed',
    EXPIRED: 'expired',
    REFUNDED: 'refunded',
    PARTIALLY_REFUNDED: 'partially_refunded'
})

/**
 * shipment_status_enum: Trạng thái vận đơn
 */
const shipment_status_enum = createEnum({
    PENDING: 'pending',
    PICKED_UP: 'picked_up',
    IN_TRANSIT: 'in_transit',
    OUT_FOR_DELIVERY: 'out_for_delivery',
    DELIVERED: 'delivered',
    FAILED_DELIVERY: 'failed_delivery',
    RETURNING: 'returning',
    RETURNED: 'returned',
    SHIPPING: 'shipping'
})

/**
 * return_status_enum: Trạng thái yêu cầu đổi trả
 */
const return_status_enum = createEnum({
    REQUESTED: 'requested',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    SHIPPING_BACK: 'shipping_back',
    RECEIVED: 'received',
    REFUNDED: 'refunded',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled' 
})
/**
 * return_reason_enum: Lý do đổi trả
 */
const return_reason_enum = createEnum({
    DEFECTIVE: 'defective',
    WRONG_ITEM: 'wrong_item',
    NOT_AS_DESCRIBED: 'not_as_described',
    CHANGED_MIND: 'changed_mind',
    DAMAGED_IN_TRANSIT: 'damaged_in_transit',
    MISSING_PARTS: 'missing_parts',
    OTHER: 'other'
})

/* ------------------------ 4. MODULE ĐÁNH GIÁ, DỰ ÁN, CSKH, NỘI DUNG ------------------------ */
/**
 * review_status_enum: Trạng thái kiểm duyệt đánh giá
 */
const review_status_enum = createEnum({
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    HIDDEN: 'hidden'
})
/**
 * project_status_enum: Trạng thái dự án
 */
const project_status_enum = createEnum({
    PLANNING: 'planning',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    ARCHIVED: 'archived'
})
/**
 * ticket_status_enum: trạng thái ticket hỗ trợ
 */
const ticket_status_enum = createEnum({
    OPEN: 'open',
    ASSIGNED: 'assigned',
    IN_PROGRESS: 'in_progress',
    WAITING_CUSTOMER: 'watiting_customer',
    RESOLVED: 'resolved',
    CLOSED: 'closed',
    REOPENED: 'reopend'
})
/**
 * ticket_priority_enum: Mức độ ưu tiên ticket
 */
const ticket_priority_enum = createEnum({
    LOW: 'low',
    NORMAL: 'normal',
    HIGH: 'high',
    URGENT: 'urgent'
})
/**
 * ticket_category_enum: Phân loại ticket
 */
const ticket_category_enum = createEnum({
    TECHNICAL: 'technical',
    ORDER: 'order',
    WARRANTY: 'warranty',
    RETURN: 'return',
    BILLING: 'billing',
    PRODUCT_INQUIRY: 'product_inquiry',
    OTHER: 'other'
})
/**
 * consultation_status_enum: Trạng thái yêu cầu tư vấn (pipeline sales)
 */
const consultation_status_enum = createEnum({
    NEW: 'new',
    ASSIGNED: 'assigned',
    CONTACTED: 'contacted',
    QUOTED: 'quoted',
    WON: 'won',
    LOST: 'lost',
    SPAM: 'spam'
})
/**
 * consultation_type_enum: Loại yêu cầu tư vấn
 */
const consultation_type_enum = createEnum({
    PRODUCT_CONSULTATION: 'product_consultation',
    PROJECT_CONSULTATION: 'project_consultation',
    QUOTATION: 'quotation',
    TECHNICAL_SUPPORT: 'technical_support',
    PARTNERSHIP: 'partnership',
    OTHER: 'other'
})
/**
 * chat_role_enum: Vai trò người gửi tin nhắn chat
 */
const chat_role_enum = createEnum({
    USER: 'user',
    ASSISTANT: 'assistant',
    AGENT: 'agent',
    SYSTEM: 'system'    
})
/**
 * subsription_status_enum: Trạng thái đăng ký nhận bản tin
 */
const subsription_status_enum = createEnum({
    PENDING_CONFIRMATION: 'pending_confirmation',
    CONFIRMED: 'confirmed',
    UNSUBCRIBED: 'unsubcribed',
    BOUNCED: 'bounced'
})
/**
 * banner_position_enum: Vị trí hiển thị banner
 */
const banner_position_enum = createEnum({
    HOME_HERO: 'home_hero',
    ABOUT_HERO: 'about_hero',
    PROJECT_HERO: 'project_hero',
    PRODUCT_HERO: 'product_hero',
    SUPPORT_HERO: 'support_hero',
    CONTACT_HERO: 'contact_hero',
    PROMO_STRIP: 'promo_strip',
    SIDEBAR: 'sidebar'
})

module.exports = {
    createEnum,
    user_role_enum,
    user_status_enum,
    gender_enum,
    address_type_enum,
    loyalty_tier_enum,
    product_status_enum,
    attribute_display_enum,
    inventory_txn_type_enum,
    discount_type_enum,
    coupon_scope_enum,
    order_status_enum,
    payment_method_enum,
    payment_status_enum,
    shipment_status_enum,
    return_reason_enum,
    return_status_enum,
    review_status_enum,
    project_status_enum,
    ticket_status_enum,
    ticket_priority_enum,
    ticket_category_enum,
    consultation_status_enum,
    consultation_type_enum,
    chat_role_enum,
    subsription_status_enum,
    banner_position_enum,
    otp_purpose_enum,
    loyalty_txn_type_enum
}
