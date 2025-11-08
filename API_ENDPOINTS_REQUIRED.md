# API Endpoints المطلوبة من الباك إند

الفرونت إند يحتاج إلى الـ endpoints التالية في الباك إند:

## 🔐 Authentication Endpoints (موجودة بالفعل ✅)

- `POST /api/auth/register` - إنشاء حساب جديد
- `POST /api/auth/login` - تسجيل الدخول

**Response Format:**
```json
{
  "token": "eyJhbGci...",
  "role": "admin" // أو "user"
}
```

---

## 📄 Pages Endpoints (مطلوبة ❌)

### 1. GET /api/pages
**الوصف:** جلب جميع الصفحات

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "_id": "123",
    "title": "Home Page",
    "slug": "home",
    "description": "This is the home page"
  }
]
```

### 2. GET /api/pages/:id
**الوصف:** جلب صفحة واحدة

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "_id": "123",
  "title": "Home Page",
  "slug": "home",
  "description": "This is the home page"
}
```

### 3. POST /api/pages
**الوصف:** إنشاء صفحة جديدة

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "title": "Home Page",
  "slug": "home",
  "description": "This is the home page"
}
```

**Response:**
```json
{
  "_id": "123",
  "title": "Home Page",
  "slug": "home",
  "description": "This is the home page"
}
```

### 4. PUT /api/pages/:id
**الوصف:** تحديث صفحة موجودة

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "title": "Updated Title",
  "slug": "updated-slug",
  "description": "Updated description"
}
```

**Response:**
```json
{
  "_id": "123",
  "title": "Updated Title",
  "slug": "updated-slug",
  "description": "Updated description"
}
```

### 5. DELETE /api/pages/:id
**الوصف:** حذف صفحة

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Page deleted successfully"
}
```

---

## 📑 Sections Endpoints (مطلوبة ❌)

### 1. GET /api/sections
**الوصف:** جلب جميع الأقسام

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "_id": "123",
    "title": "About Section",
    "description": "About us section",
    "order": 1
  }
]
```

### 2. GET /api/sections/:id
**الوصف:** جلب قسم واحد

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "_id": "123",
  "title": "About Section",
  "description": "About us section",
  "order": 1
}
```

### 3. POST /api/sections
**الوصف:** إنشاء قسم جديد

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "title": "About Section",
  "description": "About us section",
  "order": 1
}
```

**Response:**
```json
{
  "_id": "123",
  "title": "About Section",
  "description": "About us section",
  "order": 1
}
```

### 4. PUT /api/sections/:id
**الوصف:** تحديث قسم موجود

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "title": "Updated Section",
  "description": "Updated description",
  "order": 2
}
```

**Response:**
```json
{
  "_id": "123",
  "title": "Updated Section",
  "description": "Updated description",
  "order": 2
}
```

### 5. DELETE /api/sections/:id
**الوصف:** حذف قسم

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Section deleted successfully"
}
```

---

## 📝 Fields Endpoints (مطلوبة ❌)

### 1. GET /api/fields
**الوصف:** جلب جميع الحقول

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "_id": "123",
    "name": "email",
    "label": "Email Address",
    "type": "email",
    "required": true
  }
]
```

### 2. GET /api/fields/:id
**الوصف:** جلب حقل واحد

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "_id": "123",
  "name": "email",
  "label": "Email Address",
  "type": "email",
  "required": true
}
```

### 3. POST /api/fields
**الوصف:** إنشاء حقل جديد

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "name": "email",
  "label": "Email Address",
  "type": "email",
  "required": true
}
```

**Response:**
```json
{
  "_id": "123",
  "name": "email",
  "label": "Email Address",
  "type": "email",
  "required": true
}
```

### 4. PUT /api/fields/:id
**الوصف:** تحديث حقل موجود

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "name": "email",
  "label": "Updated Email Label",
  "type": "email",
  "required": false
}
```

**Response:**
```json
{
  "_id": "123",
  "name": "email",
  "label": "Updated Email Label",
  "type": "email",
  "required": false
}
```

### 5. DELETE /api/fields/:id
**الوصف:** حذف حقل

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Field deleted successfully"
}
```

---

## 🔒 Security Requirements

**جميع الـ endpoints (ما عدا register/login) تحتاج:**
- JWT Token في Header: `Authorization: Bearer <token>`
- التحقق من صلاحيات المستخدم (Admin فقط يمكنه Create/Update/Delete)
- User يمكنه فقط Read (GET)

---

## 📋 ملخص الـ Endpoints المطلوبة

### Pages (5 endpoints):
- ✅ GET /api/pages
- ✅ GET /api/pages/:id
- ✅ POST /api/pages
- ✅ PUT /api/pages/:id
- ✅ DELETE /api/pages/:id

### Sections (5 endpoints):
- ✅ GET /api/sections
- ✅ GET /api/sections/:id
- ✅ POST /api/sections
- ✅ PUT /api/sections/:id
- ✅ DELETE /api/sections/:id

### Fields (5 endpoints):
- ✅ GET /api/fields
- ✅ GET /api/fields/:id
- ✅ POST /api/fields
- ✅ PUT /api/fields/:id
- ✅ DELETE /api/fields/:id

**المجموع: 15 endpoint جديد**

