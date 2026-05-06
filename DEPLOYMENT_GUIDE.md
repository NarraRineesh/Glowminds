# Landing Page CMS Deployment Guide

## Overview
The landing page now loads content dynamically from Firestore with Firebase Storage for images. Here's how to set it up.

## 1. Deploy Firestore & Storage Rules

```bash
# Deploy updated rules
firebase deploy --only firestore
firebase deploy --only storage
```

## 2. Seed Initial Content

```bash
cd scripts
npm install
# Set your Firebase config as environment variables or update the script
node seedLandingContent.js
```

## 3. Upload Images to Firebase Storage

### Manual Upload (Recommended)
1. Go to Firebase Console → Storage
2. Create folder structure:
   ```
   landing-images/
   ├── features/
   │   ├── resume-builder.svg
   │   ├── job-matching.svg
   │   ├── ai-coach.svg
   │   ├── interview-prep.svg
   │   ├── app-tracker.svg
   │   ├── grammar-checker.svg
   │   └── cover-letter.svg
   └── hero/
       ├── dashboard.svg
       ├── resume-builder.svg
       ├── interview-prep.svg
       └── grammar-checker.svg
   ```
3. Upload all SVG files from `public/mockups/`
4. Copy download URLs for each file

### Update Firestore with Image URLs
1. Go to Firebase Console → Firestore Data
2. Navigate to `siteContent/landing`
3. Update image paths with Firebase Storage URLs:
   ```js
   // Example format:
   "https://firebasestorage.googleapis.com/v0/b/your-project.appspot.com/o/landing-images%2Ffeatures%2Fresume-builder.svg?alt=media&token=xxx"
   ```

## 4. Test the Implementation

1. **Light/Dark Mode**: Toggle theme in navbar
2. **Content Loading**: Check if content loads from Firestore
3. **Fallback**: Test with network issues (should use defaults after 2s)
4. **Images**: Verify all mockup images display correctly

## 5. Future Content Updates

### Via Firebase Console
1. Go to Firestore Data → `siteContent/landing`
2. Edit any field (text, bullets, etc.)
3. Save changes - no code deploy needed!

### Via Admin Panel (Future)
- Create admin route with authentication
- Build UI to edit landing content
- Use `useLandingStore().updateContent()` to update

## 6. Image Updates

To change any landing page image:
1. Upload new image to Firebase Storage
2. Update URL in Firestore document
3. Changes appear instantly (no deploy needed)

## 7. Monitoring

Check browser console for:
- Firestore fetch status
- Fallback activation
- Image loading errors

## Troubleshooting

### Content Not Loading
- Check Firestore rules are deployed
- Verify `siteContent/landing` document exists
- Check browser network tab for Firestore errors

### Images Not Showing
- Verify Storage rules are deployed
- Check image URLs in Firestore are correct
- Test image URLs directly in browser

### Light Mode Issues
- Toggle theme to verify CSS variables are working
- Check `index.css` has light theme variables
- Verify `landing-v2.css` uses CSS variables

## Security Notes

- Firestore: Public read for `siteContent`, admin-only write
- Storage: Public read for `landing-images`, admin-only write
- Add `admin` custom claim to admin users for write access
