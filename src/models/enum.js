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
    PENDING_VERIFICATION: 'pending_verification',   // đã đăng ký, nhưng chưa xác thực OTP
    ACTIVE: 'active',                               // đã xác thực OTP, đang hoạt động bình thường
    INACTIVE: 'inactive',                           // đã xác thực OTP, nhưng chưa đăng nhập lần nào (tạm thời chưa dùng đến)                   
    SUSPENDED: 'suspended',                         // đã xác thực OTP, nhưng bị tạm khoá do vi phạm chính sách
    BLOCKED: 'blocked',                             // đã xác thực OTP, nhưng bị khoá vĩnh viễn do vi phạm chính sách     
    BANNED: 'banned'                                // đã xác thực OTP, nhưng bị cấm vĩnh viễn do vi phạm chính sách
})

/**
 * user_role_enum: Vai trò của người dùng trong hệ thống (bảng users, cột role).
 * Thứ tự khai báo đi từ quyền thấp đến quyền cao.
 */
const user_role_enum = createEnum({
    GUEST: 'guest',                     // khách vãng lai, chưa đăng ký tài khoản
    CUSTOMER: 'customer',               // khách hàng đã đăng ký tài khoản
    AFFILIATE: 'affiliate',             // cộng tác viên (CTV) tham gia bán hàng, giới thiệu khách hàng
    COLLABORATOR: 'collaborator',       // cộng tác viên (CTV) tham gia phát triển nội dung, dự án, sản phẩm
    SUPPORT: 'support',                 // nhân viên hỗ trợ khách hàng, chăm sóc khách hàng  
    SALES: 'sales',                     // nhân viên kinh doanh, tư vấn bán hàng
    EDITOR: 'editor',                   // nhân viên biên tập nội dung, quản lý dự án, sản phẩm
    ADMIN: 'admin'                      // quản trị viên hệ thống, có quyền cao nhất
})


/**
 * gender_enum: Giới tính của người dùng trong hệ thống (bảng users, cột gender).
 * Thứ tự khai báo đi từ giới tính phổ biến đến giới tính ít phổ biến hơn.
 */
const gender_enum = createEnum({
    MALE: 'male',                   // nam giới
    FEMALE: 'female',               // nữ giới
    OTHER: 'other',                 // giới tính khác    
    UNDISCLOSED: 'undisclosed',     // không tiết lộ giới tính    
    UNDETERMINDED: 'undeterminded'  // chưa xác định giới tính
})

/**
 * address_type_enum: Loại địa chỉ giao hàng cho người dùng trong hệ thống
 */
const address_type_enum = createEnum({
    HOME: 'home',          // địa chỉ nhà riêng
    OFFICE: 'office',      // địa chỉ cơ quan, công ty 
    OTHER: 'other'         // địa chỉ khác
})

/**
 * loyalty_tier_enum: Hạng khách hàng thân thiết trong hệ thống (bảng users, cột loyalty_tier)
 * Thứ tự khai báo đi từ hạng đồng lên hạng bạch kim
 */
const loyalty_tier_enum = createEnum({
    BRONZE: 'bronze',       // hạng đồng
    SILVER: 'silver',       // hạng bạc
    GOLD: 'gold',           // hạng vàng
    PLATINUM: 'platinum'    // hạng bạch kim
})

/**
 * otp_purpose_enum: Mục đích sử dụng mã OTP khi người dùng dùng đến mã OTP
 */
const otp_purpose_enum = createEnum({
    REGISTRATION: 'registration',           // đăng ký tài khoản mới
    LOGIN: 'login',                         // đăng nhập vào tài khoản
    RESET_PASSWORD: 'reset_password',       // đặt lại mật khẩu
    CHANGE_PHONE: 'change_phone',           // thay đổi số điện thoại
    CHANGE_EMAIL: 'change_email'            // thay đổi địa chỉ email
})

/**
 * loyalty_txn_type_enum: Loại biến động điểm thưởng của người dùng + CTV
 */
const loyalty_txn_type_enum = createEnum({
    EARN_PURCHASE: 'earn_purchase',         // Tích điểm từ mua hàng
    EARN_SIGNUP: 'earn_signup',             // Tích điểm từ đăng ký tài khoản
    EARN_REVIEW: 'earn_review',             // Tích điểm từ đánh giá sản phẩm
    EARN_REFERRAL: 'earn_referral',         // Tích điểm từ giới thiệu bạn bè
    EARN_PROMOTION: 'earn_promotion',       // Tích điểm từ chương trình khuyến mãi
    REDEEM_ORDER: 'redeem_order',           // Trừ điểm khi đổi quà, đổi voucher
    EXPIRE: 'expire',                       // Hết hạn sử dụng điểm thưởng
    ADJUST_MANUAL: 'adjust_manual',         // Điều chỉnh điểm thưởng thủ công
    REVOKE_REFUND: 'revoke_refund'          // Hoàn trả điểm thưởng khi đơn hàng bị huỷ hoặc trả hàng
})

