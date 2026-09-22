'use strict'
/**
 * File enum dùng chung cho toàn bộ migration.
 * Mục đích: tránh việc mỗi migration tự định nghĩa lại danh sách giá trị enum, gây khó đồng bộ khi cần thêm/sửa giá trị sau này
 * 
 * Cách dùng trong migration:
 * const { UserStatus } = require('../helpers/enums');
 * ...
 * status: {
 *      type: Sequelize.ENUM(...UserStatus.values),
 *      allowNull: false,
 *      defaultValue: UserStatus.PENDING_VERIFICATION
 * }
 * 
 * Lưu ý quan trọng với Postgres:
 * - Sequelize.ENUM khi migrate lên Postgres sẽ tạo ra 1 TYPE riêng (vd: "enum_Users_status").
 * - Khi muốn THÊM giá trị mối cho enum đã tồn tại, không thể sửa lại migration cũ, phải viết migration mới dùng ALTER TYPE... ADD VALUE (xem hàm addEnumValue bên dưới).
 * - Khi rollback (down) migration tạo bảng có cột enum, nhớ drop luôn type (Sequelize không tự drop enum type khi dropTable trong 1 số version cũ).
 */

// ---- Định nghĩa các enum dùng chung ----
/* ==== MODULE NGƯỜI DÙNG ==== */
/* ---- 1. UserStatus ---- */
const UserStatus = Object.freeze({
    PENDING_VERIFICATION: 'pending_verification',
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    SUSPENDED: 'suspended',
    BLOCKED: 'blocked',
    BANNED: 'banned',

    values() {
        return [
            this.PENDING_VERIFICATION,
            this.ACTIVE,
            this.INACTIVE,
            this.SUSPENDED,
            this.BLOCKED,
            this.BANNED
        ]
    }
})

/* ---- 2. UserRole ---- */
const UserRole = Object.freeze({
    GUEST: 'guest',
    CUSTOMER: 'customer',
    AFFILIATE: 'affiliate',
    COLLABORATOR: 'collaborator',
    SUPPORT: 'support',
    SALES: 'sales',
    EDITOR: 'editor',
    ADMIN: 'admin',

    values(){
        return[
            this.GUEST,
            this.CUSTOMER,
            this.AFFILIATE,
            this.COLLABORATOR,
            this.SUPPORT,
            this.SALES,
            this.EDITOR,
            this.ADMIN
        ]
    }
})

/* ---- 3. Gender ---- */
const Gender = Object.freeze({
    MALE: 'male',
    FEMALE: 'female',
    OTHER: 'other',
    UNDISCLOSED: 'undisclosed',
    UNDETERMINDED: 'undeterminded',

    values(){
        return[
            this.MALE,
            this.FEMALE,
            this.OTHER,
            this.UNDISCLOSED,
            this.UNDETERMINDED
        ]
    }
})

/* ---- 4.AddressType ---- */
const AddressType = Object.freeze({
    HOME: 'home',
    OFFICE: 'office',
    OTHER: 'other',

    values(){
        return[
            this.HOME,
            this.OFFICE,
            this.OTHER
        ]
    }
})

/* ---- 5. LoyaltyTier ---- */
const LoyaltyTier = Object.freeze({
    BRONZE: 'bronze',
    SILVER: 'silver',
    GOLD: 'gold',
    PLATINUM: 'platinum',

    values(){
        return[
            this.BRONZE,
            this.SILVER,
            this.GOLD,
            this.PLATINUM
        ]
    }
})

/* ---- 6. OtpPurpose ---- */
const OtpPurpose = Object.freeze({
    REGISTRATION: 'registration',
    LOGIN: 'login',
    RESET_PASSWORD: 'reset_password',
    CHANGE_PHONE: 'change_phone',
    CHANGE_EMAIL: 'change_email',

    values(){
        return[
            this.REGISTRATION, this.LOGIN, this.RESET_PASSWORD,
            this.CHANGE_PHONE, this.CHANGE_EMAIL
        ]
    }
})
/* ---- 7. LoyaltyTxnType ---- */
const LoyaltyTxnType = Object.freeze({
    EARN_PURCHASE: 'earn_purchase',
    EARN_SIGNUP: 'earn_signup',
    EARN_REVIEW: 'earn_review',
    EARN_REFERRAL: 'earn_referral',
    EARN_PROMOTION: 'earn_promotion',
    REDEEM_ORDER: 'redeem_order',
    EXPIRE: 'expire',
    ADJUST_MANUAL: 'adjust_manual',
    REVOKE_REFUND: 'revoke_refund',
    
    values(){
        return[
            this.EARN_PURCHASE, this.EARN_SIGNUP, this.EARN_REVIEW,
            this.EARN_REFERRAL, this.EARN_PROMOTION, this.REDEEM_ORDER, 
            this.EXPIRE, this.ADJUST_MANUAL, this.REVOKE_REFUND
        ]
    }
})

