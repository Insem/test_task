#!/bin/sh

knex migrate:latest --env production && node index.js;