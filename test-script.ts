import mongoose from 'mongoose';
import { ClassCategorySchema } from './apps/api/src/schemas/class-category.schema.js';

async function run() {
  await mongoose.connect('mongodb://localhost:27017/light-kids');
  const ClassCategory = mongoose.model('ClassCategory', ClassCategorySchema);
  const classes = await ClassCategory.find({});
  console.log(classes);
  process.exit(0);
}
run();
