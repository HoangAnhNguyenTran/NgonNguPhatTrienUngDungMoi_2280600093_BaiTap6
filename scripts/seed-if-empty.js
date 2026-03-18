const mongoose = require("mongoose");

const { dataCategories, dataProducts } = require("../utils/data");
const { dataRole, dataUser } = require("../utils/data2");

const roleModel = require("../schemas/roles");
const userModel = require("../schemas/users");
const categoryModel = require("../schemas/categories");
const productModel = require("../schemas/products");

const mongoUri =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/NNPTUD-S4";

async function seedRolesIfEmpty() {
  const count = await roleModel.countDocuments({});
  if (count > 0) {
    return { seeded: 0, existing: count };
  }

  const docs = dataRole.map((r) => ({
    name: r.name,
    description: r.description,
  }));

  await roleModel.insertMany(docs);
  return { seeded: docs.length, existing: 0 };
}

async function seedUsersIfEmpty() {
  const count = await userModel.countDocuments({});
  if (count > 0) {
    return { seeded: 0, existing: count };
  }

  const roles = await roleModel.find({ isDeleted: false });
  const roleByName = new Map(roles.map((r) => [r.name, r._id]));

  const docs = dataUser
    .map((u) => {
      const roleId = roleByName.get(u.role.name);
      if (!roleId) {
        return null;
      }
      return {
        username: u.username,
        password: u.password,
        email: u.email,
        fullName: u.fullName,
        avatarUrl: u.avatarUrl,
        status: u.status,
        loginCount: u.loginCount || 0,
        role: roleId,
      };
    })
    .filter(Boolean);

  // Use create() so pre('save') hashes passwords.
  await userModel.create(docs);
  return { seeded: docs.length, existing: 0 };
}

async function seedCategoriesIfEmpty() {
  const count = await categoryModel.countDocuments({});
  if (count > 0) {
    return { seeded: 0, existing: count };
  }

  const docs = dataCategories.map((c) => ({
    name: c.name,
    slug: c.slug,
    image: c.image,
  }));

  await categoryModel.insertMany(docs);
  return { seeded: docs.length, existing: 0 };
}

async function seedProductsIfEmpty() {
  const count = await productModel.countDocuments({});
  if (count > 0) {
    return { seeded: 0, existing: count };
  }

  const categories = await categoryModel.find({ isDeleted: false });
  const categoryBySlug = new Map(categories.map((c) => [c.slug, c._id]));

  const docs = dataProducts
    .map((p) => {
      const categorySlug = p.category && p.category.slug;
      const categoryId = categoryBySlug.get(categorySlug);
      if (!categoryId) {
        return null;
      }
      return {
        title: p.title,
        slug: p.slug,
        price: p.price,
        description: p.description,
        images: Array.isArray(p.images) ? p.images : undefined,
        category: categoryId,
      };
    })
    .filter(Boolean);

  await productModel.insertMany(docs);
  return { seeded: docs.length, existing: 0 };
}

async function run() {
  try {
    await mongoose.connect(mongoUri);

    const roles = await seedRolesIfEmpty();
    const users = await seedUsersIfEmpty();
    const categories = await seedCategoriesIfEmpty();
    const products = await seedProductsIfEmpty();

    const finalCounts = {
      roles: await roleModel.countDocuments({}),
      users: await userModel.countDocuments({}),
      categories: await categoryModel.countDocuments({}),
      products: await productModel.countDocuments({}),
    };

    console.log("Seed summary:");
    console.log({ roles, users, categories, products, finalCounts });
  } catch (error) {
    console.error("Seed failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

run();
