import { assert } from 'riteway/vitest';
import { describe, test } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseFrontmatter } from '../../lib/index-generator.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('user-testing', () => {
  describe('user-testing.mdc', () => {
    test('file exists with valid frontmatter', async () => {
      const filePath = path.join(__dirname, 'user-testing.mdc');
      const exists = await fs.pathExists(filePath);

      assert({
        given: 'user-testing.mdc file',
        should: 'exist in ai/rules directory',
        actual: exists,
        expected: true,
      });

      const content = await fs.readFile(filePath, 'utf-8');
      const frontmatter = parseFrontmatter(content);

      assert({
        given: 'user-testing.mdc frontmatter',
        should: 'have description field',
        actual: typeof frontmatter?.description,
        expected: 'string',
      });

      assert({
        given: 'user-testing.mdc frontmatter',
        should: 'have alwaysApply set to false',
        actual: frontmatter?.alwaysApply,
        expected: false,
      });
    });

    test('includes HumanScript and AgentScript templates', async () => {
      const filePath = path.join(__dirname, 'user-testing.mdc');
      const content = await fs.readFile(filePath, 'utf-8');

      assert({
        given: 'user-testing.mdc content',
        should: 'include HumanScript template',
        actual: content.includes('HumanScript:template'),
        expected: true,
      });

      assert({
        given: 'user-testing.mdc content',
        should: 'include AgentScript template',
        actual: content.includes('AgentScript:template'),
        expected: true,
      });
    });
  });

  describe('user-test.md command', () => {
    test('command file exists', async () => {
      const filePath = path.join(__dirname, '../commands/user-test.md');
      const exists = await fs.pathExists(filePath);

      assert({
        given: 'user-test.md command file',
        should: 'exist in ai/commands directory',
        actual: exists,
        expected: true,
      });
    });

    test('references user-testing.mdc', async () => {
      const filePath = path.join(__dirname, '../commands/user-test.md');
      const content = await fs.readFile(filePath, 'utf-8');

      assert({
        given: 'user-test.md content',
        should: 'reference user-testing.mdc',
        actual: content.includes('@user-testing.mdc') || content.includes('user-testing.mdc'),
        expected: true,
      });
    });
  });

  describe('documentation', () => {
    test('user testing guide exists', async () => {
      const filePath = path.join(__dirname, '../../docs/user-testing.md');
      const exists = await fs.pathExists(filePath);

      assert({
        given: 'user-testing.md documentation',
        should: 'exist in docs directory',
        actual: exists,
        expected: true,
      });
    });
  });

  describe('README integration', () => {
    test('README includes user-test command', async () => {
      const filePath = path.join(__dirname, '../../README.md');
      const content = await fs.readFile(filePath, 'utf-8');

      assert({
        given: 'README.md content',
        should: 'include /user-test in command list',
        actual: content.includes('/user-test'),
        expected: true,
      });

      assert({
        given: 'README.md content',
        should: 'link to user testing documentation',
        actual: content.includes('docs/user-testing.md'),
        expected: true,
      });
    });
  });
});