/**
 * affiliate_status_enum: Trạng thái xét duyệt CTV trong hệ thống (bảng affiliates, cột status)
 * Thứ tự khai báo đi từ trạng thái bình thường đến trạng thái bị hạn chế. 
 */
const affiliate_status_enum = createEnum({
    PENDING: 'pending',                   // chờ xử lý
    ACTIVE: 'active',                     // đang hoạt động bình thường
    SUSPENDED: 'suspended',               // bị tạm khoá do vi phạm chính sách
    REJECTED: 'rejected',                 // bị từ chối tham gia chương trình CTV
})

/* ------------------------ 2. MODULE DANH MỤC SẢN PHẨM ------------------------ */
/**
 * product_status_enum: Trạng thái kinh doanh sản phẩm
 */
const product_status_enum = createEnum({
    DRAFT: 'draft',                         // bản nháp
    ACTIVE: 'active',                       // đang hoạt động
    HIDDEN: 'hidden',                       // ẩn khỏi website nhưng vẫn còn trong hệ thống
    OUT_OF_STOCK: 'out_of_stock',           // hết hàng
    DISCONTINUED: 'discontinued'            // ngừng kinh doanh
})

/**
 * attribute_display_enum: Cách render bộ chọn thuộc tính trên UI
 */
const attribute_display_enum = createEnum({
    DROPDOWN: 'dropdown',       // Danh sách thả xuống
    BUTTON: 'button',           // Nút bấm lựa chọn
    SWATCH: 'swatch',           // Mẫu hiển thị (màu sắc, hình ảnh, v.v.)
    IMAGE: 'image'              // Hình ảnh đại diện
})

/**
 * inventory_txn_type_enum: Loại biến động tồn kho
 */
const inventory_txn_type_enum = createEnum({
    PURCHASE_IN: 'purchase_in',     // Nhập kho
    SALE_OUT: 'sale_out',           // Xuất kho bán
    RETURN_IN: 'return_in',         // Nhập trả hàng về kho
    ADJUSTMENT: 'adjustment',       // Kiểm kê điều chỉnh tồn kho
    DAMAGED_OUT: 'damaged_out',     // Xuất hủy hàng hỏng
    RESERVE: 'reserve',             // Đặt chỗ
    RELEASE: 'release'              // Trả lại hàng đã đặt chỗ
})

/**
 * relation_type_enum: Loại quan hệ giữa các sản phẩm
 */
const relation_type_enum = createEnum({
    RELATED: 'related',             // Sản phẩm liên quan
    ACCESSORY: 'accessory',         // Sản phẩm phụ kiện
    UPSELL: 'upsell',               // Sản phẩm bán kèm (Upsell)
    CROSS_SELL: 'cross_sell'        // Sản phẩm bán chéo (Cross-sell)
})

/**
 * reservation_status_enum: Trạng thái đặt chỗ sản phẩm
 */
const reservation_status_enum = createEnum({
    HOLD: 'hold',                   // Đang giữ chỗ
    COMMITTED: 'committed',         // Đã xác nhận đặt chỗ
    RELEASED: 'released',           // Đã trả lại chỗ
    EXPIRED: 'expired'              // Hết hạn giữ chỗ
})

/* ------------------------ 3. MODULE MUA HÀNG & ĐƠN HÀNG ------------------------ */
/**
 * discount_type_enum: Hình thức giảm giá
 */
const discount_type_enum = createEnum({
    PERCENT: 'percent',               // giảm theo phần trăm
    FIXED: 'fixed',                   // giảm theo số tiền cố định
    FREE_SHIPPING: 'free_shipping'    // miễn phí vận chuyển
})

/**
 * coupon_scope_enum: Phạm vi áp dụng mã giảm giá
 */
const coupon_scope_enum = createEnum({
    ALL: 'all',                       // Áp dụng cho tất cả sản phẩm
    CATEGORY: 'category',             // Áp dụng cho danh mục sản phẩm
    PRODUCT: 'product',               // Áp dụng cho sản phẩm cụ thể
    BRAND: 'brand'                    // Áp dụng cho thương hiệu
})

/**
 * order_status_enum: Trạng thái đơn hàng
 */
const order_status_enum = createEnum({
    PENDING: 'pending',                         // chờ xử lý
    AWAITING_PAYMENT: 'awaiting_payment',       // chờ thanh toán
    PAYMENT_EXPIRED: 'payment_expired',         // hết hạn thanh toán
    PAID: 'paid',                               // đã thanh toán
    CONFIRMED: 'confirmed',                     // đã xác nhận
    PROCESSING: 'processing',                   // đang xử lý
    SHIPPING: 'shipping',                       // đang vận chuyển
    DELIVERED: 'delivered',                     // đã giao hàng
    RETURN_REQUESTED: 'return_requested',       // đã yêu cầu trả hàng
    RETURNED: 'returned',                       // đã trả hàng
    COMPLETED: 'completed',                     // hoàn thành
    CANCELLED: 'cancelled',                     // đã hủy
    REFUNDED: 'refunded'                        // đã hoàn tiền
})

