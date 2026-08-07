const REDACTED = '[redacted]';

const resolveMongoUri = () => {
  const value =
    process.env.MONGODB_URI ||
    process.env.MONGO_URI ||
    process.env.MONGO_URL ||
    '';

  if (!value) {
    return '';
  }

  if (value.startsWith('mongodb://') || value.startsWith('mongodb+srv://')) {
    return value;
  }

  return value.replace(/([^:]+):([^@]+)@/, `$1:${REDACTED}@`);
};

export const validateEnv = () => {
  const checks = [
    {
      name: 'MONGODB_URI (MONGODB_URI / MONGO_URI / MONGO_URL)',
      value: resolveMongoUri(),
      required: true,
    },
    {
      name: 'JWT_SECRET',
      value: process.env.JWT_SECRET || '',
      required: true,
    },
    {
      name: 'CLOUDINARY_CLOUD_NAME',
      value: process.env.CLOUDINARY_CLOUD_NAME || '',
      required: true,
    },
    {
      name: 'CLOUDINARY_API_KEY',
      value: process.env.CLOUDINARY_API_KEY || '',
      required: true,
    },
    {
      name: 'CLOUDINARY_API_SECRET',
      value: process.env.CLOUDINARY_API_SECRET ? REDACTED : '',
      required: true,
    },
  ];

  const failures = checks.filter((check) => check.required && !check.value);

  if (process.env.JWT_SECRET === 'your-secret-key') {
    failures.push({
      name: 'JWT_SECRET',
      value: 'the insecure default "your-secret-key"',
      required: true,
    });
  }

  const optional = [
    {
      name: 'CORS_ORIGINS',
      value: process.env.CORS_ORIGINS || '',
      hint: 'comma-separated allowed origins; when unset, all origins are allowed (development only)',
    },
    {
      name: 'FIREBASE_PROJECT_ID',
      value: process.env.FIREBASE_PROJECT_ID || '',
      hint: 'required only for Google Sign-In (social login disabled when missing)',
    },
    {
      name: 'PORT',
      value: process.env.PORT || '',
      hint: 'defaults to 8001',
    },
    {
      name: 'JWT_EXPIRES_IN',
      value: process.env.JWT_EXPIRES_IN || '',
      hint: 'defaults to 7d',
    },
  ];

  const warnings = optional.filter((item) => !item.value);

  if (failures.length > 0) {
    const missing = failures
      .map((failure) => `  - ${failure.name}: ${failure.value || 'missing'}`)
      .join('\n');

    throw new Error(
      `Missing required environment variables. The server cannot start safely without them.\n\n${missing}\n\nCheck your backend/.env file and your hosting provider environment settings.`,
    );
  }

  if (warnings.length > 0) {
    const lines = warnings
      .map((item) => `  - ${item.name}: unset (${item.hint})`)
      .join('\n');

    // eslint-disable-next-line no-console
    console.warn(
      `[env] Optional environment variables are unset:\n${lines}`,
    );
  }
};

export default validateEnv;
