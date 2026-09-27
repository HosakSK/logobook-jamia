/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // 1. Update users collection
  const users = app.findCollectionByNameOrId("_pb_users_auth_");
  
  users.fields.add(new SelectField({
    name: "locale",
    values: ["sk", "en", "de"],
    maxSelect: 1,
    required: false,
  }));

  users.fields.add(new SelectField({
    name: "tier",
    values: ["FREE", "COMPANY", "FREELANCER", "AGENCY", "PLATINUM"],
    maxSelect: 1,
    required: false,
  }));

  users.fields.add(new TextField({
    name: "lemonCustomerId",
    required: false,
  }));

  users.fields.add(new TextField({
    name: "lemonSubId",
    required: false,
  }));

  users.listRule = "id = @request.auth.id";
  users.viewRule = "id = @request.auth.id";
  users.updateRule = "id = @request.auth.id";
  users.deleteRule = "id = @request.auth.id";

  app.save(users);

  // 2. Create brands collection
  const brands = new Collection({
    name: "brands",
    type: "base",
    fields: [
      new RelationField({
        name: "user",
        collectionId: users.id,
        maxSelect: 1,
        required: true,
      }),
      new TextField({ name: "name", required: true }),
      new TextField({ name: "slug", required: true }),
      new TextField({ name: "customDomain", required: false }),
      new BoolField({ name: "isDomainVerified", required: false }),
      new SelectField({
        name: "status",
        values: ["LIVE", "DEV", "ARCHIVED"],
        maxSelect: 1,
        required: true,
      }),
      new JSONField({ name: "publishedConfig", required: false }),
      new TextField({ name: "passwordHash", required: false }),
      new BoolField({ name: "hideLogobookBadge", required: false }),
      new SelectField({
        name: "defaultLocale",
        values: ["sk", "en", "de"],
        maxSelect: 1,
        required: false,
      }),
      new JSONField({ name: "enabledLocales", required: false }),
      new TextField({ name: "headerLogo", required: false }),
      new TextField({ name: "favicon", required: false }),
      new JSONField({ name: "description", required: false }),
    ],
    indexes: [
      "CREATE UNIQUE INDEX `idx_brands_slug` ON `brands` (`slug`)",
      "CREATE UNIQUE INDEX `idx_brands_customDomain` ON `brands` (`customDomain`) WHERE `customDomain` != ''",
    ],
    listRule: "@request.auth.id != '' && (user = @request.auth.id || @collection.teamMembers.brand ?= id && @collection.teamMembers.user ?= @request.auth.id)",
    viewRule: "status = 'LIVE' || (@request.auth.id != '' && (user = @request.auth.id || @collection.teamMembers.brand ?= id && @collection.teamMembers.user ?= @request.auth.id))",
    createRule: "@request.auth.id != '' && user = @request.auth.id",
    updateRule: "@request.auth.id != '' && (user = @request.auth.id || (@collection.teamMembers.brand ?= id && @collection.teamMembers.user ?= @request.auth.id && @collection.teamMembers.role ?= 'OWNER'))",
    deleteRule: "@request.auth.id != '' && user = @request.auth.id",
  });
  app.save(brands);

  // 3. Create teamMembers collection
  const teamMembers = new Collection({
    name: "teamMembers",
    type: "base",
    fields: [
      new RelationField({
        name: "user",
        collectionId: users.id,
        maxSelect: 1,
        required: true,
      }),
      new RelationField({
        name: "brand",
        collectionId: brands.id,
        maxSelect: 1,
        cascadeDelete: true,
        required: true,
      }),
      new SelectField({
        name: "role",
        values: ["OWNER", "EDITOR", "VIEWER"],
        maxSelect: 1,
        required: true,
      }),
    ],
    indexes: [
      "CREATE UNIQUE INDEX `idx_teamMembers_brand_user` ON `teamMembers` (`brand`, `user`)",
    ],
    listRule: "@request.auth.id != '' && (user = @request.auth.id || brand.user = @request.auth.id)",
    viewRule: "@request.auth.id != '' && (user = @request.auth.id || brand.user = @request.auth.id)",
    createRule: "@request.auth.id != '' && brand.user = @request.auth.id",
    updateRule: "@request.auth.id != '' && brand.user = @request.auth.id",
    deleteRule: "@request.auth.id != '' && (brand.user = @request.auth.id || user = @request.auth.id)",
  });
  app.save(teamMembers);

  // 4. Create agencyDefaults collection
  const agencyDefaults = new Collection({
    name: "agencyDefaults",
    type: "base",
    fields: [
      new RelationField({
        name: "user",
        collectionId: users.id,
        maxSelect: 1,
        required: true,
      }),
      new JSONField({ name: "defaultClearanceZone", required: false }),
      new JSONField({ name: "defaultMinSize", required: false }),
      new JSONField({ name: "defaultRules", required: false }),
      new JSONField({ name: "defaultPageTree", required: false }),
      new JSONField({ name: "defaultTexts", required: false }),
    ],
    indexes: [
      "CREATE UNIQUE INDEX `idx_agencyDefaults_user` ON `agencyDefaults` (`user`)",
    ],
    listRule: "@request.auth.id != '' && user = @request.auth.id",
    viewRule: "@request.auth.id != '' && user = @request.auth.id",
    createRule: "@request.auth.id != '' && user = @request.auth.id",
    updateRule: "@request.auth.id != '' && user = @request.auth.id",
    deleteRule: "@request.auth.id != '' && user = @request.auth.id",
  });
  app.save(agencyDefaults);

  // 5. Create pageTemplates collection
  const pageTemplates = new Collection({
    name: "pageTemplates",
    type: "base",
    fields: [
      new RelationField({
        name: "user",
        collectionId: users.id,
        maxSelect: 1,
        required: false,
      }),
      new BoolField({ name: "isSystem", required: false }),
      new JSONField({ name: "name", required: true }),
      new JSONField({ name: "description", required: false }),
      new TextField({ name: "category", required: false }),
      new JSONField({ name: "structure", required: true }),
    ],
    listRule: "isSystem = true || (@request.auth.id != '' && user = @request.auth.id)",
    viewRule: "isSystem = true || (@request.auth.id != '' && user = @request.auth.id)",
    createRule: "@request.auth.id != '' && isSystem = false && user = @request.auth.id",
    updateRule: "@request.auth.id != '' && isSystem = false && user = @request.auth.id",
    deleteRule: "@request.auth.id != '' && isSystem = false && user = @request.auth.id",
  });
  app.save(pageTemplates);
}, (app) => {
  // Rollback migrations
  const collections = ["pageTemplates", "agencyDefaults", "teamMembers", "brands"];
  for (const name of collections) {
    try {
      const col = app.findCollectionByNameOrId(name);
      app.delete(col);
    } catch (_) {}
  }
});