/**
 * payment_method_enum: Phương thức thanh toans
 */
const payment_method_enum = createEnum({
    CREDIT_CARD: 'credit_card',         // thẻ tín dụng (Visa, MasterCard, JCB, v.v.)
    QR_TRANSFER: 'qr_transfer',         // chuyển khoản qua mã QR (VietQR, ZaloPay, MoMo, v.v.)
    E_WALLET: 'e_wallet',               // ví điện tử (MoMo, ZaloPay, ViettelPay, v.v.)
    BANK_CARD: 'bank_card',             // thẻ ngân hàng nội địa (ATM, Napas, v.v.)
    COD: 'cod'                          // thanh toán khi nhận hàng (Cash on Delivery)
})

/**
 * payment_status_enum : Trạng thái phiên thanh toán
 */
const payment_status_enum = createEnum({
    PENDING: 'pending',                             // chờ xử lý thanh toán
    PROCESSING: 'processing',                       // đang xử lý
    PAID: 'paid',                                   // đã thanh toán
    UNDERPAID: 'underpaid',                         // thanh toán thiếu
    OVERPAID: 'overpaid',                           // thanh toán thừa
    FAILED: 'failed',                               // thất bại
    EXPIRED: 'expired',                             // hết hạn phiên
    REFUNDED: 'refunded',                           // đã hoàn tiền
    PARTIALLY_REFUNDED: 'partially_refunded'        // đã hoàn tiền một phần
})

/**
 * shipment_status_enum: Trạng thái vận đơn
 */
const shipment_status_enum = createEnum({
    PENDING: 'pending',                         // chờ lấy hàng
    PICKED_UP: 'picked_up',                     // đã lấy hàng
    IN_TRANSIT: 'in_transit',                   // đang vận chuyển
    OUT_FOR_DELIVERY: 'out_for_delivery',       // đang giao hàng
    DELIVERED: 'delivered',                     // đã giao hàng
    FAILED_DELIVERY: 'failed_delivery',         // giao hàng thất bại
    RETURNING: 'returning',                     // đang trả hàng
    RETURNED: 'returned',                       // đã hoàn trả
    SHIPPING: 'shipping'                        // đang chuẩn bị giao hàng (chưa xác định trạng thái cụ thể)
})

/**
 * return_status_enum: Trạng thái yêu cầu đổi trả
 */
const return_status_enum = createEnum({
    REQUESTED: 'requested',                     // đã yêu cầu
    APPROVED: 'approved',                       // đã được chấp thuận
    REJECTED: 'rejected',                       // đã bị từ chối
    SHIPPING_BACK: 'shipping_back',             // đang vận chuyển trả hàng
    RECEIVED: 'received',                       // đã nhận hàng trả về
    REFUNDED: 'refunded',                       // đã hoàn tiền
    COMPLETED: 'completed',                     // đã hoàn tất quy trình đổi trả
    CANCELLED: 'cancelled'                      // đã hủy yêu cầu đổi trả
})
/**
 * return_reason_enum: Lý do đổi trả
 */
const return_reason_enum = createEnum({
    DEFECTIVE: 'defective',                         // sản phẩm bị lỗi, hỏng hóc
    WRONG_ITEM: 'wrong_item',                       // sai sản phẩm, sai đơn hàng      
    NOT_AS_DESCRIBED: 'not_as_described',           // không đúng mô tả, không đúng hình ảnh quảng cáo
    CHANGED_MIND: 'changed_mind',                   // đổi ý, không muốn mua nữa
    DAMAGED_IN_TRANSIT: 'damaged_in_transit',       // sản phẩm bị hư hỏng trong quá trình vận chuyển
    MISSING_PARTS: 'missing_parts',                 // thiếu linh kiện, phụ kiện đi kèm
    OTHER: 'other'                                  // lý do khác
})

/**
 * cart_status_enum: Trạng thái giỏ hàng
 */
const cart_status_enum = createEnum({
    ACTIVE: 'active',                       // đang hoạt động, chưa thanh toán
    CONVERTED: 'converted',                 // đã chuyển sang đơn hàng, đang chờ thanh toán
    ABANDONED: 'abandoned',                 // bị bỏ quên, chưa thanh toán trong thời gian dài
    CHECKED_OUT: 'checked_out',             // đã thanh toán, chuyển sang đơn hàng
    EXPIRED: 'expired',                      // hết hạn sử dụng, không còn hiệu lực
    MERGED: 'merged'                       // đã gộp với giỏ hàng khác
})

/* ------------------------ 4. MODULE ĐÁNH GIÁ, DỰ ÁN, CSKH, NỘI DUNG ------------------------ */
/**
 * review_status_enum: Trạng thái kiểm duyệt đánh giá
 */
const review_status_enum = createEnum({
    PENDING: 'pending',                         // chờ kiểm duyệt   
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
    loyalty_txn_type_enum,
    affiliate_status_enum,
    relation_type_enum,
    reservation_status_enum
}
