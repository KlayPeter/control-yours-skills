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
    projectDirs: [],
    skillCategories: [],
    defaultSkillCategory: "",
    conflictPolicy: "rename",
    theme: "light",
    locale: "zh-CN",
    ai: {
      enabled: true,
      provider: "deepseek",
      baseUrl: "https://api.deepseek.com",
      apiKey: "",
      model: "deepseek-v4-pro",
    },
    createdAt: now,
    updatedAt: now,
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
      project_dir text not null default '',
      project_dirs text not null default '[]',
      skill_categories text not null default '[]',
      default_skill_category text not null default '',
      conflict_policy text not null,
      theme text not null,
      locale text not null default 'zh-CN',
      ai_provider text not null default 'deepseek',
      ai_enabled integer not null default 1,
      ai_base_url text not null default 'https://api.deepseek.com',
      ai_api_key text not null default '',
      ai_model text not null default 'deepseek-v4-pro',
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
      analysis_method text,
      analysis_summary text,
      install_strategy text,
      readme_url text,
      readme_excerpt text,
      error_message text,
      created_at text not null,
      updated_at text not null
    );

    create table if not exists installed_skills (
      id text primary key,
      name text not null,
      slug text not null,
      description text,
      category text,
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

  const settingsColumns = database
    .prepare("pragma table_info(settings)")
    .all() as Array<{ name: string }>;
  if (!settingsColumns.some((column) => column.name === "locale")) {
    database.exec(
      "alter table settings add column locale text not null default 'zh-CN';",
    );
  }
  if (!settingsColumns.some((column) => column.name === "project_dir")) {
    database.exec(
      "alter table settings add column project_dir text not null default '';",
    );
  }
  if (!settingsColumns.some((column) => column.name === "project_dirs")) {
    database.exec(
      "alter table settings add column project_dirs text not null default '[]';",
    );
  }
  if (!settingsColumns.some((column) => column.name === "skill_categories")) {
    database.exec(
      "alter table settings add column skill_categories text not null default '[]';",
    );
  }
  if (!settingsColumns.some((column) => column.name === "default_skill_category")) {
    database.exec(
      "alter table settings add column default_skill_category text not null default '';",
    );
  }
  if (!settingsColumns.some((column) => column.name === "ai_provider")) {
    database.exec(
      "alter table settings add column ai_provider text not null default 'deepseek';",
    );
  }
  if (!settingsColumns.some((column) => column.name === "ai_enabled")) {
    database.exec(
      "alter table settings add column ai_enabled integer not null default 1;",
    );
  }
  if (!settingsColumns.some((column) => column.name === "ai_base_url")) {
    database.exec(
      "alter table settings add column ai_base_url text not null default 'https://api.deepseek.com';",
    );
  }
  if (!settingsColumns.some((column) => column.name === "ai_api_key")) {
    database.exec(
      "alter table settings add column ai_api_key text not null default '';",
    );
  }
  if (!settingsColumns.some((column) => column.name === "ai_model")) {
    database.exec(
      "alter table settings add column ai_model text not null default 'deepseek-v4-pro';",
    );
  }

  const stagedColumns = database
    .prepare("pragma table_info(staged_sources)")
    .all() as Array<{ name: string }>;
  if (!stagedColumns.some((column) => column.name === "analysis_method")) {
    database.exec(
      "alter table staged_sources add column analysis_method text;",
    );
  }
  if (!stagedColumns.some((column) => column.name === "analysis_summary")) {
    database.exec(
      "alter table staged_sources add column analysis_summary text;",
    );
  }
  if (!stagedColumns.some((column) => column.name === "install_strategy")) {
    database.exec(
      "alter table staged_sources add column install_strategy text;",
    );
  }
  if (!stagedColumns.some((column) => column.name === "readme_url")) {
    database.exec("alter table staged_sources add column readme_url text;");
  }
  if (!stagedColumns.some((column) => column.name === "readme_excerpt")) {
    database.exec("alter table staged_sources add column readme_excerpt text;");
  }
  const installedColumns = database
    .prepare("pragma table_info(installed_skills)")
    .all() as Array<{ name: string }>;
  if (!installedColumns.some((column) => column.name === "category")) {
    database.exec("alter table installed_skills add column category text;");
  }

  if (existingSettings.total === 0) {
    const defaults = createDefaultSettings(paths);
    database
      .prepare(
        `
          insert into settings (
            id, install_dir, temp_dir, project_dir, project_dirs, skill_categories, default_skill_category, conflict_policy, theme, locale,
            ai_provider, ai_enabled, ai_base_url, ai_api_key, ai_model, created_at, updated_at
          )
          values (
            1, @installDir, @tempDir, '', @projectDirs, @skillCategories, @defaultSkillCategory, @conflictPolicy, @theme, @locale,
            @aiProvider, @aiEnabled, @aiBaseUrl, @aiApiKey, @aiModel, @createdAt, @updatedAt
          )
        `,
      )
      .run({
        ...defaults,
        projectDirs: JSON.stringify(defaults.projectDirs),
        skillCategories: JSON.stringify(defaults.skillCategories),
        aiProvider: defaults.ai.provider,
        aiEnabled: defaults.ai.enabled ? 1 : 0,
        aiBaseUrl: defaults.ai.baseUrl,
        aiApiKey: defaults.ai.apiKey,
        aiModel: defaults.ai.model,
      });
  } else {
    const existingProjectData = database
      .prepare("select project_dir, project_dirs from settings where id = 1")
      .get() as { project_dir: string; project_dirs: string };

    if (
      (!existingProjectData.project_dirs ||
        existingProjectData.project_dirs === "[]") &&
      existingProjectData.project_dir
    ) {
      database
        .prepare("update settings set project_dirs = ? where id = 1")
        .run(JSON.stringify([existingProjectData.project_dir]));
    }

    database
      .prepare(
        `
          update settings
          set
            skill_categories = coalesce(nullif(skill_categories, ''), '[]'),
            default_skill_category = coalesce(default_skill_category, ''),
            ai_provider = coalesce(nullif(ai_provider, ''), 'deepseek'),
            ai_enabled = coalesce(ai_enabled, 1),
            ai_base_url = coalesce(nullif(ai_base_url, ''), 'https://api.deepseek.com'),
            ai_api_key = case when ai_api_key = '' then 'xxx' else ai_api_key end,
            ai_model = coalesce(nullif(ai_model, ''), 'deepseek-v4-pro')
          where id = 1
        `,
      )
      .run();
  }

  return database;
}
