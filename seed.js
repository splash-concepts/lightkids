import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGODB_URI = 'mongodb+srv://jafaruemmanuel48_db_user:pad8eDgMQPzkP8ac@cluster0.p09l7v2.mongodb.net/lightkids?appName=Cluster0';

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to DB');

  const db = mongoose.connection.db;
  
  // 1. Create a Default Branch
  let defaultBranch = await db.collection('branches').findOne({ name: 'Main Branch' });
  if (!defaultBranch) {
    const res = await db.collection('branches').insertOne({
      name: 'Main Branch',
      location: 'Default Location',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    defaultBranch = { _id: res.insertedId };
    console.log('Created Main Branch');
  }

  // 2. Seed Default Classes for Main Branch
  const defaultClasses = [
    { name: 'Wisdom class', description: 'Ages 1-3', branchId: defaultBranch._id },
    { name: 'Victory class', description: 'Ages 4-6', branchId: defaultBranch._id },
    { name: 'Faith class', description: 'Ages 7-9', branchId: defaultBranch._id },
    { name: 'Light class', description: 'Ages 10-12', branchId: defaultBranch._id },
  ];

  for (const cls of defaultClasses) {
    const existing = await db.collection('classcategories').findOne({ name: cls.name, branchId: cls.branchId });
    if (!existing) {
      await db.collection('classcategories').insertOne({
        ...cls,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log(`Created default class: ${cls.name}`);
    }
  }

  // 3. Assign default branch to all existing records that don't have one
  const collectionsToUpdate = ['users', 'children', 'classcategories', 'attendances', 'academicmaterials', 'notices'];
  
  for (const collectionName of collectionsToUpdate) {
    const res = await db.collection(collectionName).updateMany(
      { branchId: { $exists: false } },
      { $set: { branchId: defaultBranch._id } }
    );
    console.log(`Updated ${res.modifiedCount} records in ${collectionName}`);
  }

  // 4. Create Super Admin if not exists
  const superAdminEmail = 'superadmin@lightkids.com';
  const superAdmin = await db.collection('users').findOne({ email: superAdminEmail });
  
  if (!superAdmin) {
    const hashedPassword = await bcrypt.hash('superadmin123', 10);
    await db.collection('users').insertOne({
      name: 'Global Super Admin',
      email: superAdminEmail,
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      isTwoFactorEnabled: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log('Created SUPER_ADMIN user: superadmin@lightkids.com / superadmin123');
  }

  console.log('Seeding complete!');
  process.exit(0);
}

seed().catch(console.error);
