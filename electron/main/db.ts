import fs from "node:fs";

import Database from "better-sqlite3";

import type { SettingsRecord } from "@shared/contracts";

import type { RuntimePaths } from "./runtime-paths";

function currentIso() {
  return new Date().toISOString();
}

function createDefaultSettings(paths: RuntimePaths): SettingsRecord {
  const now = currentIso();

  return {
    installDir: "",
    tempDir: "",
    conflictPolicy: "rename",
    theme: "dark",
    createdAt: now,
    updatedAt: now
  };
}

export function createDatabase(paths: RuntimePaths) {
  fs.mkdirSync(paths.dataRoot, { recursive: true });
  fs.mkdirSync(paths.installRoot, { recursive: true });
  fs.mkdirSync(paths.tempRoot, { recursive: true });
  fs.mkdirSync(paths.cacheRoot, { recursive: true });
  fs.mkdirSync(paths.logsRoot, { recursive: true });

  const database = new Database(paths.databasePath);
  database.pragma("journal_mode = WAL");
  database.pragma("foreign_keys = ON");

  database.exec(`
    create table if not exists settings (
      id integer primary key check (id = 1),
      install_dir text not null,
      temp_dir text not null,
      conflict_policy text not null,
      theme text not null,
      created_at text not null,
      updated_at text not null
    );

    create table if not exists staged_sources (
      id text primary key,
      source_type text not null,
      source_value text not null,
      status text not null,
      detected_name text,
      detected_description text,
      archive_path text,
      skill_root_path text,
      skill_md_path text,
      install_path text,
      error_message text,
      created_at text not null,
      updated_at text not null
    );

    create table if not exists installed_skills (
      id text primary key,
      name text not null,
      slug text not null,
      description text,
      install_path text not null unique,
      skill_md_path text not null,
      source_type text not null,
      source_value text not null,
      installed_at text not null,
      updated_at text not null
    );

    create table if not exists logs (
      id text primary key,
      type text not null,
      level text not null,
      message text not null,
      detail text,
      related_id text,
      created_at text not null
    );
  `);

  const existingSettings = database
    .prepare("select count(*) as total from settings where id = 1")
    .get() as { total: number };

  if (existingSettings.total === 0) {
    const defaults = createDefaultSettings(paths);
    database
      .prepare(
        `
          insert into settings (
            id, install_dir, temp_dir, conflict_policy, theme, created_at, updated_at
          )
          values (
            1, @installDir, @tempDir, @conflictPolicy, @theme, @createdAt, @updatedAt
          )
        `
      )
      .run(defaults);
  }

  return database;
}