/* ==== MODULE DANH MỤC SẢN PHẨM ==== */
/* ---- 1. ProductStatus ---- */
const ProductStatus = Object.freeze({
    DRAFT: 'draft',
    ACTIVE: 'active',
    HIDDEN: 'hidden',
    OUT_OF_STOCK: 'out_of_stock',
    DISCONTINUED: 'discontinued',
    
    values() {
        return[
            this.DRAFT, this.ACTIVE, this.HIDDEN,
            this.OUT_OF_STOCK, this.DISCONTINUED
        ]
    }
})
/* ---- 2. AttributeDisplay ---- */
const AttributeDisplay = Object.freeze({
    DROPDOWN: 'dropdown',
    BUTTON: 'button',
    SWATCH: 'swatch',
    IMAGE: 'image',
    
    values(){
        return[
            this.DROPDOWN, this.BUTTON,
            this.SWATCH, this.IMAGE
        ]
    }
})
/* ---- 3. InventoryTxnType ---- */
const InventoryTxnType = Object.freeze({
    PURCHASE_IN: 'purchase_in',
    SALE_OUT: 'sale_out',
    RETURN_IN: 'return_in',
    ADJUSTMENT: 'adjustment',
    DAMAGED_OUT: 'damaged_out',
    RESERVE: 'reserve',
    RELEASE: 'release',
    
    values(){
        return[
            this.PURCHASE_IN, this.SALE_OUT, this.RETURN_IN, this.ADJUSTMENT,
            this.DAMAGED_OUT, this.RESERVE, this.RELEASE
        ]
    }
})

/* ==== 3. MODULE MUA HÀNG & ĐƠN HÀNG ==== */
/* ---- 1. DiscountType ---- */
const DiscountType = Object.freeze({
    PERCENT: 'percent',
    FIXED: 'fixed',
    FREE_SHIPPING: 'free_shipping',

    values(){
        return[
            this.PERCENT, this.FIXED, this.FREE_SHIPPING
        ]
    }
})
/* ---- 2. CouponScope ---- */
const CouponScope = Object.freeze({
    ALL: 'all',
    CATEGORY: 'category',
    PRODUCT: 'product',
    BRAND: 'brand',
    
    values(){
        return[
            this.ALL, this.CATEGORY, this.PRODUCT, this.BRAND
        ]
    }
})
/* ---- 3. OrderStatus ---- */
const OrderStatus = Object.freeze({
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
    REFUNDED: 'refunded',

    values(){
        return[
            this.PENDING, this.AWAITING_PAYMENT, this.PAYMENT_EXPIRED, this.PAID,
            this.CONFIRMED, this.PROCESSING, this.SHIPPING, this.DELIVERED,
            this.RETURN_REQUESTED, this.RETURNED, this.COMPLETED,
            this.CANCELLED, this.REFUNDED
        ]
    }
})
/* ---- 4. PaymentMethod ---- */
const PaymentMethod = Object.freeze({
    CREDIT_CARD: 'credit_card',
    QR_TRANSFER: 'qr_transfer',
    E_WALLET: 'e_wallet',
    BANK_CARD: 'bank_card',
    COD: 'cod',
    
    values(){
        return[
            this.CREDIT_CARD, this.QR_TRANSFER, this.E_WALLET,
            this.BANK_CARD, this.COD
        ]
    }
})
/* ---- 5. PaymentStatus ---- */
const PaymentStatus = Object.freeze({
    PENDING: 'pending',
    PROCESSING: 'processing',
    PAID: 'paid',
    UNDERPAID: 'underpaid',
    OVERPAID: 'overpaid',
    FAILED: 'failed',
    EXPIRED: 'expired',
    REFUNDED: 'refunded',
    PARTIALLY_REFUNDED: 'partially_refunded',

    values(){
        return[
            this.PENDING, this.PROCESSING, this.PAID, this.UNDERPAID, this.OVERPAID,
            this.FAILED, this.EXPIRED, this.REFUNDED, this.PARTIALLY_REFUNDED
        ]
    }
})
/* ---- 6. ShipmentStatus ---- */
const ShipmentStatus = Object.freeze({
    PENDING: 'pending',
    PICKED_UP: 'picked_up',
    IN_TRANSIT: 'in_transit',
    OUT_FOR_DELIVERY: 'out_for_delivery',
    DELIVERED: 'delivered',
    FAILED_DELIVERY: 'failed_delivery',
    RETURNING: 'returning',
    RETURNED: 'returned',
    SHIPPING: 'shipping',
    
    values(){
        return[
            this.PENDING, this.PICKED_UP, this.IN_TRANSIT, this.OUT_FOR_DELIVERY,
            this.DELIVERED, this.FAILED_DELIVERY, this.RETURNING, this.RETURNED, this.SHIPPING
        ]
    }
})

