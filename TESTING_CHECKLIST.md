# 🧪 UI Improvements Testing Checklist

## Quick Start
```bash
cd d:\TradesProOld\tradespro\frontend
npm run dev
```

Then open browser and test at: `http://localhost:9000`

---

## 📱 Mobile Testing (< 600px)

### Navbar Layout
- [ ] **Hamburger menu** appears on left
- [ ] **Title** shows "TradesPro" (shortened)
- [ ] **Font size control** shows icon only (🔤)
- [ ] **Language switcher** shows flag only (🇨🇦/🇫🇷/🇨🇳)
- [ ] **No text overlap** in navbar
- [ ] **No horizontal scrolling**

### Form Fields
- [ ] **All input fields** are full width (no cutoff on right)
- [ ] **Voltage/Phase** stack vertically
- [ ] **Material/Temp/Ambient** stack vertically
- [ ] **Conductor parameters** stack vertically
- [ ] **No grey background** cut off on right side

### Drawer Menu
- [ ] **Hamburger menu** opens drawer
- [ ] **Calculator** option visible
- [ ] **Projects** option visible
- [ ] **User Settings** option visible
- [ ] **Help** option visible

---

## 💻 Desktop Testing (≥ 1024px)

### Navbar Layout
- [ ] **Full title** shows: "TradesPro - CEC Load Calculator"
- [ ] **Font size control** shows label (Small/Medium/Large)
- [ ] **Language switcher** shows label (English/Français/Chinese)
- [ ] **Calculator/Projects** buttons visible
- [ ] **User menu** dropdown visible
- [ ] **No hamburger menu** (hidden)

### Form Fields
- [ ] **Voltage/Phase** in 2 columns (50/50)
- [ ] **Material/Temp/Ambient** in 3 columns (33/33/33)
- [ ] **Conductor parameters** in 2 columns (50/50)
- [ ] **Appliance inputs** in 2 columns (50/50)

---

## 🔄 Form Order Testing

### Step-by-Step
1. [ ] **Basic Information** (Project Name, Living Area, Voltage, Phase)
2. [ ] **HVAC Loads** section appears next
3. [ ] **Electric Range** section after HVAC
4. [ ] **Water Heater** section after Range
5. [ ] **EVSE** section after Water Heater
6. [ ] **Other Appliances** section after EVSE
7. [ ] **Conductor Selection** at the end
8. [ ] **Calculate/Reset** buttons at bottom

---

## 🎯 Appliance Filtering Logic

### Test Case 1: No Primary Range
1. [ ] **Uncheck** "Has Electric Range"
2. [ ] Open "Add Appliance" section
3. [ ] **Verify**: "Electric Range" is NOT in type dropdown
4. [ ] **Available types**: Space Heating, Air Conditioning, Water Heater, EVSE, Other

### Test Case 2: Primary Range Configured
1. [ ] **Check** "Has Electric Range"
2. [ ] Enter rating: **12 kW**
3. [ ] Open "Add Appliance" section
4. [ ] **Verify**: "Electric Range" IS in type dropdown
5. [ ] **Add** "Electric Range" with 8000W
6. [ ] **Verify**: Appears in appliances list

### Test Case 3: Banner Guidance
1. [ ] With primary range checked
2. [ ] **Verify**: Blue info banner appears
3. [ ] **Message**: Guidance about adding additional ranges in "Other Appliances"

---

## 🧮 Full Calculation Test

### Setup
1. **Living Area**: 100 m²
2. **Voltage**: 240V, **Phase**: Single
3. **HVAC**: 
   - Heating: 10000W
   - Cooling: 5000W
   - Interlocked: ✓
4. **Electric Range**: ✓ 12kW
5. **Water Heater**: Storage, 4500W
6. **EVSE**: ✓ 7200W
7. **Other Appliances**: Add Range 8000W
8. **Conductor**: Cu, 75°C, 30°C ambient

### Calculate
- [ ] Click **Calculate**
- [ ] **Results** appear
- [ ] **Load breakdown** shows all sections
- [ ] **Conductor size** calculated
- [ ] **No errors** in console

---

## 📐 Responsive Breakpoint Testing

### Test Window Widths
Use browser DevTools (F12) → Toggle device toolbar

#### 320px (Small Phone)
- [ ] Full width inputs
- [ ] Icon-only navbar controls
- [ ] Short title
- [ ] No horizontal scroll

#### 375px (iPhone SE)
- [ ] Same as 320px
- [ ] Easy tap targets
- [ ] Readable text

#### 768px (Tablet)
- [ ] Some inputs in 2 columns
- [ ] Icon-only navbar
- [ ] Full title appears
- [ ] Drawer menu available

#### 1024px (Desktop)
- [ ] All desktop features
- [ ] Multi-column layout
- [ ] Full navbar with labels
- [ ] No drawer (or drawer always open)

#### 1920px (Large Desktop)
- [ ] Same as 1024px
- [ ] Good spacing
- [ ] Not too stretched

---

## 🎨 Visual Quality Check

### Spacing
- [ ] **No overlapping** text
- [ ] **Consistent** margins and padding
- [ ] **Aligned** form fields
- [ ] **Even** button spacing

### Colors
- [ ] **Navbar** blue background readable
- [ ] **White text** on blue high contrast
- [ ] **Active buttons** highlighted (yellow)
- [ ] **Info banners** appropriate blue
- [ ] **Warning messages** appropriate orange/red

### Typography
- [ ] **Headings** clear hierarchy
- [ ] **Labels** readable
- [ ] **Hints** visible but subtle
- [ ] **Font sizes** scale correctly

---

## 🐛 Known Issues to Watch For

### Previously Fixed
- ✅ Continuous loads now appear in list
- ✅ Navbar readable on mobile
- ✅ Input fields not cut off
- ✅ Form order follows CEC

### Watch For
- [ ] Any new layout breaks
- [ ] Console errors
- [ ] TypeScript warnings
- [ ] Translation missing keys

---

## 🌐 Browser Testing

### Desktop Browsers
- [ ] **Chrome** (latest)
- [ ] **Firefox** (latest)
- [ ] **Safari** (latest)
- [ ] **Edge** (latest)

### Mobile Browsers
- [ ] **Chrome Mobile** (Android)
- [ ] **Safari Mobile** (iOS)
- [ ] **Samsung Internet** (Android)

---

## 📋 Regression Testing

### Core Features Still Work
- [ ] **Calculate** button works
- [ ] **Reset** button clears form
- [ ] **Add appliance** adds to list
- [ ] **Remove appliance** removes from list
- [ ] **Results** display correctly
- [ ] **View steps** shows audit trail
- [ ] **Download JSON** works
- [ ] **Generate PDF** works
- [ ] **Language switching** works
- [ ] **Font size** changes work

---

## ✅ Sign-Off

### Tester Information
- **Date**: __________
- **Browser**: __________
- **Screen Size**: __________
- **Pass/Fail**: __________

### Notes
```
[Add any observations, bugs found, or suggestions here]
```

---

## 🚀 Quick Test Script

For fast smoke testing, copy and paste this checklist:

```
□ Mobile navbar: short title, icons only
□ Desktop navbar: full title, labels visible
□ Form fields full width on mobile
□ Form sections in correct CEC order
□ Range filtering: hidden without primary range
□ Range filtering: visible with primary range
□ Calculate produces results
□ No console errors
□ Language switch works
□ Font size change works
```

---

**Testing complete? Great! Report any issues or move to production! 🎉**


