#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚀 Oura OAuth Setup Script');
console.log('==========================\n');

console.log('To get your Oura API credentials:');
console.log('1. Go to https://cloud.ouraring.com/personal-access-tokens');
console.log('2. Create a new Personal Access Token');
console.log('3. Note down the Client ID and Client Secret\n');

const questions = [
  {
    name: 'OURA_CLIENT_ID',
    message: 'Enter your Oura Client ID: ',
    required: true
  },
  {
    name: 'OURA_CLIENT_SECRET',
    message: 'Enter your Oura Client Secret: ',
    required: true
  },
  {
    name: 'JWT_SECRET',
    message: 'Enter a JWT secret (or press Enter for default): ',
    default: 'your-super-secret-jwt-key-change-this-in-production'
  },
  {
    name: 'ALLOWED_EMAIL',
    message: 'Enter your email for 2FA (or press Enter for default): ',
    default: 'douglas@gennetten.com'
  }
];

const answers = {};

function askQuestion(index) {
  if (index >= questions.length) {
    createEnvFile();
    return;
  }

  const question = questions[index];
  const prompt = question.default 
    ? `${question.message} (default: ${question.default})`
    : question.message;

  rl.question(prompt, (answer) => {
    if (question.required && !answer) {
      console.log('❌ This field is required!');
      askQuestion(index);
      return;
    }

    answers[question.name] = answer || question.default;
    askQuestion(index + 1);
  });
}

function createEnvFile() {
  const envContent = `# Server Configuration
PORT=3001
NODE_ENV=development

# JWT Configuration
JWT_SECRET=${answers.JWT_SECRET}
JWT_EXPIRES_IN=24h

# Oura Ring API Configuration
OURA_CLIENT_ID=${answers.OURA_CLIENT_ID}
OURA_CLIENT_SECRET=${answers.OURA_CLIENT_SECRET}
OURA_REDIRECT_URI=http://localhost:3001/api/auth/oura/callback

# Database Configuration (for future use)
DATABASE_URL=your-database-url

# Email Configuration (for 2FA)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Allowed Email for 2FA
ALLOWED_EMAIL=${answers.ALLOWED_EMAIL}
`;

  const envPath = path.join(__dirname, '.env');
  
  try {
    fs.writeFileSync(envPath, envContent);
    console.log('\n✅ .env file created successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Restart your server');
    console.log('2. Try connecting to Oura again');
    console.log('3. Make sure your Oura app redirect URI matches: http://localhost:3001/api/auth/oura/callback');
  } catch (error) {
    console.error('❌ Error creating .env file:', error.message);
  }

  rl.close();
}

askQuestion(0); 