/* ---- 7. ReturnStatus ---- */
const ReturnStatus = Object.freeze({
    REQUESTED: 'requested',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    SHIPPING_BACK: 'shipping_back',
    RECEIVED: 'received',
    REFUNDED: 'refunded',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    
    values(){
        return[
            this.REQUESTED, this.APPROVED, this.REJECTED, this.SHIPPING,
            this.RECEIVED, this.REFUNDED, this.COMPLETED, this.CANCELLED
        ]
    }
})

/* ---- 8. ReturnReason ---- */
const ReturnReason = Object.freeze({
    DEFECTIVE: 'defective',
    WRONG_ITEM: 'wrong_item',
    NOT_AS_DESCRIBED: 'not_as_described',
    CHANGED_MIND: 'changed_mind',
    DAMAGED_IN_TRANSIT: 'damaged_in_transit',
    MISSING_PARTS: 'missing_parts',
    OTHER: 'other',
    
    values(){
        return[
            this.DEFECTIVE, this.WRONG_ITEM, this.NOT_AS_DESCRIBED, this.CHANGED_MIND,
            this.DAMAGED_IN_TRANSIT, this.MISSING_PARTS, this.OTHER
        ]
    }
})

/* ==== 4. MODULE ĐÁNH GIÁ, DỰ ÁN, CSKH, NỘI DUNG ==== */
/* ---- 1. ReviewStatus ---- */
const ReviewStatus = Object.freeze({
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    HIDDEN: 'hidden',

    values(){
        return[
            this.PENDING, this.APPROVED, this.REJECTED, this.HIDDEN
        ]
    }
})
/* ---- 2. ProjectStatus ---- */
const ProjectStatus = Object.freeze({
    PLANNING: 'planning',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    ARCHIVED: 'archived',

    values(){
        return[
            this.PLANNING, this.IN_PROGRESS, this.COMPLETED, this.ARCHIVED
        ]
    }
})
/* ---- 3. TicketStatus ---- */
const TicketStatus = Object.freeze({
    OPEN: 'open',
    ASSIGNED: 'assigned',
    IN_PROGRESS: 'in_progress',
    WAITING_CUSTOMER: 'watiting_customer',
    RESOLVED: 'resolved',
    CLOSED: 'closed',
    REOPENED: 'reopend',

    values(){
        return[
            this.OPEN, this.ASSIGNED, this.IN_PROGRESS, this.WAITING_CUSTOMER,
            this.RESOLVED, this.CLOSED, this.REOPENED
        ]
    }
})
/* ---- 4. TicketPriority ---- */
const TicketPriority = Object.freeze({
    LOW: 'low',
    NORMAL: 'normal',
    HIGH: 'high',
    URGENT: 'urgent',

    values(){
        return[
            this.LOW, this.NORMAL, this.HIGH, this.URGENT
        ]
    }
})
/* ---- 5. TicketCategory ---- */
const TicketCategory = Object.freeze({
    TECHNICAL: 'technical',
    ORDER: 'order',
    WARRANTY: 'warranty',
    RETURN: 'return',
    BILLING: 'billing',
    PRODUCT_INQUIRY: 'product_inquiry',
    OTHER: 'other',

    values(){
        return[
            this.TECHNICAL, this.ORDER, this.WARRANTY, this.RETURN,
            this.BILLING, this.PRODUCT_INQUIRY, this.OTHER
        ]
    }
})
/* ---- 6. ConsultationStatus ---- */
const ConsultationStatus = Object.freeze({
    NEW: 'new',
    ASSIGNED: 'assigned',
    CONTACTED: 'contacted',
    QUOTED: 'quoted',
    WON: 'won',
    LOST: 'lost',
    SPAM: 'spam',

    values(){
        return[
            this.NEW, this.ASSIGNED, this.CONTACTED, this.QUOTED,
            this.WON, this.LOST, this.SPAM
        ]
    }
})
/* ---- 7. ConsultationType ---- */
const ConsultationType = Object.freeze({
    PRODUCT_CONSULTATION: 'product_consultation',
    PROJECT_CONSULTATION: 'project_consultation',
    QUOTATION: 'quotation',
    TECHNICAL_SUPPORT: 'technical_support',
    PARTNERSHIP: 'partnership',
    OTHER: 'other',

    values(){
        return[
            this.PRODUCT_CONSULTATION, this.PROJECT_CONSULTATION, this.QUOTATION,
            this.TECHNICAL_SUPPORT, this.PARTNERSHIP, this.OTHER
        ]
    }
})
/* ---- 8. ChatRole ---- */
const ChatRole = Object.freeze({
    USER: 'user',
    ASSISTANT: 'assistant',
    AGENT: 'agent',
    SYSTEM: 'system',

    values(){
        return[
            this.USER, this.ASSISTANT, this.AGENT, this.SYSTEM
        ]
    }
})
/* ---- 9. SubsriptionStatus ---- */
const SubsriptionStatus = Object.freeze({
    PENDING_CONFIRMATION: 'pending_confirmation',
    CONFIRMED: 'confirmed',
    UNSUBCRIBED: 'unsubcribed',
    BOUNCED: 'bounced',

    values(){
        return[
            this.PENDING_CONFIRMATION, this.CONFIRMED, this.UNSUBCRIBED, thus.BOUNCED
        ]
    }
})
/* ---- 10.BannerPosition ---- */
const BannerPosition = Object.freeze({
    HOME_HERO: 'home_hero',
    ABOUT_HERO: 'about_hero',
    PROJECT_HERO: 'project_hero',
    PRODUCT_HERO: 'product_hero',
    SUPPORT_HERO: 'support_hero',
    CONTACT_HERO: 'contact_hero',
    PROMO_STRIP: 'promo_strip',
    SIDEBAR: 'sidebar',

    values(){
        this.HOME_HERO, this.ABOUT_HERO, this.PROJECT_HERO, this.PRODUCT_HERO,
        this.SUPPORT_HERO, this.CONTACT_HERO, this.PROMO_STRIP, this.SIDEBAR
    }
})

