/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return Promise.all([
    knex.schema.createTable("models", (table) => {
      table.increments("uuid");
      table.string("id", 50);
      table.string("name", 50);
      table.string("modality", 50);
      table.string("description", 1024);
      table.integer("context_length").defaultTo(0);
    }),
  ]);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return Promise.all([knex.schema.dropTable("models")]);
};
