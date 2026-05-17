const { execSync } = require('child_process');
console.log('Adding CLOUDINARY_CLOUD_NAME...');
execSync('npx vercel env add CLOUDINARY_CLOUD_NAME production', { input: 'dzrd37naa', stdio: ['pipe', 'pipe', 'pipe'] });
console.log('Adding CLOUDINARY_API_KEY...');
execSync('npx vercel env add CLOUDINARY_API_KEY production', { input: '519448172653933', stdio: ['pipe', 'pipe', 'pipe'] });
console.log('Adding CLOUDINARY_API_SECRET...');
execSync('npx vercel env add CLOUDINARY_API_SECRET production', { input: 'm3-IXYgTmJZw7c-xcjI7EAi1zMM', stdio: ['pipe', 'pipe', 'pipe'] });
console.log('Done!');
