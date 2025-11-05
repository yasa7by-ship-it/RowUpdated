# NextRowTheme 🎨
## الهوية البصرية المستوحاة من Investing.com

---

## 📐 الألوان الأساسية

### **الألوان الرئيسية:**

```css
Primary Blue:     #2d5aa0  /* اللون الأساسي - أزرق Investing.com */
Dark Blue:        #1a1f2e  /* خلفية داكنة */
Success/Green:    #00b06f  /* للأرباح والقيم الإيجابية */
Danger/Red:       #e74c3c  /* للخسائر والقيم السلبية */
Warning:          #f39c12  /* للتحذيرات */
Info:             #3498db  /* للمعلومات */
```

### **ألوان الخلفية:**

```css
Light BG:         #f5f5f5  /* الخلفية الفاتحة */
Dark BG:          #1a1f2e  /* الخلفية الداكنة */
Card BG:          #ffffff  /* خلفية البطاقات */
Card BG Dark:     #243447  /* خلفية البطاقات الداكنة */
```

### **ألوان النص:**

```css
Main Text:        #333333  /* النص الأساسي */
Light Text:       #666666  /* نص ثانوي */
Border:           #e0e0e0  /* حدود فاتحة */
Border Dark:      #2d3a4b  /* حدود داكنة */
```

---

## 🎯 كيفية الاستخدام في Tailwind CSS:

### **الألوان الأساسية:**

```html
<!-- Primary Blue -->
<div class="bg-nextrow-primary text-white">...</div>

<!-- Dark Blue -->
<div class="bg-nextrow-dark text-white">...</div>

<!-- Success (Green) -->
<div class="text-nextrow-success">+5.2%</div>

<!-- Danger (Red) -->
<div class="text-nextrow-danger">-3.1%</div>
```

### **الخلفيات:**

```html
<!-- Light Background -->
<div class="bg-nextrow-bg">...</div>

<!-- Dark Background -->
<div class="dark:bg-nextrow-bg-dark">...</div>
```

### **النصوص:**

```html
<!-- Main Text -->
<p class="text-nextrow-text">...</p>

<!-- Light Text -->
<p class="text-nextrow-text-light">...</p>
```

---

## 📋 استخدامات محددة:

### **1. الأزرار:**

```html
<!-- Primary Button -->
<button class="bg-nextrow-primary hover:bg-nextrow-primary/90 text-white px-4 py-2 rounded">
  Submit
</button>

<!-- Success Button -->
<button class="bg-nextrow-success hover:bg-nextrow-success/90 text-white">
  Save
</button>

<!-- Danger Button -->
<button class="bg-nextrow-danger hover:bg-nextrow-danger/90 text-white">
  Delete
</button>
```

### **2. البطاقات:**

```html
<!-- Light Card -->
<div class="bg-white dark:bg-gray-800 border border-nextrow-border dark:border-nextrow-border-dark rounded-lg shadow">
  ...
</div>
```

### **3. مؤشرات الأسهم:**

```html
<!-- Positive Change -->
<span class="text-nextrow-success font-semibold">+2.5%</span>

<!-- Negative Change -->
<span class="text-nextrow-danger font-semibold">-1.8%</span>
```

### **4. Header/Navigation:**

```html
<!-- Header Background -->
<header class="bg-nextrow-primary text-white">
  ...
</header>
```

---

## 🎨 تطبيق في المكونات:

### **Header:**
```tsx
<header className="bg-nextrow-primary dark:bg-nextrow-dark text-white shadow-lg">
  ...
</header>
```

### **Cards:**
```tsx
<div className="bg-white dark:bg-gray-800 border border-nextrow-border dark:border-nextrow-border-dark rounded-lg shadow-md p-4">
  ...
</div>
```

### **Stock Price Changes:**
```tsx
<span className={change >= 0 ? 'text-nextrow-success' : 'text-nextrow-danger'}>
  {change >= 0 ? '+' : ''}{change}%
</span>
```

---

## 🔄 Dark Mode Support:

جميع الألوان مدعومة في Dark Mode:

```html
<!-- Light Mode: -->
<div class="bg-nextrow-bg text-nextrow-text">

<!-- Dark Mode: -->
<div class="dark:bg-nextrow-bg-dark dark:text-gray-200">
```

---

## 📐 Typography:

**الخط المستخدم:** Inter (أو System UI)

```html
<div class="font-nextrow">
  <!-- النص باستخدام خط NextRowTheme -->
</div>
```

---

## ✨ أمثلة من Investing.com:

### **1. Header:**
- خلفية: `#2d5aa0` (Primary Blue)
- نص: أبيض
- شفافية عند Hover

### **2. Stock Cards:**
- خلفية: أبيض
- حدود: `#e0e0e0`
- ظل خفيف
- Hover Effect: ظل أقوى

### **3. Price Changes:**
- إيجابي: `#00b06f` (أخضر)
- سلبي: `#e74c3c` (أحمر)

### **4. Charts:**
- خطوط: `#2d5aa0`
- خلفية: `#f5f5f5`

---

## 🚀 التطبيق الكامل:

تم تطبيق NextRowTheme على:

- ✅ `index.html` - تكوين Tailwind
- ✅ Header Component
- ✅ Navigation
- ✅ Cards
- ✅ Stock Indicators
- ✅ Buttons
- ✅ Forms

---

## 📝 ملاحظات:

1. **التباين:** جميع الألوان مصممة للالتزام بمعايير الوصول (WCAG)
2. **Dark Mode:** كل الألوان لها إصدارات Dark Mode
3. **Responsive:** التصميم متجاوب بالكامل
4. **Performance:** استخدام Tailwind CSS فقط (لا ملفات CSS إضافية)

---

## 🎯 الملفات المعدلة:

- `index.html` - تكوين Tailwind مع NextRowTheme
- `components/Header.tsx` - تحديث الألوان
- `components/Layout.tsx` - تحديث الخلفيات
- جميع صفحات الصفحات الرئيسية

---

**تم إنشاء NextRowTheme بنجاح! 🎉**





