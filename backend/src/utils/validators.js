const Joi = require('joi');

// Password validation schema
const passwordSchema = Joi.string()
  .min(8)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
  .required()
  .messages({
    'string.min': 'Password must be at least 8 characters long',
    'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)',
    'any.required': 'Password is required'
  });

// Email validation schema
const emailSchema = Joi.string()
  .email({ tlds: { allow: false } })
  .required()
  .trim()
  .messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  });

// User creation validation (for Driver creation by Admin)
const createUserSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required().trim(),
  email: emailSchema,
  password: passwordSchema,
  phone: Joi.string().pattern(/^[0-9]{10}$/).required().messages({
    'string.pattern.base': 'Phone number must be exactly 10 digits'
  }),
  role: Joi.string().valid('admin', 'delivery_staff').required()
});

// User update validation (Admin updating user details)
const updateUserSchema = Joi.object({
  email: emailSchema.optional(),
  phone: Joi.string().pattern(/^[0-9]{10}$/).optional().messages({
    'string.pattern.base': 'Phone number must be exactly 10 digits'
  }),
  role: Joi.string().valid('admin', 'delivery_staff').optional()
}).min(1);

// Login validation - requires username, email, and password
const loginSchema = Joi.object({
  username: Joi.string().required().trim(),
  email: emailSchema,
  password: Joi.string().required()
});

// Password change validation
const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: passwordSchema,
  confirmPassword: Joi.string().required().valid(Joi.ref('newPassword')).messages({
    'any.only': 'Confirm password must match new password'
  })
});

// Delivery creation validation
const createDeliverySchema = Joi.object({
  shopId: Joi.number().integer().positive().optional(),
  shop_id: Joi.number().integer().positive().optional(),
  items: Joi.array().min(1).items(
    Joi.object({
      productId: Joi.number().integer().positive().optional(),
      product_id: Joi.number().integer().positive().optional(),
      quantity: Joi.number().integer().positive().required(),
      unitPrice: Joi.number().positive().optional()
    })
  ).required(),
  deliveryDate: Joi.date().iso().optional(),
  delivery_date: Joi.date().iso().optional()
}).custom((value, helpers) => {
  // Ensure at least one shopId is provided
  if (!value.shopId && !value.shop_id) {
    return helpers.error('any.required', { label: 'shopId or shop_id' });
  }
  return value;
});

// Product validation
const productSchema = Joi.object({
  name: Joi.string().min(1).max(200).required().trim(),
  category: Joi.string().min(1).max(100).required().trim(),
  size: Joi.string().min(1).max(50).required().trim(),
  mrp: Joi.number().positive().required(),
  retail_price: Joi.number().positive().required(),
  is_active: Joi.boolean().optional()
});

// Shop validation
const shopSchema = Joi.object({
  shop_name: Joi.string().min(1).max(200).required().trim(),
  owner_name: Joi.string().min(1).max(100).required().trim(),
  phone: Joi.string().pattern(/^[0-9]{10}$/).required().messages({
    'string.pattern.base': 'Phone number must be exactly 10 digits'
  }),
  address: Joi.string().min(1).max(500).required().trim(),
  route: Joi.string().min(1).max(100).required().trim()
});

// Date validation
const dateSchema = Joi.date().iso();

// Query parameter validation
const dateQuerySchema = Joi.object({
  date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional().messages({
    'string.pattern.base': 'Date must be in YYYY-MM-DD format'
  }),
  shop_id: Joi.number().integer().positive().optional(),
  route: Joi.string().min(1).max(100).optional().trim()
});

// Load creation validation
const loadSchema = Joi.object({
  load_date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required().messages({
    'string.pattern.base': 'Load date must be in YYYY-MM-DD format'
  }),
  items: Joi.array().min(1).items(
    Joi.object({
      product_id: Joi.number().integer().positive().required(),
      quantity: Joi.number().integer().positive().required()
    })
  ).required()
});

// Validation middleware factory
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => detail.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    req.body = value;
    next();
  };
};

// Query validation middleware factory
const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => detail.message);
      return res.status(400).json({
        success: false,
        message: 'Query validation failed',
        errors
      });
    }

    req.query = value;
    next();
  };
};

module.exports = {
  passwordSchema,
  emailSchema,
  createUserSchema,
  updateUserSchema,
  loginSchema,
  changePasswordSchema,
  createDeliverySchema,
  productSchema,
  shopSchema,
  dateSchema,
  dateQuerySchema,
  loadSchema,
  validate,
  validateQuery
};