// ---- Helper dùng chung cho migration ----
/**
 * Sinh câu lệnh ALTER TYPE ... ADD VALUE để thêm 1 giá trị mới vào enum đã tồn tại trên Postgres, dùng trong migration "up".
 * 
 * @param {string} enumTypeName - tên type Postgres, ví dụ 'enum_Users_status'
 * @param {string} newValue - giá trị mới cần thêm, ví dụ 'archived'
 * @param {string} [afterValue] - nếu muốn chèn ngay sau 1 giá trị cụ thể
 */

function addEnumValueSQL(enumTypeName, newValue, afterValue){
    const position = afterValue ? `AFTER '${afterValue}'` : ``;
    return `ALTER TYPE "${enumTypeName}" ADD VALUE IF NOT EXISTS '${newValue}'${position};`;
}

module.exports = {
    addEnumValueSQL,
    UserStatus,
    UserRole,
    Gender,
    AddressType,
    LoyaltyTier,
    OtpPurpose,
    LoyaltyTxnType,
    ProductStatus,
    AttributeDisplay,
    InventoryTxnType,
    DiscountType,
    CouponScope,
    OrderStatus,
    PaymentMethod,
    PaymentStatus,
    ShipmentStatus,
    ReturnStatus,
    ReturnReason,
    ReviewStatus,
    ProjectStatus,
    TicketStatus,
    TicketPriority,
    TicketCategory,
    ConsultationStatus,
    ConsultationType,
    ChatRole,
    SubsriptionStatus,
    BannerPosition
}