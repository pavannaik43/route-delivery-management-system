# Security Configuration Guide

## Environment Variables

### Required Environment Variables

Create a `.env` file in the backend directory with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Security - JWT Secret (CRITICAL: Generate a secure random string)
# Generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=YOUR_SECURE_RANDOM_SECRET_HERE

# CORS Configuration (comma-separated list of allowed origins)
# Development: http://localhost:3000
# Production: https://your-frontend-domain.com
CORS_ORIGIN=http://localhost:3000

# Logging
LOG_LEVEL=info

# Database
DB_PATH=./database.sqlite

# Optional: Auto-seed database on startup (set to false in production)
AUTO_SEED=true
```

### Generating a Secure JWT Secret

**CRITICAL**: Never use the default JWT secret in production!

Generate a cryptographically secure secret:

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Using OpenSSL
openssl rand -hex 64

# Using Python
python -c "import secrets; print(secrets.token_hex(64))"
```

Copy the generated string and set it as your `JWT_SECRET` in the `.env` file.

## Security Features Implemented

### 1. Authentication & Authorization
- ✅ JWT-based authentication with secure token generation
- ✅ Password hashing with bcryptjs (salt rounds: 10)
- ✅ Role-based access control (admin, delivery_staff)
- ✅ Password strength requirements:
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character (@$!%*?&)

### 2. Rate Limiting
- ✅ Login endpoint: 5 attempts per 15 minutes
- ✅ User creation: 10 attempts per hour
- ✅ General API: 100 requests per minute

### 3. Input Validation
- ✅ Joi schema validation for all API endpoints
- ✅ Date format validation (YYYY-MM-DD)
- ✅ Phone number validation (10 digits)
- ✅ Positive number validation for IDs, prices, quantities
- ✅ String length limits on all text fields

### 4. HTTP Security Headers (Helmet.js)
- ✅ Content Security Policy (CSP)
- ✅ X-Frame-Options (clickjacking protection)
- ✅ X-Content-Type-Options (MIME-sniffing protection)
- ✅ Strict-Transport-Security (HTTPS enforcement)
- ✅ X-XSS-Protection

### 5. CORS Configuration
- ✅ Configurable allowed origins
- ✅ Strict origin validation in production
- ✅ Credentials support enabled
- ✅ Preflight caching (24 hours)

### 6. Request Security
- ✅ Request size limits (10MB max)
- ✅ JSON body parsing with limits
- ✅ URL-encoded body parsing with limits

### 7. Logging & Monitoring
- ✅ Winston logging with multiple transports
- ✅ Security event logging
- ✅ Failed login tracking
- ✅ Rate limit violation logging
- ✅ CORS violation logging
- ✅ Separate error and combined logs
- ✅ Log rotation (5MB max file size, 5 files retained)

### 8. Database Security
- ✅ Parameterized queries (SQL injection prevention)
- ✅ Foreign key constraints enabled
- ✅ Performance indexes on frequently queried columns
- ✅ Transaction support with rollback on error

### 9. Production Hardening
- ✅ HTTPS redirect in production
- ✅ Strict CORS enforcement in production
- ✅ Environment-based configuration

## Deployment Checklist

### Before Deploying to Production

1. **Environment Variables**
   - [ ] Generate a new secure JWT_SECRET
   - [ ] Set NODE_ENV=production
   - [ ] Configure production CORS_ORIGIN
   - [ ] Set AUTO_SEED=false

2. **Security**
   - [ ] Verify .env is NOT committed to git
   - [ ] Review and update CORS allowed origins
   - [ ] Ensure HTTPS is enabled
   - [ ] Configure proper firewall rules
   - [ ] Set up database backups

3. **Monitoring**
   - [ ] Set up log aggregation (e.g., LogDNA, Datadog)
   - [ ] Configure alerts for security events
   - [ ] Set up uptime monitoring
   - [ ] Configure error tracking (e.g., Sentry)

4. **Testing**
   - [ ] Test rate limiting
   - [ ] Verify password validation
   - [ ] Test authentication flows
   - [ ] Verify CORS configuration
   - [ ] Test all validation rules

## Security Best Practices

### Password Management
- Never store passwords in plain text
- Use bcryptjs with salt rounds ≥ 10
- Enforce strong password requirements
- Implement password reset with secure tokens

### API Security
- Always use HTTPS in production
- Validate all user inputs
- Use parameterized queries
- Implement proper error handling
- Never expose stack traces to clients

### Token Management
- Use short-lived tokens (current: 24 hours)
- Consider implementing refresh tokens
- Store tokens securely on client side
- Invalidate tokens on logout

### Database Security
- Use prepared statements
- Enable foreign key constraints
- Implement proper access controls
- Regular backups
- Monitor for suspicious queries

### Logging
- Log security events
- Never log sensitive data (passwords, tokens)
- Implement log rotation
- Monitor logs regularly
- Set up alerts for security events

## Troubleshooting

### Rate Limiting Issues
If legitimate users are being rate-limited:
1. Increase the `max` value in `rateLimiter.js`
2. Adjust the `windowMs` duration
3. Consider implementing user-based rate limiting

### CORS Errors
If frontend can't connect:
1. Verify CORS_ORIGIN includes the frontend URL
2. Check for trailing slashes in URLs
3. Ensure credentials are properly configured
4. Check browser console for specific error

### Authentication Issues
If login fails unexpectedly:
1. Check JWT_SECRET is set correctly
2. Verify token expiration time
3. Check logs for specific errors
4. Ensure bcrypt is working properly

### Validation Errors
If valid data is rejected:
1. Check validation schemas in `validators.js`
2. Verify data types match schema
3. Check for extra whitespace in strings
4. Review Joi error messages in response

## Additional Security Recommendations

### Future Enhancements
1. Implement account lockout after failed attempts
2. Add two-factor authentication (2FA)
3. Implement refresh token rotation
4. Add API versioning
5. Implement audit logging for all data changes
6. Add CAPTCHA for login after multiple failures
7. Implement IP whitelisting for admin endpoints
8. Add honeypot fields to forms
9. Implement rate limiting per user (not just per IP)
10. Add webhook for security events

### Regular Security Maintenance
- Update dependencies monthly
- Run security audits (`npm audit`)
- Review logs for suspicious activity
- Test backup restoration procedures
- Review and update security policies
- Conduct penetration testing
- Keep SSL certificates up to date

## Support
For security issues, contact: security@yourcompany.com
For general support, refer to README.md
